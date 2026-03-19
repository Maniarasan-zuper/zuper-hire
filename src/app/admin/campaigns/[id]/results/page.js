'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Camera, CheckCircle, AlertTriangle, Users, X,
    ChevronDown, ChevronUp, Search, Code2,
    Shield, ShieldAlert, Eye, Trophy, Star, ChevronLeft, ChevronRight,
    ThumbsUp, ThumbsDown, ArrowRightCircle, MessageSquare, Send, Trash2, History, ExternalLink
} from 'lucide-react';

const statusColor = (s) => s === 'Passed' ? '#34d399' : s === 'Failed' ? '#f87171' : '#fbbf24';
const statusBg = (s) => s === 'Passed' ? 'rgba(16,185,129,0.1)' : s === 'Failed' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';
const statusBorder = (s) => s === 'Passed' ? 'rgba(16,185,129,0.25)' : s === 'Failed' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)';

function StatusBadge({ status }) {
    return (
        <span style={{ fontSize: 11, fontWeight: 700, color: statusColor(status), background: statusBg(status), padding: '3px 10px', borderRadius: 99, border: `1px solid ${statusBorder(status)}` }}>
            {status}
        </span>
    );
}

function useToast() {
    const [toasts, setToasts] = useState([]);
    const show = (msg, type = 'info') => {
        const id = Date.now();
        setToasts(t => [...t, { id, msg, type }]);
        setTimeout(() => {
            setToasts(t => t.map(x => x.id === id ? { ...x, hiding: true } : x));
            setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 350);
        }, 3000);
    };
    return { toasts, show };
}
function ToastContainer({ toasts }) {
    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast-${t.type} ${t.hiding ? 'hiding' : ''}`}>
                    {t.type === 'success' && <CheckCircle size={14} />}
                    {t.msg}
                </div>
            ))}
        </div>
    );
}

function ScreenshotModal({ candidateName, screenshots, onClose }) {
    const [filter, setFilter] = useState('all');
    const [selectedShot, setSelectedShot] = useState(null);
    const filtered = filter === 'all' ? screenshots : screenshots.filter(s => s.type === filter);

    return (
        <>
            <div className="modal-backdrop" onClick={onClose}>
                <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 1100, maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: 'rgba(10,14,26,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, boxShadow: '0 40px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
                    <div style={{ padding: '18px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', flexShrink: 0 }}>
                        <div>
                            <h2 style={{ fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Camera size={18} color="#60a5fa" /> Surveillance — {candidateName}
                            </h2>
                            <p style={{ fontSize: 12, opacity: 0.4, marginTop: 3 }}>{screenshots.length} captures total</p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {[['all', 'All', '#60a5fa'], ['camera', 'Camera', '#a78bfa'], ['screen', 'Screen', '#34d399']].map(([val, label, color]) => (
                                    <button key={val} onClick={() => setFilter(val)} style={{ padding: '6px 13px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1px solid ${filter === val ? color + '50' : 'rgba(255,255,255,0.08)'}`, background: filter === val ? color + '18' : 'rgba(255,255,255,0.04)', color: filter === val ? color : 'rgba(255,255,255,0.45)' }}>
                                        {label} {val !== 'all' && `(${screenshots.filter(s => s.type === val).length})`}
                                    </button>
                                ))}
                            </div>
                            <button onClick={onClose} className="button outline" style={{ padding: '7px 12px' }}><X size={15} /></button>
                        </div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, alignContent: 'start' }}>
                        {filtered.map((shot, idx) => (
                            <div key={idx} style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', cursor: 'pointer' }} onClick={() => setSelectedShot(shot)}>
                                <div style={{ padding: '8px 12px', fontSize: 11, fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)' }}>
                                    <span style={{ color: shot.type === 'camera' ? '#a78bfa' : '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        {shot.type === 'camera' ? <Camera size={11} /> : <Eye size={11} />}
                                        {shot.type === 'screen' && shot.monitor_index != null ? `SCREEN ${shot.monitor_index + 1}` : shot.type.toUpperCase()}
                                    </span>
                                    <span style={{ opacity: 0.45 }}>{new Date(shot.created_at).toLocaleTimeString()}</span>
                                </div>
                                <img src={shot.image_data} alt="Surveillance" style={{ width: '100%', height: 'auto', display: 'block' }} />
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', opacity: 0.35 }}>
                                <Camera size={36} style={{ margin: '0 auto 12px' }} />No captures yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {selectedShot && (
                <div onClick={() => setSelectedShot(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', cursor: 'zoom-out' }}>
                    <img src={selectedShot.image_data} style={{ maxWidth: '95vw', maxHeight: '95vh', borderRadius: 8, boxShadow: '0 0 50px rgba(0,0,0,0.5)' }} alt="Full View" />
                </div>
            )}
        </>
    );
}

function CommentsPanel({ candidateId, show: showPanel }) {
    const [comments, setComments] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!showPanel) return;
        fetch(`/api/admin/candidates/${candidateId}/comments`)
            .then(r => r.json()).then(d => setComments(d.comments || []));
    }, [candidateId, showPanel]);

    const addComment = async () => {
        if (!text.trim()) return;
        setLoading(true);
        const res = await fetch(`/api/admin/candidates/${candidateId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment: text })
        });
        const d = await res.json();
        if (d.comment) { setComments(c => [d.comment, ...c]); setText(''); }
        setLoading(false);
    };

    const deleteComment = async (commentId) => {
        await fetch(`/api/admin/candidates/${candidateId}/comments`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commentId })
        });
        setComments(c => c.filter(x => x.id !== commentId));
    };

    if (!showPanel) return null;
    return (
        <div style={{ padding: '16px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', opacity: 0.45, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={12} /> Admin Notes
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                    value={text} onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addComment()}
                    placeholder="Add a note about this candidate…"
                    style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'var(--foreground)', fontSize: 13 }}
                />
                <button onClick={addComment} disabled={loading || !text.trim()} className="button" style={{ padding: '9px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Send size={13} /> Add
                </button>
            </div>
            {comments.length === 0 && <p style={{ fontSize: 13, opacity: 0.35, textAlign: 'center', padding: '12px 0' }}>No notes yet.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {comments.map(c => (
                    <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div>
                            <div style={{ fontSize: 13, lineHeight: 1.5 }}>{c.comment}</div>
                            <div style={{ fontSize: 11, opacity: 0.35, marginTop: 4 }}>{c.admin_username} · {new Date(c.created_at).toLocaleString()}</div>
                        </div>
                        <button onClick={() => deleteComment(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.35, padding: 4, color: '#f87171' }} title="Delete note">
                            <Trash2 size={13} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MoveToCampaignModal({ candidate, onClose, onMoved }) {
    const [campaigns, setCampaigns] = useState([]);
    const [selected, setSelected] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/admin/campaigns').then(r => r.json()).then(d => {
            setCampaigns((d.campaigns || []).filter(c => c.status !== 'archived' && c.id !== candidate.campaignId));
        });
    }, [candidate.campaignId]);

    const move = async () => {
        if (!selected) return;
        setLoading(true); setError('');
        const res = await fetch(`/api/admin/candidates/${candidate.id}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetCampaignId: selected })
        });
        const d = await res.json();
        if (res.ok) { onMoved(campaigns.find(c => c.id === selected)?.name); onClose(); }
        else setError(d.error || 'Failed to move candidate');
        setLoading(false);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ArrowRightCircle size={18} color="#60a5fa" /> Move to Another Campaign
                </h3>
                <p style={{ fontSize: 13, opacity: 0.55, marginBottom: 20 }}>
                    Add <strong>{candidate.name}</strong> to a different campaign. Their existing results will remain here.
                </p>
                <select value={selected} onChange={e => setSelected(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(15,23,42,0.8)', color: 'var(--foreground)', fontSize: 14, marginBottom: 16 }}>
                    <option value="">Select a campaign…</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {error && <p style={{ fontSize: 13, color: '#f87171', marginBottom: 12 }}>{error}</p>}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={onClose} className="button outline" style={{ padding: '9px 18px', fontSize: 13 }}>Cancel</button>
                    <button onClick={move} disabled={!selected || loading} className="button" style={{ padding: '9px 18px', fontSize: 13 }}>
                        {loading ? 'Moving…' : 'Move Candidate'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CandidateHistoryModal({ email, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/admin/candidates/history?email=${encodeURIComponent(email)}`)
            .then(r => r.json()).then(d => { setData(d); setLoading(false); });
    }, [email]);

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 700, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontWeight: 800, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <History size={18} color="#60a5fa" /> Campaign History — {email}
                    </h2>
                    <button onClick={onClose} className="button outline" style={{ padding: '6px 12px' }}><X size={14} /></button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                    {loading ? <div style={{ textAlign: 'center', padding: 40, opacity: 0.4 }}><div className="spinner lg" style={{ margin: '0 auto' }} /></div> : (
                        data?.history?.length === 0 ? <p style={{ opacity: 0.4, textAlign: 'center', padding: 40 }}>No history found.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {data?.history?.map((h, i) => (
                                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 15 }}>{h.campaignName}</div>
                                                <div style={{ fontSize: 12, opacity: 0.4, marginTop: 2 }}>{new Date(h.created_at).toLocaleDateString()}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: h.scorePercent >= 70 ? '#34d399' : h.scorePercent >= 40 ? '#fbbf24' : '#f87171' }}>{h.scorePercent}%</span>
                                                <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, fontWeight: 700, background: h.candidateStatus === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: h.candidateStatus === 'completed' ? '#34d399' : '#fbbf24', border: `1px solid ${h.candidateStatus === 'completed' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}` }}>{h.candidateStatus}</span>
                                                {h.eligible_next_round ? <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, fontWeight: 700, background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' }}>Eligible ✓</span> : null}
                                                <Link href={`/admin/campaigns/${h.campaignId}/results`} target="_blank">
                                                    <ExternalLink size={13} style={{ opacity: 0.4 }} />
                                                </Link>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 16, fontSize: 12, opacity: 0.55 }}>
                                            <span>{h.passedCount}/{h.totalCount} passed</span>
                                            <span>{h.totalPoints}/{h.maxPoints} pts</span>
                                            {h.tab_switches > 0 && <span style={{ color: '#fbbf24' }}>⚠ {h.tab_switches} tab switch{h.tab_switches !== 1 ? 'es' : ''}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

function RankBadge({ rank }) {
    if (rank === 1) return <span style={{ fontSize: 16 }}>🥇</span>;
    if (rank === 2) return <span style={{ fontSize: 16 }}>🥈</span>;
    if (rank === 3) return <span style={{ fontSize: 16 }}>🥉</span>;
    return <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>#{rank}</span>;
}

function CandidateCard({ candidate, submissions, rank, campaignId, onUpdate, show: showToast }) {
    const [expanded, setExpanded] = useState(false);
    const [openCodeIdx, setOpenCodeIdx] = useState(null);
    const [screenshots, setScreenshots] = useState(null);
    const [loadingShots, setLoadingShots] = useState(false);
    const [eligible, setEligible] = useState(!!candidate.eligible_next_round);
    const [showComments, setShowComments] = useState(false);
    const [showMove, setShowMove] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const totalPoints = submissions.reduce((sum, s) => sum + (s.points_earned || 0), 0);
    const maxPoints = submissions.reduce((sum, s) => sum + (s.question_points || 100), 0);
    const passed = submissions.filter(s => s.status === 'Passed').length;
    const sessionTabSwitches = submissions[0]?.session_tab_switches || 0;
    const isSuspicious = sessionTabSwitches > 0;
    const scorePercent = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

    const loadScreenshots = async () => {
        setLoadingShots(true);
        const res = await fetch(`/api/admin/candidates/${candidate.id}/screenshots`);
        const data = await res.json();
        setScreenshots(data.screenshots || []);
        setLoadingShots(false);
    };

    const toggleEligible = async () => {
        const next = !eligible;
        setEligible(next);
        await fetch(`/api/admin/candidates/${candidate.id}/eligible`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eligible: next })
        });
        showToast(next ? `${candidate.name} marked eligible for next round` : `Eligibility removed for ${candidate.name}`, 'success');
        if (onUpdate) onUpdate(candidate.id, { eligible_next_round: next ? 1 : 0 });
    };

    return (
        <>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: eligible ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', borderBottom: expanded ? '1px solid rgba(255,255,255,0.06)' : 'none' }} onClick={() => setExpanded(e => !e)}>
                    <div style={{ flexShrink: 0, width: 28, textAlign: 'center' }}><RankBadge rank={rank} /></div>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: `hsl(${candidate.name.charCodeAt(0) * 10}, 60%, 25%)`, border: `2px solid hsl(${candidate.name.charCodeAt(0) * 10}, 60%, 40%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0, color: `hsl(${candidate.name.charCodeAt(0) * 10}, 80%, 75%)` }}>
                        {candidate.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {candidate.name}
                            {eligible && <span style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', background: 'rgba(59,130,246,0.12)', padding: '2px 8px', borderRadius: 99, border: '1px solid rgba(59,130,246,0.3)' }}>Next Round ✓</span>}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.45 }}>{candidate.email}</div>
                    </div>
                    <div style={{ flex: 1, maxWidth: 160, minWidth: 80 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                            <span style={{ opacity: 0.45 }}>Score</span>
                            <span style={{ fontWeight: 700, color: scorePercent >= 70 ? '#34d399' : scorePercent >= 40 ? '#fbbf24' : '#f87171' }}>{scorePercent}%</span>
                        </div>
                        <div className="progress-bar-track" style={{ height: 6 }}>
                            <div className="progress-bar-fill" style={{ width: `${scorePercent}%`, background: scorePercent >= 70 ? 'linear-gradient(90deg,#10b981,#34d399)' : scorePercent >= 40 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#fbbf24' }}>{totalPoints}<span style={{ fontSize: 11, opacity: 0.5 }}>/{maxPoints}</span></div>
                            <div style={{ fontSize: 10, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>pts</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: passed === submissions.length ? '#34d399' : '#fbbf24' }}>{passed}/{submissions.length}</div>
                            <div style={{ fontSize: 10, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Passed</div>
                        </div>
                        {isSuspicious ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#fbbf24', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', padding: '5px 10px', borderRadius: 8 }}>
                                <ShieldAlert size={13} /> {sessionTabSwitches}× switch
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#34d399', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: '5px 10px', borderRadius: 8 }}>
                                <Shield size={13} /> Clean
                            </div>
                        )}
                        {/* Action buttons — stop propagation so clicks don't expand the card */}
                        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                            <button onClick={toggleEligible} title={eligible ? 'Remove eligibility' : 'Mark eligible for next round'}
                                style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1px solid ${eligible ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}`, background: eligible ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)', color: eligible ? '#60a5fa' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                {eligible ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />} {eligible ? 'Eligible' : 'Eligible?'}
                            </button>
                            <button onClick={() => setShowMove(true)} title="Move to another campaign"
                                className="button outline" style={{ fontSize: 12, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <ArrowRightCircle size={13} />
                            </button>
                            <button onClick={() => setShowHistory(true)} title="View campaign history"
                                className="button outline" style={{ fontSize: 12, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <History size={13} />
                            </button>
                            <button onClick={e => { e.stopPropagation(); loadScreenshots(); }} disabled={loadingShots}
                                className="button outline" style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5, color: '#60a5fa', borderColor: 'rgba(59,130,246,0.3)' }}>
                                {loadingShots ? <div className="spinner sm" /> : <Camera size={13} />} Surveillance
                            </button>
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}>
                            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                    </div>
                </div>

                {expanded && (
                    <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {submissions.map((s, i) => (
                            <div key={i} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}>
                                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(s.status), flexShrink: 0 }} />
                                        <span style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.question_title}</span>
                                        {s.question_type === 'mcq' && <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(139,92,246,0.12)', padding: '2px 7px', borderRadius: 6, border: '1px solid rgba(139,92,246,0.25)', flexShrink: 0 }}>MCQ</span>}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: s.points_earned > 0 ? '#fbbf24' : 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
                                            {s.points_earned || 0}/{s.question_points || 100} pts
                                        </span>
                                        {s.test_cases_total > 0 && s.question_type !== 'mcq' && (
                                            <span style={{ fontSize: 11, color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>({s.test_cases_passed}/{s.test_cases_total} tests)</span>
                                        )}
                                        <StatusBadge status={s.status} />
                                        {s.tab_switches > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '3px 8px', borderRadius: 6 }}>⚠ {s.tab_switches}× switch</span>}
                                        <span style={{ fontSize: 11, opacity: 0.35, fontFamily: 'var(--font-mono)' }}>{new Date(s.created_at).toLocaleTimeString()}</span>
                                        {s.question_type !== 'mcq' && (
                                            <button onClick={() => setOpenCodeIdx(openCodeIdx === i ? null : i)} className="button outline" style={{ fontSize: 11, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <Code2 size={11} /> {openCodeIdx === i ? 'Hide' : 'Code'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {openCodeIdx === i && s.question_type !== 'mcq' && (
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <pre style={{ padding: '14px 18px', background: '#0d1117', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.65, overflowX: 'auto', whiteSpace: 'pre', margin: 0, maxHeight: 320 }}>{s.code}</pre>
                                    </div>
                                )}
                                {s.question_type === 'mcq' && (
                                    <div style={{ padding: '8px 16px 12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                                        Selected: <span style={{ fontFamily: 'var(--font-mono)', color: s.status === 'Passed' ? '#34d399' : '#f87171' }}>{s.code || '—'}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                        {/* Comments toggle */}
                        <button onClick={() => setShowComments(v => !v)} className="button outline" style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
                            <MessageSquare size={13} /> {showComments ? 'Hide Notes' : 'Admin Notes'}
                        </button>
                    </div>
                )}
                <CommentsPanel candidateId={candidate.id} show={showComments && expanded} />
            </div>

            {screenshots && <ScreenshotModal candidateName={candidate.name} screenshots={screenshots} onClose={() => setScreenshots(null)} />}
            {showMove && <MoveToCampaignModal candidate={{ ...candidate, campaignId }} onClose={() => setShowMove(false)} onMoved={(name) => showToast(`${candidate.name} added to "${name}"`, 'success')} />}
            {showHistory && <CandidateHistoryModal email={candidate.email} onClose={() => setShowHistory(false)} />}
        </>
    );
}

const PAGE_SIZE = 15;

export default function CampaignResults({ params }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [campaign, setCampaign] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [eligibility, setEligibility] = useState({});
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const { toasts, show } = useToast();

    useEffect(() => {
        Promise.all([
            fetch(`/api/admin/campaigns/${id}`).then(r => r.json()),
            fetch(`/api/admin/campaigns/${id}/submissions`).then(r => r.json()),
        ]).then(([campData, subData]) => {
            if (campData.campaign) setCampaign(campData.campaign);
            const subs = subData.submissions || [];
            setSubmissions(subs);
            // Build initial eligibility map
            const eligMap = {};
            subs.forEach(s => { eligMap[s.candidate_id] = s.eligible_next_round; });
            setEligibility(eligMap);
            setLoading(false);
        });
    }, [id]);

    const handleCandidateUpdate = (candidateId, updates) => {
        if ('eligible_next_round' in updates) {
            setEligibility(e => ({ ...e, [candidateId]: updates.eligible_next_round }));
        }
    };

    const candidateMap = {};
    submissions.forEach(s => {
        if (!candidateMap[s.candidate_id]) {
            candidateMap[s.candidate_id] = {
                id: s.candidate_id, name: s.name, email: s.email,
                eligible_next_round: eligibility[s.candidate_id] ?? s.eligible_next_round,
                submissions: []
            };
        }
        candidateMap[s.candidate_id].submissions.push(s);
    });

    const allCandidates = Object.values(candidateMap).sort((a, b) => {
        const ptA = a.submissions.reduce((sum, s) => sum + (s.points_earned || 0), 0);
        const ptB = b.submissions.reduce((sum, s) => sum + (s.points_earned || 0), 0);
        return ptB - ptA;
    });

    // Sync eligibility state into candidates
    allCandidates.forEach(c => { c.eligible_next_round = eligibility[c.id] ?? c.eligible_next_round; });

    const filtered = allCandidates.filter(c => {
        const ms = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
        const mf = filterStatus === 'All'
            || (filterStatus === 'Passed' && c.submissions.some(s => s.status === 'Passed'))
            || (filterStatus === 'Failed' && c.submissions.every(s => s.status !== 'Passed'))
            || (filterStatus === 'Suspicious' && (c.submissions[0]?.session_tab_switches > 0))
            || (filterStatus === 'Eligible' && c.eligible_next_round);
        return ms && mf;
    });

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const totalPassed = allCandidates.filter(c => c.submissions.some(s => s.status === 'Passed')).length;
    const totalSuspicious = allCandidates.filter(c => (c.submissions[0]?.session_tab_switches > 0)).length;
    const totalEligible = allCandidates.filter(c => eligibility[c.id] ?? c.eligible_next_round).length;
    const passRate = allCandidates.length > 0 ? Math.round((totalPassed / allCandidates.length) * 100) : 0;
    const avgScore = allCandidates.length > 0
        ? Math.round(allCandidates.reduce((sum, c) => {
            const pts = c.submissions.reduce((s2, s) => s2 + (s.points_earned || 0), 0);
            const max = c.submissions.reduce((s2, s) => s2 + (s.question_points || 100), 0);
            return sum + (max > 0 ? (pts / max) * 100 : 0);
        }, 0) / allCandidates.length) : 0;

    return (
        <div className="container" style={{ maxWidth: 1200 }}>
            <ToastContainer toasts={toasts} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 14 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <Link href={`/admin/campaigns/${id}`}>
                            <button className="button outline" style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <ArrowLeft size={13} /> Campaign
                            </button>
                        </Link>
                        <span style={{ opacity: 0.2 }}>›</span>
                        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Trophy size={22} color="#fbbf24" /> Candidate Results
                        </h1>
                    </div>
                    {campaign && <p style={{ fontSize: 13, opacity: 0.45 }}>{campaign.name} · {campaign.duration} min</p>}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Candidates', value: allCandidates.length, color: '#3b82f6' },
                    { label: 'Submissions', value: submissions.length, color: '#8b5cf6' },
                    { label: 'Passed', value: totalPassed, color: '#10b981' },
                    { label: 'Suspicious', value: totalSuspicious, color: '#f59e0b' },
                    { label: 'Pass Rate', value: `${passRate}%`, color: passRate >= 50 ? '#10b981' : '#ef4444' },
                    { label: 'Avg Score', value: `${avgScore}%`, color: avgScore >= 70 ? '#10b981' : avgScore >= 40 ? '#f59e0b' : '#ef4444' },
                    { label: 'Next Round', value: totalEligible, color: '#60a5fa' },
                ].map(s => (
                    <div key={s.label} className="stat-card" style={{ padding: '14px 18px', borderTop: `3px solid ${s.color}` }}>
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {allCandidates.length > 0 && (
                <div style={{ marginBottom: 24, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                        <span style={{ opacity: 0.5 }}>Campaign Pass Rate</span>
                        <span style={{ fontWeight: 700, color: passRate >= 50 ? '#34d399' : '#f87171' }}>{totalPassed}/{allCandidates.length} candidates · {passRate}%</span>
                    </div>
                    <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${passRate}%`, background: passRate >= 50 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#ef4444,#f87171)' }} />
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }} />
                    <input type="text" className="input" placeholder="Search by name or email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 36, fontSize: 13 }} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[['All', '#60a5fa'], ['Passed', '#34d399'], ['Failed', '#f87171'], ['Suspicious', '#fbbf24'], ['Eligible', '#60a5fa']].map(([label, color]) => (
                        <button key={label} onClick={() => { setFilterStatus(label); setPage(1); }} style={{ padding: '9px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1px solid ${filterStatus === label ? color + '50' : 'rgba(255,255,255,0.08)'}`, background: filterStatus === label ? color + '18' : 'rgba(255,255,255,0.04)', color: filterStatus === label ? color : 'rgba(255,255,255,0.45)' }}>
                            {label}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, opacity: 0.4 }}>
                    <Star size={12} /> Sorted by score · {filtered.length} of {allCandidates.length}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px 0', opacity: 0.4 }}>
                    <div className="spinner lg" style={{ margin: '0 auto 14px' }} />Loading results…
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {paginated.map((c, i) => (
                            <CandidateCard
                                key={c.id}
                                candidate={c}
                                submissions={c.submissions}
                                rank={(page - 1) * PAGE_SIZE + i + 1}
                                campaignId={id}
                                onUpdate={handleCandidateUpdate}
                                show={show}
                            />
                        ))}
                        {filtered.length === 0 && (
                            <div style={{ border: '2px dashed rgba(255,255,255,0.06)', borderRadius: 14, padding: '60px 24px', textAlign: 'center', opacity: 0.4 }}>
                                <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>{allCandidates.length === 0 ? 'No submissions yet' : 'No matches'}</div>
                                <div style={{ fontSize: 13 }}>{allCandidates.length === 0 ? 'Candidates will appear here once they submit answers.' : 'Try a different search or filter.'}</div>
                            </div>
                        )}
                    </div>
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 28 }}>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="button outline" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 5, opacity: page === 1 ? 0.4 : 1 }}>
                                <ChevronLeft size={14} /> Prev
                            </button>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} onClick={() => setPage(p)} style={{ width: 36, height: 36, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: `1px solid ${p === page ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`, background: p === page ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)', color: p === page ? '#60a5fa' : 'rgba(255,255,255,0.5)' }}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="button outline" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 5, opacity: page === totalPages ? 0.4 : 1 }}>
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
