import pandas as pd
import requests

# Load the dataset
file_path = "equipment_metadata.xlsx"
data = pd.read_excel(file_path, sheet_name="Φύλλο1")

# Target URL
url = "http://buildon.epu.ntua.gr:5000/datapoint/create/veolia"

# Iterate over each row and send a POST request
for _, row in data.iterrows():
    payload = {
        "point_id": row["point_id"],
        "point_type": row["point_type"],
        "equipment_id": row["equipment_id"],
        "equipment_type": row["equipment_type"]
    }
    
    # Send POST request
    response = requests.post(url, json=payload)
    
    # Log the result
    if response.status_code == 201:
        print(f"Success: {payload}")
    else:
        print(f"Failed: {payload} | Status Code: {response.status_code} | Response: {response.text}")

