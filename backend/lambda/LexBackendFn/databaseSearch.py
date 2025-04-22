import json
import logging
import datetime
import pytz
from config import table_name, lambda_name
from utils import invoke_lambda, normalize_filters, convert_relative_times

# Configure logger
logger = logging.getLogger()

def search_complaints(raw_filters):
    """
    Search for complaints based on the provided filters
    
    Parameters:
    raw_filters (dict): The raw filter parameters from the Lex V2 request
    
    Returns:
    tuple: (all_complaints, status_counts, total_complaints)
        - all_complaints: List of complaint objects matching the filters
        - status_counts: Dictionary with counts by status
        - total_complaints: Total number of matching complaints
    """
    # Define Arizona timezone
    arizona_tz = pytz.timezone('America/Phoenix')
    
    # Get current date and time in Arizona
    current_az_time = datetime.datetime.now(arizona_tz)
    logger.info(f"Current Arizona time: {current_az_time}")
    
    # Valid options definition
    valid_options = {
        "beatNumber": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17"],
        "problemCategory": ["Stop sign", "School traffic complaint", "Racing", "Speed", "Red light", "Reckless Driving"],
        "complaintStatus": ["Open", "Follow-Up", "Closed", "Red-Star"],
        "daysOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "relativeTimes": ["Today", "Yesterday", "This week", "Last week", "This month", "Last month"]
    }
    
    # Normalize the filters to match valid options
    filters = normalize_filters(raw_filters, valid_options)
    
    # Convert relative times to date range (in Arizona time)
    date_range = ("", "")
    if filters["relativeTimes"]:
        date_range = convert_relative_times(filters["relativeTimes"])
        logger.info(f"Converted relative times {filters['relativeTimes']} to Arizona time date range: {date_range}")
    
    # Query results storage
    all_complaints = []
    status_counts = {}
    
    # Make a separate call for each status or use default statuses if none provided
    if not filters["statuses"]:
        # If no statuses provided, use all possible statuses
        search_statuses = valid_options["complaintStatus"]
        logger.info("No statuses provided, using all statuses for search")
    else:
        search_statuses = filters["statuses"]

    for status in search_statuses:
        # Initialize a list to store all filtered complaints for this status
        status_filtered_complaints = []
        current_page = 1
        total_pages = 1  # Will be updated with the first call
        
        # Fetch all pages for this status
        while current_page <= total_pages:
            # Construct payload for the DynamoDB query Lambda
            payload = {
                "tableName": table_name,  # Name of your DynamoDB table
                "beatNumber": filters["beatNums"],           # List of beat numbers
                "problemCategory": filters["categories"],     # List of problem categories 
                "complaintStatus": status,         # Single status
                "page": current_page,              # Current page number
                "timezone": "America/Phoenix"      # Specify Arizona timezone
            }
            
            # Add date range to payload if relative times were provided
            if filters["relativeTimes"]:
                payload["startDate"] = date_range[0]
                payload["endDate"] = date_range[1]
            
            # Convert payload to JSON string
            payload_json = json.dumps(payload)
            
            # Invoke the Lambda function
            try:
                logger.info(f"Invoking Lambda for status {status}, page {current_page}/{total_pages}")
                response_payload = invoke_lambda(lambda_name, payload_json)
                
                # Parse the response
                response_data = json.loads(response_payload)
                
                # Update total pages from the response (in case it changed)
                total_pages = response_data.get('totalPages', 1)
                
                # Get page complaints
                page_complaints = response_data.get('complaintsData', [])
                
                # Filter complaints by day of week if days_of_week filter is not empty
                filtered_page_complaints = []
                if filters['daysOfWeek']:
                    logger.info(f"Filtering by days of week: {filters['daysOfWeek']}")
                    for complaint in page_complaints:
                        # Check if the complaint has daysOfWeek field
                        complaint_days = complaint.get('daysOfWeek', [])
                        
                        # Check if any day in the filter matches any day in the complaint
                        days_overlap = any(day in complaint_days for day in filters['daysOfWeek'])
                        
                        if days_overlap:
                            filtered_page_complaints.append(complaint)
                            logger.info(f"Complaint {complaint.get('complaintId')} matches day filter: {complaint_days}")
                        else:
                            logger.info(f"Complaint {complaint.get('complaintId')} days {complaint_days} don't match filter {filters['daysOfWeek']}")
                else:
                    # If no days filter, include all complaints
                    filtered_page_complaints = page_complaints
                
                # Add filtered complaints to our status-specific list
                status_filtered_complaints.extend(filtered_page_complaints)
                
                logger.info(f"Status {status}, Page {current_page}: Retrieved {len(filtered_page_complaints)} complaints after filtering")
                
                # Move to the next page
                current_page += 1
                
            except Exception as e:
                logger.error(f"Error querying for status {status}, page {current_page}: {str(e)}")
                break  # Stop trying further pages if we encounter an error
        
        # After processing all pages for this status:
        # 1. Add all filtered complaints for this status to the overall list
        all_complaints.extend(status_filtered_complaints)
        # 2. Update the status count based on the complete filtered results
        status_counts[status] = len(status_filtered_complaints)
    
    # Calculate total from status counts after all statuses have been processed
    total_complaints = sum(status_counts.values())
    
    # Return the complaints, counts, and total as a tuple
    return all_complaints, status_counts, total_complaints, filters, date_range