import json
import logging
import query_complaint_handler
import send_email_handler
import fallback_intent_handler  # Added import for the new fallback handler

# Configure logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Main Lambda handler function that routes intents to their respective handlers
    
    Parameters:
    event (dict): The Lambda event data
    context (LambdaContext): The Lambda context object
    
    Returns:
    dict: The response for Amazon Lex V2
    """
    # Log the incoming event for debugging
    logger.info('Received event: %s', json.dumps(event))
    
    try:
        # Extract the intent name to determine which handler to use
        intent_name = event['sessionState']['intent']['name']
        
        # Route to the appropriate handler based on intent name
        if intent_name == 'Query_Complaint_Info':
            return query_complaint_handler.handle(event)
        elif intent_name == 'sendEmail':
            return send_email_handler.handle(event)
        elif intent_name == 'FallbackIntent':  # Added handling for the new FallbackIntent
            return fallback_intent_handler.handle(event)
        else:
            # Handle unknown or unimplemented intents
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
                        "content": f"The intent '{intent_name}' is not yet implemented."
                    }
                ]
            }
    
    except Exception as e:
        # Log the error
        logger.error('Error processing request: %s', str(e))
        
        # Return a generic error response
        return {
            "sessionState": {
                "dialogAction": {
                    "type": "Close"
                },
                "intent": {
                    "name": event.get('sessionState', {}).get('intent', {}).get('name', 'Unknown'),
                    "state": "Failed"
                }
            },
            "messages": [
                {
                    "contentType": "PlainText",
                    "content": "Sorry, I encountered an error processing your request."
                }
            ]
        }