import { useState, useRef, useEffect } from 'react'
import './ChatComponent.css'

export interface Message {
  id: number
  player: string
  message: string
  timestamp: string
  type: 'chat' | 'answer' | 'bot'
  messageType?: string
  originalTimestamp?: number
  isOwnMessage?: boolean
  sessionId?: string
}

interface ChatComponentProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  currentPlayer: string
  isLoadingHistory?: boolean
  onKeyboardToggle?: (isOpen: boolean) => void
}

function ChatComponent({ messages, onSendMessage, isLoadingHistory, onKeyboardToggle }: ChatComponentProps) {
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

  // Handle input focus/blur for keyboard detection
  const handleInputFocus = () => {
    if (onKeyboardToggle) {
      onKeyboardToggle(true)
    }
  }

  const handleInputBlur = () => {
    if (onKeyboardToggle) {
      onKeyboardToggle(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return timestamp
  }

  const renderBotMessage = (message: string) => {
    let formattedMessage = message
      .replace(/\n/g, '<br/>') // Convert newlines to <br/>
      .replace(/@(\w+)/g, '<span class="mention">@$1</span>') // Highlight mentions
      .replace(/"/g, '&quot;') // Escape quotes
      .replace(/'/g, '&#39;'); // Escape apostrophes

    // Apply specific formatting based on message content patterns
    if (message.includes('Question:') && message.includes('Correct! The answer is:')) {
      // Format answer messages with special styling
      formattedMessage = formattedMessage
        .replace(/(Question: )(.+?)(\n)/, '<span class="bot-question">$1$2</span>$3')
        .replace(/(Correct! The answer is: )(.+?)(\n|$)/, '$1<span class="answer-highlight">$2</span>$3')
        .replace(/(First to answer: )(.+?)(\n|$)/, '$1<span class="first-responder">$2</span>$3');
    } else if (message.includes('Welcome to Trivvia')) {
      // Format welcome messages
      formattedMessage = formattedMessage
        .replace(/(Welcome to Trivvia, )(.+?)(!)/, '$1<span class="player-name">$2</span>$3');
    }

    return formattedMessage;
  }

  const renderUserMessage = (message: string) => {
    return message
      .replace(/\n/g, '<br/>') // Convert newlines to <br/>
      .replace(/"/g, '&quot;') // Escape quotes
      .replace(/'/g, '&#39;'); // Escape apostrophes
  }

  return (
    <div className="chat-component">
      {isLoadingHistory && (
        <div className="chat-history-loading">
          <div className="loading-spinner"></div>
          <span>Loading chat history...</span>
        </div>
      )}

      <div className="chat-messages" ref={messagesContainerRef}>
        {messages.map((message) => {
          return (
            <div
              key={message.id}
              className={`message ${message.type} ${
                message.isOwnMessage ? 'own-message' : ''
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
                      __html: renderBotMessage(message.message)
                    }}
                  />
                ) : (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: renderUserMessage(message.message)
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <div className="chat-input-group">
                      <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
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

