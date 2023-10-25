import os
import json
import boto3

client = boto3.resource('dynamodb')

def handler(event, context):
    table = client.Table(os.environ['dbTable'])

    response = table.scan()
    message = []
    for item in response['Items']:
        print(item)
        message.append({ item['id']: int(item['count'])})

    return {
        "body": json.dumps(message),
        "statusCode": 200,
    };
