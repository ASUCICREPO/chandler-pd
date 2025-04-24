import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as ses from "aws-cdk-lib/aws-ses";
import * as amplify from "@aws-cdk/aws-amplify-alpha";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as LexBot from "cdk-lex-zip-import";
import * as cr from "aws-cdk-lib/custom-resources";
import { EmailEncoding } from "aws-cdk-lib/aws-ses-actions";

interface CdkStackProps extends cdk.StackProps {
  githubToken: string;
  githubOwner: string;
  viteEnableAuth: string;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    // add api gateway, dynamodb, ses and 4 lambda functions: Add/update complaint, Query db, email invocation, chatbot open, chatbot process and heatmap api
    const complaintTable = new dynamodb.Table(this, "ComplaintTable", {
      partitionKey: { name: "complaintId", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const complaintTableArn = complaintTable.tableArn;

    // Create the lambda layer for time zone conversions
    const lexBackendLayer = new lambda.LayerVersion(this, "LexBackendLayer", {
      code: lambda.Code.fromAsset("../lambda/layers/lex_backend_layer"),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_13],
      description: "Layer for Lex backend dependencies",
    });

    const beatRetrievalLayer = new lambda.LayerVersion(this, "BeatRetrievalLayer", {
      code: lambda.Code.fromAsset("../lambda/layers/beat_retrieval_layer"),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_13],
      description: "Layer for beat retrieval dependencies",
    });

    const beatRetrievalLambda = new lambda.Function(this, "beatRetrievalLambda", {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: "beatRetrievalFn.lambda_handler",
      code: lambda.Code.fromAsset("../lambda"),
      environment: {
        COMPLAINT_TABLE_NAME: complaintTable.tableName,
      },
      layers: [beatRetrievalLayer],
    });

    const DBManagementLambda = new lambda.Function(this, "DBManagementLambda", {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: "dbManagementFn.lambda_handler",
      code: lambda.Code.fromAsset("../lambda"),
      environment: {
        COMPLAINT_TABLE_NAME: complaintTable.tableName,
        LAMBDA_FN_NAME: beatRetrievalLambda.functionName,
      },
      role: new iam.Role(this, "DBManagementLambdaRole", {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"), iam.ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess"), iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")],
        inlinePolicies: {
          LambdaInvokePolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: ["lambda:InvokeFunction"],
                resources: ["*"],
              }),
            ],
          }),
        },
      }),
    });
    const dbQueryLambda = new lambda.Function(this, "dbQueryLambda", {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: "dbQueryFn.lambda_handler",
      code: lambda.Code.fromAsset("../lambda"),
      environment: {
        COMPLAINT_TABLE_NAME: complaintTable.tableName,
      },
    });
    const emailHandlerLambda = new lambda.Function(this, "EmailHandlerLambda", {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: "emailHandlerFn.lambda_handler",
      code: lambda.Code.fromAsset("../lambda"),
      environment: {
        COMPLAINT_TABLE_NAME: complaintTable.tableName,
      },
      role: new iam.Role(this, "emailHandlerLambdaRole", {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"), iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSESFullAccess")],
      }),
    });
    const heatmapLambda = new lambda.Function(this, "HeatmapLambda", {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: "initialHeatmapQueryFn.lambda_handler",
      code: lambda.Code.fromAsset("../lambda"),
      environment: {
        COMPLAINT_TABLE_NAME: complaintTable.tableName,
      },
    });

    // Create IAM role for Lex
    const lexRole = new iam.Role(this, "LexRole", {
      assumedBy: new iam.ServicePrincipal("lex.amazonaws.com"),
      description: "IAM Role for Lex to use Polly SynthesizeSpeech",
    });

    // Attach the Polly policy to the role
    lexRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["polly:SynthesizeSpeech"],
        resources: ["*"],
      })
    );

    // Create the Lex Bot language
    const lexBot = new LexBot.ImportBot(this, "LexBot", {
      lexRoleArn: lexRole.roleArn,
      sourceDirectory: "./LexBot",
    });

    //NOTE: You need to add the following line to the lexbot.ts file for this to work, solves a dependancy issue
    // node_modules/cdk-lex-zip-import/lib/lexbot.js, after the custom resource, but before the botId

    // // Add explicit dependency to ensure the bucket deployment completes first
    // lexBotImport.node.addDependency(upload);

    // Create the lambda function that opens the chatbot connection
    const chatbotConnectorLambda = new lambda.Function(this, "ChatbotConnectorLambda", {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: "chatbotConnectorFn.lambda_handler",
      code: lambda.Code.fromAsset("../lambda"),
      timeout: cdk.Duration.seconds(60),
      role: new iam.Role(this, "ChatbotConnectorLambdaRole", {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"), iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonLexFullAccess")],
      }),
      environment: {
        LEXBOT_ID: lexBot.botId,
      },
    });

    // Create the Lambda function that processes chatbot actions in the backend
    const chatbotBackendLambda = new lambda.Function(this, "ChatbotBackendLambda", {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: "lambda_function.lambda_handler",
      code: lambda.Code.fromAsset("../lambda/LexBackendFn"),
      timeout: cdk.Duration.seconds(60),
      role: new iam.Role(this, "ChatbotBackendLambdaRole", {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"), iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonLexFullAccess"), iam.ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess")],
      }),

      environment: {
        LEXBOT_ID: lexBot.botId,
        COMPLAINT_TABLE_NAME: complaintTable.tableName,
        DB_QUERY_LAMBDA_NAME: dbQueryLambda.functionName,
        EMAIL_LAMBDA_NAME: emailHandlerLambda.functionName,
      },
      layers: [lexBackendLayer],
    });

    // Define the Lex bot ARN pattern that allows any alias
    // Format: arn:aws:lex:{region}:{account}:bot-alias/{botId}/*
    const lexBotAnyAliasArn = `arn:aws:lex:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:bot-alias/${lexBot.botId}/*`;

    // Add the resource-based policy to allow any alias of the specified Lex bot to invoke this Lambda
    chatbotBackendLambda.addPermission("LexInvokePermission", {
      principal: new iam.ServicePrincipal("lexv2.amazonaws.com"),
      action: "lambda:InvokeFunction",
      sourceArn: lexBotAnyAliasArn,
    });

    // Create a custom resource to create the version and alias for the Lex bot, and set the alias ID for the lambdas

    const customResourceLambda = new lambda.Function(this, "LexBotVersionAliasLambda", {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: "LexBotVersionAliasFn.lambda_handler",
      code: lambda.Code.fromAsset("../lambda"),
      timeout: cdk.Duration.minutes(15),
      role: new iam.Role(this, "LexBotVersionAliasLambdaRole", {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"), iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonLexFullAccess"), iam.ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess")],
      }),
      environment: {
        LEXBOT_ID: lexBot.botId,
        LEXBOT_LAMBDA_ARN_BACKEND: chatbotBackendLambda.functionArn,
        LEXBOT_LAMBDA_ARN_CONNECTOR: chatbotConnectorLambda.functionArn,
      },
    });

    const provider = new cr.Provider(this, "LexBotVersionAliasProvider", {
      onEventHandler: customResourceLambda,
    });

    const customResource = new cdk.CustomResource(this, "LexBotVersionAlias", {
      serviceToken: provider.serviceToken,
      properties: {
        LexBotId: lexBot.botId,
      },
    });
    customResource.node.addDependency(chatbotBackendLambda);
    customResource.node.addDependency(chatbotConnectorLambda);
    customResource.node.addDependency(lexBot);

    complaintTable.grantReadWriteData(DBManagementLambda);
    complaintTable.grantReadWriteData(dbQueryLambda);
    complaintTable.grantReadWriteData(heatmapLambda);
    complaintTable.grantReadWriteData(beatRetrievalLambda);

    // Create a new api gateway

    const api = new apigateway.RestApi(this, "ChandlerPDApiGateway", {
      restApiName: "chandlerPDAPI",
      description: "This is an All purpose Rest API for all backend functionality related to Chandler PD",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
      deployOptions: {
        stageName: "prod",
      },
    });

    const rootResource = api.root;
    // proxy integration should be false

    rootResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(DBManagementLambda, {
        proxy: false,
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": "'*'",
              "method.response.header.Access-Control-Allow-Credentials": "'true'",
            },
          },
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
      }),
      {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Credentials": true,
            },
          },
        ],
      }
    );
    rootResource.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(DBManagementLambda, {
        proxy: false,
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": "'*'",
              "method.response.header.Access-Control-Allow-Credentials": "'true'",
            },
          },
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
      }),
      {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Credentials": true,
            },
          },
        ],
      }
    );
    // rootResource.addMethod('OPTIONS', new apigateway.LambdaIntegration(DBManagementLambda));
    rootResource.defaultCorsPreflightOptions;
    // root
    // rootResource.addCorsPreflight({
    //   allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
    //   allowMethods: ['OPTIONS', 'POST', 'PUT'],
    //   allowCredentials: true,
    //   allowOrigins: ['*'],
    // });

    const beatOpenCaseResource = rootResource.addResource("beat-open-cases");
    beatOpenCaseResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(heatmapLambda, {
        proxy: false,
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": "'*'",
              "method.response.header.Access-Control-Allow-Credentials": "'true'",
            },
          },
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
      }),
      {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Credentials": true,
            },
          },
        ],
      }
    );
    beatOpenCaseResource.defaultCorsPreflightOptions;

    // Add the chatbot connector resource
    const chatbotResource = rootResource.addResource("chatBot");
    chatbotResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(chatbotConnectorLambda, {
        proxy: false,
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": "'*'",
              "method.response.header.Access-Control-Allow-Credentials": "'true'",
            },
          },
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
      }),
      {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Credentials": true,
            },
          },
        ],
      }
    );
    chatbotResource.defaultCorsPreflightOptions;

    const dbQueryResource = rootResource.addResource("db-filter-query-api");
    dbQueryResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(dbQueryLambda, {
        proxy: false,
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": "'*'",
              "method.response.header.Access-Control-Allow-Credentials": "'true'",
            },
          },
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
      }),
      {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Credentials": true,
            },
          },
        ],
      }
    );
    dbQueryResource.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(dbQueryLambda, {
        proxy: false,
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": "'*'",
              "method.response.header.Access-Control-Allow-Credentials": "'true'",
            },
          },
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
      }),
      {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Credentials": true,
            },
          },
        ],
      }
    );
    dbQueryResource.defaultCorsPreflightOptions;

    const emailResource = rootResource.addResource("send-email");
    emailResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(emailHandlerLambda, {
        proxy: false,
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": "'*'",
              "method.response.header.Access-Control-Allow-Credentials": "'true'",
            },
          },
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
      }),
      {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Credentials": true,
            },
          },
        ],
      }
    );
    emailResource.defaultCorsPreflightOptions;

    const apiUrl = api.url;

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

    complaintsPortalApp.addEnvironment("VITE_API_URL", apiUrl);
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

    complaintsFormApp.addEnvironment("VITE_API_URL", apiUrl);

    const emailIdentity = ses.Identity.email("mmaddur1@asu.edu");
    new ses.EmailIdentity(this, "EmailIdentity", {
      identity: emailIdentity,
    });
  }
}
