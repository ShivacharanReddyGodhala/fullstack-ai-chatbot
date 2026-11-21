import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type HistoryMessage = {
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
  const [failedMessage, setFailedMessage] = useState<Message | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    })
  }, [messages, loading])

  function handleNewChat() {
    if (loading) return
    setMessages([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to my local AI chatbot, powered by Qwen3!'
    }
  ])

  setInput('')
  setError('')
  setFailedMessage(null)
}
  async function requestAI(
    text: string,
    history: HistoryMessage[]
  ): Promise<boolean> {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history
        })
      })

      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`)
      }

      const data: ChatResponse = await response.json()

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply
      }

      setMessages((previous) => [...previous, aiMessage])
      setFailedMessage(null)

      return true

    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Unknown error'

      setError(`Unable to get an AI response. ${message}`)
      console.error('Chat request failed:', err)

      return false

    } finally {
      setLoading(false)
    }
  }
  async function handleSend(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()

  const text = input.trim()

  if (!text || loading || failedMessage) return

  const history: HistoryMessage[] = messages
    .filter((message) => message.id !== 'welcome')
    .slice(-20)
    .map((message) => ({
      role: message.role,
      content: message.content
    }))

  const userMessage: Message = {
    id: crypto.randomUUID(),
    role: 'user',
    content: text
  }

  setMessages((previous) => [...previous, userMessage])
  setInput('')

  const success = await requestAI(text, history)

  if (!success) {
    setFailedMessage(userMessage)
  }
}

async function handleRetry() {
  if (!failedMessage || loading) return

  const failedIndex = messages.findIndex(
    (message) => message.id === failedMessage.id
  )

  if (failedIndex === -1) return

  const history: HistoryMessage[] = messages
    .slice(0, failedIndex)
    .filter((message) => message.id !== 'welcome')
    .slice(-20)
    .map((message) => ({
      role: message.role,
      content: message.content
    }))

  await requestAI(failedMessage.content, history)
}

  return (
    <div className="chat-app">
      <header className="chat-header">
        <div>
          <h1>My AI Chatbot</h1>
          <p>React + FastAPI + Ollama</p>
        </div>

        <div className="header-actions">
          <span className="status">Local AI</span>

          <button
            type="button"
            className="new-chat-button"
            onClick={handleNewChat}
            disabled={loading}
          >
            + New Chat
          </button>
        </div>
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

        <div ref={messagesEndRef} />
      </main>

      {error && (
        <div className="error-message" role="alert">
          <p>{error}</p>

          {failedMessage && (
            <button
              type="button"
              className="retry-button"
              onClick={handleRetry}
              disabled={loading}
            >
              Retry
            </button>
          )}
        </div>
      )}

      <form className="chat-input-area" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Ask your AI assistant..."
          value={input}
          maxLength={2000}
          onChange={(event) => setInput(event.target.value)}
          disabled={loading || failedMessage !== null}
        />

        <button
          type="submit"
          disabled={!input.trim() || loading || failedMessage !== null}
        >
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default App