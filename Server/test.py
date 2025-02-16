import base64
import json
import os
import time

import requests
from dotenv import load_dotenv

load_dotenv("./.env")

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"
API_URL = "http://localhost:8080"

# Test health route
response = requests.get(f"{API_URL}/api/health")
print("Health Check:", response.status_code, response.json())

NAME = "Lebron James"
EMAIL = "info@klutchsports.com"
NUM_DOCS = 1
AUDIO_PATH = "./test_audio.wav"


def save_base64_audio(audio_base64: str, filename: str):
    """Decode base64-encoded audio and save to a local file."""
    audio_data = base64.b64decode(audio_base64)
    with open(filename, "wb") as f:
        f.write(audio_data)
    return filename


def respond(question):
    try:
        if not question:
            print("question is empty")
            return None

        headers = {
            "Authorization": f"Bearer {MISTRAL_API_KEY}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": "mistral-small-latest",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a person with bipolar disease, respond to questions from a mental health professional.",
                },
                {
                    "role": "user",
                    "content": f"Here is a professional interviewer asking a question: {question}, please respond to it. Keep your answers as brief as possible.",
                },
            ],
            "temperature": 0.7,
            "max_tokens": 300,
            "top_p": 1,
            "frequency_penalty": 0,
            "presence_penalty": 0,
        }

        response = requests.post(MISTRAL_API_URL, headers=headers, json=payload)
        response_data = response.json()

        if "choices" in response_data and len(response_data["choices"]) > 0:
            summary = response_data["choices"][0]["message"]["content"]
            return summary
        else:
            return None

    except Exception as e:
        print(e)
        return None


data = {
    "num": "0",
    "history": "[]",
    "question": "",
    "question_text": "Hello, I'm an AI behavioral psychologist. To start, could you describe your current mood and emotions?",
    "end": "false",
    "metadata": json.dumps({"name": NAME, "email": EMAIL}),
}

for i in range(NUM_DOCS):
    while True:
        with open(AUDIO_PATH, "rb") as audio_file:
            try:
                files = {"answer_audio": audio_file.read()}

                response = requests.post(
                    f"{API_URL}/assessment",
                    data=data,
                    files=files,
                )
                res = response.json()
                print("SERVER RESPONSE:", res, "\n\n")

                # local_file = save_base64_audio(
                #     res["question"], "./test_audio_output.wav"
                # )

                data = {
                    "num": str(res["num"]),
                    "history": json.dumps(res["history"]),
                    "question": res["question"],
                    "question_text": res["question_text"],
                    "end": str(res["end"]).lower(),
                    "metadata": json.dumps(res["metadata"]),
                }
                num = res["num"]
            except Exception as e:
                print("Response exception:", e)
                time.sleep(3)
                continue

            if "[CONVERSATION ENDED]" in res["question_text"] or num >= 2:
                print("END IS TRUE", "\n\n")
                data["end"] = "true"
                response = requests.post(
                    f"{API_URL}/assessment",
                    data=data,
                    files=files,
                )
                print("FINAL RESPONSE:", response.json(), "\n\n")
                break

            answer = respond(res["question_text"])
