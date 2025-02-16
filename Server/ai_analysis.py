import os
import requests
import json
import chromadb
import re  # Added to clean AI response
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv("./.env")

# Set Mistral AI API credentials
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"

# ChromaDB Configuration
CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")

# Validate API keys
if not MISTRAL_API_KEY:
    raise ValueError("MISTRAL_API_KEY is missing from .env")
if not CHROMA_API_KEY:
    raise ValueError("CHROMA_API_KEY is missing from .env")

try:
    chroma_client = chromadb.HttpClient(
        ssl=True,
        host="api.trychroma.com",
        tenant=CHROMA_TENANT,
        database="Treehacks25",
        headers={"x-chroma-token": CHROMA_API_KEY},
    )
except Exception as e:
    print("Error initializing ChromaDB:", e)

# Function to generate a crisis plan using Mistral AI
def generate_crisis_plan(biometric_data, behavioral_summary):
    """
    Uses Mistral AI to generate a structured AI-driven crisis plan.

    :param biometric_data: Dictionary containing Apple Watch health data.
    :param behavioral_summary: AI-generated summary of the patient's mental state.
    :return: AI-generated recommendations in JSON format.
    """

    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json",
    }

    prompt = f"""
You are an AI-powered mental health assistant helping therapists assess bipolar patients.
Based on the provided biometric data (Apple Watch) and behavioral assessment summary, generate 
a **detailed** personalized crisis plan. The recommendations must be **specific, quantifiable, and actionable**.

--- Patient Biometric Data ---
{json.dumps(biometric_data, indent=2)}

--- Behavioral Assessment Summary ---
{behavioral_summary}

--- Task ---
1. **Current State Analysis**: 
   - Determine if the patient is experiencing **Mania, Hypomania, Depression, Mixed Episode, or Rapid Cycling** based on provided data.
   - Assign a **confidence level (percentage)** to this classification. 
   - If uncertain, specify what additional data would be needed for better accuracy.

2. **AI-Generated Crisis Plan**: Provide structured, detailed, and specific recommendations tailored to the patient’s current state.
   - **Physical Activity**: If increased activity is recommended, specify **duration, frequency, and type** (e.g., "Engage in 30-45 minutes of moderate exercise, such as walking or swimming, at least 4 times per week").
   - **Sleep Adjustments**: If a structured sleep routine is suggested, define **specific changes** (e.g., "Reduce bedtime by 1 hour", "Increase total sleep time by 2 hours", "Establish a consistent bedtime of 10 PM").
   - **Social Engagement**:
     - If mild symptoms, recommend **specific interactions** (e.g., "Attend a social gathering once per week" or "Call a close friend twice a week").
     - If symptoms are **concerning**, recommend scheduling **more frequent therapy sessions** (e.g., "Schedule an emergency therapy session within 48 hours").
     - If symptoms are **severe**, notify the emergency contact (e.g., "Ask emergency contact to check in on the patient daily").
   - **Medication Review**:
     - If symptoms persist despite medication, recommend **checking for side effects** (e.g., "Patient may be experiencing side effects from lithium; consider dosage review").
     - If non-compliance is detected, **suggest steps** (e.g., "Patient has skipped doses in the past week. Consider medication adherence counseling").
   - **Risk Alerts**:
     - If **agitation levels** are high, suggest grounding techniques and **reducing stimulation** (e.g., "Reduce screen time before bed, practice mindfulness for 15 minutes").
     - If **sleep deprivation is severe**, recommend **urgent intervention** (e.g., "Significant sleep loss detected for 3 consecutive days—consult psychiatrist within 24 hours").
     - If **suicidal ideation or high-risk behavior is detected**, **immediate action required** (e.g., "Notify emergency contact and activate crisis protocol").

3. **Intervention Suggestions**: 
   - Provide **specific therapist actions** to stabilize the patient.
   - List **monitoring strategies** (e.g., "Track mood daily in app", "Increase Apple Watch check-ins to every 2 hours").
   - Suggest structured **coping mechanisms** based on current symptoms (e.g., "If experiencing racing thoughts, use guided breathing exercises for 10 minutes").

4. **Urgency Level**: 
   - **Low**: No immediate action required; mild fluctuations in mood.
   - **Moderate**: Symptoms present but manageable with lifestyle adjustments.
   - **High**: Patient requires **immediate therapist intervention**; high risk of escalation.
   - **Immediate / Suicidal**: **Activate emergency response**; patient is in critical danger and requires immediate support.

Respond in a **structured JSON format** without additional explanations.
    """

    payload = {
        "model": "mistral-small-latest",
        "messages": [
            {"role": "system", "content": "You are a helpful AI therapist assistant."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 500,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0,
    }

    try:
        response = requests.post(MISTRAL_API_URL, headers=headers, json=payload)
        response_data = response.json()

        print("Full API Response:", response_data)  # Debugging print

        if "choices" in response_data and response_data["choices"]:
            ai_output = response_data["choices"][0]["message"]["content"]

            # **Fix: Clean AI response**
            ai_output = re.sub(r"```json\n|\n```", "", ai_output)

            try:
                return json.loads(ai_output)  # Ensure valid JSON
            except json.JSONDecodeError:
                return {"error": "AI response is not a valid JSON after cleanup."}

        else:
            return {"error": "Failed to generate a crisis plan."}

    except Exception as e:
        print("Error during API call:", str(e))
        return {"error": str(e)}


# Main execution block (Testing Mode)
if __name__ == "__main__":
    # Define dictionary instead of reading JSON files
    biometric_data = {
        "userEmail": "steve@aol.com",
        "userName": "steve",
        "heart_rate": {
            "hrv": 7.81,
            "agitation": 63.12,
        },
        "sleep": {
            "totalSleepHours": 6.5,
            "deepSleepHours": 2.0,
            "remSleepHours": 1.5,
            "awakeTime": 0.5,
            "sleepQualityScore": 75.0,
        },
        "activity": {
            "steps": 10000,
            "caloriesBurned": 2500.5,
            "activityScore": 85.0,
        }
    }

    behavioral_summary = """
    The patient reports feeling stable overall, with a neutral mood but occasional anxiety, 
    mainly due to an upcoming work deadline. They feel slightly overwhelmed but not experiencing 
    extreme mood swings.
    """

    try:
        crisis_plan = generate_crisis_plan(biometric_data, behavioral_summary)
        print("Crisis Plan Generated:", json.dumps(crisis_plan, indent=4))
    except Exception as e:
        print("GENERATE PLAN ERROR:", e)