import requests
import time

url = "http://localhost:8000/api/stories/create"
payload = {"theme": "Dragons"}

print("Sending POST request to generate story...")
r = requests.post(url, json=payload)
if r.status_code != 200:
    print(f"Error starting job: {r.status_code} - {r.text}")
    exit(1)

job_data = r.json()
job_id = job_data.get("job_id")
print(f"Job started. ID: {job_id}, Status: {job_data.get('status')}")

# Poll status
for i in range(20):
    time.sleep(2)
    status_url = f"http://localhost:8000/api/jobs/{job_id}"
    r_status = requests.get(status_url)
    if r_status.status_code != 200:
        print(f"Error checking job: {r_status.status_code} - {r_status.text}")
        continue
    status_data = r_status.json()
    status = status_data.get("status")
    print(f"Poll {i+1}: Status: {status}, Story ID: {status_data.get('story_id')}, Error: {status_data.get('error')}")
    if status in ["completed", "failed"]:
        break
