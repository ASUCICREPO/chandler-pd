import json
import logging

# Configure logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handle(event):
    """
    Handler for the FallbackIntent
    
    Parameters:
    event (dict): The Lambda event data
    
    Returns:
    dict: The response for Amazon Lex V2
    """
    # Log the incoming event for this specific handler
    logger.info('Handling FallbackIntent: %s', json.dumps(event))
    
    try:
        # Extract any relevant information from the event
        session_attributes = event.get('sessionState', {}).get('sessionAttributes', {})
        
        # Process the fallback logic
        # This is where you would implement your specific fallback handling
        
        # Return a response for the fallback intent
        return {
            "sessionState": {
                "dialogAction": {
                    "type": "Close"
                },
                "intent": {
                    "name": "FallbackIntent",
                    "state": "Fulfilled"
                },
                "sessionAttributes": session_attributes
            },
            "messages": [
                {
                    "contentType": "PlainText",
                    "content": "I'm sorry, I didn't understand what you're asking for. Could you rephrase your request or ask something else?"
                }
            ]
        }
    
    except Exception as e:
        # Log the error
        logger.error('Error in fallback handler: %s', str(e))
        
        # Return an error response
        return {
            "sessionState": {
                "dialogAction": {
                    "type": "Close"
                },
                "intent": {
                    "name": "FallbackIntent",
                    "state": "Failed"
                }
            },
            "messages": [
                {
                    "contentType": "PlainText",
                    "content": "Sorry, I encountered an error while trying to process your request."
                }
            ]
        }