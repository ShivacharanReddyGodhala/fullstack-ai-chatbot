from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from ollama import Client, ResponseError
import httpx

# Create the FastAPI application
app = FastAPI(title="Full Stack AI Chatbot API")

# Connect to our locally running Ollama server
ollama_client = Client(
    host="http://127.0.0.1:11434",
    timeout=120.0
)

MODEL_NAME = "qwen3:1.7b"


# Define the expected chatbot input
class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


# Home endpoint
@app.get("/")
def home():
    return {
        "message": "Welcome to my AI Chatbot Backend!",
        "status": "running"
    }


# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


# AI chatbot endpoint
@app.post("/chat")
def chat(request: ChatRequest):
    try:
        # Send the user's message to our local AI model
        response = ollama_client.chat(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful AI assistant. "
                        "Explain things clearly and simply."
                    )
                },
                {
                    "role": "user",
                    "content": request.message
                }
            ],
            think=False,
            options={
                "num_predict": 300
            }
        )

        # Return the AI-generated response
        return {
            "user_message": request.message,
            "reply": response.message.content,
            "model": MODEL_NAME
        }

    except ResponseError as error:
        print("Ollama error:", error.status_code, flush=True)
        raise HTTPException(
            status_code=502,
            detail="The local AI model could not complete the request"
        ) from error

    except httpx.RequestError as error:
        print("Ollama connection error:", type(error).__name__, flush=True)
        raise HTTPException(
            status_code=503,
            detail="The local AI service is unavailable"
        ) from error
