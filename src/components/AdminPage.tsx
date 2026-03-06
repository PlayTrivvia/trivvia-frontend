import { useState, useEffect, useCallback } from 'react';
import './AdminPage.css';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
const ADMIN_TOKEN_KEY = 'trivvia_admin_token';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnswerOption {
  text: string;
  threshold: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  emoji: string;
}

interface Subcategory {
  id: number;
  category_id: number;
  name: string;
}

interface PendingQuestion {
  id: number;
  question_text: string;
  difficulty: string;
  answers_json: AnswerOption[];
  best_answer: string;
  category_id: number;
  category_name: string;
  subcategory_id?: number;
  subcategory_name?: string;
  contributed_by: string;
  contributor_username?: string;
  submitted_at: string;
  status: string;
  reviewed_at?: string;
  review_notes?: string;
}

interface TriviaQuestion {
  id: number;
  question_text: string;
  difficulty: string;
  category: string;
  answers_json: AnswerOption[];
  best_answer: string;
  source: string;
  category_id?: number;
  category_name?: string;
  subcategory_id?: number;
  subcategory_name?: string;
  contributed_by?: string;
  times_answered: number;
  times_correct: number;
  created_at: string;
  updated_at: string;
}

interface AdminUser {
  id: string;
  email: string;
  username?: string;
  verified: boolean;
  is_premium: boolean;
  premium_expires_at?: string;
  best_streak: number;
  created_at: string;
}

interface UserEditForm {
  username: string;
  is_premium: boolean;
  premium_expires_at: string;
}

type Tab = 'pending' | 'questions' | 'users';

const emptyAnswer = (): AnswerOption => ({ text: '', threshold: 0.8 });

const emptyQuestion = (): Partial<TriviaQuestion> => ({
  question_text: '',
  difficulty: 'medium',
  category: '',
  best_answer: '',
  answers_json: [emptyAnswer()],
  source: 'internal',
  category_id: undefined,
  subcategory_id: undefined,
});

// ─── Admin API helpers ────────────────────────────────────────────────────────

function adminFetch(path: string, token: string, options: RequestInit = {}) {
  return fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

// ─── Question Form (shared for create/edit/approve) ──────────────────────────

interface QuestionFormProps {
  initial: Partial<TriviaQuestion>;
  categories: Category[];
  subcategories: Subcategory[];
  onCategoryChange: (id: number | '') => void;
  onSave: (q: Partial<TriviaQuestion>) => void;
  onCancel: () => void;
  saving: boolean;
  saveLabel?: string;
}

function QuestionForm({ initial, categories, subcategories, onCategoryChange, onSave, onCancel, saving, saveLabel = 'Save' }: QuestionFormProps) {
  const [form, setForm] = useState<Partial<TriviaQuestion>>({ ...initial });

  useEffect(() => { setForm({ ...initial }); }, [initial.id]);

  const set = (field: keyof TriviaQuestion, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const setAnswer = (idx: number, field: keyof AnswerOption, value: string | number) =>
    setForm((f) => ({
      ...f,
      answers_json: (f.answers_json || []).map((a, i) => i === idx ? { ...a, [field]: value } : a),
    }));

  const addAnswer = () => {
    if ((form.answers_json || []).length >= 6) return;
    set('answers_json', [...(form.answers_json || []), emptyAnswer()]);
  };

  const removeAnswer = (idx: number) => {
    const updated = (form.answers_json || []).filter((_, i) => i !== idx);
    set('answers_json', updated.length ? updated : [emptyAnswer()]);
  };

  const handleCategoryChange = (val: string) => {
    const id = val ? Number(val) : ('' as '');
    set('category_id', id || undefined);
    set('subcategory_id', undefined);
    onCategoryChange(id);
    // Set category slug from the category list
    if (id) {
      const cat = categories.find((c) => c.id === id);
      if (cat) set('category', cat.slug);
    } else {
      set('category', '');
    }
  };

  return (
    <div className="qform">
      <div className="qform-grid">
        {/* Question text */}
        <div className="qform-group qform-full">
          <label className="qform-label">Question Text *</label>
          <textarea
            className="qform-textarea"
            value={form.question_text || ''}
            onChange={(e) => set('question_text', e.target.value)}
            rows={3}
            placeholder="Enter the question..."
          />
        </div>

        {/* Category */}
        <div className="qform-group">
          <label className="qform-label">Category *</label>
          <select
            className="qform-select"
            value={form.category_id || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
            ))}
          </select>
        </div>

        {/* Subcategory */}
        <div className="qform-group">
          <label className="qform-label">Subcategory</label>
          <select
            className="qform-select"
            value={form.subcategory_id || ''}
            onChange={(e) => set('subcategory_id', e.target.value ? Number(e.target.value) : undefined)}
            disabled={subcategories.length === 0}
          >
            <option value="">None</option>
            {subcategories.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div className="qform-group">
          <label className="qform-label">Difficulty *</label>
          <select
            className="qform-select"
            value={form.difficulty || 'medium'}
            onChange={(e) => set('difficulty', e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Source */}
        <div className="qform-group">
          <label className="qform-label">Source</label>
          <select
            className="qform-select"
            value={form.source || 'internal'}
            onChange={(e) => set('source', e.target.value)}
          >
            <option value="internal">Internal</option>
            <option value="ai_generated">AI Generated</option>
            <option value="user_contributed">User Contributed</option>
          </select>
        </div>

        {/* Best answer */}
        <div className="qform-group qform-full">
          <label className="qform-label">Best Answer (canonical) *</label>
          <input
            className="qform-input"
            type="text"
            value={form.best_answer || ''}
            onChange={(e) => set('best_answer', e.target.value)}
            placeholder="The ideal display answer shown to players"
          />
        </div>

        {/* Answers JSON */}
        <div className="qform-group qform-full">
          <label className="qform-label">
            Accepted Answers (answers_json) *
            <span className="qform-hint">Each variant that should be counted as correct</span>
          </label>
          <div className="qform-answers">
            {(form.answers_json || [emptyAnswer()]).map((ans, idx) => (
              <div key={idx} className="qform-answer-row">
                <input
                  className="qform-input"
                  type="text"
                  value={ans.text}
                  onChange={(e) => setAnswer(idx, 'text', e.target.value)}
                  placeholder={`Answer variant ${idx + 1}`}
                />
                <div className="qform-threshold">
                  <span className="qform-threshold-label">Match</span>
                  <select
                    className="qform-select qform-select-sm"
                    value={ans.threshold}
                    onChange={(e) => setAnswer(idx, 'threshold', Number(e.target.value))}
                  >
                    <option value={1.0}>100%</option>
                    <option value={0.9}>90%</option>
                    <option value={0.8}>80%</option>
                    <option value={0.7}>70%</option>
                  </select>
                </div>
                <button
                  type="button"
                  className="qform-remove-ans"
                  onClick={() => removeAnswer(idx)}
                  title="Remove"
                >×</button>
              </div>
            ))}
            <button type="button" className="qform-add-ans" onClick={addAnswer}>
              + Add answer variant
            </button>
          </div>
        </div>
      </div>

      <div className="qform-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="btn-primary" onClick={() => onSave(form)} disabled={saving}>
          {saving ? 'Saving…' : saveLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────

function AdminPage() {
  const [token, setToken] = useState<string>(() => localStorage.getItem(ADMIN_TOKEN_KEY) || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [tab, setTab] = useState<Tab>('pending');

  // ── Pending Questions state ──
  const [pendingQuestions, setPendingQuestions] = useState<PendingQuestion[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingStatus, setPendingStatus] = useState('pending');
  const [pendingOffset, setPendingOffset] = useState(0);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState('');

  // Approve modal
  const [approveTarget, setApproveTarget] = useState<PendingQuestion | null>(null);
  const [approveOverride, setApproveOverride] = useState<Partial<TriviaQuestion>>(emptyQuestion());
  const [approveSaving, setApproveSaving] = useState(false);
  const [approveError, setApproveError] = useState('');

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState<PendingQuestion | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejectSaving, setRejectSaving] = useState(false);
  const [rejectError, setRejectError] = useState('');

  // ── Main Questions state ──
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [questionsTotal, setQuestionsTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubcategoryId, setFilterSubcategoryId] = useState('');
  const [filterSubcategoryOptions, setFilterSubcategoryOptions] = useState<Subcategory[]>([]);
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [questionsOffset, setQuestionsOffset] = useState(0);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState('');

  // Create/Edit modal
  const [editTarget, setEditTarget] = useState<TriviaQuestion | null>(null);
  const [editIsNew, setEditIsNew] = useState(false);
  const [editForm, setEditForm] = useState<Partial<TriviaQuestion>>(emptyQuestion());
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<TriviaQuestion | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Users state ──
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersOffset, setUsersOffset] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  // Edit user modal
  const [editUserTarget, setEditUserTarget] = useState<AdminUser | null>(null);
  const [editUserForm, setEditUserForm] = useState<UserEditForm>({ username: '', is_premium: false, premium_expires_at: '' });
  const [editUserSaving, setEditUserSaving] = useState(false);
  const [editUserError, setEditUserError] = useState('');

  // Delete user confirm
  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUser | null>(null);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);

  // Shared category/subcategory data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [approveSubcategories, setApproveSubcategories] = useState<Subcategory[]>([]);
  const LIMIT = 20;

  // ── Load categories once ──
  useEffect(() => {
    fetch(`${apiBase}/categories`)
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  // ── Auth ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch(`${apiBase}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      setToken(data.token);
      setLoginPassword('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await adminFetch('/admin/logout', token, { method: 'POST' }).catch(() => {});
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken('');
  };

  // ── Pending Questions ──
  const loadPending = useCallback(async (status: string, offset: number) => {
    if (!token) return;
    setPendingLoading(true);
    setPendingError('');
    try {
      const res = await adminFetch(`/admin/pending_questions?status=${status}&limit=${LIMIT}&offset=${offset}`, token);
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPendingQuestions(data.questions || []);
      setPendingTotal(data.total || 0);
    } catch (err) {
      setPendingError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setPendingLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && tab === 'pending') loadPending(pendingStatus, pendingOffset);
  }, [token, tab, pendingStatus, pendingOffset]);

  const openApproveModal = (q: PendingQuestion) => {
    setApproveTarget(q);
    setApproveError('');
    const override: Partial<TriviaQuestion> = {
      question_text: q.question_text,
      difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
      category: categories.find((c) => c.id === q.category_id)?.slug || '',
      category_id: q.category_id,
      subcategory_id: q.subcategory_id,
      best_answer: q.best_answer,
      answers_json: q.answers_json,
      source: 'user_contributed',
    };
    setApproveOverride(override);
    // Load subcategories for the category
    if (q.category_id) {
      fetch(`${apiBase}/subcategories?category_id=${q.category_id}`)
        .then((r) => r.json())
        .then((d) => setApproveSubcategories(d.subcategories || []))
        .catch(() => setApproveSubcategories([]));
    }
  };

  const handleApprove = async (form: Partial<TriviaQuestion>) => {
    if (!approveTarget) return;
    setApproveSaving(true);
    setApproveError('');
    try {
      const res = await adminFetch(`/admin/pending_questions/${approveTarget.id}/approve`, token, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setApproveTarget(null);
      loadPending(pendingStatus, pendingOffset);
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setApproveSaving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setRejectSaving(true);
    setRejectError('');
    try {
      const res = await adminFetch(`/admin/pending_questions/${rejectTarget.id}/reject`, token, {
        method: 'PUT',
        body: JSON.stringify({ notes: rejectNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRejectTarget(null);
      setRejectNotes('');
      loadPending(pendingStatus, pendingOffset);
    } catch (err) {
      setRejectError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setRejectSaving(false);
    }
  };

  // ── Main Questions ──
  const loadQuestions = useCallback(async (s: string, catId: string, subCatId: string, diff: string, offset: number) => {
    if (!token) return;
    setQuestionsLoading(true);
    setQuestionsError('');
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
      if (s) params.set('search', s);
      if (catId) params.set('category_id', catId);
      if (subCatId) params.set('subcategory_id', subCatId);
      if (diff) params.set('difficulty', diff);
      const res = await adminFetch(`/admin/questions?${params}`, token);
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuestions(data.questions || []);
      setQuestionsTotal(data.total || 0);
    } catch (err) {
      setQuestionsError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setQuestionsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && tab === 'questions') loadQuestions(search, filterCategory, filterSubcategoryId, filterDifficulty, questionsOffset);
  }, [token, tab, questionsOffset]);

  // Load subcategories when category filter changes
  useEffect(() => {
    if (!filterCategory) { setFilterSubcategoryOptions([]); setFilterSubcategoryId(''); return; }
    fetch(`${apiBase}/subcategories?category_id=${filterCategory}`)
      .then((r) => r.json())
      .then((d) => setFilterSubcategoryOptions(d.subcategories || []))
      .catch(() => setFilterSubcategoryOptions([]));
    setFilterSubcategoryId('');
  }, [filterCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuestionsOffset(0);
    loadQuestions(search, filterCategory, filterSubcategoryId, filterDifficulty, 0);
  };

  const openEditModal = (q: TriviaQuestion) => {
    setEditIsNew(false);
    setEditTarget(q);
    setEditForm({ ...q });
    setEditError('');
    if (q.category_id) {
      fetch(`${apiBase}/subcategories?category_id=${q.category_id}`)
        .then((r) => r.json())
        .then((d) => setSubcategories(d.subcategories || []))
        .catch(() => setSubcategories([]));
    }
  };

  const openCreateModal = () => {
    setEditIsNew(true);
    setEditTarget(null);
    setEditForm(emptyQuestion());
    setEditError('');
    setSubcategories([]);
  };

  const handleSaveQuestion = async (form: Partial<TriviaQuestion>) => {
    setEditSaving(true);
    setEditError('');
    try {
      const body = {
        question_text: form.question_text,
        difficulty: form.difficulty,
        category: form.category,
        best_answer: form.best_answer,
        answers_json: (form.answers_json || []).filter((a) => a.text.trim()),
        source: form.source || 'internal',
        category_id: form.category_id || null,
        subcategory_id: form.subcategory_id || null,
      };

      let res: Response;
      if (editIsNew) {
        res = await adminFetch('/admin/questions', token, { method: 'POST', body: JSON.stringify(body) });
      } else {
        res = await adminFetch(`/admin/questions/${editTarget!.id}`, token, { method: 'PUT', body: JSON.stringify(body) });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditTarget(null);
      setEditIsNew(false);
      loadQuestions(search, filterCategory, filterSubcategoryId, filterDifficulty, questionsOffset);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await adminFetch(`/admin/questions/${deleteTarget.id}`, token, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setDeleteTarget(null);
      loadQuestions(search, filterCategory, filterSubcategoryId, filterDifficulty, questionsOffset);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubcategoryLoad = async (categoryID: number | '') => {
    if (!categoryID) { setSubcategories([]); return; }
    const res = await fetch(`${apiBase}/subcategories?category_id=${categoryID}`);
    const d = await res.json();
    setSubcategories(d.subcategories || []);
  };

  const handleApproveSubcategoryLoad = async (categoryID: number | '') => {
    if (!categoryID) { setApproveSubcategories([]); return; }
    const res = await fetch(`${apiBase}/subcategories?category_id=${categoryID}`);
    const d = await res.json();
    setApproveSubcategories(d.subcategories || []);
  };

  // ── Users ──
  const loadUsers = useCallback(async (search: string, offset: number) => {
    if (!token) return;
    setUsersLoading(true);
    setUsersError('');
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
      if (search) params.set('search', search);
      const res = await adminFetch(`/admin/users?${params}`, token);
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users || []);
      setUsersTotal(data.total || 0);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setUsersLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && tab === 'users') loadUsers(usersSearch, usersOffset);
  }, [token, tab, usersOffset]);

  const openEditUserModal = (u: AdminUser) => {
    setEditUserTarget(u);
    setEditUserError('');
    setEditUserForm({
      username: u.username || '',
      is_premium: u.is_premium,
      premium_expires_at: u.premium_expires_at
        ? new Date(u.premium_expires_at).toISOString().split('T')[0]
        : '',
    });
  };

  const handleSaveUser = async () => {
    if (!editUserTarget) return;
    setEditUserSaving(true);
    setEditUserError('');
    try {
      const body = {
        username: editUserForm.username || null,
        is_premium: editUserForm.is_premium,
        premium_expires_at: editUserForm.is_premium && editUserForm.premium_expires_at
          ? editUserForm.premium_expires_at
          : null,
      };
      const res = await adminFetch(`/admin/users/${editUserTarget.id}`, token, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditUserTarget(null);
      loadUsers(usersSearch, usersOffset);
    } catch (err) {
      setEditUserError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setEditUserSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserTarget) return;
    setDeleteUserLoading(true);
    try {
      const res = await adminFetch(`/admin/users/${deleteUserTarget.id}`, token, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setDeleteUserTarget(null);
      loadUsers(usersSearch, usersOffset);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleteUserLoading(false);
    }
  };

  const difficultyLabel = (d: string) => ({ easy: '🟢 Easy', medium: '🟡 Medium', hard: '🔴 Hard' }[d] || d);
  const statusBadge = (s: string) => ({
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
  }[s] || '');

  // ─── Not authenticated ────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-box">
          <div className="admin-login-logo">⚙️</div>
          <h1 className="admin-login-title">Trivvia Admin</h1>
          <p className="admin-login-sub">Enter your admin password to continue</p>
          <form onSubmit={handleLogin} className="admin-login-form">
            <input
              className="admin-login-input"
              type="password"
              placeholder="Admin password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              autoFocus
            />
            {loginError && <div className="admin-login-error">{loginError}</div>}
            <button className="admin-login-btn" type="submit" disabled={loginLoading}>
              {loginLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Authenticated ────────────────────────────────────────────────────────
  return (
    <div className="admin-page">
      {/* Top bar */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand">
            <span className="admin-brand-icon">⚙️</span>
            <span className="admin-brand-name">Trivvia Admin</span>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <main className="admin-main">
        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${tab === 'pending' ? 'active' : ''}`}
            onClick={() => setTab('pending')}
          >
            Pending Submissions
            {pendingTotal > 0 && tab !== 'pending' && (
              <span className="tab-count">{pendingTotal}</span>
            )}
          </button>
          <button
            className={`admin-tab ${tab === 'questions' ? 'active' : ''}`}
            onClick={() => setTab('questions')}
          >
            Question Manager
          </button>
          <button
            className={`admin-tab ${tab === 'users' ? 'active' : ''}`}
            onClick={() => setTab('users')}
          >
            Users
          </button>
        </div>

        {/* ─── Tab: Pending ──────────────────────────────────────────────── */}
        {tab === 'pending' && (
          <section className="admin-section">
            <div className="admin-section-header">
              <div className="section-title-row">
                <h2 className="section-title">Pending Submissions</h2>
                <span className="section-count">{pendingTotal} total</span>
              </div>
              <div className="filter-row">
                {(['pending', 'approved', 'rejected', ''] as const).map((s) => (
                  <button
                    key={s || 'all'}
                    className={`filter-btn ${pendingStatus === s ? 'active' : ''}`}
                    onClick={() => { setPendingStatus(s); setPendingOffset(0); }}
                  >
                    {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
                <button className="btn-icon" onClick={() => loadPending(pendingStatus, pendingOffset)} title="Refresh">↻</button>
              </div>
            </div>

            {pendingError && <div className="admin-error">{pendingError}</div>}
            {pendingLoading && <div className="admin-loading">Loading…</div>}

            {!pendingLoading && pendingQuestions.length === 0 && (
              <div className="admin-empty">No submissions found.</div>
            )}

            <div className="pending-list">
              {pendingQuestions.map((q) => (
                <div key={q.id} className="pending-card">
                  <div className="pending-card-top">
                    <div className="pending-meta">
                      <span className={`badge ${statusBadge(q.status)}`}>{q.status}</span>
                      <span className="pending-cat">{q.category_name}{q.subcategory_name ? ` › ${q.subcategory_name}` : ''}</span>
                      <span className={`diff-tag diff-${q.difficulty}`}>{q.difficulty}</span>
                    </div>
                    <div className="pending-info">
                      <span>By: <strong>{q.contributor_username || q.contributed_by.slice(0, 8)}</strong></span>
                      <span>{new Date(q.submitted_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <p className="pending-question">{q.question_text}</p>

                  <div className="pending-answers">
                    {q.answers_json.map((a, i) => (
                      <span key={i} className="answer-chip">{a.text} <em>({Math.round(a.threshold * 100)}%)</em></span>
                    ))}
                  </div>

                  <div className="pending-best">
                    Best answer: <strong>{q.best_answer}</strong>
                  </div>

                  {q.review_notes && (
                    <div className="pending-notes">Review notes: {q.review_notes}</div>
                  )}

                  {q.status === 'pending' && (
                    <div className="pending-actions">
                      <button className="btn-approve" onClick={() => openApproveModal(q)}>
                        ✓ Review & Approve
                      </button>
                      <button className="btn-reject" onClick={() => { setRejectTarget(q); setRejectNotes(''); setRejectError(''); }}>
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {pendingTotal > LIMIT && (
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={pendingOffset === 0}
                  onClick={() => setPendingOffset(Math.max(0, pendingOffset - LIMIT))}
                >← Prev</button>
                <span className="page-info">
                  {pendingOffset + 1}–{Math.min(pendingOffset + LIMIT, pendingTotal)} of {pendingTotal}
                </span>
                <button
                  className="page-btn"
                  disabled={pendingOffset + LIMIT >= pendingTotal}
                  onClick={() => setPendingOffset(pendingOffset + LIMIT)}
                >Next →</button>
              </div>
            )}
          </section>
        )}

        {/* ─── Tab: Questions ─────────────────────────────────────────────── */}
        {tab === 'questions' && (
          <section className="admin-section">
            <div className="admin-section-header">
              <div className="section-title-row">
                <h2 className="section-title">Question Manager</h2>
                <span className="section-count">{questionsTotal} questions</span>
              </div>

              {/* Search & filters */}
              <form className="search-bar" onSubmit={handleSearch}>
                <input
                  className="search-input"
                  type="text"
                  placeholder="Search questions…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="search-select"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                  ))}
                </select>
                <select
                  className="search-select"
                  value={filterSubcategoryId}
                  onChange={(e) => setFilterSubcategoryId(e.target.value)}
                  disabled={filterSubcategoryOptions.length === 0}
                >
                  <option value="">All subcategories</option>
                  {filterSubcategoryOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <select
                  className="search-select"
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                >
                  <option value="">All difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <button className="btn-primary" type="submit">Search</button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setSearch(''); setFilterCategory(''); setFilterSubcategoryId(''); setFilterSubcategoryOptions([]); setFilterDifficulty(''); setQuestionsOffset(0); loadQuestions('', '', '', '', 0); }}
                >
                  Clear
                </button>
              </form>

              <div className="section-actions">
                <button className="btn-primary" onClick={openCreateModal}>+ Add Question</button>
                <button className="btn-icon" onClick={() => loadQuestions(search, filterCategory, filterSubcategoryId, filterDifficulty, questionsOffset)} title="Refresh">↻</button>
              </div>
            </div>

            {questionsError && <div className="admin-error">{questionsError}</div>}
            {questionsLoading && <div className="admin-loading">Loading…</div>}
            {!questionsLoading && questions.length === 0 && (
              <div className="admin-empty">No questions found.</div>
            )}

            <div className="questions-table-wrap">
              {questions.length > 0 && (
                <table className="questions-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Question</th>
                      <th>Category</th>
                      <th>Difficulty</th>
                      <th>Source</th>
                      <th>Stats</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q) => (
                      <tr key={q.id}>
                        <td className="col-id">#{q.id}</td>
                        <td className="col-question">
                          <span className="q-text">{q.question_text}</span>
                          <span className="q-answer">→ {q.best_answer}</span>
                        </td>
                        <td className="col-cat">
                          {q.category_name || q.category}
                          {q.subcategory_name && <span className="sub-name"> › {q.subcategory_name}</span>}
                        </td>
                        <td className="col-diff">
                          <span className={`diff-tag diff-${q.difficulty}`}>{q.difficulty}</span>
                        </td>
                        <td className="col-source">
                          <span className={`source-tag source-${q.source}`}>{q.source.replace('_', ' ')}</span>
                        </td>
                        <td className="col-stats">
                          <span title="Times answered / correct">
                            {q.times_correct}/{q.times_answered}
                          </span>
                        </td>
                        <td className="col-actions">
                          <button className="btn-table-edit" onClick={() => openEditModal(q)}>Edit</button>
                          <button className="btn-table-delete" onClick={() => setDeleteTarget(q)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {questionsTotal > LIMIT && (
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={questionsOffset === 0}
                  onClick={() => { const o = Math.max(0, questionsOffset - LIMIT); setQuestionsOffset(o); loadQuestions(search, filterCategory, filterSubcategoryId, filterDifficulty, o); }}
                >← Prev</button>
                <span className="page-info">
                  {questionsOffset + 1}–{Math.min(questionsOffset + LIMIT, questionsTotal)} of {questionsTotal}
                </span>
                <button
                  className="page-btn"
                  disabled={questionsOffset + LIMIT >= questionsTotal}
                  onClick={() => { const o = questionsOffset + LIMIT; setQuestionsOffset(o); loadQuestions(search, filterCategory, filterSubcategoryId, filterDifficulty, o); }}
                >Next →</button>
              </div>
            )}
          </section>
        )}
        {/* ─── Tab: Users ─────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <section className="admin-section">
            <div className="admin-section-header">
              <div className="section-title-row">
                <h2 className="section-title">User Manager</h2>
                <span className="section-count">{usersTotal} users</span>
              </div>
              <form className="search-bar" onSubmit={(e) => { e.preventDefault(); setUsersOffset(0); loadUsers(usersSearch, 0); }}>
                <input
                  className="search-input"
                  type="text"
                  placeholder="Search by email or username…"
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                />
                <button className="btn-primary" type="submit">Search</button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setUsersSearch(''); setUsersOffset(0); loadUsers('', 0); }}
                >Clear</button>
                <button className="btn-icon" onClick={() => loadUsers(usersSearch, usersOffset)} type="button" title="Refresh">↻</button>
              </form>
            </div>

            {usersError && <div className="admin-error">{usersError}</div>}
            {usersLoading && <div className="admin-loading">Loading…</div>}
            {!usersLoading && users.length === 0 && (
              <div className="admin-empty">No users found.</div>
            )}

            <div className="questions-table-wrap">
              {users.length > 0 && (
                <table className="questions-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Username</th>
                      <th>Verified</th>
                      <th>Premium</th>
                      <th>Expires</th>
                      <th>Best Streak</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td style={{ fontSize: '0.8125rem', color: '#0f172a' }}>{u.email}</td>
                        <td style={{ fontSize: '0.8125rem', color: u.username ? '#0f172a' : '#94a3b8' }}>
                          {u.username || <em>none</em>}
                        </td>
                        <td>
                          <span className={`badge ${u.verified ? 'badge-approved' : 'badge-rejected'}`}>
                            {u.verified ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${u.is_premium ? 'badge-approved' : ''}`}
                            style={!u.is_premium ? { background: '#f1f5f9', color: '#94a3b8' } : {}}>
                            {u.is_premium ? 'Premium' : 'Free'}
                          </span>
                        </td>
                        <td className="col-stats">
                          {u.premium_expires_at
                            ? new Date(u.premium_expires_at).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="col-stats">{u.best_streak}</td>
                        <td className="col-stats">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="col-actions">
                          <button className="btn-table-edit" onClick={() => openEditUserModal(u)}>Edit</button>
                          <button className="btn-table-delete" onClick={() => setDeleteUserTarget(u)}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {usersTotal > LIMIT && (
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={usersOffset === 0}
                  onClick={() => { const o = Math.max(0, usersOffset - LIMIT); setUsersOffset(o); loadUsers(usersSearch, o); }}
                >← Prev</button>
                <span className="page-info">
                  {usersOffset + 1}–{Math.min(usersOffset + LIMIT, usersTotal)} of {usersTotal}
                </span>
                <button
                  className="page-btn"
                  disabled={usersOffset + LIMIT >= usersTotal}
                  onClick={() => { const o = usersOffset + LIMIT; setUsersOffset(o); loadUsers(usersSearch, o); }}
                >Next →</button>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ─── Approve Modal ──────────────────────────────────────────────────── */}
      {approveTarget && (
        <div className="modal-overlay" onClick={() => !approveSaving && setApproveTarget(null)}>
          <div className="modal-box modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Review & Approve — #{approveTarget.id}</h3>
              <button className="modal-close" onClick={() => setApproveTarget(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="approve-original">
                <strong>Original submission:</strong>
                <p className="approve-orig-q">{approveTarget.question_text}</p>
                <p className="approve-orig-meta">
                  {approveTarget.category_name} · {approveTarget.difficulty} · by {approveTarget.contributor_username || approveTarget.contributed_by.slice(0, 8)}
                </p>
              </div>
              <p className="modal-divider-label">Edit before approving (all fields go into the main database):</p>
              {approveError && <div className="admin-error">{approveError}</div>}
              <QuestionForm
                initial={approveOverride}
                categories={categories}
                subcategories={approveSubcategories}
                onCategoryChange={handleApproveSubcategoryLoad}
                onSave={handleApprove}
                onCancel={() => setApproveTarget(null)}
                saving={approveSaving}
                saveLabel="Approve & Insert"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Reject Modal ───────────────────────────────────────────────────── */}
      {rejectTarget && (
        <div className="modal-overlay" onClick={() => !rejectSaving && setRejectTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Question #{rejectTarget.id}</h3>
              <button className="modal-close" onClick={() => setRejectTarget(null)}>×</button>
            </div>
            <div className="modal-body">
              <p className="reject-question-preview">"{rejectTarget.question_text}"</p>
              <label className="qform-label">Feedback for contributor (optional)</label>
              <textarea
                className="qform-textarea"
                rows={3}
                placeholder="Explain why this question was rejected…"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
              />
              {rejectError && <div className="admin-error">{rejectError}</div>}
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setRejectTarget(null)} disabled={rejectSaving}>Cancel</button>
                <button className="btn-danger" onClick={handleReject} disabled={rejectSaving}>
                  {rejectSaving ? 'Rejecting…' : 'Reject Question'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Create/Edit Modal ──────────────────────────────────────────────── */}
      {(editIsNew || editTarget !== null) && (
        <div className="modal-overlay" onClick={() => !editSaving && (setEditTarget(null), setEditIsNew(false))}>
          <div className="modal-box modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editIsNew ? 'Add New Question' : `Edit Question #${editTarget?.id}`}</h3>
              <button className="modal-close" onClick={() => { setEditTarget(null); setEditIsNew(false); }}>×</button>
            </div>
            <div className="modal-body">
              {editError && <div className="admin-error">{editError}</div>}
              <QuestionForm
                initial={editForm}
                categories={categories}
                subcategories={subcategories}
                onCategoryChange={handleSubcategoryLoad}
                onSave={handleSaveQuestion}
                onCancel={() => { setEditTarget(null); setEditIsNew(false); }}
                saving={editSaving}
                saveLabel={editIsNew ? 'Create Question' : 'Save Changes'}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm ─────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => !deleteLoading && setDeleteTarget(null)}>
          <div className="modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Question</h3>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}>×</button>
            </div>
            <div className="modal-body">
              <p className="delete-preview">"{deleteTarget.question_text}"</p>
              <p className="delete-warning">This action cannot be undone.</p>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>Cancel</button>
                <button className="btn-danger" onClick={handleDeleteQuestion} disabled={deleteLoading}>
                  {deleteLoading ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit User Modal ────────────────────────────────────────────────── */}
      {editUserTarget && (
        <div className="modal-overlay" onClick={() => !editUserSaving && setEditUserTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User</h3>
              <button className="modal-close" onClick={() => setEditUserTarget(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.8125rem', color: '#475569', marginBottom: '1.25rem' }}>
                {editUserTarget.email}
              </p>

              <div className="qform-group" style={{ marginBottom: '1rem' }}>
                <label className="qform-label">Username</label>
                <input
                  className="qform-input"
                  type="text"
                  placeholder="Leave blank to remove username"
                  value={editUserForm.username}
                  onChange={(e) => setEditUserForm((f) => ({ ...f, username: e.target.value }))}
                />
              </div>

              <div className="qform-group" style={{ marginBottom: '1rem' }}>
                <label className="qform-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editUserForm.is_premium}
                    onChange={(e) => setEditUserForm((f) => ({ ...f, is_premium: e.target.checked }))}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  Premium member
                </label>
              </div>

              {editUserForm.is_premium && (
                <div className="qform-group" style={{ marginBottom: '1rem' }}>
                  <label className="qform-label">Premium Expires At</label>
                  <input
                    className="qform-input"
                    type="date"
                    value={editUserForm.premium_expires_at}
                    onChange={(e) => setEditUserForm((f) => ({ ...f, premium_expires_at: e.target.value }))}
                  />
                  <span className="qform-hint">Leave blank for no expiry</span>
                </div>
              )}

              {editUserError && <div className="admin-error" style={{ margin: '0 0 1rem' }}>{editUserError}</div>}

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setEditUserTarget(null)} disabled={editUserSaving}>Cancel</button>
                <button className="btn-primary" onClick={handleSaveUser} disabled={editUserSaving}>
                  {editUserSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete User Confirm ─────────────────────────────────────────────── */}
      {deleteUserTarget && (
        <div className="modal-overlay" onClick={() => !deleteUserLoading && setDeleteUserTarget(null)}>
          <div className="modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Remove User</h3>
              <button className="modal-close" onClick={() => setDeleteUserTarget(null)}>×</button>
            </div>
            <div className="modal-body">
              <p className="delete-preview">{deleteUserTarget.email}</p>
              <p className="delete-warning">This permanently deletes the account and all associated data.</p>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setDeleteUserTarget(null)} disabled={deleteUserLoading}>Cancel</button>
                <button className="btn-danger" onClick={handleDeleteUser} disabled={deleteUserLoading}>
                  {deleteUserLoading ? 'Removing…' : 'Remove User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
