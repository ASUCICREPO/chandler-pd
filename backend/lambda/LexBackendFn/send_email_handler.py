import json
import logging
import boto3
from utils import invoke_lambda
import config
from databaseSearch import search_complaints

# Configure logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS Lambda client
lambda_client = boto3.client('lambda')
# Initialize the Lex V2 client
lex_client = boto3.client('lexv2-runtime')

def handle(event):
    """
    Handler for the sendEmail intent
    
    Parameters:
    event (dict): The event dictionary containing the Lex V2 request details
    
    Returns:
    dict: Response message confirming the email address
    """
    # Log the incoming event for debugging
    logger.info('Received sendEmail event: %s', json.dumps(event))
    
    # Extract intent name for the response
    intent_name = event['sessionState']['intent']['name']
    
    # Get the sessionId from the event
    session_id = event.get('sessionId')
    
    # Variables to store session data
    session_filters = None
    
    # Get session information using the new boto3 operation
    if session_id:
        try:
            session_response = lex_client.get_session(
                botId=config.botId,
                botAliasId=config.botAliasId,
                localeId=config.localeId,
                sessionId=session_id
            )
            # Extract filters from the session response
            session_filters = extract_filters_from_response(session_response)
            # Log the extracted filters
            logger.info('Extracted session filters: %s', json.dumps(session_filters))
        except Exception as e:
            logger.error(f"Error getting session information: {str(e)}")
    
    # Extract the email address from the slots
    email_address = None
    if 'slots' in event['sessionState']['intent'] and 'email' in event['sessionState']['intent']['slots']:
        email_slot = event['sessionState']['intent']['slots']['email']
        if email_slot and 'value' in email_slot and 'interpretedValue' in email_slot['value']:
            email_address = email_slot['value']['interpretedValue']
    
    if not email_address:
        # Return error response if no email was provided
        return {
            "sessionState": {
                "dialogAction": {
                    "type": "Close"
                },
                "intent": {
                    "name": intent_name,
                    "state": "Failed"
                }
            },
            "messages": [
                {
                    "contentType": "PlainText",
                    "content": "I couldn't find a valid email address in your request. Please try again with a valid email."
                }
            ]
        }
    
    # Use session filters to query for complaints if available
    complaints_to_send = []
    status_counts = {}
    total_complaints = 0
    applied_filters = {}
    date_range = ("", "")
    
    # Default to empty filters if none are available
    if not session_filters:
        session_filters = {
            "beatNums": [],
            "categories": [],
            "statuses": [],
            "daysOfWeek": [],
            "relativeTimes": []
        }
        logger.info('No session filters available, using empty filters')
    
    try:
        # Call search_complaints to get relevant complaints based on filters
        complaints_to_send, status_counts, total_complaints, applied_filters, date_range = search_complaints(session_filters)
        
        # Log the search results
        logger.info(f'Found {total_complaints} complaints matching the filters')
        logger.info(f'Status counts: {status_counts}')
        logger.info(f'Applied filters: {applied_filters}')
        logger.info(f'Date range: {date_range}')
        
        # If no complaints were found, log a warning
        if not complaints_to_send:
            logger.warning('No complaints found matching the filters')
    except Exception as e:
        logger.error(f"Error searching for complaints: {str(e)}")
        # In case of error, return an empty list
        complaints_to_send = []
    
    # Create the email event payload
    email_payload = {
        "selectedComplaints": complaints_to_send,
        "sendTo": email_address,  # Use the email address from the Lex slots
        "filters": applied_filters,  # Include the filters that were applied
        "dateRange": date_range   # Include the date range that was applied
    }
    
    # Convert to JSON
    email_payload_json = json.dumps(email_payload)
    
    try:
        # Invoke the email Lambda function using the utility function
        logger.info(f"Invoking emailHandlerLambdaFn with sendTo: {email_address}")
        response_payload = invoke_lambda(config.email_lambda_name, email_payload_json)
        
        # Parse the response if needed
        logger.info(f"Email Lambda response: {response_payload}")
        
        # Create success response with complaint information
        complaint_count_message = f"I've sent {total_complaints} complaint"
        if total_complaints != 1:
            complaint_count_message += "s"
            
        # Add filter information to the message if filters were applied
        filter_info = ""
        if applied_filters.get("beatNums"):
            beat_str = ", ".join(applied_filters["beatNums"])
            filter_info += f" from beat{'' if len(applied_filters['beatNums']) == 1 else 's'} {beat_str}"
        
        if applied_filters.get("categories"):
            category_str = ", ".join(applied_filters["categories"])
            filter_info += f" with category {category_str}"
            
        if applied_filters.get("statuses"):
            status_str = ", ".join(applied_filters["statuses"])
            filter_info += f" having status {status_str}"
            
        if applied_filters.get("daysOfWeek"):
            days_str = ", ".join(applied_filters["daysOfWeek"])
            filter_info += f" occurring on {days_str}"
            
        # Add date range information if applicable
        if date_range[0] and date_range[1]:
            filter_info += f" between {date_range[0]} and {date_range[1]}"
        
        # Construct the complete message
        content_message = f"I've sent complaint{filter_info} to {email_address}. Please check your inbox shortly."
        
        # Return success response
        return {
            "sessionState": {
                "dialogAction": {
                    "type": "Close"
                },
                "intent": {
                    "name": intent_name,
                    "state": "Fulfilled"
                }
            },
            "messages": [
                {
                    "contentType": "PlainText",
                    "content": content_message
                }
            ]
        }
        
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        
        # Return error response
        return {
            "sessionState": {
                "dialogAction": {
                    "type": "Close"
                },
                "intent": {
                    "name": intent_name,
                    "state": "Failed"
                }
            },
            "messages": [
                {
                    "contentType": "PlainText",
                    "content": f"I encountered an errThe intent 'FallbackIntent' is not yet implemented.or while trying to send the email. Please try again later."
                }
            ]
        }

def extract_filters_from_response(response_json):
    """
    Extract filter values from a Lex response JSON object
    
    Parameters:
    response_json (dict): The JSON response from Lex
    
    Returns:
    dict: Raw filter values organized by filter type
    """
    # Get the slots from the response object (either location works)
    slots = response_json.get('sessionState', {}).get('intent', {}).get('slots', {})
    
    # Direct extraction of values using the array structure in the response
    beat_nums = []
    if 'beatNums' in slots and slots['beatNums'] is not None and 'values' in slots['beatNums']:
        beat_nums = [item['value']['interpretedValue'] for item in slots['beatNums']['values']]
    
    categories = []
    if 'category' in slots and slots['category'] is not None and 'values' in slots['category']:
        categories = [item['value']['interpretedValue'] for item in slots['category']['values']]
    
    statuses = []
    if 'status' in slots and slots['status'] is not None and 'values' in slots['status']:
        statuses = [item['value']['interpretedValue'] for item in slots['status']['values']]
    
    days_of_week = []
    if 'daysOfWeek' in slots and slots['daysOfWeek'] is not None and 'values' in slots['daysOfWeek']:
        days_of_week = [item['value']['interpretedValue'] for item in slots['daysOfWeek']['values']]
        
    relative_times = []
    if 'relativeTimes' in slots and slots['relativeTimes'] is not None and 'values' in slots['relativeTimes']:
        relative_times = [item['value']['interpretedValue'] for item in slots['relativeTimes']['values']]
    
    # Create and return the raw filter dictionary
    return {
        "beatNums": beat_nums,
        "categories": categories,
        "statuses": statuses,
        "daysOfWeek": days_of_week,
        "relativeTimes": relative_times
    }