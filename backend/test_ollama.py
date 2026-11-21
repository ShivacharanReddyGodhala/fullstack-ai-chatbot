from ollama import Client

client = Client(host="http://127.0.0.1:11434")

response = client.chat(
    model="qwen3:1.7b",
    messages=[
        {
            "role": "user",
            "content": "Explain what FastAPI is in two sentences."
        }
    ],
    think=False
)

print(response.message.content)