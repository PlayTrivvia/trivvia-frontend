import { useState, useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import NavigationBar from './NavigationBar';
import './AboutPage.css';

interface AboutPageProps {}

function AboutPage({}: AboutPageProps) {
  const auth = useAppSelector((state) => state.auth);
  const isLoggedIn = !!auth.token && !!auth.email;
  
  const [formData, setFormData] = useState({
    email: isLoggedIn ? auth.email || '' : '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Update email when auth state changes
  useEffect(() => {
    if (isLoggedIn && auth.email) {
      setFormData(prev => ({ ...prev, email: auth.email || '' }));
    }
  }, [isLoggedIn, auth.email]);

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
        // Clear message but keep email if logged in
        setFormData(prev => ({ 
          email: isLoggedIn ? prev.email : '', 
          message: '' 
        }));
        
      } else {
        const errorData = await response.json();
        console.error('❌ Contact submission failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error
        });
        setSubmitStatus('error');
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
      <NavigationBar currentPage="about" />
      <div className="about-container">
        <header className="about-header">
          <div className="about-title-section">
            <h1 className="about-title animate-fade-in">About Trivvia</h1>
            <p className="about-subtitle animate-fade-in-delay-1">Real-time trivia with friends</p>
          </div>
        </header>

        <div className="about-content">
          <section className="about-section">
            <h2 className="animate-fade-in-view">Features</h2>
            <div className="about-features">
              <div className="feature-item animate-fade-in-view-delay-1">
                <div className="feature-icon-wrapper yellow">
                  <svg className="feature-icon hand-drawn" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <div className="feature-content">
                  <h3>Real-time Scoring</h3>
                  <p>Quick questions. Instant scoring. No waiting around.</p>
                </div>
              </div>
              
              <div className="feature-item animate-fade-in-view-delay-2">
                <div className="feature-icon-wrapper">
                  <svg className="feature-icon hand-drawn" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>
                    <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>
                    <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>
                  </svg>
                </div>
                <div className="feature-content">
                  <h3>Smart Categories</h3>
                  <p>Thousands of curated questions and difficulty levels.</p>
                </div>
              </div>
              
              <div className="feature-item animate-fade-in-view-delay-3">
                <div className="feature-icon-wrapper">
                  <svg className="feature-icon hand-drawn" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className="feature-content">
                  <h3>Social by Default</h3>
                  <p>Join public rooms or create private battles.</p>
                </div>
              </div>
              
              <div className="feature-item animate-fade-in-view-delay-4">
                <div className="feature-icon-wrapper yellow">
                  <svg className="feature-icon hand-drawn" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
                  </svg>
                </div>
                <div className="feature-content">
                  <h3>Live Chat</h3>
                  <p>Chat with other players while you compete.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2 className="animate-fade-in-view">Get in Touch</h2>
            <p className="contact-description animate-fade-in-view-delay-1">
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
                  className={`form-input ${isLoggedIn ? 'form-input-readonly' : ''}`}
                  required
                  readOnly={isLoggedIn}
                  disabled={isLoggedIn}
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
                  {isSubmitting ? 'Sending...' : (
                    <>
                      Send Message
                      <svg className="send-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </>
                  )}
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
            <h2 className="animate-fade-in-view">About the Game</h2>
            <div className="about-info animate-fade-in-view-delay-1">
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
            © 2025 Trivvia. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default AboutPage;
