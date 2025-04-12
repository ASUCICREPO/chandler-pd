import boto3
from boto3.dynamodb.conditions import Attr
import uuid
import math as m
import datetime
import json
from datetime import datetime, timedelta, timezone

dynamodb = boto3.resource('dynamodb')

def convert_to_utc7(time_str):
    """Convert time string to UTC-7 timezone"""
    # Parse the time string into a datetime object
    # time_obj = datetime.strptime(time_str, '%Y-%m-%dT%H:%M:%S.%fZ')

    # Set the timezone to UTC
    # time_obj = time_obj.replace(tzinfo=timezone.utc)

    # Convert to UTC-7
    phoenix_offset = timedelta(hours=-7)
    phoenix_timezone = timezone(phoenix_offset)
    # time_str = time_str.astimezone(phoenix_timezone)

    final_date_time = datetime.fromisoformat(time_str).astimezone(phoenix_timezone)
    # date_var = final_date_time.date()
    time_var = final_date_time.time()

    # Format the datetime object back to a string
    return str(time_var)

def lambda_handler(event, context):
    print(event)
    table_name = event.get('tableName', None)
    date = event.get('date', None)
    time = event.get('time', None)
    beat_no = event.get('beatNumber', None)
    complaint_id = event.get('complaintId', None)
    problem_category = event.get('problemCategory', None)
    complaint_status = event.get('complaintStatus', None)
    start_date = event.get('startDate', None)
    end_date = event.get('endDate', None)
    start_time = event.get('startTime', None)
    end_time = event.get('endTime', None)
    
    """Query records from DynamoDB table based on date, time, beat no, complaint id, problem category, complaint status"""
    table = dynamodb.Table(table_name)
     
    filter_expressions = []
    
    if start_date and end_date:
        # filter_expressions.append(Attr('startDate').eq(start_date) & Attr('endDate').eq(end_date))
        filter_expressions.append(Attr('startDate').between(start_date, end_date))
    elif date:
        filter_expressions.append(Attr('dateOfComplaint').eq(date))

    if start_time and end_time:
        # Convert string times to datetime.time objects for comparison
        start_time_obj = convert_to_utc7(start_time)
        end_time_obj = convert_to_utc7(end_time)
        # filter_expressions.append(Attr('startTime').between(start_time_obj.strftime('%H:%M:%S'), end_time_obj.strftime('%H:%M:%S')))
        filter_expressions.append(Attr('startTime').between(start_time_obj, end_time_obj))

        # filter_expressions.append(Attr('startTime').eq(start_time_obj) & Attr('endTime').eq(end_time_obj))
    elif time:
        # Convert single time string to datetime.time object
        time_obj = datetime.strptime(time, '%H:%M:%S').time() 
        filter_expressions.append(Attr('time').eq(time_obj.strftime('%H:%M:%S')))        
    if beat_no:
        if isinstance(beat_no, list):
            # Handle multiple beat numbers
            beat_conditions = [Attr('beatNumber').eq(b) for b in beat_no]
            combined_beat = beat_conditions[0]
            for condition in beat_conditions[1:]:
                combined_beat = combined_beat | condition
            filter_expressions.append(combined_beat)
        else:
            filter_expressions.append(Attr('beatNumber').eq(beat_no))
        
    if complaint_id:
        if isinstance(complaint_id, list):
            # Handle multiple complaint IDs
            complaint_conditions = [Attr('complaintId').eq(c) for c in complaint_id]
            combined_complaints = complaint_conditions[0]
            for condition in complaint_conditions[1:]:
                combined_complaints = combined_complaints | condition
            filter_expressions.append(combined_complaints)
        else:
            filter_expressions.append(Attr('complaintId').eq(complaint_id))
        
    if problem_category:
        if isinstance(problem_category, list):
            # Handle multiple problem categories
            category_conditions = [Attr('problemCategory').eq(p) for p in problem_category]
            combined_categories = category_conditions[0]
            for condition in category_conditions[1:]:
                combined_categories = combined_categories | condition
            filter_expressions.append(combined_categories)
        else:
            filter_expressions.append(Attr('problemCategory').eq(problem_category))     

    if complaint_status:
        filter_expressions.append(Attr('complaintStatus').eq(complaint_status))

    if filter_expressions:
        combined_filter = filter_expressions[0]
        for filter_exp in filter_expressions[1:]:
            combined_filter = combined_filter & filter_exp
        response = table.scan(FilterExpression=combined_filter)
    else:
        response = table.scan()

    totalStatusDict = {}

    print(filter_expressions)
    # Incase it is the totals of the filter query
    if not filter_expressions:
        totalStatusDict['TotalOpen'] = len(table.scan(FilterExpression=Attr('complaintStatus').eq("Open"))['Items'])
        totalStatusDict['TotalClosed'] = len(table.scan(FilterExpression=Attr('complaintStatus').eq("Closed"))['Items'])
        totalStatusDict['TotalFollow-Up'] = len(table.scan(FilterExpression=Attr('complaintStatus').eq("Follow-Up"))['Items'])
        totalStatusDict['TotalRed-Star'] = len(table.scan(FilterExpression=Attr('complaintStatus').eq("Red-Star"))['Items'])
    else:
        if not complaint_status:
            for each_status in ["Open", "Closed", "Follow-Up", "Red-Star"]:
                new_combined_filter = combined_filter
                total_count_filter = Attr('complaintStatus').eq(each_status)
                new_combined_filter = new_combined_filter & total_count_filter
                totalStatusDict[f"Total{each_status}"] = len(table.scan(FilterExpression=new_combined_filter)['Items'])
                # response['Items'] += table.scan(FilterExpression=Attr('complaintStatus').eq(each_status))['Items']
        else:
            for each_status in ["Open", "Closed", "Follow-Up", "Red-Star"]:
                if each_status.lower() == complaint_status.lower():
                    totalStatusDict[f"Total{each_status}"] = len(response['Items'])
                else:
                    totalStatusDict[f"Total{each_status}"] = 0
            
    
    # # In the case of global totals for status
    # for each_status in ["Open", "Closed", "Follow up", "Red star"]:
    #     totalStatusDict[each_status] = len(table.scan(FilterExpression=Attr('complaintStatus').eq(each_status))['Items'])



    # sort by complaint id
    # response['Items'] = sorted(response['Items'], key=lambda x: x['complaintId'], reverse=True)
        
    total_pages = m.ceil(len(response['Items'])/10)
    current_page = int(event.get('page', -1))
    totalComplaint = len(response['Items'])
    if  current_page > 0 and current_page <= total_pages:
        start_index = (current_page - 1) * 10
        if current_page == total_pages:
            complaint_data = response['Items'][start_index:]
        else:
            complaint_data = response['Items'][start_index : start_index + 10]
        # complaint_data = response['Items']
        message = "Complaints fetched successfully"
    else:
        complaint_data = []  
        current_page = -1  
        message = "Page out of limit"

    return {
        "complaintsData": complaint_data,
        "page": current_page,
        "status": 200,
        "totalComplaint": len(response['Items']),
        "totalStatusCounts": totalStatusDict,
        "totalPages": total_pages,
        "message": message
        }