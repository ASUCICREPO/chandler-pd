import boto3
import logging
import datetime
from typing import List, Tuple
import pytz

# Configure logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize Lambda client
lambda_client = boto3.client('lambda')

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
        logger.error(f"Error invoking Lambda function: {str(e)}")
        raise e


def normalize_filters(raw_filters, valid_options):
    """
    Normalize filter values to match valid options in the system,
    using fuzzy matching only for multi-word fields.
    
    Parameters:
    raw_filters (dict): Filters dictionary from Lex with beatNums, categories, statuses, and daysOfWeek
    valid_options (dict): Dictionary containing valid options for each filter type
    
    Returns:
    dict: Normalized filters dictionary with values matched to valid options
    """
    normalized_filters = {
        "beatNums": [],
        "categories": [],
        "statuses": [],
        "daysOfWeek": [],  # Added days of week to normalized filters
        "relativeTimes": []
    }
    
    # For beat numbers, use simple validation without fuzzy matching
    for beat in raw_filters.get("beatNums", []):
        # Convert to string for comparison with valid options
        beat_str = str(beat).strip()
        if beat_str in valid_options["beatNumber"] and beat_str not in normalized_filters["beatNums"]:
            normalized_filters["beatNums"].append(beat_str)
    
    # Use fuzzy matching for categories
    for category in raw_filters.get("categories", []):
        match = find_best_match(category, valid_options["problemCategory"])
        if match and match not in normalized_filters["categories"]:
            normalized_filters["categories"].append(match)
    
    # Use fuzzy matching for statuses
    for status in raw_filters.get("statuses", []):
        match = find_best_match(status, valid_options["complaintStatus"])
        if match and match not in normalized_filters["statuses"]:
            normalized_filters["statuses"].append(match)
    
    # NEW: Use fuzzy matching for days of week
    for day in raw_filters.get("daysOfWeek", []):
        match = find_best_match(day, valid_options["daysOfWeek"])
        if match and match not in normalized_filters["daysOfWeek"]:
            normalized_filters["daysOfWeek"].append(match)

    # Use fuzzy matching for relativeTime
    for relativeTime in raw_filters.get("relativeTimes", []):
        match = find_best_match(relativeTime, valid_options["relativeTimes"])
        if match and match not in normalized_filters["relativeTimes"]:
            normalized_filters["relativeTimes"].append(match)
    
    return normalized_filters

def find_best_match(input_text, valid_options, threshold=0.7):
    """
    Find the best match for input_text from valid_options using Levenshtein distance.

    Parameters:
    input_text (str): The text to find a match for
    valid_options (list): List of valid options to match against
    threshold (float): Minimum similarity score (0-1) to consider a match

    Returns:
    str or None: The best matching option, or None if no good match found
    """
    # Simple normalization for comparison
    input_normalized = input_text.lower().strip()

    # First try exact matching after normalization
    for option in valid_options:
        if input_normalized == option.lower():
            return option

    # If no exact match, try approximate matching
    best_score = 0
    best_match = None

    for option in valid_options:
        # Calculate similarity score using Levenshtein distance
        score = levenshtein_similarity(input_normalized, option.lower())
        
        if score > best_score and score >= threshold:
            best_score = score
            best_match = option

    return best_match
    

def levenshtein_similarity(s1, s2):
    """
    Calculate similarity between strings s1 and s2 using Levenshtein distance.
    Returns a score between 0 (completely different) and 1 (identical).
    """
    # Calculate Levenshtein distance
    m, n = len(s1), len(s2)
    if m == 0 or n == 0:
        return 0
        
    d = [[0 for _ in range(n+1)] for _ in range(m+1)]
    
    for i in range(m+1):
        d[i][0] = i
    for j in range(n+1):
        d[0][j] = j
        
    for j in range(1, n+1):
        for i in range(1, m+1):
            if s1[i-1] == s2[j-1]:
                d[i][j] = d[i-1][j-1]
            else:
                d[i][j] = min(d[i-1][j], d[i][j-1], d[i-1][j-1]) + 1
    
    # Convert distance to similarity score
    max_len = max(m, n)
    return 1 - (d[m][n] / max_len)

def convert_relative_times(relative_times: List[str]) -> Tuple[str, str]:
    """
    Convert a list of relative time strings into a start and end date range.
    The end date is always the current date.
    The start date is the earliest date based on the provided relative times.
    All dates are in Arizona time (UTC-7).
    
    Parameters:
    relative_times (List[str]): List of relative time strings like "Today", "This month", etc.
    
    Returns:
    Tuple[str, str]: A tuple containing (start_date, end_date) formatted as YYYY-MM-DD strings
    """
    # Define Arizona timezone
    arizona_tz = pytz.timezone('America/Phoenix')
    
    # If no relative times provided, return current date for both start and end
    if not relative_times:
        # Get current date in Arizona time
        today = datetime.datetime.now(arizona_tz).date()
        today_str = today.strftime("%Y-%m-%d")
        return (today_str, today_str)
    
    # Get the current date in Arizona time
    today = datetime.datetime.now(arizona_tz).date()
    end_date = today
    
    # Initialize start_date to today (we'll move it earlier as needed)
    start_date = today
    
    # Process each relative time and find the earliest start date
    for rel_time in relative_times:
        rel_time = rel_time.lower()  # Normalize to lowercase for easier comparison
        
        if rel_time == "today":
            # Start date is today (no change needed)
            pass
            
        elif rel_time == "yesterday":
            # Start date is one day before today
            potential_start = today - datetime.timedelta(days=1)
            start_date = min(start_date, potential_start)
            
        elif rel_time in ["this week", "current week"]:
            # Start date is the beginning of the current week (Monday)
            days_since_monday = today.weekday()  # 0 for Monday, 6 for Sunday
            potential_start = today - datetime.timedelta(days=days_since_monday)
            start_date = min(start_date, potential_start)
            
        elif rel_time in ["last week", "previous week"]:
            # Start date is the beginning of the previous week
            days_since_monday = today.weekday()  # 0 for Monday, 6 for Sunday
            days_to_last_monday = days_since_monday + 7
            potential_start = today - datetime.timedelta(days=days_to_last_monday)
            start_date = min(start_date, potential_start)
            
        elif rel_time in ["this month", "current month"]:
            # Start date is the first day of the current month
            potential_start = today.replace(day=1)
            start_date = min(start_date, potential_start)
            
        elif rel_time in ["last month", "previous month"]:
            # Start date is the first day of the previous month
            # Handle month underflow (January to December of previous year)
            if today.month == 1:
                potential_start = today.replace(year=today.year-1, month=12, day=1)
            else:
                potential_start = today.replace(month=today.month-1, day=1)
            start_date = min(start_date, potential_start)
        
    # Format dates as YYYY-MM-DD strings
    start_date_str = start_date.strftime("%Y-%m-%d")
    end_date_str = end_date.strftime("%Y-%m-%d")
    
    return (start_date_str, end_date_str)
