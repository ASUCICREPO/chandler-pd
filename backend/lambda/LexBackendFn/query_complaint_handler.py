import json
import logging
import boto3
import datetime
import pytz
from config import table_name, lambda_name
from utils import invoke_lambda
from databaseSearch import search_complaints

# Configure logger
logger = logging.getLogger()

def handle(event):
    """
    Handler for the Query_Complaint_Info intent
    
    Parameters:
    event (dict): The event dictionary containing the Lex V2 request details
    
    Returns:
    dict: Response message with filter summaries and query results
    """
    # Define Arizona timezone
    arizona_tz = pytz.timezone('America/Phoenix')
    
    # Get current date and time in Arizona
    current_az_time = datetime.datetime.now(arizona_tz)
    
    intent_name = event['sessionState']['intent']['name']
    slots = event['sessionState']['intent']['slots']
    
    # Extract filter values from slots
    raw_filters = extract_filters_from_slots(slots)
    
    # Use the search_complaints function from databaseSearch.py
    all_complaints, status_counts, total_complaints, filters, date_range = search_complaints(raw_filters)
    
    # Format and return the response
    return format_response(
        intent_name, 
        filters, 
        date_range, 
        all_complaints, 
        status_counts, 
        total_complaints, 
        current_az_time
    )

def extract_filters_from_slots(slots):
    """
    Extract filter values from the Lex slots
    
    Parameters:
    slots (dict): The slots object from the Lex V2 request
    
    Returns:
    dict: Raw filter values organized by filter type
    """
    # Direct extraction of values using the array structure in the event
    beat_nums = []
    if 'beatNums' in slots and slots['beatNums'] is not None and 'values' in slots['beatNums']:
        beat_nums = [item['value']['interpretedValue'] for item in slots['beatNums']['values']]
    
    categories = []
    if 'category' in slots and slots['category'] is not None and 'values' in slots['category']:
        categories = [item['value']['interpretedValue'] for item in slots['category']['values']]
    
    # Simplified status handling - updated to match other slot extraction
    statuses = []
    if 'status' in slots and slots['status'] is not None and 'values' in slots['status']:
        statuses = [item['value']['interpretedValue'] for item in slots['status']['values']]
    
    # Extract days of week
    days_of_week = []
    if 'daysOfWeek' in slots and slots['daysOfWeek'] is not None and 'values' in slots['daysOfWeek']:
        days_of_week = [item['value']['interpretedValue'] for item in slots['daysOfWeek']['values']]
        
    # Extract relative times
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

def format_response(intent_name, filters, date_range, all_complaints, status_counts, total_complaints, current_az_time):
    """
    Format the response for Lex V2
    
    Parameters:
    intent_name (str): The name of the Lex intent
    filters (dict): The normalized filters used for search
    date_range (tuple): Start and end dates for time-based filters
    all_complaints (list): List of complaint objects matching the filters
    status_counts (dict): Dictionary with counts by status
    total_complaints (int): Total number of matching complaints
    current_az_time (datetime): Current time in Arizona
    
    Returns:
    dict: Formatted response for Lex V2
    """
    # Format the current Arizona time for display
    current_az_date = current_az_time.strftime("%Y-%m-%d")
    current_az_time_str = current_az_time.strftime("%H:%M:%S")
    
    # Construct response message with the data in Markdown format
    message = f"   \n\n"
    message += f"### I found information based on your search criteria:\n"
    message += f"- **Beat Numbers**: {', '.join(filters['beatNums']) if filters['beatNums'] else 'All'}\n"
    message += f"- **Categories**: {', '.join(filters['categories']) if filters['categories'] else 'All'}\n"
    message += f"- **Statuses**: {', '.join(filters['statuses']) if filters['statuses'] else 'All'}\n"
    
    # Include days of week in search criteria summary
    if filters['daysOfWeek']:
        message += f"- **Days of Week**: {', '.join(filters['daysOfWeek'])}\n"
    
    # Include relative times in search criteria summary
    if filters['relativeTimes']:
        # Format the date range for display
        start_date = date_range[0]
        end_date = date_range[1]
        message += f"- **Time Period**: {', '.join(filters['relativeTimes'])} ({start_date} to {end_date} Arizona time)\n"
    
    # Add current time information
    message += f"- **Query Time**: {current_az_date} at {current_az_time_str} (Arizona time)\n"
    message += f"\n"

    # After counting the complaints, but before returning the response
    if total_complaints > 0:
        message += f"### Summary\n"
        message += f"I found **{total_complaints}** complaints matching your criteria:\n"
        for status, count in status_counts.items():
            if count > 0:
                message += f"- **{status}**: {count} complaint{'s' if count > 1 else ''}\n"
        
        # Add detailed information about each complaint
        message += "\n### Complaint Details\n"
        
        # Limit to first 5 complaints to avoid very long messages
        max_complaints_to_show = min(5, len(all_complaints))
        for i in range(max_complaints_to_show):
            complaint = all_complaints[i]
            
            # Format date if available
            complaint_date = complaint.get('dateOfComplaint', 'Unknown date')
            
            # Format the time information
            time_info = ""
            if 'daysOfWeek' in complaint and complaint['daysOfWeek']:
                days = ", ".join(complaint['daysOfWeek'])
                time_info += f"on {days}"
            
            if 'startTime' in complaint and 'endTime' in complaint:
                # Convert 24h format to more readable time if needed
                start = complaint['startTime'][:5]  # Take only HH:MM
                end = complaint['endTime'][:5]      # Take only HH:MM
                if time_info:
                    time_info += f" between {start} and {end} (Arizona time)"
                else:
                    time_info = f"between {start} and {end} (Arizona time)"
            
            # Format the address
            address = complaint.get('addressStreet', 'Unknown location')
            
            message += f"#### Complaint #{i+1} (ID: {complaint['complaintId']})\n"
            # Make sure each item is on its own line by using double line breaks
            message += f"**Reported by**: {complaint.get('firstName', '')} {complaint.get('lastName', '')}\n\n"
            message += f"**Filed on**: {complaint_date} (Arizona time)\n\n"
            message += f"**Category**: {complaint.get('problemCategory', 'Not specified')}\n\n"
            message += f"**Beat**: {complaint.get('beatNumber', 'Not specified')}\n\n"
            message += f"**Status**: {complaint.get('complaintStatus', 'Not specified')}\n\n"
            message += f"**Location**: {address}\n\n"
            message += f"**Occurs**: {time_info}\n"
            
            # Include the description
            if 'description' in complaint and complaint['description']:
                message += f"\n**Issue Description**:\n"
                message += f"> {complaint['description']}\n"
            
            # Add a divider between complaints
            if i < max_complaints_to_show - 1:
                message += "\n---\n"
        
        if len(all_complaints) > max_complaints_to_show:
            message += f"\n\n_...and {len(all_complaints) - max_complaints_to_show} more complaints not shown. Please refine your search if you need more specific results._"
    else:
        message += "I couldn't find any complaints matching your criteria. Try adjusting your filters for different results."
    
    # Return formatted response for Lex V2 with Markdown content type
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
                "contentType": "SSML",  # Changed from "PlainText" to "SSML" to support Markdown
                "content": message
            }
        ]
    }