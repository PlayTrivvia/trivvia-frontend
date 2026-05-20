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
  currentPlayerIsPremium?: boolean
}

function ChatComponent({ messages, onSendMessage, isLoadingHistory, currentPlayerIsPremium }: ChatComponentProps) {
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

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    scrollToBottom()
    const target = e.target
    setTimeout(() => {
      target.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, 300)
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
                <span className="message-player">
                  {message.type === 'bot' && (
                    <span className="bot-prefix">
                      <span className="bot-icon">🤖</span>
                    </span>
                  )}
                  {message.type !== 'bot' && (
                    <span className={`player-icon ${message.isOwnMessage ? 'own-player-icon' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 14C3 11.7909 5.23858 10 8 10C10.7614 10 13 11.7909 13 14" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                  {message.type === 'bot' ? 'Trivvia Bot' : message.player.toLowerCase()}
                  {message.isOwnMessage && currentPlayerIsPremium && (
                    <span className="premium-crown" title="Premium member">👑</span>
                  )}
                </span>
                <span className="message-timestamp">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
              <div className="message-content">
                {message.type === 'answer' && (
                  <span className="answer-prefix">💡 </span>
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

