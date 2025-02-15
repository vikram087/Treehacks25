import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_API_KEY)

def adaptive_test():
    # ==============================================
    #  ALTER MODEL HERE
    # ==============================================
    model = genai.GenerativeModel('gemini-2.0-flash')

    # ==============================================
    # QUESTIONS AND PROMPTS
    # ==============================================

    topics_to_ask = """
    1. Mood and Emotions
    2. Eating and Diet
    3. Sleep and Fatigue
    4. Exercise and Fitness
    5. Relationships and Social Interaction
    """

    instructions = f"""
    You are a behavioral psychologist. You are to facilitate a conversation with the user
    who likely has some for of bi-polar disorder. You are to ask them questions about the
    following topics:

    ----- TOPICS -----
    {topics_to_ask}

    ----- DIRECTIONS -----
    
    To start the conversation (i.e. the history is empty), you should introduce youself as 
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
    
    chat_history = []
    user_input = ""
    while True:
        
        prompt = f"""

        ----- INSTRUCTIONS -----

        {instructions}

        ----- CURRENT CONVERSATION -----

        history: {chat_history}
        
        user: {user_input}

        ----- TASK -----

        Please response to the user according to the instructions and current conversation.
        Give a short question response to the user as your sole output. Remember, only ask
        up to 2 follow up questions per theme and end the conversation once all topics have been
        covered.
        """ 
        # Generate response
        response = model.generate_content(prompt)
        
        # Store the conversation
        chat_history.append({"role": "user", "text": user_input})
        chat_history.append({"role": "assistant", "text": response.text})
        
        # Print the response
        if "[CONVERSATION ENDED]" in response.text:
            print("\nAssistant:", response.text.replace("[CONVERSATION ENDED]", ""))
            break
        else:
            print("\nAssistant:", response.text)

        # Get user input
        user_input = input("\nYou: ")

if __name__ == "__main__":
    adaptive_test() 