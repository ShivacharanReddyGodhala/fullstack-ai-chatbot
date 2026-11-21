import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type ChatResponse = {
  user_message: string
  reply: string
  model: string
}

const API_URL = 'http://127.0.0.1:8000'

function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to my local AI chatbot, powered by Qwen3!'
    }
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const text = input.trim()

    if (!text || loading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text
    }

    setMessages((previous) => [...previous, userMessage])
    setInput('')
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text
        })
      })

      if (!response.ok) {
        throw new Error(
          `Backend returned HTTP ${response.status}`
        )
      }

      const data: ChatResponse = await response.json()

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply
      }

      setMessages((previous) => [...previous, aiMessage])

    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Unknown error'

      setError(`Unable to get an AI response. ${message}`)
      console.error('Chat request failed:', err)

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-app">
      <header className="chat-header">
        <div>
          <h1>My AI Chatbot</h1>
          <p>React + FastAPI + Ollama</p>
        </div>

        <span className="status">Local AI</span>
      </header>

      <main className="chat-messages" aria-live="polite">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role}`}
          >
            <div className="message-bubble">
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message assistant">
            <div className="message-bubble loading">
              AI is thinking...
            </div>
          </div>
        )}
      </main>

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      <form className="chat-input-area" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Ask your AI assistant..."
          value={input}
          maxLength={2000}
          onChange={(event) => setInput(event.target.value)}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
        >
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default App