import json
import boto3
from boto3.dynamodb.conditions import Attr
import os

dynamodb = boto3.resource('dynamodb')

table = dynamodb.Table(os.environ['COMPLAINT_TABLE_NAME'])

# Driver function that queries and retrieves all open cases per beat
def lambda_handler(event, context):
    try:
        beat_opencases_dict = {}
        opencases_for_each_beat = table.scan()

        attribute = 'beatNumber'
        unique_values = set(item[attribute] for item in opencases_for_each_beat['Items'])
        
        for beat in unique_values:
            response = table.scan(FilterExpression= Attr(attribute).eq(beat) & Attr('complaintStatus').eq('Open'))
            beat_opencases_dict[beat] = len(response['Items'])

        return {
            'statusCode': 200,
            'body': beat_opencases_dict
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': str(e)
        }

