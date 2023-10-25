import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as api from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as IAM from 'aws-cdk-lib/aws-iam';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class CdkWordcountStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const restapi = new api.RestApi(this, 'wc-api', {
        cloudWatchRole: true,
        parameters: { para: 'foobar' },
        deployOptions: { stageName: 'dev' }
    });

    const sendMessageRole = new IAM.Role(this, 'wc-send-message-role', {
        assumedBy: new IAM.ServicePrincipal('apigateway.amazonaws.com'),
    });

    const queue = new sqs.Queue(this, 'wc-queue');
    queue.grantSendMessages(sendMessageRole);

    const sendMessageIntegration = new api.AwsIntegration({
      service: 'sqs',
      path: `${queue.queueName}`,
      integrationHttpMethod: 'POST',
      options: {
        credentialsRole: sendMessageRole,
        requestParameters: {
          'integration.request.header.Content-Type': `'application/x-www-form-urlencoded'`,
        },
        requestTemplates: {
          'application/json': 'Action=SendMessage&MessageBody=$input.body',
        },
        integrationResponses: [
          {
            statusCode: '200',
          },
          {
            statusCode: '400',
          },
          {
            statusCode: '500',
          }
        ]
      },
    });

    restapi.root.resourceForPath('wc').addMethod('POST', sendMessageIntegration, {
      methodResponses: [
        {
          statusCode: '400',
        },
        {
          statusCode: '200',
        },
        {
          statusCode: '500',
        }
      ]
    });

    const modifyTableRole = new IAM.Role(this, 'wc-modify-table-role', {
        assumedBy: new IAM.ServicePrincipal('lambda.amazonaws.com'),
    });
    modifyTableRole.addManagedPolicy(IAM.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"));

    const globalTable = new dynamodb.Table(this, 'wc-table', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    globalTable.grantReadWriteData(modifyTableRole);

    const lambdaFunction = new lambda.Function(this, 'wc-lambda', {
      runtime: lambda.Runtime.PYTHON_3_11,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'wordcount.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '/../lambda/wordcount')),
      environment: {
        dbTable: globalTable.tableName
      },
      role: modifyTableRole
    });

    lambdaFunction.addEventSource(new eventsources.SqsEventSource(queue));

  }
}
