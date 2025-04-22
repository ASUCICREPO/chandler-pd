import os

table_name = os.environ["COMPLAINT_TABLE_NAME"]
lambda_name = os.environ["DB_QUERY_LAMBDA_NAME"]
email_lambda_name = os.environ["EMAIL_LAMBDA_NAME"]


botId = os.environ["LEXBOT_ID"]
botAliasId = os.environ["LEXBOT_ALIAS_ID"]
localeId = "en_US"