import { useState, useRef, useEffect } from 'react'
import './ChatComponent.css'

export interface Message {
  id: number
  player: string
  message: string
  timestamp: string
  type: 'chat' | 'answer' | 'bot'
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
              {message.type === 'bot' && (
                <span className="bot-prefix">🤖 </span>
              )}
              {message.type === 'bot' ? (
                <span
                  dangerouslySetInnerHTML={{
                    __html: message.message.replace(
                      /(Correct! The answer is: )(.+?)(<br\/>|$)/,
                      '$1<span class="answer-text">$2</span>$3'
                    )
                  }}
                />
              ) : (
                message.message
              )}
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
              placeholder="Type your answer..."
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

