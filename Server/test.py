import json
import os
import time

import requests
from dotenv import load_dotenv

from server import upload

load_dotenv("./.env")

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"
API_URL = "http://localhost:8080"

# Test health route
response = requests.get(f"{API_URL}/api/health")
print("Health Check:", response.status_code, response.json())


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
                    "content": f"Here is a professional interviewer asking a question: {question}, please respond to it. Keep your answers VERY BRIEF.",
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
    "num": 0,
    "history": [],
    "question": None,
    "question_text": None,
    "bio-data": {"heart_rate": 85, "steps": 3200},
    "end": False,
}

while True:
    response = requests.post(f"{API_URL}/assessment", json=data)
    res = response.json()
    try:
        num = res["num"]
    except Exception as e:
        print("res has no attribute 'num'", e)
        time.sleep(3)
        continue

    num += 1

    if "[CONVERSATION ENDED]" in res["question_text"] or num >= 16:
        print(json.dumps(res, indent=4))
        upload(res["history"], res["bio-data"])
        break

    answer = respond(res["question_text"])

    print(f"Question: {res["question_text"]}\nAnswer: {answer}")

    hist = res["history"]
    hist.append({"question": res["question_text"], "answer": answer})

    data = {
        "num": num,
        "history": hist,
        "question": None,
        "question_text": None,
        "bio-data": {"heart_rate": 85, "steps": 3200},
        "end": False,
    }
