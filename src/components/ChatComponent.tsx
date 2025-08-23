import { useState, useRef, useEffect } from 'react'
import './ChatComponent.css'

export interface Message {
  id: number
  player: string
  message: string
  timestamp: string
  type: 'chat' | 'answer'
}

interface ChatComponentProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  currentPlayer: string
}

function ChatComponent({ messages, onSendMessage, currentPlayer }: ChatComponentProps) {
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim())
      setNewMessage('')
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return timestamp
  }

  return (
    <div className="chat-component">
      <div className="chat-header">
        <h3 className="chat-title">Game Chat</h3>
        <span className="chat-subtitle">Chat with other players</span>
      </div>

      <div className="chat-messages" ref={messagesContainerRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.type} ${
              message.player === currentPlayer ? 'own-message' : ''
            }`}
          >
            <div className="message-header">
              <span className="message-player">{message.player}</span>
              <span className="message-timestamp">
                {formatTimestamp(message.timestamp)}
              </span>
            </div>
            <div className="message-content">
              {message.type === 'answer' && (
                <span className="answer-prefix">💡 </span>
              )}
              {message.message}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <div className="chat-input-group">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="chat-input"
            maxLength={200}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="send-button"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChatComponent

