import os
import boto3
import json
import logging
import urllib3
import time

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize Lex client
botId = os.environ.get("LEXBOT_ID")
lexBackendLambdaArn = os.environ.get("LEXBOT_LAMBDA_ARN_BACKEND")
lexConnectorLambdaArn = os.environ.get("LEXBOT_LAMBDA_ARN_CONNECTOR")
client = boto3.client("lexv2-models")
lambda_client = boto3.client("lambda")

def lambda_handler(event, context):
    """
    Custom Resource Lambda handler for creating Lex bot versions and aliases.
    """
    logger.info("Received event: %s", json.dumps(event))
    time.sleep(660)  # Allow time for the event to be fully received
    
    # Extract request details
    request_type = event['RequestType']
    physical_id = event.get('PhysicalResourceId', None)
    properties = event.get('ResourceProperties', {})
    stack_id = event.get('StackId')
    request_id = event.get('RequestId')
    resource_id = event.get('LogicalResourceId')
    response_url = event.get('ResponseURL')
    
    # Initialize response data
    response_data = {}
    
    try:
        # Handle different request types
        if request_type == 'Create':
            logger.info("Handling Create request")
            # Create bot version and alias
            response_data = create_bot_version_and_alias()
            physical_id = f"{botId}-version-{response_data.get('botVersion', 'unknown')}"
        
        elif request_type == 'Update':
            logger.info("Handling Update request")
            # For updates, we can create a new version and update the alias
            # or just return the existing values
            if not physical_id:
                physical_id = f"{botId}-version-unknown"
            response_data = {"Message": "Update operation completed successfully"}
        
        elif request_type == 'Delete':
            logger.info("Handling Delete request")
            # We may not want to delete the bot version/alias on stack deletion
            # Just return success
            if not physical_id:
                physical_id = f"{botId}-version-unknown"
            response_data = {"Message": "Delete operation completed successfully"}
        
        # Send success response
        send(event, context, "SUCCESS", response_data, physical_id)
        
        # Return the data for potential use in test environments
        return {
            "Status": "SUCCESS",
            "PhysicalResourceId": physical_id,
            "Data": response_data
        }
        
    except Exception as e:
        logger.error("Error: %s", str(e), exc_info=True)
        error_message = str(e)
        
        # Send failure response
        if not physical_id:
            physical_id = f"{botId}-error"
        
        send(event, context, "FAILED", {"Error": error_message}, physical_id)
        
        # Re-raise for Lambda logging
        raise

def create_bot_version_and_alias():
    """
    Creates a bot version from DRAFT and an alias pointing to that version.
    Then updates Lambda function environment variables with the alias ID.
    """
    logger.info(f"Creating bot version for bot ID: {botId}")
    
    # Create a bot version
    version_response = client.create_bot_version(
        botId=botId,
        description="Created by CloudFormation custom resource",
        botVersionLocaleSpecification={
            'en_US': {
                'sourceBotVersion': 'DRAFT',
            }
        }
    )
    
    bot_version = version_response['botVersion']
    logger.info(f"Created bot version: {bot_version}")
    
    # Wait for bot version to be built
    logger.info(f"Waiting for bot version {bot_version} to be available")
    time.sleep(60)
    
    # Create an alias for the bot version
    logger.info(f"Creating bot alias for bot ID: {botId} and version: {bot_version}")
    alias_response = client.create_bot_alias(
        botId=botId,
        botVersion=bot_version,
        botAliasName="PROD",
        description="Created by CloudFormation custom resource",
        botAliasLocaleSettings={
            'en_US': {
                'enabled': True,
                'codeHookSpecification': {
                    'lambdaCodeHook': {
                        'lambdaARN': lexBackendLambdaArn,
                        'codeHookInterfaceVersion': '1.0'
                    }
                }
            }
        }
    )
    
    bot_alias_id = alias_response['botAliasId']
    logger.info(f"Created bot alias with ID: {bot_alias_id}")
    
    # Wait for bot alias to be available
    logger.info(f"Waiting for bot alias {bot_alias_id} to be available")
    time.sleep(60)
    
    # Update environment variables for the Lambda functions
    update_lambda_environment(lexBackendLambdaArn, bot_alias_id)
    update_lambda_environment(lexConnectorLambdaArn, bot_alias_id)
    
    return {
        "botVersion": bot_version,
        "botAliasId": bot_alias_id,
        "botId": botId
    }

def update_lambda_environment(lambda_arn, bot_alias_id):
    """
    Updates the environment variables of a Lambda function.
    """
    # Extract function name from ARN
    function_name = lambda_arn.split(':')[-1]
    logger.info(f"Updating environment variables for Lambda function: {function_name}")
    
    try:
        # Get the current environment variables
        response = lambda_client.get_function_configuration(
            FunctionName=function_name
        )
        
        current_env = response.get('Environment', {}).get('Variables', {})
        
        # Add the new environment variable
        current_env['LEXBOT_ALIAS_ID'] = bot_alias_id
        
        # Update the Lambda function's environment variables
        lambda_client.update_function_configuration(
            FunctionName=function_name,
            Environment={
                'Variables': current_env
            }
        )
        
        logger.info(f"Successfully updated environment variables for Lambda function: {function_name}")
    except Exception as e:
        logger.error(f"Error updating environment variables for Lambda function {function_name}: {str(e)}")
        raise

def send(event, context, responseStatus, responseData, physicalResourceId=None, noEcho=False, reason=None):
    """
    Send a response to CloudFormation to handle the custom resource lifecycle.
    """
    responseUrl = event['ResponseURL']
    logger.info(responseUrl)
    
    responseBody = {
        'Status': responseStatus,
        'Reason': reason or f"See the details in CloudWatch Log Stream: {context.log_stream_name}",
        'PhysicalResourceId': physicalResourceId or context.log_stream_name,
        'StackId': event['StackId'],
        'RequestId': event['RequestId'],
        'LogicalResourceId': event['LogicalResourceId'],
        'NoEcho': noEcho,
        'Data': responseData
    }
    
    json_responseBody = json.dumps(responseBody)
    logger.info("Response body:")
    logger.info(json_responseBody)
    
    headers = {
        'content-type': '',
        'content-length': str(len(json_responseBody))
    }
    
    try:
        http = urllib3.PoolManager()
        response = http.request('PUT', responseUrl, headers=headers, body=json_responseBody)
        logger.info(f"Status code: {response.status}")
    except Exception as e:
        logger.error(f"send(..) failed executing http.request(..): {e}")
        raise