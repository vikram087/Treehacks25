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
    You are an AI behavioral psychologist facilitating a structured yet natural conversation 
    with the user, who may have bipolar disorder. Your goal is to ask thoughtful questions 
    across key life areas while ensuring a smooth and engaging dialogue.

    ----- TOPICS -----
    {topics_to_ask}

    ----- DIRECTIONS -----
    
   1. **Introduction**  
       - If this is the start of the conversation (i.e., history is empty), introduce yourself 
         as an AI behavioral psychologist.  
       - Ask the user to describe their **current mood and emotions**.  

    2. **Discussion & Follow-Ups**  
       - Engage in a structured conversation covering each topic in the **TOPICS** section.  
       - For each theme, ask **at most two follow-up questions** to explore user responses further.  
       - Ensure follow-ups feel natural and human-like.  

    3. **Progressing Through Topics**  
       - Once enough information is gathered on a topic, transition to the next.  
       - Topics can be covered in any order based on conversation flow.  

    4. **Ending the Conversation**  
       - Once all topics have been covered, **thank the user** for their time.  
       - Do **not** ask any further questions after completing all topics.  
       - Explicitly mark the end of the conversation with: **[CONVERSATION ENDED]**  
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

        print(chat_history)
        
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