import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import NavigationBar from './NavigationBar';
import './PremiumPage.css';

function PremiumPage() {
  const navigate = useNavigate();
  const auth = useAppSelector((state) => state.auth);
  const isLoggedIn = !!auth.token && !!auth.username;
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    if (!isLoggedIn) {
      navigate('/signup');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBase}/create_checkout_session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsProcessing(false);
    }
  };

  return (
    <div className="premium-page">
      <NavigationBar currentPage="home" />
      
      <div className="premium-container">
        <header className="premium-header">
          <h1 className="premium-title animate-fade-in">Upgrade to Premium</h1>
          <p className="premium-subtitle animate-fade-in-delay-1">Unlock exclusive features and support Trivvia</p>
        </header>

        <div className="pricing-cards">
          {/* Free Tier */}
          <div className="pricing-card free-card animate-fade-in-delay-2">
            <div className="card-header">
              <h3 className="card-title">Free</h3>
              <div className="card-price">
                <span className="price">$0</span>
                <span className="period">/forever</span>
              </div>
            </div>
            
            <ul className="feature-list">
              <li className="feature-item">
                <span className="plan-check-icon">✓</span>
                Play unlimited trivia games
              </li>
              <li className="feature-item">
                <span className="plan-check-icon">✓</span>
                Real-time multiplayer
              </li>
              <li className="feature-item">
                <span className="plan-check-icon">✓</span>
                Live chat with players
              </li>
              <li className="feature-item">
                <span className="plan-check-icon">✓</span>
                Track your streak
              </li>
              <li className="feature-item disabled">
                <span className="plan-check-icon">✗</span>
                No custom themes
              </li>
              <li className="feature-item disabled">
                <span className="plan-check-icon">✗</span>
                No priority support
              </li>
            </ul>

            <button className="plan-button free-button" disabled>
              Current Plan
            </button>
          </div>

          {/* Premium Tier */}
          <div className="pricing-card premium-card featured animate-fade-in-delay-3">
            <div className="featured-badge">Most Popular</div>
            <div className="card-header">
              <h3 className="card-title">Premium</h3>
              <div className="card-price">
                <span className="price">$4.99</span>
                <span className="period">/month</span>
              </div>
            </div>
            
            <ul className="feature-list">
              <li className="feature-item">
                <span className="plan-check-icon premium-icon">✓</span>
                Everything in Free
              </li>
              <li className="feature-item">
                <span className="plan-check-icon premium-icon">✓</span>
                Custom doodly themes
              </li>
              <li className="feature-item">
                <span className="plan-check-icon premium-icon">✓</span>
                Premium badge in games
              </li>
              <li className="feature-item">
                <span className="plan-check-icon premium-icon">✓</span>
                Priority support
              </li>
              <li className="feature-item">
                <span className="plan-check-icon premium-icon">✓</span>
                Ad-free experience
              </li>
              <li className="feature-item">
                <span className="plan-check-icon premium-icon">✓</span>
                Support indie development
              </li>
            </ul>

            {error && (
              <div className="error-banner">
                {error}
              </div>
            )}

            <button 
              className="plan-button premium-button" 
              onClick={handleUpgrade}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : isLoggedIn ? 'Upgrade Now' : 'Sign up to Upgrade'}
            </button>
          </div>
        </div>

        <section className="faq-section">
          <h2 className="faq-title animate-fade-in-delay-4">Frequently Asked Questions</h2>
          
          <div className="faq-grid">
            <div className="faq-item animate-fade-in-delay-5">
              <h3 className="faq-question">Can I cancel anytime?</h3>
              <p className="faq-answer">
                Yes! You can cancel your subscription at any time from your account page. 
                You'll keep premium access until the end of your billing period.
              </p>
            </div>

            <div className="faq-item animate-fade-in-delay-5">
              <h3 className="faq-question">What payment methods do you accept?</h3>
              <p className="faq-answer">
                We accept all major credit cards, debit cards, and digital wallets through 
                Stripe's secure payment processing.
              </p>
            </div>

            <div className="faq-item animate-fade-in-delay-6">
              <h3 className="faq-question">Is my payment information secure?</h3>
              <p className="faq-answer">
                Absolutely! We use Stripe for payment processing. We never store your card 
                details on our servers.
              </p>
            </div>

            <div className="faq-item animate-fade-in-delay-6">
              <h3 className="faq-question">What happens if I downgrade?</h3>
              <p className="faq-answer">
                Your premium features will remain active until the end of your billing period. 
                After that, you'll return to the free plan.
              </p>
            </div>
          </div>
        </section>

        <footer className="premium-footer">
          <p>Have questions? <a href="/about">Contact us</a></p>
        </footer>
      </div>
    </div>
  );
}

export default PremiumPage;

