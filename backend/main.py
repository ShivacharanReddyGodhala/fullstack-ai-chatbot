from fastapi import FastAPI

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
