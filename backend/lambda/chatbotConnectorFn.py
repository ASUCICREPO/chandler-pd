import json
import boto3
import os


botId = os.environ["LEXBOT_ID"]
botAliasId = os.environ["LEXBOT_ALIAS_ID"]
localeId = "en_US"


def lambda_handler(event, context):
    
    print("EVENT:")
    print(event)

    client = boto3.client('lexv2-runtime')

    # Define the arguments and call the lex bot
    args = {
        "botId": botId,
        "botAliasId": botAliasId,
        "localeId": localeId,
        "sessionId": event["sessionId"],
        "text": event["message"]
    }
    response = client.recognize_text(**args)

    print(response)

    return {
        'statusCode': 200,
        'body': response
    }
