import base64
import json
import os
import uuid
from datetime import datetime
from io import BytesIO
from typing import Optional

import chromadb
from twilio.rest import Client
import google.generativeai as genai
import requests
import whispr
from dotenv import load_dotenv
from flask import Flask, Response, jsonify, request
from flask_cors import CORS

# whispr_model = whispr.load_model("base")

app = Flask(__name__)
CORS(app)

load_dotenv("./.env")

CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv(
    "ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM"
)  # default voice ID

TWILIO_SID = os.getenv("TWILIO_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
TWILIO_CLIENT = Client(TWILIO_SID, TWILIO_AUTH_TOKEN)

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


def transcribe(request) -> str:
    try:
        # Ensure a file was uploaded
        if "file" not in request.files:
            return ""

        audio_file = request.files["file"]
        if audio_file.filename == "":
            return ""

        # Save the file temporarily
        temp_filename = f"{uuid.uuid4()}.wav"
        audio_file.save(temp_filename)

        # Perform transcription
        result = whispr_model.transcribe(temp_filename)

        # Remove temporary file
        os.remove(temp_filename)

        return result["text"]

    except Exception as e:
        print(e)
        return ""


def get_qa_analysis(qa: list[dict]) -> Optional[str]:
    try:
        if len(qa) == 0:
            print("qa is length 0")
            return None

        conversation = ""
        for convo in qa:
            if not convo or not isinstance(convo, dict):
                continue

            question = convo.get("question", "")
            answer = convo.get("answer", "")
            conversation += f"Q: {question}\nA: {answer}\n"

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


def create_or_upload_user(email: str, name: str) -> tuple[str, int]:
    try:
        if not email or not name:
            return "", 404

        docs = fetch_collection("patients")

        collection = chroma_client.get_or_create_collection(name="patients")

        for doc in docs:
            if email == doc["document"]["email"] and name == doc["document"]["name"]:
                return doc["id"], 200

        new_id = f"{uuid.uuid4()}"
        collection.add(
            ids=[new_id],
            documents=[json.dumps({"name": name, "email": email})],
        )

        return new_id, 201

    except Exception as e:
        print("Failed to upload data", e)
        return "", 500


def upload(history: list[dict], metadata: dict) -> bool:
    try:
        if not history:
            return False

        collection = chroma_client.get_or_create_collection(name="patient_records")

        document = {
            "history": history,
            "summary": get_qa_analysis(history),
            "timestamp": datetime.now().isoformat(),
        }

        user_id, status = create_or_upload_user(metadata["email"], metadata["name"])
        if status >= 200 and status < 300:
            metadata["user_id"] = user_id

        collection.add(
            ids=[f"{uuid.uuid4()}"],
            documents=[json.dumps(document)],
            metadatas=[metadata],
        )

        return True

    except Exception as e:
        print("Failed to upload data", e)
        return False


def text_to_speech(text: str) -> Optional[str]:
    """Convert text to speech using 11labs API and return base64 encoded audio"""
    try:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"

        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
        }

        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.5},
        }

        response = requests.post(url, json=data, headers=headers)

        if response.status_code == 200:
            # Convert audio bytes to base64 string
            audio_bytes = BytesIO(response.content)
            base64_audio = base64.b64encode(audio_bytes.read()).decode("utf-8")
            return base64_audio
        else:
            print(f"Error from ElevenLabs API: {response.status_code}")
            return None

    except Exception as e:
        print(f"Error in text_to_speech: {str(e)}")
        return None


def fetch_collection(coll: str) -> list[dict]:
    try:
        collection = chroma_client.get_or_create_collection(name=coll)
        docs = collection.get()

        data = []
        for doc_id, doc, meta in zip(docs["ids"], docs["documents"], docs["metadatas"]):
            data.append({"id": doc_id, "document": json.loads(doc), "metadata": meta})
        return data
    except Exception as e:
        print(e)
        return [{}]


@app.route("/fetch-patient-data/<collection>", methods=["GET"])
def fetch_data(collection: str):
    try:
        data = fetch_collection(collection)

        sorted_data = sorted(
            data,
            key=lambda x: datetime.fromisoformat(x["document"]["timestamp"]),
            reverse=True,
        )
        return jsonify({"success": True, "data": sorted_data}), 200
    except Exception as e:
        print(e)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/assessment", methods=["POST"])
def assessment() -> tuple[Response, int]:
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
        # TOPICS = """
        # 1. Mood and Emotions
        # """

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
        if not all(
            key in data
            for key in [
                "num",
                "history",
                "question",
                "end",
                "question_text",
                "metadata",
                "answer_audio",
            ]
        ):
            return jsonify({"error": "Invalid input format"}), 400

        # Format the conversation history
        chat_history = data["history"]
        user_input = data["question"]
        end = data["end"]
        meta = data["metadata"]

        # If conversation is ended, upload to database
        if end or data["num"] >= 16:
            upload(
                chat_history,
                metadata=meta,
            )
            return jsonify(
                {
                    "num": data["num"],
                    "history": chat_history,
                    "question_text": None,
                    "question": None,
                    "end": True,
                    "metadata": meta,
                    "answer_audio": None,
                }
            ), 200

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
        # audio_base64 = text_to_speech(response.text)
        audio_base64 = "TIOWEHFogih3wogwrehgo9ughw3roiughqewrp"

        if audio_base64 is None:
            return jsonify({"error": "Failed to generate audio"}), 500

        return jsonify(
            {
                "num": data["num"],
                "history": chat_history,
                "question": audio_base64,
                "question_text": response.text,
                "end": end,
                "metadata": meta,
                "answer_audio": None,
            }
        ), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/chat", methods=["POST"])
def chat() -> tuple[Response, int]:
    data = request.get_json()

    # Validate input format
    if "question" not in data:
        return jsonify({"error": "Question is required"}), 400

    user_question = data["question"]
    conv_chain = data["conversation-chain"]
    chat_history = data["chat-history"]

    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json",
    }

    # convert to JSON object to string
    conv_chain = json.dumps(conv_chain, indent=2)
    chat_history = json.dumps(chat_history, indent=2)

    payload = {
        "model": "mistral-small-latest",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful medical assistant. Use the provided conversation chain for context, but focus on giving direct and relevant responses to the user's questions.",
            },
            {
                "role": "user",
                "content": f"""
                Reference Information:
                {conv_chain}

                Conversation Chain:
                {chat_history}

                Current Question: {user_question}

                Please provide a helpful response to the current question, using the reference information and conversation history as context.
                """,
            },
        ],
        "temperature": 0.7,
        "max_tokens": 300,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0,
    }

    response = requests.post(MISTRAL_API_URL, headers=headers, json=payload)
    print(response)
    response_data = response.json()

    if "choices" in response_data and len(response_data["choices"]) > 0:
        bot_response = response_data["choices"][0]["message"]["content"]
        return jsonify({"response": bot_response}), 200
    else:
        return jsonify({"error": "Failed to get a response from Mistral"}), 500


@app.route("/alert_status", methods=["POST"])
def alert_status():
    try:
        data = request.get_json()
        
        # First, ensure user exists/create if needed
        user_id, status = create_or_upload_user(data["userEmail"], data["userName"])
        
        if status >= 400:
            return jsonify({"error": "Failed to process user"}), status
            
        # Add user_id to the metrics
        data["user_id"] = user_id
        
        # Store the entire payload in ChromaDB
        collection = chroma_client.get_or_create_collection(name="user_metrics")
        
        current_time = datetime.now().isoformat()
        document = {
            "metrics": data,
            "timestamp": current_time,
            "user_id": user_id
        }
        
        collection.add(
            ids=[f"{uuid.uuid4()}"],
            documents=[json.dumps(document)],
            metadatas=[{
                "email": data["userEmail"], 
                "name": data["userName"],
                "timestamp": current_time,
                "user_id": user_id
            }]
        )

        # Check for critical state
        is_critical = data["hrv"] > 100
        
        if is_critical:
            message = TWILIO_CLIENT.messages.create(
                from_=TWILIO_PHONE_NUMBER,
                body='Alert! Mood swing!',
                to='+16047806112'
            )
            print(message.sid)
            
            # Initiate the conversation with the watch
            question = """Hi, I'm an AI therapist. I've noticed that you've been having some mood swings.
            Can you tell me how you are feeling right now?"""
        else:
            question = ""

        return jsonify({
            "critical": is_critical,
            "question": question
        }), 200

    except Exception as e:
        print("Error storing metrics:", e)
        return jsonify({"error": str(e)}), 500
