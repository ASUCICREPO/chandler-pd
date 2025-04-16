import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as amplify from "@aws-cdk/aws-amplify-alpha";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

interface CdkStackProps extends cdk.StackProps {
  githubToken: string;
  githubOwner: string;
  viteApiUrl: string;
  viteEnableAuth: string;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: CdkStackProps) {
    super(scope, id, props);

    // 🔐 Store GitHub token in Secrets Manager
    const githubTokenSecret = new secretsmanager.Secret(this, "GitHubToken", {
      secretName: "chandler-pd-access-token-cdk",
      description: "GitHub Personal Access Token for Amplify",
      secretStringValue: cdk.SecretValue.unsafePlainText(props.githubToken),
    });

    // 🚀 Amplify App 1: Complaints Portal (with Auth)
    const complaintsPortalApp = new amplify.App(this, "ComplaintsPortal", {
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: props.githubOwner,
        repository: "chandler-pd",
        oauthToken: githubTokenSecret.secretValue,
      }),
      autoBranchCreation: {
        patterns: ["*"],
        basicAuth: amplify.BasicAuth.fromGeneratedPassword("auto-user"),
        pullRequestEnvironmentName: "staging",
      },
      buildSpec: cdk.aws_codebuild.BuildSpec.fromObjectToYaml({
        version: "1.0",
        frontend: {
          phases: {
            preBuild: {
              commands: ["cd frontend/complaints-portal", "npm ci"],
            },
            build: {
              commands: ["npm run build"],
            },
          },
          artifacts: {
            baseDirectory: "frontend/complaints-portal/dist",
            files: ["**/*"],
          },
          cache: {
            paths: ["frontend/complaints-portal/node_modules/**/*"],
          },
        },
      }),
    });

    complaintsPortalApp.addBranch("main");

    complaintsPortalApp.addEnvironment("VITE_API_URL", props.viteApiUrl);
    complaintsPortalApp.addEnvironment("VITE_ENABLE_AUTH", props.viteEnableAuth);

    // 🚀 Amplify App 2: Complaints Form (NO Auth)
    const complaintsFormApp = new amplify.App(this, "ComplaintsForm", {
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: props.githubOwner,
        repository: "chandler-pd",
        oauthToken: githubTokenSecret.secretValue,
      }),
      autoBranchCreation: {
        patterns: ["*"],
        basicAuth: amplify.BasicAuth.fromGeneratedPassword("auto-user"),
        pullRequestEnvironmentName: "staging",
      },
      buildSpec: cdk.aws_codebuild.BuildSpec.fromObjectToYaml({
        version: "1.0",
        frontend: {
          phases: {
            preBuild: {
              commands: ["cd frontend/complaints-form", "npm ci"],
            },
            build: {
              commands: ["npm run build"],
            },
          },
          artifacts: {
            baseDirectory: "frontend/complaints-form/dist",
            files: ["**/*"],
          },
          cache: {
            paths: ["frontend/complaints-form/node_modules/**/*"],
          },
        },
      }),
    });

    complaintsFormApp.addBranch("main");

    complaintsFormApp.addEnvironment("VITE_API_URL", props.viteApiUrl);


    // add api gateway, dynamodb, ses and 4 lambda functions: Add/update complaint, Query db, email invocation and heatmap api
    const complaintTable = new dynamodb.Table(this, 'ComplaintTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
    });
    const complaintTableArn = complaintTable.tableArn;

    const DBManagementLambda = new lambda.Function(this, 'DBManagementLambda', {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'dbManagementFn.lambda_handler',
      code: lambda.Code.fromAsset('../lambda'),
      environment: {
        COMPLAINT_TABLE_NAME: complaintTable.tableName
      }
    });
    const dbQueryLambda = new lambda.Function(this, 'dbQueryLambda', {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'dbQueryFn.lambda_handler',
      code: lambda.Code.fromAsset('../lambda'),
      environment: {
        COMPLAINT_TABLE_NAME: complaintTable.tableName
      }
    });
    const emailHandlerLambda = new lambda.Function(this, 'EmailHandlerLambda', {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'emailHandlerFn.lambda_handler',
      code: lambda.Code.fromAsset('../lambda'),
      environment: {
        COMPLAINT_TABLE_NAME: complaintTable.tableName
      }
    });
    const heatmapLambda = new lambda.Function(this, 'HeatmapLambda', {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'initialHeatmapQueryFn.lambda_handler',
      code: lambda.Code.fromAsset('../lambda'),
      environment: {
        COMPLAINT_TABLE_NAME: complaintTable.tableName
      }
    });

    const beatRetrievalLayer = new lambda.LayerVersion(this, 'BeatRetrievalLayer', {
      code: lambda.Code.fromAsset('../lambda/layers/beat_retrieval_layer'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_13],
      description: 'Layer for beat retrieval dependencies',
    });

    const beatRetrievalLambda = new lambda.Function(this, 'beatRetrievalLambda', {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'beatRetrievalFn.lambda_handler',
      code: lambda.Code.fromAsset('../lambda'),
      environment: {
        COMPLAINT_TABLE_NAME: complaintTable.tableName
      },
      layers: [beatRetrievalLayer]
    })
    complaintTable.grantReadWriteData(DBManagementLambda);
    complaintTable.grantReadWriteData(dbQueryLambda);
    complaintTable.grantReadWriteData(heatmapLambda);
    complaintTable.grantReadWriteData(beatRetrievalLambda);
    
    // Create a new api gateway


    const api = new apigateway.RestApi(this, 'ChandlerPDApiGateway', {
      restApiName: 'chandlerPDAPI',
      description: 'This is an All purpose Rest API for all backend functionality related to Chandler PD',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      }
    });

    const rootResource = api.root.addResource('root');
    rootResource.addMethod('POST', new apigateway.LambdaIntegration(DBManagementLambda));
    rootResource.addMethod('PUT', new apigateway.LambdaIntegration(DBManagementLambda));
    // rootResource.addMethod('OPTIONS', new apigateway.LambdaIntegration(DBManagementLambda));
    rootResource.defaultCorsPreflightOptions
    // rootResource.addCorsPreflight({
    //   allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
    //   allowMethods: ['OPTIONS', 'POST', 'PUT'],
    //   allowCredentials: true,
    //   allowOrigins: ['*'],
    // });

    const beatOpenCaseResource = rootResource.addResource('beat-open-cases');
    beatOpenCaseResource.addMethod('GET', new apigateway.LambdaIntegration(heatmapLambda));
    beatOpenCaseResource.defaultCorsPreflightOptions

    // const chatbotResource = rootResource.addResource('/chatBot');
    // chatbotResource.addMethod('POST', new apigateway.LambdaIntegration(beatRetrievalLambda));
    // chatbotResource.defaultCorsPreflightOptions

    const dbQueryResource = rootResource.addResource('db-filter-query-api')
    dbQueryResource.addMethod('POST', new apigateway.LambdaIntegration(dbQueryLambda));
    dbQueryResource.addMethod('PUT', new apigateway.LambdaIntegration(dbQueryLambda));
    dbQueryResource.defaultCorsPreflightOptions

    const emailResource = rootResource.addResource('send-email')
    emailResource.addMethod('POST', new apigateway.LambdaIntegration(emailHandlerLambda));
    emailResource.defaultCorsPreflightOptions

    const emailIdentity = ses.Identity.email('mmaddur1@asu.edu');
    new ses.EmailIdentity(this, "EmailIdentity", {
      identity: emailIdentity,
    });    
  }
}
