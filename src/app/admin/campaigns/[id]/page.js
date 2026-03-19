'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
    Copy, Plus, DownloadCloud, Users, ArrowLeft,
    Trash2, CheckCircle, AlertTriangle, X, Search,
    Eye, FileCode2, TestTube, ChevronRight, BarChart2,
    ChevronUp, Activity, Mail, RotateCcw, UserPlus, Shield
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

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
    return <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', opacity: 0.45, marginBottom: 8 }}>{children}</div>;
}

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
    const icons = { success: <CheckCircle size={15} />, error: <AlertTriangle size={15} />, info: <span style={{ fontWeight: 700 }}>i</span>, warning: <AlertTriangle size={15} /> };
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

// ── Confirm modal ────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel = 'Confirm', confirmClass = 'danger-btn button', onConfirm, onCancel }) {
    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle size={20} color="#f87171" />
                    </div>
                    <div>
                        <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{title}</h3>
                        <p style={{ fontSize: 14, opacity: 0.6, lineHeight: 1.6 }}>{message}</p>
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

// ── Pool Detail Modal ────────────────────────────────────
function PoolDetailModal({ question, alreadyAdded, onAdd, onClose }) {
    if (!question) return null;
    const tcs = question.test_cases || [];
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: 900, maxHeight: '90vh',
                    display: 'flex', flexDirection: 'column',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 18, boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
                    overflow: 'hidden'
                }}
            >
                <div style={{ padding: '22px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, background: 'rgba(255,255,255,0.02)', flexShrink: 0 }}>
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 10 }}>{question.title}</h2>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <DiffBadge d={question.difficulty} />
                            <CatBadge c={question.category} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', background: 'rgba(59,130,246,0.1)', padding: '3px 9px', borderRadius: 99, border: '1px solid rgba(59,130,246,0.25)', fontFamily: 'var(--font-mono)' }}>
                                {tcs.length} test case{tcs.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                        {!alreadyAdded ? (
                            <button onClick={onAdd} className="button success" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', fontWeight: 700 }}>
                                <Plus size={15} /> Add to Campaign
                            </button>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', padding: '10px 16px', borderRadius: 8, fontWeight: 700 }}>
                                <CheckCircle size={15} /> Already Added
                            </span>
                        )}
                        <button onClick={onClose} className="button outline" style={{ padding: '9px 12px' }}><X size={16} /></button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden' }}>
                    <div style={{ padding: '24px 28px', overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                        <SectionLabel>Problem Description</SectionLabel>
                        <div style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 24 }}>
                            {question.description}
                        </div>
                        <SectionLabel>
                            <TestTube size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                            Test Cases ({tcs.length})
                        </SectionLabel>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {tcs.map((tc, i) => (
                                <div key={i} style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
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
                    </div>
                    <div style={{ padding: '24px 28px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)' }}>
                        <SectionLabel>
                            <FileCode2 size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                            Candidate Starter Code
                        </SectionLabel>
                        <pre style={{ padding: '16px 18px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre', color: '#e2e8f0', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)' }}>
                            {question.default_code}
                        </pre>
                    </div>
                </div>

                <div style={{ padding: '14px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'rgba(255,255,255,0.015)', flexShrink: 0 }}>
                    <button onClick={onClose} className="button outline" style={{ padding: '9px 20px', fontSize: 13 }}>Close</button>
                    {!alreadyAdded && (
                        <button onClick={onAdd} className="button success" style={{ padding: '9px 20px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Plus size={14} /> Add to Campaign
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Pool Browser Modal ───────────────────────────────────
function PoolBrowserModal({ pool, questions, onAdd, onClose }) {
    const [search, setSearch] = useState('');
    const [filterDiff, setFilterDiff] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [filterCat, setFilterCat] = useState('All');
    const [detailQ, setDetailQ] = useState(null);

    const CATEGORIES = ['All', 'JavaScript', 'React', 'SQL', 'Python', 'Java', 'DSA', 'Strings', 'Arrays', 'Math', 'Sorting', 'System Design', 'General IQ', 'Problem Solving'];

    const filtered = pool.filter(q => {
        const ms = !search || q.title.toLowerCase().includes(search.toLowerCase()) || q.description.toLowerCase().includes(search.toLowerCase());
        const md = filterDiff === 'All' || q.difficulty === filterDiff;
        const mt = filterType === 'All' || q.question_type === (filterType === 'MCQ' ? 'mcq' : 'coding');
        const mc = filterCat === 'All' || q.category === filterCat;
        return ms && md && mt && mc;
    });

    const isAdded = (q) => questions.some(cq => cq.title === q.title);

    const handleAdd = (q) => {
        onAdd(q.id);
        setDetailQ(null);
    };

    return (
        <>
            <div className="modal-backdrop" onClick={onClose}>
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        width: '100%', maxWidth: 1080, height: '88vh',
                        display: 'flex', flexDirection: 'column',
                        background: 'rgba(10,14,26,0.97)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 18, boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'rgba(255,255,255,0.02)', flexShrink: 0 }}>
                        <div>
                            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px', display: 'flex', alignItems: 'center', gap: 9 }}>
                                <DownloadCloud size={20} color="#a78bfa" /> Browse Question Pool
                            </h2>
                            <p style={{ fontSize: 13, opacity: 0.4, marginTop: 3 }}>{pool.length} questions available · click a card to view details</p>
                        </div>
                        <button onClick={onClose} className="button outline" style={{ padding: '8px 12px' }}><X size={16} /></button>
                    </div>

                    <div style={{ padding: '14px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0, background: 'rgba(0,0,0,0.15)' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }} />
                            <input
                                type="text" className="input"
                                placeholder="Search questions…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ paddingLeft: 36, fontSize: 13, padding: '9px 14px 9px 36px' }}
                                autoFocus
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {['All', 'Easy', 'Medium', 'Hard'].map(d => {
                                const c = d === 'All' ? '#a78bfa' : diffColor(d);
                                const active = filterDiff === d;
                                return (
                                    <button key={d} onClick={() => setFilterDiff(d)} style={{
                                        padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                        cursor: 'pointer', border: `1px solid ${active ? c + '60' : 'rgba(255,255,255,0.08)'}`,
                                        background: active ? c + '20' : 'rgba(255,255,255,0.04)',
                                        color: active ? c : 'rgba(255,255,255,0.45)', transition: 'all 0.15s'
                                    }}>
                                        {d}
                                    </button>
                                );
                            })}
                        </div>
                        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                        <div style={{ display: 'flex', gap: 6 }}>
                            {['All', 'Coding', 'MCQ'].map(t => {
                                const active = filterType === t;
                                return (
                                    <button key={t} onClick={() => setFilterType(t)} style={{
                                        padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                        cursor: 'pointer', border: `1px solid ${active ? '#60a5fa' : 'rgba(255,255,255,0.08)'}`,
                                        background: active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                                        color: active ? '#60a5fa' : 'rgba(255,255,255,0.45)', transition: 'all 0.15s'
                                    }}>
                                        {t}
                                    </button>
                                );
                            })}
                        </div>
                        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, opacity: 0.4, fontWeight: 700 }}>CAT:</span>
                            <select
                                className="input"
                                value={filterCat}
                                onChange={e => setFilterCat(e.target.value)}
                                style={{ padding: '4px 8px', fontSize: 11, width: 'auto', minWidth: 100, background: 'rgba(255,255,255,0.05)', height: 32, border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <span style={{ fontSize: 12, opacity: 0.35, marginLeft: 4 }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, alignContent: 'start' }}>
                        {filtered.map(q => {
                            const added = isAdded(q);
                            return (
                                <div
                                    key={q.id}
                                    onClick={() => setDetailQ(q)}
                                    style={{
                                        padding: '18px 20px', borderRadius: 12, cursor: 'pointer',
                                        background: added ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${added ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
                                        borderLeft: `4px solid ${diffColor(q.difficulty)}`,
                                        transition: 'all 0.2s',
                                        display: 'flex', flexDirection: 'column', gap: 10
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = diffColor(q.difficulty) + '60'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = added ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none'; }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                        <h3 style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3, flex: 1 }}>{q.title}</h3>
                                        {added && <CheckCircle size={16} color="#34d399" style={{ flexShrink: 0, marginTop: 2 }} />}
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        <DiffBadge d={q.difficulty} />
                                        <CatBadge c={q.category} />
                                    </div>
                                    <p style={{ fontSize: 13, opacity: 0.55, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {q.description}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.35 }}>
                                            {q.question_type === 'mcq'
                                                ? `${(q.options || []).length} options`
                                                : `${(q.test_cases || []).length} tests`}
                                        </span>
                                        <div style={{ display: 'flex', gap: 7 }} onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => setDetailQ(q)}
                                                className="button outline"
                                                style={{ padding: '5px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
                                            >
                                                <Eye size={12} /> Details
                                            </button>
                                            <button
                                                onClick={() => !added && handleAdd(q)}
                                                disabled={added}
                                                className={added ? 'button outline' : 'button success'}
                                                style={{ padding: '5px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, opacity: added ? 0.6 : 1 }}
                                            >
                                                {added ? <><CheckCircle size={12} /> Added</> : <><Plus size={12} /> Add</>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {filtered.length === 0 && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', opacity: 0.35 }}>
                                <DownloadCloud size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                                <div style={{ fontWeight: 600 }}>{pool.length === 0 ? 'Question pool is empty' : 'No matching questions'}</div>
                                <div style={{ fontSize: 13, marginTop: 4 }}>{pool.length === 0 ? 'Add questions in the Global Pool section.' : 'Try a different search or filter.'}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {detailQ && (
                <PoolDetailModal
                    question={detailQ}
                    alreadyAdded={isAdded(detailQ)}
                    onAdd={() => handleAdd(detailQ)}
                    onClose={() => setDetailQ(null)}
                />
            )}
        </>
    );
}


export default function CampaignManage({ params }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [campaign, setCampaign] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [pool, setPool] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [deleteQuestionId, setDeleteQuestionId] = useState(null);
    const [linkCopied, setLinkCopied] = useState(false);
    const [showPoolBrowser, setShowPoolBrowser] = useState(false);
    const [showCustomForm, setShowCustomForm] = useState(false);
    const { toasts, show } = useToast();

    // Tab state
    const [candidatesTab, setCandidatesTab] = useState(false);

    // Candidates tab state
    const [preregCandidates, setPreregCandidates] = useState([]);
    const [newCandidate, setNewCandidate] = useState({ name: '', email: '' });
    const [emailSending, setEmailSending] = useState({});
    const [resetTarget, setResetTarget] = useState(null);
    const [resetReassign, setResetReassign] = useState(false);
    const [cloning, setCloning] = useState(false);

    // Randomize settings state
    const [randomize, setRandomize] = useState(false);
    const [questionCount, setQuestionCount] = useState(0);
    const [diffMix, setDiffMix] = useState({ Easy: 0, Medium: 0, Hard: 0 });

    const [form, setForm] = useState({
        title: '', description: '',
        question_type: 'coding',
        default_code: 'function solution(input) {\n  // Your code here\n  return input;\n}',
        test_cases: '[{"input": "1", "expectedOutput": "1"}]',
        options: '["Option A", "Option B", "Option C", "Option D"]',
        correct_answer: 'Option A',
        difficulty: 'Easy', category: 'Problem Solving', points: 100
    });

    const fetchData = async () => {
        fetch(`/api/admin/campaigns/${id}`).then(r => r.json()).then(d => {
            if (d.campaign) {
                setCampaign(d.campaign);
                setRandomize(!!d.campaign.randomize_questions);
                setQuestionCount(d.campaign.question_count || 0);
                try {
                    setDiffMix(JSON.parse(d.campaign.difficulty_mix || '{}') || { Easy: 0, Medium: 0, Hard: 0 });
                } catch { setDiffMix({ Easy: 0, Medium: 0, Hard: 0 }); }
            }
        });
        fetch(`/api/admin/campaigns/${id}/questions`).then(r => r.json()).then(d => setQuestions(d.questions || []));
        fetch('/api/admin/pool').then(r => r.json()).then(d => setPool(d.pool || []));
        fetch(`/api/admin/campaigns/${id}/submissions`).then(r => r.json()).then(d => {
            setSubmissions(d.submissions || []);
            const map = {};
            (d.submissions || []).forEach(s => { map[s.candidate_id] = { id: s.candidate_id, name: s.name, email: s.email }; });
            setCandidates(Object.values(map));
        });
        loadCandidates();
    };

    const loadCandidates = () => {
        fetch(`/api/admin/campaigns/${id}/candidates`)
            .then(r => r.json())
            .then(d => setPreregCandidates(d.candidates || []));
    };

    const addCandidate = async (e) => {
        e.preventDefault();
        const res = await fetch(`/api/admin/campaigns/${id}/candidates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCandidate)
        });
        const data = await res.json();
        if (res.ok) {
            // Optimistically prepend so the candidate appears instantly
            const optimistic = {
                id: data.candidateId,
                name: newCandidate.name.trim(),
                email: newCandidate.email.trim().toLowerCase(),
                campaign_id: id,
                status: 'invited',
                submission_count: 0,
                total_points: 0,
                last_submission_at: null,
                tab_switches: 0,
                eligible_next_round: 0,
            };
            setPreregCandidates(prev =>
                prev.some(c => c.id === data.candidateId) ? prev : [optimistic, ...prev]
            );
            setNewCandidate({ name: '', email: '' });
            show('Candidate added!', 'success');
            // Sync from server in background to get accurate DB data
            loadCandidates();
        } else {
            show(data.error || 'Failed to add candidate', 'error');
        }
    };

    const sendEmail = async (candidateId) => {
        setEmailSending(prev => ({ ...prev, [candidateId]: true }));
        const res = await fetch(`/api/admin/candidates/${candidateId}/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ baseUrl: window.location.origin })
        });
        const data = await res.json();
        setEmailSending(prev => ({ ...prev, [candidateId]: false }));
        if (res.ok) show('Email sent!', 'success');
        else show(data.error || 'Failed to send email', 'error');
    };

    const resetCandidate = async (candidateId) => {
        await fetch(`/api/admin/candidates/${candidateId}/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reassignQuestions: resetReassign })
        });
        loadCandidates();
        show(resetReassign ? 'Candidate reset with new questions assigned.' : 'Candidate reset — they can retake the test.', 'info');
        setResetTarget(null);
        setResetReassign(false);
    };

    const cloneCampaign = async () => {
        setCloning(true);
        const res = await fetch(`/api/admin/campaigns/${id}/clone`, { method: 'POST' });
        const data = await res.json();
        setCloning(false);
        if (res.ok && data.id) {
            show(`Campaign cloned! Redirecting…`, 'success');
            setTimeout(() => window.location.href = `/admin/campaigns/${data.id}`, 1200);
        } else {
            show(data.error || 'Failed to clone campaign', 'error');
        }
    };

    const saveCampaign = async () => {
        if (!campaign) return;

        // Validation for Randomization
        if (randomize) {
            const count = parseInt(questionCount) || 0;
            if (count > questions.length) {
                show(`Cannot randomize: You requested ${count} questions but the campaign only has ${questions.length} total.`, 'error');
                return;
            }
            if (count <= 2 && count === questions.length) {
                show(`Randomization is not valid if you show all questions when the pool size is very small (${count}). Add more questions to enable meaningful randomization.`, 'error');
                return;
            }
            if (count === questions.length) {
                show(`Note: Requested count is same as pool size. Randomization will just shuffle order.`, 'info');
            }

            const mixTotal = Object.values(diffMix).reduce((a, b) => a + (parseInt(b) || 0), 0);
            if (mixTotal !== count) {
                show(`The sum of Easy/Medium/Hard (${mixTotal}) must match the total question count (${count}).`, 'error');
                return;
            }

            // Check if we have enough of each difficulty
            const diffCounts = questions.reduce((acc, q) => {
                acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
                return acc;
            }, { Easy: 0, Medium: 0, Hard: 0 });

            for (const d of ['Easy', 'Medium', 'Hard']) {
                if ((parseInt(diffMix[d]) || 0) > diffCounts[d]) {
                    show(`Not enough ${d} questions. You asked for ${diffMix[d]} but only have ${diffCounts[d]} available in this campaign.`, 'error');
                    return;
                }
            }
        }

        const res = await fetch(`/api/admin/campaigns/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: campaign.name,
                duration: campaign.duration,
                proctoring: campaign.proctoring,
                status: campaign.status,
                randomize_questions: randomize,
                question_count: parseInt(questionCount) || 0,
                difficulty_mix: diffMix
            })
        });
        if (res.ok) show('Campaign settings saved!', 'success');
        else show('Failed to save settings.', 'error');
    };

    useEffect(() => { fetchData(); }, [id]);

    const addQuestion = async (e) => {
        e.preventDefault();
        try {
            let payload = { ...form };
            if (form.question_type === 'coding') {
                payload.test_cases = JSON.parse(form.test_cases);
                payload.options = '[]';
                payload.correct_answer = '';
            } else {
                payload.options = JSON.parse(form.options);
                payload.test_cases = '[]';
                payload.default_code = '';
            }

            const res = await fetch(`/api/admin/campaigns/${id}/questions`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                fetchData();
                setForm(f => ({ ...f, title: '', description: '' }));
                show('Question added!', 'success');
                setShowCustomForm(false);
            }
        } catch (err) {
            show('Invalid JSON in test cases or options.', 'error');
        }
    };

    const addFromPool = async (poolId) => {
        const res = await fetch(`/api/admin/campaigns/${id}/add-from-pool`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ poolId })
        });
        if (res.ok) { fetchData(); show('Question added from pool!', 'success'); }
    };

    const deleteQuestion = async (questionId) => {
        const res = await fetch(`/api/admin/campaigns/${id}/questions/${questionId}`, { method: 'DELETE' });
        if (res.ok) { setQuestions(prev => prev.filter(q => q.id !== questionId)); show('Question removed.', 'info'); }
        else show('Failed to delete question.', 'error');
        setDeleteQuestionId(null);
    };

    const toggleStatus = async () => {
        if (!campaign) return;
        const newStatus = campaign.status === 'live' ? 'archived' : 'live';
        const res = await fetch(`/api/admin/campaigns/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
        const data = await res.json();
        if (res.ok) {
            setCampaign({ ...campaign, status: newStatus });
            show(`Campaign ${newStatus === 'live' ? 'is now live' : 'archived'}.`, newStatus === 'live' ? 'success' : 'info');
        } else {
            show(data.error || 'Failed to update status.', 'error');
        }
    };

    const copyShareLink = () => {
        if (campaign?.status === 'archived') { show('Cannot share an archived campaign.', 'warning'); return; }
        navigator.clipboard.writeText(`${window.location.origin}/candidate/login?campaign=${id}`).then(() => {
            setLinkCopied(true); show('Invite link copied!', 'success');
            setTimeout(() => setLinkCopied(false), 2500);
        });
    };

    const passed = submissions.filter(s => s.status === 'Passed').length;
    const passRate = submissions.length > 0 ? Math.round((passed / submissions.length) * 100) : 0;

    return (
        <div className="container" style={{ maxWidth: '1100px' }}>
            <ToastContainer toasts={toasts} />

            {/* Back nav */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link href="/admin">
                    <button className="button outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '7px 14px' }}>
                        <ArrowLeft size={14} /> Back to Dashboard
                    </button>
                </Link>
                <ThemeToggle />
            </div>

            {/* Header */}
            <div style={{ marginBottom: 28, padding: '24px 28px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
                                {campaign?.name || 'Campaign Overview'}
                            </h1>
                            {campaign && (
                                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', padding: '4px 10px', borderRadius: 99, background: campaign.status === 'live' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)', color: campaign.status === 'live' ? '#34d399' : '#9ca3af', border: `1px solid ${campaign.status === 'live' ? 'rgba(16,185,129,0.3)' : 'rgba(107,114,128,0.25)'}` }}>
                                    {campaign.status === 'live' ? '● Live' : '⊘ Archived'}
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', opacity: 0.4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <span>ID: {id}</span>
                            <span>•</span>
                            <span>{campaign?.duration || 60} min</span>
                            <span>•</span>
                            <span>{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
                            <span>•</span>
                            <span>{preregCandidates.length} candidate{preregCandidates.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <button onClick={toggleStatus} className="button outline" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: campaign?.status === 'live' ? '#f87171' : '#34d399', borderColor: campaign?.status === 'live' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)' }}>
                            {campaign?.status === 'live' ? 'Archive' : 'Make Live'}
                        </button>
                        <button onClick={cloneCampaign} disabled={cloning} className="button outline" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            {cloning ? <div className="spinner sm" /> : <Copy size={14} />} Clone
                        </button>
                        <button onClick={copyShareLink} disabled={campaign?.status === 'archived'} className={linkCopied ? 'button success' : 'button outline'} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            {linkCopied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy Invite Link</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
                {[
                    { label: 'Questions', value: questions.length, color: '#3b82f6' },
                    { label: 'Candidates', value: preregCandidates.length, color: '#8b5cf6' },
                    { label: 'Submissions', value: submissions.length, color: '#f59e0b' },
                    { label: 'Pass Rate', value: `${passRate}%`, color: passRate >= 50 ? '#10b981' : '#ef4444' }
                ].map(s => (
                    <div key={s.label} className="stat-card" style={{ padding: '16px 18px', borderTop: `3px solid ${s.color}` }}>
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-value" style={{ color: s.color, fontSize: 26 }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Results & Live Monitoring CTA */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)', gap: 16, marginBottom: 24 }}>
                <Link href={`/admin/campaigns/${id}/results`} style={{ textDecoration: 'none' }}>
                    <div style={{
                        height: '100%', padding: '18px 24px',
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.06))',
                        border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.14), rgba(59,130,246,0.1) )'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.06))'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)'; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Shield size={20} color="#34d399" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Candidate Results & Audit</div>
                                <div style={{ fontSize: 13, opacity: 0.55 }}>
                                    {submissions.length > 0
                                        ? `${preregCandidates.length} candidate${preregCandidates.length !== 1 ? "s" : ""} · ${submissions.length} submission${submissions.length !== 1 ? "s" : ""}`
                                        : 'View submissions, surveillance footage, and analytics'}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                            Results <ChevronRight size={14} />
                        </div>
                    </div>
                </Link>

                <Link href={`/admin/campaigns/${id}/live`} style={{ textDecoration: 'none' }}>
                    <div style={{
                        height: '100%', padding: '18px 24px',
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))',
                        border: '1px solid rgba(59,130,246,0.25)', borderRadius: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.14), rgba(139,92,246,0.1) )'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)'; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Activity size={20} color="#60a5fa" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Monitor Live Feed</div>
                                <div style={{ fontSize: 13, opacity: 0.55 }}>Real-time surveillance of active candidates</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#60a5fa', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                            Live <ChevronRight size={14} />
                        </div>
                    </div>
                </Link>
            </div>

            {/* Pass rate bar */}
            {submissions.length > 0 && (
                <div style={{ marginBottom: 28, padding: '14px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                        <span style={{ opacity: 0.6 }}>Overall Pass Rate</span>
                        <span style={{ fontWeight: 700, color: passRate >= 50 ? '#34d399' : '#f87171' }}>{passed}/{submissions.length} passed</span>
                    </div>
                    <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${passRate}%`, background: passRate >= 50 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#ef4444,#f87171)' }} />
                    </div>
                </div>
            )}

            {/* Campaign Settings Card */}
            <div className="card glass-panel" style={{ marginBottom: 20, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>Campaign Settings</h3>
                    <button onClick={saveCampaign} className="button" style={{ padding: '8px 18px', fontSize: 13, fontWeight: 700 }}>Save Settings</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 2 }}>
                        <label style={{ fontSize: 12, opacity: 0.5, display: 'block', marginBottom: 6, fontWeight: 600 }}>Campaign Name</label>
                        <input className="input" value={campaign?.name || ''} onChange={e => setCampaign(c => ({ ...c, name: e.target.value }))} style={{ background: 'rgba(0,0,0,0.2)' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, opacity: 0.5, display: 'block', marginBottom: 6, fontWeight: 600 }}>Duration (minutes)</label>
                        <input type="number" className="input" value={campaign?.duration || 60} onChange={e => setCampaign(c => ({ ...c, duration: parseInt(e.target.value) || 60 }))} style={{ background: 'rgba(0,0,0,0.2)' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, opacity: 0.5, display: 'block', marginBottom: 6, fontWeight: 600 }}>Proctoring Mode</label>
                        <select
                            className="input"
                            value={campaign?.proctoring || 'full'}
                            onChange={e => setCampaign(c => ({ ...c, proctoring: e.target.value }))}
                            style={{ background: 'rgba(0,0,0,0.2)', cursor: 'pointer' }}
                        >
                            <option value="none">None (No Recording)</option>
                            <option value="screen">Screen Only</option>
                            <option value="full">Full (Camera + Screen)</option>
                        </select>
                    </div>
                </div>
                {/* Randomize toggle */}
                <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: randomize ? 14 : 0 }}>
                        <div
                            onClick={() => setRandomize(v => !v)}
                            style={{
                                width: 42, height: 24, borderRadius: 99, cursor: 'pointer', flexShrink: 0,
                                background: randomize ? 'linear-gradient(135deg,#6d28d9,#8b5cf6)' : 'rgba(255,255,255,0.1)',
                                position: 'relative', transition: 'background 0.2s', border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <div style={{
                                position: 'absolute', top: 3, left: randomize ? 20 : 3,
                                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                                transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)'
                            }} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>Randomize Questions</span>
                        <span style={{ fontSize: 12, opacity: 0.45, marginLeft: 2 }}>Show a random subset to each candidate</span>
                    </div>
                    {randomize && (
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 4 }}>
                            <div>
                                <label style={{ fontSize: 12, opacity: 0.5, display: 'block', marginBottom: 5, fontWeight: 600 }}>Questions to Show</label>
                                <input type="number" min="1" className="input" value={questionCount} onChange={e => setQuestionCount(e.target.value)} style={{ width: 90, background: 'rgba(0,0,0,0.2)' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                <div>
                                    <label style={{ fontSize: 12, display: 'block', marginBottom: 5, fontWeight: 600, color: '#34d399' }}>Easy</label>
                                    <input type="number" min="0" className="input" value={diffMix.Easy} onChange={e => setDiffMix(m => ({ ...m, Easy: parseInt(e.target.value) || 0 }))} style={{ width: 70, background: 'rgba(0,0,0,0.2)' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, display: 'block', marginBottom: 5, fontWeight: 600, color: '#fbbf24' }}>Medium</label>
                                    <input type="number" min="0" className="input" value={diffMix.Medium} onChange={e => setDiffMix(m => ({ ...m, Medium: parseInt(e.target.value) || 0 }))} style={{ width: 70, background: 'rgba(0,0,0,0.2)' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, display: 'block', marginBottom: 5, fontWeight: 600, color: '#f87171' }}>Hard</label>
                                    <input type="number" min="0" className="input" value={diffMix.Hard} onChange={e => setDiffMix(m => ({ ...m, Hard: parseInt(e.target.value) || 0 }))} style={{ width: 70, background: 'rgba(0,0,0,0.2)' }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
                <button
                    onClick={() => setCandidatesTab(false)}
                    style={{
                        padding: '8px 20px', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
                        background: !candidatesTab ? 'rgba(59,130,246,0.15)' : 'transparent',
                        color: !candidatesTab ? '#60a5fa' : 'var(--text-muted)',
                        transition: 'all 0.15s'
                    }}
                >
                    Questions ({questions.length})
                </button>
                <button
                    onClick={() => { setCandidatesTab(true); loadCandidates(); }}
                    style={{
                        padding: '8px 20px', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
                        background: candidatesTab ? 'rgba(139,92,246,0.15)' : 'transparent',
                        color: candidatesTab ? '#a78bfa' : 'var(--text-muted)',
                        transition: 'all 0.15s'
                    }}
                >
                    Candidates ({preregCandidates.length})
                </button>
            </div>

            {/* Candidates Tab Panel */}
            {candidatesTab && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Add candidate form */}
                    <div className="card glass-panel" style={{ border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.04)', padding: '20px 24px' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <UserPlus size={16} color="#a78bfa" /> Add Candidate
                        </h3>
                        <form onSubmit={addCandidate} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1, minWidth: 160 }}>
                                <label style={{ fontSize: 12, opacity: 0.5, display: 'block', marginBottom: 5, fontWeight: 600 }}>Name</label>
                                <input className="input" placeholder="Full name" value={newCandidate.name} onChange={e => setNewCandidate(c => ({ ...c, name: e.target.value }))} required style={{ background: 'rgba(0,0,0,0.2)' }} />
                            </div>
                            <div style={{ flex: 2, minWidth: 200 }}>
                                <label style={{ fontSize: 12, opacity: 0.5, display: 'block', marginBottom: 5, fontWeight: 600 }}>Email</label>
                                <input type="email" className="input" placeholder="candidate@example.com" value={newCandidate.email} onChange={e => setNewCandidate(c => ({ ...c, email: e.target.value }))} required style={{ background: 'rgba(0,0,0,0.2)' }} />
                            </div>
                            <button type="submit" className="button" style={{ padding: '10px 20px', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
                                <Plus size={14} /> Add
                            </button>
                        </form>
                    </div>

                    {/* Candidate list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {preregCandidates.length === 0 ? (
                            <div style={{ border: '2px dashed rgba(255,255,255,0.06)', borderRadius: 14, padding: '56px 24px', textAlign: 'center', opacity: 0.4 }}>
                                <Users size={32} style={{ margin: '0 auto 12px' }} />
                                <div style={{ fontWeight: 600, marginBottom: 6 }}>No candidates yet</div>
                                <div style={{ fontSize: 13 }}>Add candidates above to pre-register them for this campaign.</div>
                            </div>
                        ) : preregCandidates.map(c => {
                            const statusColor = c.status === 'completed' ? '#34d399' : c.status === 'started' ? '#fbbf24' : '#60a5fa';
                            const statusBg = c.status === 'completed' ? 'rgba(16,185,129,0.12)' : c.status === 'started' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)';
                            const statusBdr = c.status === 'completed' ? 'rgba(16,185,129,0.3)' : c.status === 'started' ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)';
                            return (
                                <div key={c.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                                    {/* Avatar */}
                                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#6d28d9,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 14, color: '#fff' }}>
                                        {(c.name || '?')[0].toUpperCase()}
                                    </div>
                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{c.name}</div>
                                        <div style={{ fontSize: 12, opacity: 0.5, fontFamily: 'var(--font-mono)' }}>{c.email}</div>
                                    </div>
                                    {/* Status badge */}
                                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'capitalize', color: statusColor, background: statusBg, padding: '3px 10px', borderRadius: 99, border: `1px solid ${statusBdr}`, flexShrink: 0 }}>
                                        {c.status || 'invited'}
                                    </span>
                                    {/* Points */}
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', minWidth: 60, textAlign: 'right', flexShrink: 0 }}>
                                        {c.total_points != null ? `${c.total_points} pts` : '—'}
                                    </div>
                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => {
                                                const url = `${window.location.origin}/candidate/login?campaign=${id}&name=${encodeURIComponent(c.name)}&email=${encodeURIComponent(c.email)}`;
                                                navigator.clipboard.writeText(url).then(() => show('Personal link copied!', 'success'));
                                            }}
                                            className="button outline"
                                            style={{ padding: '7px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                                            title="Copy a pre-filled link for this candidate"
                                        >
                                            <Copy size={13} /> Copy Link
                                        </button>
                                        <button
                                            onClick={() => sendEmail(c.id)}
                                            disabled={emailSending[c.id]}
                                            className="button outline"
                                            style={{ padding: '7px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                                        >
                                            <Mail size={13} /> {emailSending[c.id] ? 'Sending…' : 'Email'}
                                        </button>
                                        <button
                                            onClick={() => setResetTarget(c)}
                                            className="button outline"
                                            style={{ padding: '7px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24', borderColor: 'rgba(245,158,11,0.3)' }}
                                        >
                                            <RotateCcw size={13} /> Reset
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Questions Tab Panel */}
            {!candidatesTab && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Action bar: add question buttons */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                            Questions
                            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', opacity: 0.4, fontWeight: 400 }}>({questions.length})</span>
                        </h2>
                        <button
                            onClick={() => setShowPoolBrowser(true)}
                            className="button"
                            style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', fontSize: 13, fontWeight: 700, boxShadow: '0 0 20px rgba(139,92,246,0.2)' }}
                        >
                            <DownloadCloud size={14} /> Browse Pool
                        </button>
                        <button
                            onClick={() => setShowCustomForm(v => !v)}
                            className={showCustomForm ? 'button outline' : 'button outline'}
                            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', fontSize: 13, fontWeight: 700, borderColor: showCustomForm ? 'rgba(59,130,246,0.5)' : undefined, color: showCustomForm ? '#60a5fa' : undefined }}
                        >
                            {showCustomForm ? <><ChevronUp size={14} /> Hide Form</> : <><Plus size={14} /> Add Custom Question</>}
                        </button>
                    </div>

                    {/* Collapsible custom question form */}
                    {showCustomForm && (
                        <div className="card glass-panel" style={{ border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Plus size={16} color="#60a5fa" /> New Custom Question
                                </h3>
                                <button onClick={() => setShowCustomForm(false)} className="button outline" style={{ padding: '5px 10px' }}>
                                    <X size={14} />
                                </button>
                            </div>
                            <form onSubmit={addQuestion} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <input type="text" className="input" style={{ gridColumn: '1/-1', background: 'rgba(0,0,0,0.2)' }} placeholder="Question title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                                <select className="input" style={{ background: 'rgba(0,0,0,0.2)' }} value={form.question_type} onChange={e => setForm({ ...form, question_type: e.target.value })}>
                                    <option value="coding">Coding Problem (Auto-graded)</option>
                                    <option value="mcq">Multiple Choice (MCQ)</option>
                                </select>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <select className="input" style={{ flex: 1, background: 'rgba(0,0,0,0.2)' }} value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                                        {['Easy', 'Medium', 'Hard'].map(d => <option key={d}>{d}</option>)}
                                    </select>
                                    <select className="input" style={{ flex: 1, background: 'rgba(0,0,0,0.2)' }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                        {['JavaScript', 'React', 'Node.js', 'SQL', 'Python', 'Java', 'DSA', 'Strings', 'Arrays', 'Math', 'Sorting', 'System Design', 'General IQ', 'Problem Solving'].map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <textarea className="input" style={{ gridColumn: '1/-1', background: 'rgba(0,0,0,0.2)' }} rows="3" placeholder="Problem description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                                {form.question_type === 'coding' ? (
                                    <>
                                        <div style={{ gridColumn: '1/-1' }}>
                                            <SectionLabel>Starter Code</SectionLabel>
                                            <textarea className="input font-mono" style={{ background: 'rgba(0,0,0,0.2)', fontSize: 12 }} rows="4" value={form.default_code} onChange={e => setForm({ ...form, default_code: e.target.value })} required />
                                        </div>
                                        <div style={{ gridColumn: '1/-1' }}>
                                            <SectionLabel>Test Cases <span style={{ color: '#60a5fa', textTransform: 'none' }}>(JSON)</span></SectionLabel>
                                            <textarea className="input font-mono" style={{ background: 'rgba(0,0,0,0.2)', fontSize: 11 }} rows="2" value={form.test_cases} onChange={e => setForm({ ...form, test_cases: e.target.value })} required />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ gridColumn: '1/-1' }}>
                                            <SectionLabel>Options <span style={{ color: '#a78bfa', textTransform: 'none' }}>(JSON Array)</span></SectionLabel>
                                            <textarea className="input font-mono" style={{ background: 'rgba(0,0,0,0.2)', fontSize: 12 }} rows="3" value={form.options} onChange={e => setForm({ ...form, options: e.target.value })} required />
                                        </div>
                                        <div style={{ gridColumn: '1/-1' }}>
                                            <SectionLabel>Correct Answer <span style={{ opacity: 0.5, textTransform: 'none' }}>(Must match one option exactly)</span></SectionLabel>
                                            <input type="text" className="input" style={{ background: 'rgba(0,0,0,0.2)' }} value={form.correct_answer} onChange={e => setForm({ ...form, correct_answer: e.target.value })} required />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label style={{ fontSize: 12, opacity: 0.5, display: 'block', marginBottom: 5, fontWeight: 600 }}>Points</label>
                                    <input type="number" min="0" max="1000" className="input" value={form.points ?? 100} onChange={e => setForm(f => ({ ...f, points: parseInt(e.target.value) || 0 }))} style={{ width: 80, background: 'rgba(0,0,0,0.2)' }} />
                                </div>
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowCustomForm(false)} className="button outline" style={{ padding: '10px 20px', fontSize: 13 }}>Cancel</button>
                                    <button type="submit" className="button" style={{ padding: '10px 24px', fontWeight: 700, fontSize: 13 }}>Save to Campaign</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Active Questions list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {questions.map((q, idx) => (
                            <div key={q.id} className="card" style={{ padding: '18px 22px', borderLeft: `4px solid ${diffColor(q.difficulty)}`, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 13, color: '#60a5fa' }}>
                                    {idx + 1}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{q.title}</div>
                                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 8 }}>
                                        <div style={{ fontSize: 10, fontWeight: 800, background: q.question_type === 'mcq' ? 'rgba(167,139,250,0.15)' : 'rgba(59,130,246,0.15)', color: q.question_type === 'mcq' ? '#a78bfa' : '#60a5fa', padding: '3px 8px', borderRadius: 6, border: `1px solid ${q.question_type === 'mcq' ? 'rgba(167,139,250,0.3)' : 'rgba(59,130,246,0.3)'}` }}>
                                            {q.question_type?.toUpperCase() || 'CODING'}
                                        </div>
                                        <DiffBadge d={q.difficulty} />
                                        <CatBadge c={q.category} />
                                        {q.question_type === 'mcq' ? (
                                            <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(16,185,129,0.1)', padding: '3px 9px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.2)', fontFamily: 'var(--font-mono)' }}>{q.options?.length || 0} options</span>
                                        ) : (
                                            <span style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', background: 'rgba(59,130,246,0.1)', padding: '3px 9px', borderRadius: 99, border: '1px solid rgba(59,130,246,0.2)', fontFamily: 'var(--font-mono)' }}>{q.test_cases?.length || 0} tests</span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: 13, opacity: 0.55, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{q.description}</p>
                                </div>
                                <button onClick={() => setDeleteQuestionId(q.id)} className="danger-btn button" style={{ padding: '7px 10px', flexShrink: 0 }} title="Remove">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {questions.length === 0 && (
                            <div style={{ border: '2px dashed rgba(255,255,255,0.06)', borderRadius: 14, padding: '56px 24px', textAlign: 'center', opacity: 0.4 }}>
                                <Users size={32} style={{ margin: '0 auto 12px' }} />
                                <div style={{ fontWeight: 600, marginBottom: 6 }}>No questions yet</div>
                                <div style={{ fontSize: 13 }}>Add from the pool or create a custom question above.</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Pool Browser Modal */}
            {showPoolBrowser && (
                <PoolBrowserModal
                    pool={pool}
                    questions={questions}
                    onAdd={(poolId) => { addFromPool(poolId); }}
                    onClose={() => setShowPoolBrowser(false)}
                />
            )}

            {/* Delete question confirm */}
            {deleteQuestionId && (
                <ConfirmModal
                    title="Remove Question"
                    message="Remove this question from the campaign? This cannot be undone."
                    confirmLabel="Remove"
                    onConfirm={() => deleteQuestion(deleteQuestionId)}
                    onCancel={() => setDeleteQuestionId(null)}
                />
            )}

            {/* Reset candidate confirm */}
            {resetTarget && (
                <div className="modal-backdrop" onClick={() => { setResetTarget(null); setResetReassign(false); }}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <RotateCcw size={20} color="#f87171" />
                            </div>
                            <div>
                                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Reset Candidate</h3>
                                <p style={{ fontSize: 14, opacity: 0.6, lineHeight: 1.6 }}>
                                    Reset <strong>{resetTarget.name}</strong>? Their submissions will be cleared and they can retake the test.
                                </p>
                            </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, cursor: 'pointer', marginBottom: 20 }}>
                            <input
                                type="checkbox"
                                checked={resetReassign}
                                onChange={e => setResetReassign(e.target.checked)}
                                style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0 }}
                            />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: '#fbbf24' }}>Assign different questions</div>
                                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                                    Since this candidate may have seen the previous questions, a fresh randomised set will be picked at their next login.
                                </div>
                            </div>
                        </label>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => { setResetTarget(null); setResetReassign(false); }} className="button outline" style={{ padding: '9px 18px', fontSize: 13 }}>Cancel</button>
                            <button onClick={() => resetCandidate(resetTarget.id)} className="danger-btn button" style={{ padding: '9px 18px', fontSize: 13 }}>Reset</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
