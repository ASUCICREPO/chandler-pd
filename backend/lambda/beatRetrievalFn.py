import json
import requests


# TODO: Make URL and env variable
url = "https://gistest.chandleraz.gov/appsanonymous/rest/services/Geocoders/PoliceBeat_Composite/GeocodeServer/findAddressCandidates"

def lambda_handler(event, context):
    # TODO implement
    # Build your payload as a dictionary
    print(event)
    try:
        payload = {
            "Address": event.get('location_data', ""),
            "City": "chandler",
            # Include any additional fields you need, e.g., the PoliceBeat field is included in outFields
            "outFields": "Shape, Match_addr, Score, Loc_name, City, PoliceBeat",
            "outSR": "4326",
            "f": "json"
        }

        # Send the POST request with the payload
        response = requests.post(url, data=payload)
        data = response.json()

        if "candidates" in data:
            return {
                'statusCode': 200,
                'body': data
            }
        else:
            return {
                'statusCode': 200,
                'body': json.dumps({"message": "No Candidates found"})
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({"error": str(e)})
        }


    
