import requests
import json
import base64
import os
from dotenv import load_dotenv

load_dotenv()

# User provided key - intended to be in an env file, but placing here for direct functionality as requested
# Ideally, this should be an environment variable.
API_KEY = "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" 
API_URL = "https://openrouter.ai/api/v1/chat/completions"

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def analyze_chart_image(image_path):
    base64_image = encode_image(image_path)
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        # "HTTP-Referer": "http://localhost:5173", # Optional for OpenRouter
    }

    prompt_text = """
    You are an expert price action trader. Analyze this candlestick chart image. 
    Identify the current trend, major patterns (e.g., Engulfing, Pinbar, Head & Shoulders), support/resistance levels.
    
    PROVIDE A STRICT JSON RESPONSE. DO NOT ADD MARKDOWN FORMATTING like ```json ... ```. JUST THE RAW JSON.
    
    The JSON structure must be exactly:
    {
        "signal": "BUY" or "SELL",
        "entry": <number>,
        "sl": <number>,
        "tp": <number>,
        "confidence": <number between 0-100>,
        "pattern": "<brief description of pattern>"
    }
    
    If the image is not a trading chart, return {"signal": "NEUTRAL", "entry": 0, "sl": 0, "tp": 0, "confidence": 0, "pattern": "Invalid Image"}.
    """

    data = {
        "model": "openai/gpt-4o", # Using GPT-4o as requested for vision capabilities
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt_text},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ]
    }

    try:
        print("Sending request to OpenRouter...")
        response = requests.post(API_URL, headers=headers, data=json.dumps(data))
        response.raise_for_status()
        
        result_json = response.json()
        content = result_json['choices'][0]['message']['content']
        
        # Clean up code blocks if the model ignores the instruction
        content = content.replace("```json", "").replace("```", "").strip()
        
        print("Raw AI Response:", content)
        
        parsed_result = json.loads(content)
        return parsed_result
        
    except Exception as e:
        print(f"AI Engine Error: {e}")
        # Return specific error structure so frontend doesn't crash
        return {
            "signal": "ERROR",
            "entry": 0.0,
            "sl": 0.0,
            "tp": 0.0,
            "confidence": 0,
            "pattern": "Analysis Failed: " + str(e)
        }
