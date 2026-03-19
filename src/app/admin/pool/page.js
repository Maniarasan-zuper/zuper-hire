'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Database, Plus, Trash2, CheckCircle, AlertTriangle, X, ArrowLeft, Pencil, Eye, TestTube, FileCode2, Save } from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────
const diffColor = (d) => d === 'Easy' ? '#34d399' : d === 'Medium' ? '#fbbf24' : '#f87171';
const diffBg = (d) => d === 'Easy' ? 'rgba(16,185,129,0.12)' : d === 'Medium' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
const diffBdr = (d) => d === 'Easy' ? 'rgba(16,185,129,0.3)' : d === 'Medium' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)';

function DiffBadge({ d }) {
    return <span style={{ fontSize: 11, fontWeight: 700, color: diffColor(d), background: diffBg(d), padding: '3px 9px', borderRadius: 99, border: `1px solid ${diffBdr(d)}` }}>{d}</span>;
}
function CatBadge({ c }) {
    return <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'rgba(139,92,246,0.12)', padding: '3px 9px', borderRadius: 99, border: '1px solid rgba(139,92,246,0.25)' }}>{c}</span>;
}
function SectionLabel({ children }) {
    return <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', opacity: 0.45, marginBottom: 7 }}>{children}</div>;
}

const CATEGORIES = ['JavaScript', 'React', 'Node.js', 'SQL', 'Python', 'Java', 'DSA', 'Strings', 'Arrays', 'Math', 'Sorting', 'System Design', 'General IQ', 'Problem Solving'];

// ── Toast ────────────────────────────────────────────────
function useToast() {
    const [toasts, setToasts] = useState([]);
    const show = (msg, type = 'info') => {
        const id = Date.now();
        setToasts(t => [...t, { id, msg, type }]);
        setTimeout(() => {
            setToasts(t => t.map(x => x.id === id ? { ...x, hiding: true } : x));
            setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 350);
        }, 3200);
    };
    return { toasts, show };
}
function ToastContainer({ toasts }) {
    const icons = { success: <CheckCircle size={15} />, error: <AlertTriangle size={15} />, info: <span style={{ fontWeight: 700 }}>i</span> };
    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast-${t.type} ${t.hiding ? 'hiding' : ''}`}>
                    {icons[t.type]} {t.msg}
                </div>
            ))}
        </div>
    );
}

// ── Generic Confirm Modal ────────────────────────────────
function ConfirmModal({ icon, iconBg, iconColor = '#f87171', title, message, confirmLabel = 'Confirm', confirmClass = 'danger-btn button', children, onConfirm, onCancel }) {
    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div className="modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: iconBg || 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {icon || <AlertTriangle size={20} color={iconColor} />}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{title}</h3>
                        <p style={{ fontSize: 14, opacity: 0.6, lineHeight: 1.6 }}>{message}</p>
                        {children}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} className="button outline" style={{ padding: '9px 18px', fontSize: 13 }}>Cancel</button>
                    <button onClick={onConfirm} className={confirmClass} style={{ padding: '9px 18px', fontSize: 13 }}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
}

// ── Question Detail View Modal ────────────────────────────
function DetailModal({ q, onClose, onEdit }) {
    const tcs = q.test_cases || [];
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: 900, maxHeight: '90vh',
                    display: 'flex', flexDirection: 'column',
                    background: 'rgba(10,14,26,0.97)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 18, boxShadow: '0 40px 80px rgba(0,0,0,0.7)', overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{ padding: '22px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, background: 'rgba(255,255,255,0.02)', flexShrink: 0 }}>
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 10 }}>{q.title}</h2>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 10, fontWeight: 800, background: q.question_type === 'mcq' ? 'rgba(167,139,250,0.15)' : 'rgba(59,130,246,0.15)', color: q.question_type === 'mcq' ? '#a78bfa' : '#60a5fa', padding: '3px 8px', borderRadius: 6, border: `1px solid ${q.question_type === 'mcq' ? 'rgba(167,139,250,0.3)' : 'rgba(59,130,246,0.3)'}` }}>
                                {q.question_type?.toUpperCase() || 'CODING'}
                            </div>
                            <DiffBadge d={q.difficulty} />
                            <CatBadge c={q.category} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', background: 'rgba(59,130,246,0.1)', padding: '3px 9px', borderRadius: 99, border: '1px solid rgba(59,130,246,0.25)', fontFamily: 'var(--font-mono)' }}>
                                {q.question_type === 'mcq' ? `${(q.options || []).length} options` : `${tcs.length} cases`}
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                        <button onClick={onEdit} className="button outline" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', fontSize: 13, color: '#fbbf24', borderColor: 'rgba(245,158,11,0.3)' }}>
                            <Pencil size={14} /> Edit
                        </button>
                        <button onClick={onClose} className="button outline" style={{ padding: '9px 12px' }}><X size={16} /></button>
                    </div>
                </div>

                {/* Two-column body */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden' }}>
                    {/* Left */}
                    <div style={{ padding: '24px 28px', overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                        <SectionLabel>Problem Description</SectionLabel>
                        <div style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 24 }}>
                            {q.description}
                        </div>

                        {q.question_type === 'mcq' ? (
                            <>
                                <SectionLabel>Multiple Choice Options</SectionLabel>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {(q.options || []).map((opt, i) => (
                                        <div key={i} style={{ padding: '12px 14px', background: opt === q.correct_answer ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.3)', border: opt === q.correct_answer ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 9, display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <div style={{ width: 22, height: 22, borderRadius: 11, background: opt === q.correct_answer ? '#10b981' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: opt === q.correct_answer ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                            <span style={{ fontSize: 14, color: opt === q.correct_answer ? '#34d399' : 'rgba(255,255,255,0.8)', fontWeight: opt === q.correct_answer ? 600 : 400 }}>{opt}</span>
                                            {opt === q.correct_answer && <CheckCircle size={14} style={{ marginLeft: 'auto' }} color="#10b981" />}
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <SectionLabel><TestTube size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />Test Cases ({tcs.length})</SectionLabel>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {tcs.map((tc, i) => (
                                        <div key={i} style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                                            <div style={{ marginBottom: 8 }}>
                                                <span style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', background: 'rgba(59,130,246,0.12)', padding: '2px 8px', borderRadius: 6 }}>Case {i + 1}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: '5px 10px' }}>
                                                <span style={{ opacity: 0.45, fontSize: 12 }}>Input</span>
                                                <span style={{ color: '#93c5fd', wordBreak: 'break-all' }}>{tc.input}</span>
                                                <span style={{ opacity: 0.45, fontSize: 12 }}>Expected</span>
                                                <span style={{ color: '#6ee7b7', wordBreak: 'break-all' }}>{tc.expectedOutput}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right: starter code */}
                    <div style={{ padding: '24px 28px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)' }}>
                        {q.question_type === 'mcq' ? (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: 0.3, textAlign: 'center' }}>
                                <Database size={48} style={{ marginBottom: 16 }} />
                                <div style={{ fontWeight: 700 }}>MCQ Assessment</div>
                                <div style={{ fontSize: 12 }}>No starter code required</div>
                            </div>
                        ) : (
                            <>
                                <SectionLabel><FileCode2 size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />Candidate Starter Code</SectionLabel>
                                <pre style={{ padding: '16px 18px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre', color: '#e2e8f0', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)' }}>
                                    {q.default_code}
                                </pre>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '14px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'rgba(255,255,255,0.015)', flexShrink: 0 }}>
                    <button onClick={onEdit} className="button" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', fontSize: 13, background: 'linear-gradient(135deg,#f59e0b,#d97706)', fontWeight: 700 }}>
                        <Pencil size={14} /> Edit Question
                    </button>
                    <button onClick={onClose} className="button outline" style={{ padding: '9px 20px', fontSize: 13 }}>Close</button>
                </div>
            </div>
        </div>
    );
}

// ── Edit Question Modal ───────────────────────────────────
function EditModal({ q, onSave, onCancel, saving }) {
    const [form, setForm] = useState({
        title: q.title,
        description: q.description,
        question_type: q.question_type || 'coding',
        default_code: q.default_code || '',
        test_cases: JSON.stringify(q.test_cases || [], null, 2),
        options: JSON.stringify(q.options || [], null, 2),
        correct_answer: q.correct_answer || '',
        difficulty: q.difficulty,
        category: q.category,
    });
    const [jsonError, setJsonError] = useState('');

    const handleSave = () => {
        try {
            const up = { ...form };
            if (form.question_type === 'coding') {
                up.test_cases = JSON.parse(form.test_cases);
                up.options = [];
                up.correct_answer = '';
            } else {
                up.options = JSON.parse(form.options);
                up.test_cases = [];
                up.default_code = '';
            }
            setJsonError('');
            onSave(up);
        } catch {
            setJsonError('Invalid JSON array. Please check your syntax.');
        }
    };

    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: 780, maxHeight: '92vh',
                    display: 'flex', flexDirection: 'column',
                    background: 'rgba(10,14,26,0.97)', border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 18, boxShadow: '0 40px 80px rgba(0,0,0,0.7)', overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(245,158,11,0.04)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Pencil size={17} color="#fbbf24" />
                        </div>
                        <div>
                            <h2 style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.3px' }}>Edit Question</h2>
                            <p style={{ fontSize: 12, opacity: 0.45, marginTop: 2 }}>Changes will be reflected across all campaigns using this question.</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="button outline" style={{ padding: '8px 12px' }}><X size={16} /></button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                        <SectionLabel>Title</SectionLabel>
                        <input type="text" className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Question title" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                        <div>
                            <SectionLabel>Type</SectionLabel>
                            <select className="input" value={form.question_type} onChange={e => setForm({ ...form, question_type: e.target.value })}>
                                <option value="coding">Coding</option>
                                <option value="mcq">MCQ</option>
                            </select>
                        </div>
                        <div>
                            <SectionLabel>Difficulty</SectionLabel>
                            <select className="input" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                                {['Easy', 'Medium', 'Hard'].map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <SectionLabel>Category</SectionLabel>
                            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <SectionLabel>Problem Description</SectionLabel>
                        <textarea className="input" rows="5" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the problem in detail…" style={{ lineHeight: 1.7 }} />
                    </div>

                    {form.question_type === 'coding' ? (
                        <>
                            <div>
                                <SectionLabel>Starter Code</SectionLabel>
                                <textarea className="input font-mono" rows="3" value={form.default_code} onChange={e => setForm({ ...form, default_code: e.target.value })} style={{ fontSize: 13, lineHeight: 1.6 }} />
                            </div>
                            <div>
                                <SectionLabel>Test Cases <span style={{ color: '#60a5fa', textTransform: 'none', letterSpacing: 0 }}>(JSON array)</span></SectionLabel>
                                <textarea className="input font-mono" rows="4" value={form.test_cases} onChange={e => { setForm({ ...form, test_cases: e.target.value }); setJsonError(''); }} style={{ fontSize: 12, lineHeight: 1.6 }} />
                                {jsonError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{jsonError}</p>}
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <SectionLabel>Options <span style={{ color: '#a78bfa', textTransform: 'none', letterSpacing: 0 }}>(JSON array)</span></SectionLabel>
                                <textarea className="input font-mono" rows="3" value={form.options} onChange={e => { setForm({ ...form, options: e.target.value }); setJsonError(''); }} style={{ fontSize: 13, lineHeight: 1.6 }} />
                                {jsonError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{jsonError}</p>}
                            </div>
                            <div>
                                <SectionLabel>Correct Answer</SectionLabel>
                                <input type="text" className="input" value={form.correct_answer} onChange={e => setForm({ ...form, correct_answer: e.target.value })} placeholder="Exact string matching one option" />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'rgba(255,255,255,0.015)', flexShrink: 0 }}>
                    <button onClick={onCancel} className="button outline" style={{ padding: '10px 20px', fontSize: 13 }}>Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="button" style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', gap: 7 }}>
                        {saving ? <><div className="spinner sm" /> Saving…</> : <><Save size={14} /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Add-to-pool confirm preview ───────────────────────────
function AddConfirmModal({ form, onConfirm, onCancel }) {
    return (
        <ConfirmModal
            icon={<Plus size={18} color="#34d399" />}
            iconBg="rgba(16,185,129,0.12)"
            iconColor="#34d399"
            title="Add to Question Pool?"
            confirmLabel="Yes, Add to Pool"
            confirmClass="button success"
            onConfirm={onConfirm}
            onCancel={onCancel}
        >
            <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                    { label: 'Title', value: form.title },
                    { label: 'Type', value: form.question_type?.toUpperCase() || 'CODING' },
                    { label: 'Difficulty', value: form.difficulty },
                    { label: 'Category', value: form.category },
                    {
                        label: 'Payload', value: form.question_type === 'mcq'
                            ? (() => { try { return `${JSON.parse(form.options).length} options`; } catch { return 'Err'; } })()
                            : (() => { try { return `${JSON.parse(form.test_cases).length} cases`; } catch { return 'Err'; } })()
                    },
                ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ opacity: 0.45, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{r.label}</span>
                        <span style={{ fontWeight: 600 }}>{r.value}</span>
                    </div>
                ))}
            </div>
        </ConfirmModal>
    );
}


export default function PoolManage() {
    const [pool, setPool] = useState([]);
    const [deleteId, setDeleteId] = useState(null);
    const [detailQ, setDetailQ] = useState(null);
    const [editQ, setEditQ] = useState(null);
    const [saving, setSaving] = useState(false);
    const [adding, setAdding] = useState(false);
    const [confirmAdd, setConfirmAdd] = useState(false);
    const [search, setSearch] = useState('');
    const [filterDiff, setFilterDiff] = useState('All');
    const [filterCat, setFilterCat] = useState('All');
    const { toasts, show } = useToast();

    const emptyForm = {
        title: '', description: '',
        question_type: 'coding',
        default_code: 'function solution(input) {\n  // Your code here\n  return input;\n}',
        test_cases: '[{"input": "1", "expectedOutput": "1"}]',
        options: '["Option A", "Option B", "Option C", "Option D"]',
        correct_answer: 'Option A',
        difficulty: 'Easy', category: 'Problem Solving'
    };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        fetch('/api/admin/pool').then(r => r.json()).then(d => setPool(d.pool || []));
    }, []);

    const handleAddSubmit = (e) => {
        e.preventDefault();
        try {
            if (form.question_type === 'coding') JSON.parse(form.test_cases);
            else JSON.parse(form.options);
        } catch { show('Invalid JSON in test cases or options.', 'error'); return; }
        if (!form.title.trim() || !form.description.trim()) { show('Title and description are required.', 'error'); return; }
        setConfirmAdd(true);
    };

    const doAddQuestion = async () => {
        setConfirmAdd(false);
        setAdding(true);
        try {
            const payload = { ...form };
            if (form.question_type === 'coding') {
                payload.test_cases = JSON.parse(form.test_cases);
                payload.options = [];
                payload.correct_answer = '';
            } else {
                payload.options = JSON.parse(form.options);
                payload.test_cases = [];
                payload.default_code = '';
            }

            const res = await fetch('/api/admin/pool', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await fetch('/api/admin/pool').then(r => r.json());
                setPool(data.pool || []);
                setForm(emptyForm);
                show(`"${form.title}" added to pool!`, 'success');
            }
        } catch { show('Failed to add question.', 'error'); }
        finally { setAdding(false); }
    };

    const doDeleteQuestion = async (qId) => {
        const res = await fetch(`/api/admin/pool/${qId}`, { method: 'DELETE' });
        if (res.ok) { setPool(prev => prev.filter(q => q.id !== qId)); show('Question deleted.', 'info'); }
        else show('Failed to delete question.', 'error');
        setDeleteId(null);
    };

    const doEditQuestion = async (updated) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/pool/${editQ.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...updated, test_cases: updated.test_cases })
            });
            if (res.ok) {
                setPool(prev => prev.map(q => q.id === editQ.id ? { ...q, ...updated } : q));
                show('Question updated!', 'success');
                setEditQ(null);
                setDetailQ(null);
            } else { show('Failed to save changes.', 'error'); }
        } catch { show('Error saving question.', 'error'); }
        finally { setSaving(false); }
    };

    const [filterType, setFilterType] = useState('All');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    const filtered = pool.filter(q => {
        const ms = !search || q.title.toLowerCase().includes(search.toLowerCase()) || q.description.toLowerCase().includes(search.toLowerCase());
        const md = filterDiff === 'All' || q.difficulty === filterDiff;
        const mt = filterType === 'All' || q.question_type === (filterType === 'MCQ' ? 'mcq' : 'coding');
        const mc = filterCat === 'All' || q.category === filterCat;
        return ms && md && mt && mc;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="container">
            <ToastContainer toasts={toasts} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <Database size={22} color="#8b5cf6" />
                        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Global Question Pool
                        </h1>
                    </div>
                    <p style={{ fontSize: 14, opacity: 0.45 }}>Reusable questions that can be added to any campaign</p>
                </div>
                <Link href="/admin">
                    <button className="button outline" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <ArrowLeft size={14} /> Admin
                    </button>
                </Link>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, marginBottom: 28 }}>
                {[{ label: 'Total', value: pool.length, color: '#8b5cf6' }, { label: 'Easy', value: pool.filter(q => q.difficulty === 'Easy').length, color: '#34d399' }, { label: 'Medium', value: pool.filter(q => q.difficulty === 'Medium').length, color: '#fbbf24' }, { label: 'Hard', value: pool.filter(q => q.difficulty === 'Hard').length, color: '#f87171' }].map(s => (
                    <div key={s.label} className="stat-card" style={{ padding: '14px 16px', borderTop: `3px solid ${s.color}` }}>
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-value" style={{ color: s.color, fontSize: 24 }}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {/* Add Question Form */}
                <div style={{ flex: '1 1 280px', maxWidth: 380 }}>
                    <div className="card glass-panel" style={{ position: 'sticky', top: 24 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Plus size={18} color="var(--primary)" /> Add New Question
                        </h2>
                        <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <SectionLabel>Type</SectionLabel>
                                    <select className="input" value={form.question_type} onChange={e => setForm({ ...form, question_type: e.target.value })}>
                                        <option value="coding">Coding</option>
                                        <option value="mcq">MCQ</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <SectionLabel>Difficulty</SectionLabel>
                                    <select className="input" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                                        {['Easy', 'Medium', 'Hard'].map(d => <option key={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <SectionLabel>Category</SectionLabel>
                                <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <SectionLabel>Description</SectionLabel>
                                <textarea className="input" rows="2" placeholder="Detailed problem description…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                            </div>
                            {form.question_type === 'coding' ? (
                                <>
                                    <div>
                                        <SectionLabel>Starter Code</SectionLabel>
                                        <textarea className="input font-mono" style={{ fontSize: 12 }} rows="2" value={form.default_code} onChange={e => setForm({ ...form, default_code: e.target.value })} required />
                                    </div>
                                    <div>
                                        <SectionLabel>Test Cases <span style={{ color: '#60a5fa', textTransform: 'none', letterSpacing: 0 }}>(JSON)</span></SectionLabel>
                                        <textarea className="input font-mono" style={{ fontSize: 11 }} rows="2" value={form.test_cases} onChange={e => setForm({ ...form, test_cases: e.target.value })} required />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <SectionLabel>Options <span style={{ color: '#a78bfa', textTransform: 'none', letterSpacing: 0 }}>(JSON)</span></SectionLabel>
                                        <textarea className="input font-mono" style={{ fontSize: 12 }} rows="2" value={form.options} onChange={e => setForm({ ...form, options: e.target.value })} required />
                                    </div>
                                    <div>
                                        <SectionLabel>Correct Answer</SectionLabel>
                                        <input type="text" className="input" value={form.correct_answer} onChange={e => setForm({ ...form, correct_answer: e.target.value })} placeholder="Exact text" required />
                                    </div>
                                </>
                            )}
                            <button type="submit" className="button success" style={{ marginTop: 4, fontWeight: 700 }} disabled={adding}>
                                {adding ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><div className="spinner" /> Adding…</span> : <><Plus size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Add to Pool</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Pool List */}
                <div style={{ flex: '2 1 360px' }}>
                    {/* Search + filter */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                        <input type="text" className="input" placeholder="Search questions…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, minWidth: 150, fontSize: 13 }} />
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {['All', 'Easy', 'Medium', 'Hard'].map(d => {
                                const c = d === 'All' ? '#a78bfa' : diffColor(d);
                                const active = filterDiff === d;
                                return (
                                    <button key={d} onClick={() => { setFilterDiff(d); setPage(1); }} style={{ padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${active ? c + '60' : 'rgba(255,255,255,0.08)'}`, background: active ? c + '20' : 'rgba(255,255,255,0.04)', color: active ? c : 'rgba(255,255,255,0.45)', transition: 'all 0.15s' }}>{d}</button>
                                );
                            })}
                        </div>
                        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
                        <div style={{ display: 'flex', gap: 6 }}>
                            {['All', 'Coding', 'MCQ'].map(t => {
                                const active = filterType === t;
                                return (
                                    <button key={t} onClick={() => { setFilterType(t); setPage(1); }} style={{ padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${active ? '#60a5fa' : 'rgba(255,255,255,0.08)'}`, background: active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)', color: active ? '#60a5fa' : 'rgba(255,255,255,0.45)', transition: 'all 0.15s' }}>{t}</button>
                                );
                            })}
                        </div>
                        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, opacity: 0.4, fontWeight: 700 }}>CAT:</span>
                            <select
                                className="input"
                                value={filterCat}
                                onChange={e => { setFilterCat(e.target.value); setPage(1); }}
                                style={{ padding: '4px 8px', fontSize: 11, width: 'auto', minWidth: 110, height: 32, border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                {['All', ...CATEGORIES].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.35, marginBottom: 12 }}>{filtered.length} of {pool.length} questions{totalPages > 1 && ` — page ${page} of ${totalPages}`}</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {paginated.map(q => (
                            <div key={q.id} className="card" style={{ padding: '18px 20px', borderLeft: `4px solid ${diffColor(q.difficulty)}` }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                            <div style={{ fontSize: 10, fontWeight: 800, background: q.question_type === 'mcq' ? 'rgba(167,139,250,0.15)' : 'rgba(59,130,246,0.15)', color: q.question_type === 'mcq' ? '#a78bfa' : '#60a5fa', padding: '3px 8px', borderRadius: 6, border: `1px solid ${q.question_type === 'mcq' ? 'rgba(167,139,250,0.3)' : 'rgba(59,130,246,0.3)'}` }}>
                                                {q.question_type?.toUpperCase() || 'CODING'}
                                            </div>
                                            <DiffBadge d={q.difficulty} />
                                            <CatBadge c={q.category} />
                                        </div>
                                        <p style={{ fontSize: 13, opacity: 0.6, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 10 }}>
                                            {q.description}
                                        </p>
                                        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.35 }}>
                                            {q.question_type === 'mcq' ? `${(q.options || []).length} options` : `${(q.test_cases || []).length} test cases`}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                                        <button
                                            onClick={() => setDetailQ(q)}
                                            className="button outline"
                                            style={{ padding: '7px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
                                            title="View details"
                                        >
                                            <Eye size={13} /> View
                                        </button>
                                        <button
                                            onClick={() => setEditQ(q)}
                                            className="button outline"
                                            style={{ padding: '7px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, color: '#fbbf24', borderColor: 'rgba(245,158,11,0.3)' }}
                                            title="Edit question"
                                        >
                                            <Pencil size={13} /> Edit
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(q.id)}
                                            className="danger-btn button"
                                            style={{ padding: '7px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
                                            title="Delete"
                                        >
                                            <Trash2 size={13} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div style={{ border: '2px dashed rgba(255,255,255,0.06)', borderRadius: 12, padding: '48px 24px', textAlign: 'center', opacity: 0.4 }}>
                                <Database size={32} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>{pool.length === 0 ? 'Pool is empty' : 'No matches'}</div>
                                <div style={{ fontSize: 13 }}>{pool.length === 0 ? 'Add your first question using the form.' : 'Try a different search or filter.'}</div>
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="button outline" style={{ padding: '6px 14px', fontSize: 13, opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)} className="button outline" style={{ padding: '6px 12px', fontSize: 13, minWidth: 36, background: p === page ? 'rgba(139,92,246,0.2)' : undefined, borderColor: p === page ? '#8b5cf6' : undefined, color: p === page ? '#a78bfa' : undefined }}>{p}</button>
                            ))}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="button outline" style={{ padding: '6px 14px', fontSize: 13, opacity: page === totalPages ? 0.4 : 1 }}>Next →</button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Confirm Add to Pool ── */}
            {confirmAdd && (
                <AddConfirmModal form={form} onConfirm={doAddQuestion} onCancel={() => setConfirmAdd(false)} />
            )}

            {/* ── Confirm Delete ── */}
            {deleteId && (
                <ConfirmModal
                    title="Delete Question"
                    message="Permanently delete this question from the pool? It will no longer be available to add to campaigns. This cannot be undone."
                    confirmLabel="Delete Permanently"
                    onConfirm={() => doDeleteQuestion(deleteId)}
                    onCancel={() => setDeleteId(null)}
                />
            )}

            {/* ── Detail View ── */}
            {detailQ && !editQ && (
                <DetailModal
                    q={detailQ}
                    onClose={() => setDetailQ(null)}
                    onEdit={() => setEditQ(detailQ)}
                />
            )}

            {/* ── Edit Modal ── */}
            {editQ && (
                <EditModal
                    q={editQ}
                    saving={saving}
                    onSave={doEditQuestion}
                    onCancel={() => setEditQ(null)}
                />
            )}
        </div>
    );
}
