import os
import json
import boto3

client = boto3.resource('dynamodb')

def handler(event, context):
    table = client.Table(os.environ['dbTable'])
    for rec in event['Records']:
        body = json.loads(rec["body"])
        try:
            response = table.get_item(Key={"id": body["word"]})
            entry = response['Item']
            print("got", entry)
        except Exception as e:
            print('no entry', e)
            entry = dict()
            entry["id"] = body["word"]
            entry["count"] = 0
        entry["count"] += 1
        try:
            table.put_item(
                Item=entry
            )
            print("put", entry)
        except Exception as e:
            print(e)
            raise(e)

