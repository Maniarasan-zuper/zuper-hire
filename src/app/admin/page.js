'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, Users, FolderPlus, Database, Zap, Clock, CheckCircle, Archive, ChevronRight, TrendingUp, BarChart2, Camera, Monitor, ShieldOff, LogOut, Shield, Mail, Copy } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

// ── Toast hook ──────────────────────────────────────────
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
    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast-${t.type} ${t.hiding ? 'hiding' : ''}`}>
                    {t.type === 'success' && <CheckCircle size={16} />}
                    {t.type === 'error' && <span>✗</span>}
                    {t.type === 'info' && <span>ℹ</span>}
                    {t.msg}
                </div>
            ))}
        </div>
    );
}

export default function AdminDashboard() {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState([]);
    const [campPage, setCampPage] = useState(1);
    const CAMP_PAGE_SIZE = 10;
    const [name, setName] = useState('');
    const [duration, setDuration] = useState(60);
    const [proctoring, setProctoring] = useState('full');
    const [creating, setCreating] = useState(false);
    const [me, setMe] = useState(null);
    const { toasts, show } = useToast();

    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.json())
            .then(d => {
                if (!d.admin) { router.replace('/admin/login'); return; }
                setMe(d.admin);
                fetch('/api/admin/campaigns')
                    .then(res => res.json())
                    .then(data => setCampaigns(data.campaigns || []));
            })
            .catch(() => router.replace('/admin/login'));
    }, [router]);

    const createCampaign = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setCreating(true);
        try {
            const res = await fetch('/api/admin/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, duration: parseInt(duration) || 60, proctoring })
            });
            const data = await res.json();
            router.push(`/admin/campaigns/${data.id}`);
        } catch {
            show('Failed to create campaign.', 'error');
        } finally {
            setCreating(false);
        }
    };

    const cloneCampaign = async (e, campId) => {
        e.stopPropagation();
        e.preventDefault();
        try {
            const res = await fetch(`/api/admin/campaigns/${campId}/clone`, { method: 'POST' });
            const data = await res.json();
            if (data.newId) {
                router.push(`/admin/campaigns/${data.newId}`);
            } else {
                show(data.error || 'Failed to clone campaign', 'error');
            }
        } catch {
            show('Network error.', 'error');
        }
    };

    const live = campaigns.filter(c => !c.status || c.status === 'live').length;
    const archived = campaigns.filter(c => c.status === 'archived').length;
    const campTotalPages = Math.max(1, Math.ceil(campaigns.length / CAMP_PAGE_SIZE));
    const paginatedCamps = campaigns.slice((campPage - 1) * CAMP_PAGE_SIZE, campPage * CAMP_PAGE_SIZE);

    return (
        <div className="container">
            <ToastContainer toasts={toasts} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <img src="/zuper_logo.png" alt="Zuper Hire" style={{ height: 36, width: 'auto' }} className="dark-logo" />
                            <img src="/zuper_logo_light.png" alt="Zuper Hire" style={{ height: 36, width: 'auto' }} className="light-logo" />
                        </div>
                        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.8px', background: 'linear-gradient(135deg, var(--foreground), var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Zuper Hire Portal
                        </h1>
                    </div>
                    <p style={{ fontSize: 14 }} className="opacity-40">Manage hiring campaigns, questions, and monitor candidates</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center' }}>
                    <Link href="/admin/stats">
                        <button className="button outline" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
                            <BarChart2 size={15} /> Stats
                        </button>
                    </Link>
                    <Link href="/admin/pool">
                        <button className="button outline" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
                            <Database size={15} /> Question Pool
                        </button>
                    </Link>
                    <Link href="/admin/settings">
                        <button className="button outline" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
                            <Mail size={15} /> Email Settings
                        </button>
                    </Link>
                    {me?.role === 'superadmin' && (
                        <Link href="/superadmin">
                            <button className="button outline" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#fbbf24', borderColor: 'rgba(245,158,11,0.3)' }}>
                                <Shield size={14} /> Super Admin
                            </button>
                        </Link>
                    )}
                    <ThemeToggle />
                    <button
                        onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/admin/login'); }}
                        className="button outline"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}
                    >
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
                <div className="stat-card" style={{ borderTop: '3px solid #3b82f6' }}>
                    <div className="stat-label">Total</div>
                    <div className="stat-value" style={{ color: '#60a5fa' }}>{campaigns.length}</div>
                    <div className="stat-sub">Campaigns</div>
                </div>
                <div className="stat-card" style={{ borderTop: '3px solid #10b981' }}>
                    <div className="stat-label">Live</div>
                    <div className="stat-value" style={{ color: '#34d399' }}>{live}</div>
                    <div className="stat-sub">Active now</div>
                </div>
                <div className="stat-card" style={{ borderTop: '3px solid #6b7280' }}>
                    <div className="stat-label">Archived</div>
                    <div className="stat-value" style={{ color: '#9ca3af' }}>{archived}</div>
                    <div className="stat-sub">Closed rounds</div>
                </div>
                <div className="stat-card" style={{ borderTop: '3px solid #8b5cf6' }}>
                    <div className="stat-label">Status</div>
                    <div className="stat-value" style={{ color: '#a78bfa', fontSize: 18, fontWeight: 700, marginTop: 4 }}>Operational</div>
                    <div className="stat-sub">All systems</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {/* Create campaign */}
                <div style={{ flex: '1 1 280px', maxWidth: 340 }}>
                    <div className="card glass-panel" style={{ position: 'sticky', top: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                            <FolderPlus size={20} color="var(--primary)" />
                            <h2 style={{ fontSize: 17, fontWeight: 700 }}>New Campaign</h2>
                        </div>

                        <form onSubmit={createCampaign} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 7 }}>Campaign Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. Q3 Node.js Senior Backend"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 7 }}>
                                    <Clock size={11} style={{ display: 'inline', marginRight: 5 }} />
                                    Duration
                                </label>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {[30, 60, 90, 120].map(d => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setDuration(d)}
                                            style={{
                                                padding: '6px 12px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                                                background: duration == d ? 'rgba(var(--primary-rgb), 0.15)' : 'var(--button-ghost-bg, rgba(0,0,0,0.04))',
                                                border: `1px solid ${duration == d ? 'var(--primary)' : 'var(--border)'}`,
                                                color: duration == d ? 'var(--primary)' : 'var(--text-muted)',
                                                cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            {d}m
                                        </button>
                                    ))}
                                    <input
                                        type="number"
                                        min="15" max="300"
                                        value={duration}
                                        onChange={e => setDuration(e.target.value)}
                                        className="input"
                                        style={{ width: 72, padding: '6px 10px', fontSize: 13 }}
                                        placeholder="min"
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 7 }}>
                                    Proctoring
                                </label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[
                                        { value: 'full', label: 'Full', sub: 'Camera + Screen', icon: Camera },
                                        { value: 'screen', label: 'Screen', sub: 'Screen only', icon: Monitor },
                                        { value: 'none', label: 'None', sub: 'No surveillance', icon: ShieldOff },
                                    ].map(({ value, label, sub, icon: Icon }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setProctoring(value)}
                                            style={{
                                                flex: 1, padding: '9px 6px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                                background: proctoring === value ? 'rgba(var(--primary-rgb), 0.15)' : 'var(--button-ghost-bg, rgba(0,0,0,0.04))',
                                                border: `1px solid ${proctoring === value ? 'var(--primary)' : 'var(--border)'}`,
                                                color: proctoring === value ? 'var(--primary)' : 'var(--text-muted)',
                                                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                                            }}
                                        >
                                            <Icon size={13} style={{ display: 'block', margin: '0 auto 4px' }} />
                                            {label}
                                            <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2, fontWeight: 400 }}>{sub}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="button" style={{ marginTop: 4, padding: '12px', fontWeight: 700 }} disabled={creating}>
                                {creating ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <div className="spinner" /> Creating...
                                    </span>
                                ) : (
                                    <span>Create Campaign <ChevronRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Campaign list */}
                <div style={{ flex: '2 1 400px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h2 style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, opacity: 0.9 }}>
                            <Users size={18} /> All Campaigns
                            <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.4, fontFamily: 'var(--font-mono)' }}>({campaigns.length})</span>
                        </h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {paginatedCamps.map(camp => {
                            const isLive = !camp.status || camp.status === 'live';
                            return (
                                <div
                                    key={camp.id}
                                    className="campaign-card"
                                    style={{ borderLeftColor: isLive ? '#10b981' : '#6b7280' }}
                                    onClick={() => window.location.href = `/admin/campaigns/${camp.id}`}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                            <div style={{ fontWeight: 700, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {camp.name}
                                            </div>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px',
                                                padding: '3px 8px', borderRadius: 99,
                                                background: isLive ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
                                                color: isLive ? '#34d399' : '#9ca3af',
                                                border: `1px solid ${isLive ? 'rgba(16,185,129,0.3)' : 'rgba(107,114,128,0.25)'}`,
                                                flexShrink: 0
                                            }}>
                                                {isLive ? '● Live' : '⊘ Archived'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', opacity: 0.4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={10} /> {camp.duration || 60} min
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {camp.proctoring === 'none' ? <ShieldOff size={10} /> : camp.proctoring === 'screen' ? <Monitor size={10} /> : <Camera size={10} />}
                                                {camp.proctoring === 'none' ? 'No proctoring' : camp.proctoring === 'screen' ? 'Screen only' : 'Full proctoring'}
                                            </span>
                                            <span>ID: {camp.id.substring(0, 8)}…</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={(e) => cloneCampaign(e, camp.id)}
                                            className="button outline"
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 12px' }}
                                            title="Clone Campaign"
                                            disabled={creating} // Disable button while cloning
                                        >
                                            <Copy size={13} />
                                        </button>
                                        <Link href={`/admin/campaigns/${camp.id}`}>
                                            <button className="button outline" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}>
                                                <Settings size={13} /> Manage
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}

                        {campaigns.length === 0 && (
                            <div style={{
                                border: '2px dashed rgba(255,255,255,0.07)', borderRadius: 14,
                                padding: '60px 24px', textAlign: 'center', opacity: 0.5
                            }}>
                                <FolderPlus size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                                <div style={{ fontWeight: 600, marginBottom: 6 }}>No campaigns yet</div>
                                <div style={{ fontSize: 13 }}>Create your first campaign using the form on the left.</div>
                            </div>
                        )}
                    </div>

                    {campTotalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                            <button onClick={() => setCampPage(p => Math.max(1, p - 1))} disabled={campPage === 1} className="button outline" style={{ padding: '6px 14px', fontSize: 13, opacity: campPage === 1 ? 0.4 : 1 }}>← Prev</button>
                            {Array.from({ length: campTotalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setCampPage(p)} className="button outline" style={{ padding: '6px 12px', fontSize: 13, minWidth: 36, background: p === campPage ? 'rgba(59,130,246,0.2)' : undefined, borderColor: p === campPage ? '#3b82f6' : undefined, color: p === campPage ? '#60a5fa' : undefined }}>{p}</button>
                            ))}
                            <button onClick={() => setCampPage(p => Math.min(campTotalPages, p + 1))} disabled={campPage === campTotalPages} className="button outline" style={{ padding: '6px 14px', fontSize: 13, opacity: campPage === campTotalPages ? 0.4 : 1 }}>Next →</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
