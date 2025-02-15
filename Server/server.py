import json
import os
import uuid
from typing import Optional

import chromadb
import google.generativeai as genai
import requests
from dotenv import load_dotenv
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from io import BytesIO
import base64

app = Flask(__name__)
CORS(app)

load_dotenv("./.env")

CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # default voice ID

chroma_client = chromadb.HttpClient(
    ssl=True,
    host="api.trychroma.com",
    tenant=CHROMA_TENANT,
    database="Treehacks25",
    headers={"x-chroma-token": CHROMA_API_KEY},
)


@app.route("/api/health", methods=["GET"])
def health() -> tuple[Response, int]:
    return jsonify({"message": "Success"}), 200


def get_qa_analysis(qa: list[dict]) -> Optional[str]:
    try:
        if len(qa) == 0:
            print("qa is length 0")
            return None

        conversation = ""
        for convo in qa:
            ques, ans = convo.items()
            conversation += f"Q: {ques}\nA: {ans}\n"

        headers = {
            "Authorization": f"Bearer {MISTRAL_API_KEY}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": "mistral-small-latest",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful medical assistant. Summarize the patient interview. Provide responses in HTML only without markdown or additional formatting.",
                },
                {
                    "role": "user",
                    "content": f"Here is a patient interview Q&A:\n{conversation}\n\nPlease summarize it clearly and concisely.\n\nPlease summarize it clearly and concisely in HTML.",
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
            return summary.strip("```").replace("\n", "").strip("html")
        else:
            return None

    except Exception as e:
        print(e)
        return None


def upload(history: list[dict], bio_data: dict, metadata=None) -> tuple[Response, int]:
    try:
        if not history or not bio_data:
            return jsonify({"error": "history is required"}), 400

        collection = chroma_client.get_or_create_collection(name="patient_records")

        document = {
            "history": history,
            "summary": get_qa_analysis(history),
        }

        collection.add(
            ids=[f"{uuid.uuid4()}"],
            documents=[json.dumps(document)],
            metadatas=[metadata],
        )

        return jsonify({"message": "Documents uploaded successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def text_to_speech(text: str) -> Optional[str]:
    """Convert text to speech using 11labs API and return base64 encoded audio"""
    try:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
        
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }
        
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            # Convert audio bytes to base64 string
            audio_bytes = BytesIO(response.content)
            base64_audio = base64.b64encode(audio_bytes.read()).decode('utf-8')
            return base64_audio
        else:
            print(f"Error from ElevenLabs API: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"Error in text_to_speech: {str(e)}")
        return None


@app.route("/assessment", methods=["POST"])
def chat() -> tuple[Response, int]:
    # ==============================================
    #  MODEL HERE
    # ==============================================
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash")

    try:
        # ==============================================
        # QUESTIONS AND PROMPTS
        # ==============================================
        TOPICS = """
        1. Mood and Emotions
        2. Eating and Diet
        3. Sleep and Fatigue
        4. Exercise and Fitness
        5. Relationships and Social Interaction
        """

        INSTRUCTIONS = f"""
        You are a behavioral psychologist. You are to facilitate a conversation with the user
        who likely has some form of bi-polar disorder. You are to ask them questions about the
        following topics:

        ----- TOPICS -----

        {TOPICS}

        ----- DIRECTIONS -----

        To start the conversation (i.e. the history is empty), you should introduce yourself as 
        an AI behavioral psychologist and ask the user to describe their current mood and emotions.

        Then, in the conversation, you should act like a human and ask follow up questions on 
        each theme you touch on. Do not exceed 2 follow up questions per theme. Once you feel
        like you have enough information on a theme, you should move on to the next theme in
        any order in the ----- TOPICS ----- section.

        Once all topics in ----- TOPICS ----- have been covered, thank the user
        for their time and directly end the conversation. No more follow up questions.
        Add this marker to the end of the conversation: [CONVERSATION ENDED]
        """

        # ==============================================
        # CONVERSATION
        # ==============================================
        data = request.get_json()

        # Validate input format
        if not all(key in data for key in ["num", "history", "question"]):
            return jsonify({"error": "Invalid input format"}), 400

        # Format the conversation history
        chat_history = data['history']
        user_input = data['question']
        end = data['end']

        # If conversation is ended, upload to database
        if end:
            upload(chat_history, data['bio-data'])
            return
        
        prompt = f"""
        ----- INSTRUCTIONS -----

        {INSTRUCTIONS}

        ----- CURRENT CONVERSATION -----

        history: {chat_history}
        
        user input: {user_input}

        ----- TASK -----

        Please response to the user according to the instructions and current conversation.
        Give a short question response to the user as your sole output. Remember, only ask
        up to 2 follow up questions per theme and end the conversation once all topics have been
        covered.
        """

        # Generate response
        response = model.generate_content(prompt)
        
        # Convert text to speech
        audio_base64 = text_to_speech(response.text)
        
        if audio_base64 is None:
            return jsonify({"error": "Failed to generate audio"}), 500

        return jsonify({
            'num': data['num'],
            'history': chat_history,
            'question': audio_base64,
            'end': end,
            'bio-data': data['bio-data']
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=8080, debug=True)
