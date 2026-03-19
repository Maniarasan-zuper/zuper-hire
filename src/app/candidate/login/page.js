'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, CheckCircle, ChevronRight, User, Mail, Hash, ArrowLeft, Lock } from 'lucide-react';

export default function CandidateLogin() {
    return (
        <Suspense>
            <CandidateLoginInner />
        </Suspense>
    );
}

function CandidateLoginInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [step, setStep] = useState(1); // 1 = enter details, 2 = confirm & start
    const [form, setForm] = useState({ name: '', email: '', campaignId: '' });
    const [locked, setLocked] = useState({ name: false, email: false, campaignId: false });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [campaignPreview, setCampaignPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const campaignDebounceRef = useRef(null);

    // Auto-fill fields from URL query params; lock fields that are pre-filled
    useEffect(() => {
        const cId = searchParams.get('campaign');
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const updates = {};
        const locks = {};
        if (cId) { updates.campaignId = cId; locks.campaignId = true; fetchCampaignPreview(cId); }
        if (name) { updates.name = decodeURIComponent(name); locks.name = true; }
        if (email) { updates.email = decodeURIComponent(email); locks.email = true; }
        if (Object.keys(updates).length) {
            setForm(f => ({ ...f, ...updates }));
            setLocked(l => ({ ...l, ...locks }));
        }
    }, [searchParams]);

    const fetchCampaignPreview = async (id) => {
        if (!id || id.length < 8) {
            setCampaignPreview(null);
            return;
        }
        setPreviewLoading(true);
        try {
            const res = await fetch(`/api/admin/campaigns/${id}`);
            const data = await res.json();
            if (data.campaign) {
                setCampaignPreview(data.campaign);
                setFieldErrors(fe => ({ ...fe, campaignId: undefined }));
            } else {
                setCampaignPreview(null);
                setFieldErrors(fe => ({ ...fe, campaignId: 'Campaign not found' }));
            }
        } catch {
            setCampaignPreview(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleCampaignIdChange = (val) => {
        setForm(f => ({ ...f, campaignId: val }));
        setCampaignPreview(null);
        setFieldErrors(fe => ({ ...fe, campaignId: undefined }));
        clearTimeout(campaignDebounceRef.current);
        campaignDebounceRef.current = setTimeout(() => fetchCampaignPreview(val.trim()), 600);
    };

    const validateStep1 = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Full name is required';
        if (!form.email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';
        if (!form.campaignId.trim()) errs.campaignId = 'Invitation ID is required';
        else if (!campaignPreview) errs.campaignId = 'Enter a valid Campaign ID';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleContinue = (e) => {
        e.preventDefault();
        if (validateStep1()) setStep(2);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/candidate/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('candidateId', data.candidateId);
                router.push(`/candidate/${data.campaignId}`);
            } else {
                setError(data.error || 'Login failed. Please try again.');
                setStep(1);
            }
        } catch {
            setError('Network error. Please check your connection and try again.');
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', position: 'relative', overflow: 'hidden'
        }}>
            {/* Background glow blobs */}
            <div style={{
                position: 'fixed', top: '20%', left: '15%', width: 500, height: 500,
                background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
                pointerEvents: 'none', zIndex: 0
            }} />
            <div style={{
                position: 'fixed', bottom: '20%', right: '10%', width: 400, height: 400,
                background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
                pointerEvents: 'none', zIndex: 0
            }} />

            <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ margin: '0 auto 16px' }}>
                        <img src="/zuper_logo.png" alt="Zuper Hire" style={{ height: 48, width: 'auto' }} className="dark-logo mx-auto" />
                        <img src="/zuper_logo_light.png" alt="Zuper Hire" style={{ height: 48, width: 'auto' }} className="light-logo mx-auto" />
                    </div>
                    <h1 style={{
                        fontSize: 28, fontWeight: 800, letterSpacing: '-0.8px',
                        background: 'linear-gradient(135deg, var(--foreground), var(--primary))',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>Zuper Hire</h1>
                    <p style={{ fontSize: 13, opacity: 0.55, marginTop: 4 }}>Technical Interview Environment</p>
                </div>

                {/* Step indicator */}
                <div className="steps" style={{ marginBottom: 28 }}>
                    {[
                        { label: 'Identify', num: 1 },
                        { label: 'Confirm', num: 2 },
                    ].map((s) => (
                        <div key={s.num} className={`step-item ${step > s.num ? 'done' : step === s.num ? 'active' : ''}`}>
                            <div className="step-circle">
                                {step > s.num ? <CheckCircle size={14} /> : s.num}
                            </div>
                            <div className="step-label">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Card */}
                <div style={{
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 18, padding: '32px 36px',
                    boxShadow: '0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(20px)'
                }}>

                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 20 }}>
                            <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* ── STEP 1: Enter details ── */}
                    {step === 1 && (
                        <form onSubmit={handleContinue} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 8 }}>
                                    Full Name
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <User size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }} />
                                    <input
                                        type="text"
                                        placeholder="Jane Smith"
                                        style={{ paddingLeft: 40, paddingRight: locked.name ? 40 : undefined }}
                                        className={`input${fieldErrors.name ? ' border-red-500' : ''}`}
                                        value={form.name}
                                        readOnly={locked.name}
                                        onChange={e => {
                                            if (locked.name) return;
                                            setForm({ ...form, name: e.target.value });
                                            setFieldErrors(fe => ({ ...fe, name: undefined }));
                                        }}
                                        autoFocus={!locked.name}
                                    />
                                    {locked.name && <Lock size={13} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />}
                                </div>
                                {fieldErrors.name && <p style={{ fontSize: 12, color: '#f87171', marginTop: 5 }}>{fieldErrors.name}</p>}
                            </div>

                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 8 }}>
                                    Email Address
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }} />
                                    <input
                                        type="email"
                                        placeholder="jane@company.com"
                                        style={{ paddingLeft: 40, paddingRight: locked.email ? 40 : undefined }}
                                        className={`input${fieldErrors.email ? ' border-red-500' : ''}`}
                                        value={form.email}
                                        readOnly={locked.email}
                                        onChange={e => {
                                            if (locked.email) return;
                                            setForm({ ...form, email: e.target.value });
                                            setFieldErrors(fe => ({ ...fe, email: undefined }));
                                        }}
                                    />
                                    {locked.email && <Lock size={13} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />}
                                </div>
                                {fieldErrors.email && <p style={{ fontSize: 12, color: '#f87171', marginTop: 5 }}>{fieldErrors.email}</p>}
                            </div>

                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 8 }}>
                                    Invitation ID
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Hash size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }} />
                                    <input
                                        type="text"
                                        placeholder="Paste your invite code here"
                                        style={{ paddingLeft: 40, paddingRight: locked.campaignId ? 40 : undefined, fontFamily: 'var(--font-mono)', fontSize: 13 }}
                                        className={`input${fieldErrors.campaignId ? ' border-red-500' : ''}`}
                                        value={form.campaignId}
                                        readOnly={locked.campaignId}
                                        onChange={e => { if (!locked.campaignId) handleCampaignIdChange(e.target.value); }}
                                    />
                                    {locked.campaignId && <Lock size={13} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />}
                                    {previewLoading && (
                                        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
                                            <div className="spinner sm" />
                                        </div>
                                    )}
                                </div>
                                {fieldErrors.campaignId && !previewLoading && (
                                    <p style={{ fontSize: 12, color: '#f87171', marginTop: 5 }}>{fieldErrors.campaignId}</p>
                                )}

                                {/* Campaign preview */}
                                {campaignPreview && !previewLoading && (
                                    <div className="campaign-preview-card" style={{ marginTop: 10 }}>
                                        <CheckCircle size={18} color="#34d399" style={{ flexShrink: 0 }} />
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: '#34d399' }}>{campaignPreview.name}</div>
                                            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                                                {campaignPreview.duration} min · {campaignPreview.status === 'live' || !campaignPreview.status ? '🟢 Active' : '🔴 Archived'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="button" style={{ marginTop: 6, padding: '13px', fontSize: 15, fontWeight: 700 }}>
                                Continue
                                <ChevronRight size={16} style={{ display: 'inline', marginLeft: 6, verticalAlign: 'middle' }} />
                            </button>
                        </form>
                    )}

                    {/* ── STEP 2: Confirm & start ── */}
                    {step === 2 && (
                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ textAlign: 'center', marginBottom: 8 }}>
                                <h2 style={{ fontWeight: 700, fontSize: 19, marginBottom: 4 }}>Ready to begin?</h2>
                                <p style={{ fontSize: 13, opacity: 0.5 }}>Review your details before starting the interview.</p>
                            </div>

                            {/* Summary */}
                            <div style={{
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12
                            }}>
                                {[
                                    { label: 'Name', value: form.name },
                                    { label: 'Email', value: form.email },
                                    { label: 'Campaign', value: campaignPreview?.name || form.campaignId },
                                    { label: 'Duration', value: campaignPreview ? `${campaignPreview.duration} minutes` : '—' },
                                ].map(row => (
                                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                                        <span style={{ opacity: 0.45, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{row.label}</span>
                                        <span style={{ fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Warning */}
                            <div className="alert alert-info" style={{ fontSize: 13 }}>
                                <ShieldAlert size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                                <span>Camera &amp; screen recording will be required once you enter the interview environment.</span>
                            </div>

                            <button type="submit" className="button success" style={{ padding: '13px', fontSize: 15, fontWeight: 700, marginTop: 4 }} disabled={loading}>
                                {loading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                        <div className="spinner" /> Starting Session...
                                    </span>
                                ) : 'Begin Interview Session →'}
                            </button>

                            {/* Hide back button when all fields are pre-filled from link */}
                            {!(locked.name && locked.email && locked.campaignId) && (
                                <button type="button" onClick={() => setStep(1)} className="button outline" style={{ padding: '11px', fontSize: 13 }}>
                                    <ArrowLeft size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                                    Edit Details
                                </button>
                            )}
                        </form>
                    )}
                </div>

                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <Link href="/" style={{ fontSize: 12, opacity: 0.35, display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'opacity 0.2s' }}>
                        <ArrowLeft size={12} /> Back to Homepage
                    </Link>
                </div>
            </div>
        </div>
    );
}
