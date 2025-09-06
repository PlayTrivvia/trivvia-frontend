import { useState } from 'react';
import './AboutPage.css';

interface AboutPageProps {
  onBack: () => void;
}

function AboutPage({ onBack }: AboutPageProps) {
  const [formData, setFormData] = useState({
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [rateLimitInfo, setRateLimitInfo] = useState<{remaining: number, total: number} | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.message) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
      console.log('📤 Sending contact form to:', `${apiBase}/contact`);
      console.log('📤 Form data:', { email: formData.email, messageLength: formData.message.length });
      
      const response = await fetch(`${apiBase}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          message: formData.message
        })
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Contact submission successful:', responseData);
        setSubmitStatus('success');
        setFormData({ email: '', message: '' });
        
        // Store rate limit info if provided
        if (responseData.rateLimit) {
          setRateLimitInfo(responseData.rateLimit);
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Contact submission failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error
        });
        setSubmitStatus('error');
        
        // Handle rate limiting specifically
        if (response.status === 429) {
          setRateLimitInfo({
            remaining: 0,
            total: errorData.limit || 5
          });
        }
      }
    } catch (error) {
      console.error('❌ Contact submission network error:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="about-page">
      <div className="about-container">
        <header className="about-header">
          <div className="about-nav">
            <button onClick={onBack} className="back-button">
              ← Back
            </button>
          </div>
          <div className="about-title-section">
            <h1 className="about-title">About Trivvia</h1>
            <p className="about-subtitle">Real-time trivia with friends</p>
          </div>
        </header>

        <div className="about-content">
          <section className="about-section">
            <h2>How It Works</h2>
            <div className="about-features">
              <div className="feature-item">
                <div className="feature-icon">🎯</div>
                <div className="feature-content">
                  <h3>Real-time Questions</h3>
                  <p>Answer trivia questions as they appear, competing with other players for the fastest correct response.</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">💬</div>
                <div className="feature-content">
                  <h3>Live Chat</h3>
                  <p>Chat with other players in real-time, share strategies, and celebrate victories together.</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">🏆</div>
                <div className="feature-content">
                  <h3>Leaderboard</h3>
                  <p>Track your progress with streaks and climb the leaderboard to become the trivia champion.</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">💡</div>
                <div className="feature-content">
                  <h3>Smart Hints</h3>
                  <p>Get progressive hints as time passes, making every question accessible to players of all levels.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>Get in Touch</h2>
            <p className="contact-description">
              Have a question, suggestion, or want to submit new trivia questions? 
              We'd love to hear from you!
            </p>
            
            
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Your Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="message" className="form-label">
                  Message, Question, or Feedback
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Share your thoughts, submit new questions, or let us know how we can improve..."
                  className="form-textarea"
                  rows={6}
                  required
                />
              </div>
              
              <div className="form-actions">
                <button
                  type="submit"
                  className={`submit-button ${isSubmitting ? 'loading' : ''}`}
                  disabled={isSubmitting || !formData.email || !formData.message}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
              
              {submitStatus === 'success' && (
                <div className="status-message success">
                  ✓ Thank you for your message! We'll get back to you soon.
                </div>
              )}
              
              {submitStatus === 'error' && (
                <div className="status-message error">
                  ✗ Something went wrong. Please try again or contact us directly.
                </div>
              )}
            </form>
          </section>

          <section className="about-section">
            <h2>About the Game</h2>
            <div className="about-info">
              <p>
                Trivvia features our own growing database of carefully curated questions, 
                handpicked for their ability to engage, challenge, and entertain players 
                of all levels. As our community grows, so does our collection of unique content.
              </p>
              <p>
                To ensure a diverse and fresh experience, we also supplement our database 
                with questions from <a 
                  href="https://the-trivia-api.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="credit-link"
                >
                  The Trivia API
                </a>, which provides access to over 11,000 additional vetted questions 
                across diverse categories.
              </p>
              <p>
                Whether you're a trivia enthusiast or just looking for a fun way to 
                challenge your knowledge, Trivvia offers an accessible and engaging 
                experience that brings friends together for quick, competitive trivia sessions.
              </p>
            </div>
          </section>
        </div>

        <footer className="about-footer">
          <p className="footer-text">
            Made with ❤️ for trivia lovers everywhere
          </p>
        </footer>
      </div>
    </div>
  );
}

export default AboutPage;
