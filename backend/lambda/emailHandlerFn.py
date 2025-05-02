import boto3
import re
import os
from botocore.exceptions import ClientError

client = boto3.client('ses', region_name='us-west-2')

SOURCE_EMAIL = os.environ['SOURCE_EMAIL']

# Validates email address structure and domain
def validation_fn(email):
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    Validation1 = re.match(pattern, email)
    if Validation1 is not None:
        val_subject = email.split('@')[1].split('.')
        validation2 = (val_subject[0] == 'chandleraz' or val_subject[0] == 'chandlerazpd') and val_subject[1] == 'gov'
        return validation2
    else:
        return False

# Checks if email address is verified in AWS SES
def verify_email_identity(email_address):
    try:
        client.verify_email_identity(EmailAddress=email_address)
        print(f"Verification email sent to {email_address}")
    except ClientError as e:
        print(f"Error: {e.response['Error']['Message']}")

# Formats complaint data into a readable format for email body
def format_complaint(complaint):
    return f"""
        Complaint ID: {complaint['complaintId']}
        Name: {complaint['firstName']} {complaint['lastName']}
        Description: {complaint['description']}
        Status: {complaint['complaintStatus']}
        Date of Complaint: {complaint['dateOfComplaint']}
        Beat Number: {complaint['beatNumber']}
        Problem Category: {complaint.get('problemCategory', 'N/A')}
        Is Urgent: {"Yes" if complaint.get('isUrgentChecked') else "No"}
        Address: {complaint.get('addressStreet', 'N/A')}, {complaint.get('addressDirection', 'N/A')} {complaint.get('addressZipcode', 'N/A')}
        Location Type: {complaint.get('location', 'N/A')}
        Days of Week: {", ".join(complaint.get('daysOfWeek', []))}
        Start Date: {complaint.get('startDate', 'N/A')}
        End Date: {complaint.get('endDate', 'N/A')}
        Start Time: {complaint.get('startTime', 'N/A')}
        End Time: {complaint.get('endTime', 'N/A')}
        Coordinates: Latitude {complaint['coordinates'][1]}, Longitude {complaint['coordinates'][0]}
        Officer's Notes: {complaint.get('officersNotes', 'N/A')}
        
        Intersection Details:
            Intersection 1 Street: {complaint.get('intersection1Street', 'N/A')}
            Intersection 1 Direction: {complaint.get('intersection1Direction', 'N/A')}
            Intersection 2 Street: {complaint.get('intersection2Street', 'N/A')}
            Intersection 2 Direction: {complaint.get('intersection2Direction', 'N/A')}
            Intersection Zipcode: {complaint.get('intersectionZipcode', 'N/A')}
        
        Subscribe to Alerts: {"Yes" if complaint.get('subscribeToAlerts', '').lower() == "yes" else "No"}
        
        {'='*40}
    """

# Driver Function containing the final email service format
def lambda_handler(event, context):

    try:
        if validation_fn(event['sendTo']):
            
            status = client.get_identity_verification_attributes(
                Identities=[event['sendTo']]
            )
            if status['VerificationAttributes'].get(event['sendTo'], {}).get('VerificationStatus') != 'Success':
                verify_email_identity(event['sendTo'])
                return {
                    'statusCode': 200,
                    'body': '',
                    'message': 'Email is not verified. Verification email sent. '
                }
            else:
                body = "\n".join([format_complaint(c) for c in event['selectedComplaints']])
                
                response = client.send_email(
                    Source=SOURCE_EMAIL,
                    Destination={'ToAddresses': [event['sendTo']]},
                    Message={
                        'Subject': {'Data': 'Complaint Collection'},
                        'Body': {'Text': {'Data': body}}
                    }
                )

                return {
                    'statusCode': 200,
                    'body': response,
                    'message': 'Email sent successfully'
                }
        else:
            return {
                    'statusCode': 400,
                    'body': '',
                    'message': 'Invalid Email'
                }
    except Exception as e:
        return {
            'statusCode': 400,
            'body': '',
            'message': f"Failed due to : {str(e)}"
        }
