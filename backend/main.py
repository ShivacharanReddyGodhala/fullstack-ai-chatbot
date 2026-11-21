from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Literal
from pydantic import BaseModel, Field
from ollama import Client, ResponseError
import httpx

# Create the FastAPI application
app = FastAPI(title="Full Stack AI Chatbot API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"]
)

# Connect to our locally running Ollama server
ollama_client = Client(
    host="http://127.0.0.1:11434",
    timeout=120.0
)

MODEL_NAME = "qwen3:1.7b"


# Define the expected chatbot input
class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[HistoryMessage] = Field(
        default_factory=list,
        max_length=20
    )


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
                # Create the conversation with system instructions
        conversation = [
            {
                "role": "system",
                "content": (
                    "You are a helpful AI assistant. "
                    "Use conversation history to answer "
                    "follow-up questions accurately."
                )
            }
        ]

        # Add previous conversation messages
        for previous_message in request.history:
            conversation.append({
                "role": previous_message.role,
                "content": previous_message.content
            })

        # Add the newest user message
        conversation.append({
            "role": "user",
            "content": request.message
        })

        # Send the entire conversation to Ollama
        response = ollama_client.chat(
            model=MODEL_NAME,
            messages=conversation,
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
