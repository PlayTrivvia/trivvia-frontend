import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import NavigationBar from './NavigationBar';
import './ContributePage.css';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

interface AnswerOption {
  text: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  emoji: string;
  is_active: boolean;
  is_premium: boolean;
}

interface Subcategory {
  id: number;
  category_id: number;
  name: string;
}

const defaultAnswer = (): AnswerOption => ({ text: '' });

function ContributePage() {
  const navigate = useNavigate();
  const auth = useAppSelector((state) => state.auth);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [questionText, setQuestionText] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [categoryID, setCategoryID] = useState<number | ''>('');
  const [subcategoryID, setSubcategoryID] = useState<number | ''>('');
  const [bestAnswer, setBestAnswer] = useState('');
  const [answers, setAnswers] = useState<AnswerOption[]>([defaultAnswer()]);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not logged in or not premium
  useEffect(() => {
    if (!auth.token) {
      navigate('/login');
      return;
    }
    if (!auth.isPremium) {
      navigate('/premium');
      return;
    }
  }, [auth.token, auth.isPremium]);

  // Load categories
  useEffect(() => {
    fetch(`${apiBase}/categories`)
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (!categoryID) {
      setSubcategories([]);
      setSubcategoryID('');
      return;
    }
    fetch(`${apiBase}/subcategories?category_id=${categoryID}`)
      .then((r) => r.json())
      .then((data) => {
        setSubcategories(data.subcategories || []);
        setSubcategoryID('');
      })
      .catch(() => setSubcategories([]));
  }, [categoryID]);

  const handleAddAnswer = () => {
    if (answers.length >= 5) return;
    setAnswers([...answers, defaultAnswer()]);
  };

  const handleRemoveAnswer = (idx: number) => {
    if (answers.length <= 1) return;
    setAnswers(answers.filter((_, i) => i !== idx));
  };

  const handleAnswerChange = (idx: number, value: string) => {
    setAnswers(answers.map((a, i) => i === idx ? { ...a, text: value } : a));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!questionText.trim()) return setError('Question text is required.');
    if (!categoryID) return setError('Please select a category.');
    if (!bestAnswer.trim()) return setError('Best answer is required.');
    const validAnswers = answers.filter((a) => a.text.trim());
    if (validAnswers.length === 0) return setError('At least one answer is required.');

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/submit_question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          question_text: questionText.trim(),
          difficulty,
          category_id: Number(categoryID),
          subcategory_id: subcategoryID ? Number(subcategoryID) : null,
          best_answer: bestAnswer.trim(),
          answers_json: validAnswers.map((a) => ({
            text: a.text.trim(),
            threshold: 0.8,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit question');
      setSuccess(true);
      // Reset form
      setQuestionText('');
      setDifficulty('medium');
      setCategoryID('');
      setSubcategoryID('');
      setBestAnswer('');
      setAnswers([defaultAnswer()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  if (!auth.token || !auth.isPremium) return null;

  return (
    <div className="contribute-page">
      <NavigationBar currentPage="contribute" />
      <div className="contribute-container">
        <div className="contribute-header">
          <h1 className="contribute-title">Contribute a Question</h1>
          <p className="contribute-subtitle">
            Help grow the Trivvia question bank. All submissions are reviewed before going live.
            You'll be credited as the contributor when your question is displayed to players!
          </p>
          <div className="contribute-badge">👑 Premium Contributors</div>
        </div>

        {success && (
          <div className="contribute-success">
            <span className="success-icon">✓</span>
            <div>
              <strong>Question submitted!</strong>
              <p>Thank you for contributing. Our team will review it shortly.</p>
            </div>
            <button className="success-dismiss" onClick={() => setSuccess(false)}>×</button>
          </div>
        )}

        <form className="contribute-form" onSubmit={handleSubmit}>
          {/* Question Text */}
          <div className="form-group">
            <label className="form-label">
              Question <span className="required">*</span>
            </label>
            <textarea
              className="form-textarea"
              placeholder="e.g. What is the capital of France?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <span className="char-count">{questionText.length}/500</span>
          </div>

          {/* Category + Subcategory row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Category <span className="required">*</span>
              </label>
              <select
                className="form-select"
                value={categoryID}
                onChange={(e) => setCategoryID(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Subcategory</label>
              <select
                className="form-select"
                value={subcategoryID}
                onChange={(e) => setSubcategoryID(e.target.value ? Number(e.target.value) : '')}
                disabled={subcategories.length === 0}
              >
                <option value="">
                  {subcategories.length === 0 ? 'Select a category first' : 'Optional'}
                </option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Difficulty */}
          <div className="form-group">
            <label className="form-label">
              Difficulty <span className="required">*</span>
            </label>
            <div className="difficulty-buttons">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`difficulty-btn difficulty-${d} ${difficulty === d ? 'active' : ''}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Answers */}
          <div className="form-group">
            <label className="form-label">
              Accepted Answers <span className="required">*</span>
              <span className="form-hint">Add all variants that should be accepted (e.g. "Paris", "paris", "the capital of France")</span>
            </label>
            <div className="answers-list">
              {answers.map((ans, idx) => (
                <div key={idx} className="answer-row">
                  <div className="answer-input-group">
                    <input
                      className="form-input answer-text"
                      type="text"
                      placeholder={`Answer variant ${idx + 1}`}
                      value={ans.text}
                      onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    />
                  </div>
                  {answers.length > 1 && (
                    <button
                      type="button"
                      className="answer-remove"
                      onClick={() => handleRemoveAnswer(idx)}
                      title="Remove answer"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {answers.length < 5 && (
              <button type="button" className="add-answer-btn" onClick={handleAddAnswer}>
                + Add another answer variant
              </button>
            )}
          </div>

          {/* Best Answer */}
          <div className="form-group">
            <label className="form-label">
              Best Answer (Canonical) <span className="required">*</span>
              <span className="form-hint">The ideal answer shown to players when time runs out</span>
            </label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Paris"
              value={bestAnswer}
              onChange={(e) => setBestAnswer(e.target.value)}
              maxLength={200}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Question'}
            </button>
          </div>
        </form>

        <div className="contribute-guidelines">
          <h3>Submission Guidelines</h3>
          <ul>
            <li>Questions should have a single, clear correct answer</li>
            <li>Avoid questions with multiple possible correct answers</li>
            <li>Keep questions concise, aim for one sentence</li>
            <li>Add all reasonable answer variants (including abbreviations)</li>
            <li>Questions are reviewed by our team before going live</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ContributePage;
