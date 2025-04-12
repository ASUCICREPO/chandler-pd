import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ses from 'aws-cdk-lib/aws-ses';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // add api gateway, dynamodb, ses and 4 lambda functions: Add/update complaint, Query db, email invocation and heatmap api
    const complaintTable = new dynamodb.Table(this, 'ComplaintTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
    });
    const complaintTableArn = complaintTable.tableArn;

    const addComplaintLambda = new lambda.Function(this, 'AddComplaintLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'addComplaint.handler',
      code: lambda.Code.fromAsset('../api'),
      environment: {
        COMPLAINT_TABLE_NAME: complaintTable.tableName
      }
    });
    const queryComplaintLambda = new lambda.Function(this, 'QueryComplaintLambda', {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'queryComplaint.handler',
      code: lambda.Code.fromAsset('../api'),
      environment: {
        COMPLAINT_TABLE_NAME: complaintTable.tableName
      }
    });
    const emailLambda = new lambda.Function(this, 'EmailLambda', {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'email.handler',
      code: lambda.Code.fromAsset('../api'),
      environment: {
        COMPLAINT_TABLE_NAME: complaintTable.tableName
      }
    });
    const heatmapLambda = new lambda.Function(this, 'HeatmapLambda', {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'heatmap.handler',
      code: lambda.Code.fromAsset('../api'),
      environment: {
        COMPLAINT_TABLE_NAME: complaintTable.tableName
      }
    });
    complaintTable.grantReadWriteData(addComplaintLambda);

    const api = new apigateway.RestApi(this, 'MyApi', {
      restApiName: 'My Service API',
      description: 'This is my API Gateway service.',
    });

    const emailIdentity = ses.Identity.email('youremail@example.com');
    new ses.EmailIdentity(this, "EmailIdentity", {
      identity: emailIdentity,
    });    
  }
}
