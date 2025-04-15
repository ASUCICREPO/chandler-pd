#write a lambda function to add or update records to dynamodb database
import boto3
import json
from datetime import datetime
from botocore.exceptions import ClientError
from datetime import datetime, timezone, timedelta
import uuid
from boto3.dynamodb.conditions import Attr
from decimal import Decimal
import os

dynamodb = boto3.resource('dynamodb')
lambda_client = boto3.client('lambda')

COMPLAINTS_TABLE = os.environ['COMPLAINT_TABLE_NAME']

# BeatRetrieval
def invoke_lambda(function_name, payload):
    """Invoke another Lambda function with the given payload"""
    
    try:
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=payload
        )
        return response['Payload'].read()
    except Exception as e:
        print(f"Error invoking Lambda function: {str(e)}")
        raise e   

def convert_to_utc7(time_str):
    """Convert time string to UTC-7 timezone"""
    # Parse the time string into a datetime object
    # time_obj = datetime.strptime(time_str, '%Y-%m-%dT%H:%M:%S.%fZ')

    # Set the timezone to UTC
    # time_obj = time_obj.replace(tzinfo=timezone.utc)
    if time_str == "":
        return "", ""
    else:
        # Convert to UTC-7
        phoenix_offset = timedelta(hours=-7)
        phoenix_timezone = timezone(phoenix_offset)
        # time_str = time_str.astimezone(phoenix_timezone)

        final_date_time = datetime.fromisoformat(time_str).astimezone(phoenix_timezone)
        date_var = final_date_time.date()
        time_var = final_date_time.time()

        # Format the datetime object back to a string
        return str(date_var), str(time_var)

def create_table_if_not_exists(table_name):
    """Create DynamoDB table if it doesn't exist"""
    try:
        table = dynamodb.create_table(
            TableName=table_name,
            KeySchema=[{'AttributeName': 'complaintId', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'complaintId', 'AttributeType': 'S'}],
            ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
        )
        table.wait_until_exists()
    except Exception as Error:
        return Error

def update_record(record_id, attribute, value):
    # Verify the new value is valid

    """Update a record in DynamoDB table"""
    table = dynamodb.Table(COMPLAINTS_TABLE)
    response = table.update_item(
        Key={'complaintId': record_id},
        UpdateExpression=f'SET {attribute} = :value',
        ExpressionAttributeValues={':value': value},
        ReturnValues='ALL_NEW'
    )
    print(response)
    # item = table.get_item(Key={'complaintId': record_id})
    return response.get('Attributes', {})


def add_item_to_table(event):
    """Add item to DynamoDB table"""
    initial_date, initial_time = convert_to_utc7(event.get('startTime', ''))
    end_date, end_time = convert_to_utc7(event.get('endTime', ''))
    
    try:
        # Generate a random id
        while True:
            # Generate random UUID
            complaint_id = str(uuid.uuid4())[:8]

            table = dynamodb.Table(COMPLAINTS_TABLE)
            
            # Check if ID already exists
            response = table.scan(
                FilterExpression=Attr('complaintId').eq(complaint_id)
            )
            
            # If no matching records found, ID is unique
            if len(response['Items']) == 0:
                break

        location_data = ""
        if event.get('location',"").lower() == 'address':
            for i in ['addressDirection', 'addressStreet', 'addressZipcode']:
                location_data += event.get(i, '') + ' '
        elif event.get('location', "").lower() == 'intersection':
            for i in ['intersection1Direction', 'intersection1Street']:
                location_data += event.get(i, '') + ' '
            location_data += '& '
            for i in ['intersection2Direction', 'intersection2Street']:
                location_data += event.get(i, '') + ' '

        # Call another lambda function
        beat_data = invoke_lambda('BeatRetrieval', json.dumps({"location_data": location_data}))
        parsed = json.loads(beat_data)
        print(parsed)
        
        # Processing data obtained from BeatRetrieval Lambda API to get beat no. and coordinates
        if len(parsed['body']['candidates']) > 0:
            if int(parsed['body']['candidates'][0]['score']) > 0.8:
                if len(parsed['body']['candidates']) == 1:
                    beat_no = parsed['body']['candidates'][0]['attributes']['PoliceBeat']
                    x, y = str(parsed['body']['candidates'][0]['location']['x']), str(parsed['body']['candidates'][0]['location']['y'])
                elif len(parsed['body']['candidates']) > 1:
                    if parsed['body']['candidates'][0]['attributes']['PoliceBeat'] == "" and parsed['body']['candidates'][1]['attributes']['PoliceBeat']!="" and int(parsed['body']['candidates'][1]['score']) > 0.8:
                            beat_no = parsed['body']['candidates'][1]['attributes']['PoliceBeat']
                            x, y = str(parsed['body']['candidates'][1]['location']['x']), str(parsed['body']['candidates'][1]['location']['y'])
                    else:
                        beat_no = parsed['body']['candidates'][0]['attributes']['PoliceBeat']
                        x, y = str(parsed['body']['candidates'][0]['location']['x']), str(parsed['body']['candidates'][0]['location']['y'])

            # beat_no = parsed['body']['candidates'][0]['attributes']['PoliceBeat']
            # x, y = str(parsed['body']['candidates'][0]['location']['x']), str(parsed['body']['candidates'][0]['location']['y'])
            coordinates = (x,y)
        else:
            beat_no = ""
            coordinates = ("", "")

        item = {
            "isUrgentChecked": event.get('isUrgentChecked', False),
            "firstName": event.get('firstName', ''),
            "lastName": event.get('lastName', ''), 
            "daysOfWeek": event.get('daysOfWeek', []),
            "startTime": initial_time,
            "endTime": end_time,
            "location": event.get('location', ''),
            "addressDirection": event.get('addressDirection', ''),
            "addressStreet": event.get('addressStreet', ''),
            "addressZipcode": event.get('addressZipcode', ''),
            "intersection1Direction": event.get('intersection1Direction', ''),
            "intersection1Street": event.get('intersection1Street', ''),
            "intersection2Direction": event.get('intersection2Direction', ''),
            "intersection2Street": event.get('intersection2Street', ''),
            "intersectionZipcode": event.get('intersectionZipcode', ''),
            "problemCategory": event.get('problemCategory', ''),
            "description": event.get('description', ''),
            "subscribeToAlerts": event.get('subscribeToAlerts', ''),
            "email": event.get('email', ''),
            "phone": event.get('phone', ''),        
            "officersNotes": event.get('officersNote', ''),
            "complaintStatus": 'Open',
            "beatNumber": beat_no,
            "complaintId": complaint_id,
            "coordinates": coordinates,
            "dateOfComplaint": str(initial_date),
            "startDate": str(initial_date),
            "endDate": str(end_date)
        }
    
        table = dynamodb.Table(COMPLAINTS_TABLE)
        response = table.put_item(Item=item)
        return {
            'statusCode': 200,
            'body': json.dumps(response)
        }
    except ClientError as e:
        if "ResourceNotFoundException" in str(e):
            create_table_if_not_exists(COMPLAINTS_TABLE)
            # response = table.put_item(Item=item)
            # return {
            #     'statusCode': 200,
            #     'body': json.dumps(response)
            # }
        return {
            'statusCode': 500,
            'body': f"Error: {str(e)}"
        }

# TODO: Change based on payload (API METHOD)
def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    # table = dynamodb.Table('YourTableName')  # Replace with your actual table name
    print(event)
    print(context)
    # return add_item_to_table(event)
    if not event.get('isUpdate', False):
        print(event.get('isUpdate', False))
        return add_item_to_table(event)
    elif event.get('isUpdate', False):
        print(event.get('isUpdate', False))
        record_id = event.get('complaintId', '')
        attribute = event.get('attribute', '')
        value = event.get('value', '')
        item = update_record(record_id, attribute, value)
        print(item)
        # Attr('problemCategory').eq(problem_category)
        return {
            'statusCode': 200,
            'message': 'Record updated successfully',
            'body': item
        }



    