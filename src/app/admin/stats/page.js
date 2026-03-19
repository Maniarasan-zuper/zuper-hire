'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    BarChart2, Users, FileText, CheckCircle, AlertTriangle,
    ArrowLeft, TrendingUp, Shield, Database, Activity,
    Trophy, Clock, Eye, X
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
const diffColor = d => d === 'Easy' ? '#34d399' : d === 'Medium' ? '#fbbf24' : '#f87171';

function StatCard({ label, value, sub, color = '#60a5fa', icon: Icon }) {
    return (
        <div className="stat-card" style={{ borderTop: `3px solid ${color}`, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                {Icon && <Icon size={16} color={color} style={{ opacity: 0.8 }} />}
                <div className="stat-label" style={{ fontSize: 11 }}>{label}</div>
            </div>
            <div className="stat-value" style={{ color, fontSize: 28, lineHeight: 1 }}>{value}</div>
            {sub && <div className="stat-sub" style={{ marginTop: 6, fontSize: 12 }}>{sub}</div>}
        </div>
    );
}

function SectionTitle({ icon: Icon, color, children }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            {Icon && <Icon size={18} color={color} />}
            <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>{children}</h2>
        </div>
    );
}

// Simple inline bar
function Bar({ value, max, color }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
        </div>
    );
}

// Donut-style ring using SVG
function Ring({ pct, color, size = 80, stroke = 8 }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        </svg>
    );
}

// Mini activity chart (sparkline bars)
function ActivityChart({ data, color, label }) {
    if (!data || data.length === 0) {
        return <div style={{ fontSize: 12, opacity: 0.35, padding: '20px 0' }}>No activity in the last 30 days</div>;
    }
    const max = Math.max(...data.map(d => d.n), 1);
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
                {data.map((d, i) => (
                    <div key={i} title={`${d.day}: ${d.n} ${label}`} style={{
                        flex: 1, minWidth: 4, background: color,
                        height: `${Math.max(4, (d.n / max) * 60)}px`,
                        borderRadius: '2px 2px 0 0', opacity: 0.7,
                        transition: 'height 0.3s ease'
                    }} />
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, opacity: 0.3 }}>
                <span>{data[0]?.day?.slice(5)}</span>
                <span>{data[data.length - 1]?.day?.slice(5)}</span>
            </div>
        </div>
    );
}

export default function StatsPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(r => r.json())
            .then(d => { setStats(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center', opacity: 0.5 }}>
                    <div className="spinner" style={{ margin: '0 auto 12px', width: 32, height: 32 }} />
                    <div>Loading stats…</div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: 60, opacity: 0.5 }}>
                <AlertTriangle size={32} style={{ margin: '0 auto 12px' }} />
                <div>Failed to load stats.</div>
            </div>
        );
    }

    const { campaigns, candidates, submissions, pool, integrity, activity, topCampaigns } = stats;
    const maxCampCandidates = Math.max(...(topCampaigns.map(c => c.candidate_count)), 1);

    return (
        <div className="container" style={{ maxWidth: 1100 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <BarChart2 size={22} color="#8b5cf6" />
                        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Platform Stats
                        </h1>
                    </div>
                    <p style={{ fontSize: 14, opacity: 0.45 }}>Overview of interviews, candidates, and activity</p>
                </div>
                <Link href="/admin">
                    <button className="button outline" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <ArrowLeft size={14} /> Admin
                    </button>
                </Link>
            </div>

            {/* ── Top KPIs ─────────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 32 }}>
                <StatCard label="Total Campaigns" value={campaigns.total} sub={`${campaigns.live} live · ${campaigns.archived} archived`} color="#8b5cf6" icon={FileText} />
                <StatCard label="Total Candidates" value={candidates.total} sub={`${candidates.completed} completed`} color="#60a5fa" icon={Users} />
                <StatCard label="Interviews Taken" value={candidates.started + candidates.completed} sub={`${candidates.completionRate}% completion rate`} color="#34d399" icon={CheckCircle} />
                <StatCard label="Total Submissions" value={submissions.total} sub={`${submissions.passRate}% pass rate`} color="#fbbf24" icon={TrendingUp} />
                <StatCard label="Avg Score" value={`${submissions.avgScore} pts`} sub="per submission" color="#f472b6" icon={Trophy} />
                <StatCard label="Pool Questions" value={pool.total} sub={`${pool.byType.find(t => t.question_type === 'mcq')?.n || 0} MCQ · ${pool.byType.find(t => t.question_type === 'coding')?.n || 0} Coding`} color="#a78bfa" icon={Database} />
            </div>

            {/* ── Candidate Funnel + Submission Ring ───────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>

                {/* Candidate funnel */}
                <div className="card" style={{ padding: '20px 24px' }}>
                    <SectionTitle icon={Users} color="#60a5fa">Candidate Funnel</SectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {[
                            { label: 'Invited (not started)', value: candidates.invited, color: '#60a5fa' },
                            { label: 'In Progress', value: candidates.started, color: '#fbbf24' },
                            { label: 'Completed', value: candidates.completed, color: '#34d399' },
                            { label: 'Eligible – Next Round', value: candidates.eligible, color: '#a78bfa' },
                        ].map(row => (
                            <div key={row.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                                    <span style={{ opacity: 0.7 }}>{row.label}</span>
                                    <span style={{ fontWeight: 700, color: row.color }}>{row.value}</span>
                                </div>
                                <Bar value={row.value} max={candidates.total} color={row.color} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submission pass rate ring */}
                <div className="card" style={{ padding: '20px 24px' }}>
                    <SectionTitle icon={CheckCircle} color="#34d399">Submission Quality</SectionTitle>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <Ring pct={submissions.passRate} color="#34d399" size={100} stroke={10} />
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#34d399' }}>{submissions.passRate}%</div>
                                <div style={{ fontSize: 9, opacity: 0.45, fontWeight: 700 }}>PASS</div>
                            </div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {[
                                { label: 'Passed', value: submissions.passed, color: '#34d399' },
                                { label: 'Failed / Partial', value: submissions.total - submissions.passed, color: '#f87171' },
                            ].map(row => (
                                <div key={row.label}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                                        <span style={{ opacity: 0.7 }}>{row.label}</span>
                                        <span style={{ fontWeight: 700, color: row.color }}>{row.value}</span>
                                    </div>
                                    <Bar value={row.value} max={submissions.total} color={row.color} />
                                </div>
                            ))}
                            <div style={{ marginTop: 4, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: 11, opacity: 0.45 }}>Avg score per submission</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24', marginTop: 2 }}>{submissions.avgScore} pts</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Integrity */}
                <div className="card" style={{ padding: '20px 24px' }}>
                    <SectionTitle icon={Shield} color="#f87171">Integrity Signals</SectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1, padding: '14px 16px', background: 'rgba(239,68,68,0.06)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.15)', textAlign: 'center' }}>
                                <div style={{ fontSize: 26, fontWeight: 800, color: '#f87171' }}>{integrity.highTabSwitches}</div>
                                <div style={{ fontSize: 11, opacity: 0.55, marginTop: 3 }}>Candidates with ≥5 tab switches</div>
                            </div>
                            <div style={{ flex: 1, padding: '14px 16px', background: 'rgba(251,191,36,0.06)', borderRadius: 10, border: '1px solid rgba(251,191,36,0.15)', textAlign: 'center' }}>
                                <div style={{ fontSize: 26, fontWeight: 800, color: '#fbbf24' }}>{integrity.avgTabSwitches}</div>
                                <div style={{ fontSize: 11, opacity: 0.55, marginTop: 3 }}>Avg tab switches</div>
                            </div>
                        </div>
                        <div style={{ padding: '14px 16px', background: 'rgba(139,92,246,0.06)', borderRadius: 10, border: '1px solid rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: 11, opacity: 0.55 }}>Screenshots captured</div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: '#a78bfa', marginTop: 2 }}>{integrity.totalScreenshots.toLocaleString()}</div>
                            </div>
                            <Eye size={28} color="#a78bfa" style={{ opacity: 0.4 }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Activity Charts ────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
                <div className="card" style={{ padding: '20px 24px' }}>
                    <SectionTitle icon={Activity} color="#60a5fa">Submissions – Last 30 Days</SectionTitle>
                    <ActivityChart data={activity.submissionsPerDay} color="#60a5fa" label="submissions" />
                </div>
                <div className="card" style={{ padding: '20px 24px' }}>
                    <SectionTitle icon={Users} color="#34d399">New Candidates – Last 30 Days</SectionTitle>
                    <ActivityChart data={activity.candidatesPerDay} color="#34d399" label="candidates" />
                </div>
            </div>

            {/* ── Question Pool Breakdown ────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
                <div className="card" style={{ padding: '20px 24px' }}>
                    <SectionTitle icon={Database} color="#a78bfa">Pool by Difficulty</SectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {['Easy', 'Medium', 'Hard'].map(d => {
                            const found = pool.byDifficulty.find(x => x.difficulty === d);
                            const n = found?.n || 0;
                            return (
                                <div key={d}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                                        <span style={{ color: diffColor(d), fontWeight: 600 }}>{d}</span>
                                        <span style={{ fontWeight: 700, color: diffColor(d) }}>{n}</span>
                                    </div>
                                    <Bar value={n} max={pool.total} color={diffColor(d)} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="card" style={{ padding: '20px 24px' }}>
                    <SectionTitle icon={Database} color="#a78bfa">Pool by Category</SectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 240, overflowY: 'auto' }}>
                        {pool.byCategory.length === 0 && <div style={{ fontSize: 13, opacity: 0.4 }}>No questions yet.</div>}
                        {pool.byCategory.map(row => (
                            <div key={row.category}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                                    <span style={{ opacity: 0.7 }}>{row.category}</span>
                                    <span style={{ fontWeight: 700, color: '#a78bfa' }}>{row.n}</span>
                                </div>
                                <Bar value={row.n} max={pool.byCategory[0]?.n || 1} color="#8b5cf6" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Top Campaigns ─────────────────────────────────────────────── */}
            <div className="card" style={{ padding: '20px 24px', marginBottom: 32 }}>
                <SectionTitle icon={Trophy} color="#fbbf24">Campaigns by Participation</SectionTitle>
                {topCampaigns.length === 0 && <div style={{ fontSize: 13, opacity: 0.4 }}>No campaigns yet.</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {topCampaigns.map((camp, i) => {
                        const compRate = camp.candidate_count > 0 ? Math.round((camp.completed_count / camp.candidate_count) * 100) : 0;
                        const isLive = !camp.status || camp.status === 'live';
                        return (
                            <div key={camp.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: i < 3 ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: i < 3 ? '#fbbf24' : 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                                    {i + 1}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                        <span style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{camp.name}</span>
                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, flexShrink: 0,
                                            background: isLive ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                                            color: isLive ? '#34d399' : '#9ca3af',
                                            border: `1px solid ${isLive ? 'rgba(16,185,129,0.3)' : 'rgba(107,114,128,0.25)'}` }}>
                                            {isLive ? '● Live' : '⊘ Archived'}
                                        </span>
                                    </div>
                                    <Bar value={camp.candidate_count} max={maxCampCandidates} color="#60a5fa" />
                                </div>
                                <div style={{ display: 'flex', gap: 20, flexShrink: 0, textAlign: 'right' }}>
                                    <div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: '#60a5fa' }}>{camp.candidate_count}</div>
                                        <div style={{ fontSize: 10, opacity: 0.4 }}>candidates</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399' }}>{compRate}%</div>
                                        <div style={{ fontSize: 10, opacity: 0.4 }}>completed</div>
                                    </div>
                                </div>
                                <Link href={`/admin/campaigns/${camp.id}`}>
                                    <button className="button outline" style={{ padding: '6px 12px', fontSize: 12 }}>View</button>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
