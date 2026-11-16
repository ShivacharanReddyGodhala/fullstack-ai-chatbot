from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Full Stack AI Chatbot API")


@app.get("/")
def home():
    return {
        "message": "Welcome to my AI Chatbot Backend!",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


class ChatRequest(BaseModel):
    message: str


@app.post("/chat")
def chat(request: ChatRequest):
    user_message = request.message

    return {
        "user_message": user_message,
        "reply": f"You said: {user_message}"
    }