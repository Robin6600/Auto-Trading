from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.ai_engine import analyze_chart_image
import shutil
import os
import uuid

app = FastAPI(title="Sniper Trader Pro API")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"status": "Online", "system": "Sniper Trader Pro Backend"}

@app.post("/analyze")
async def analyze_endpoint(file: UploadFile = File(...)):
    try:
        # Save uploaded file safely
        file_extension = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Call AI Engine
        # Note: In a real deployment, we might need to upload this image to a public URL 
        # or convert it to base64 if the AI API supports it. 
        # For OpenRouter/OpenAI Vision, Base64 is often supported or a public URL.
        # We will use Base64 encoding in the service.
        
        result = analyze_chart_image(file_path)
        
        # Cleanup (Optional: keep for debugging)
        # os.remove(file_path) 
        
        return result

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
