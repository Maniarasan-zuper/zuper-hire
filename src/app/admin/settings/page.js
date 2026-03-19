'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Save, CheckCircle, AlertTriangle, Eye, EyeOff, TestTube, RotateCcw, Camera, Trash2 } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

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
    const icons = { success: <CheckCircle size={14} />, error: <AlertTriangle size={14} />, info: <span style={{ fontWeight: 700 }}>i</span> };
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

const DEFAULT_TEMPLATE = {
    subject: "You've been invited to a technical assessment — {{campaign_name}}",
    body: `Hello {{name}},

You have been invited to complete a technical assessment for the role associated with {{campaign_name}}.

Click the link below to start your interview:
{{link}}

The assessment is {{duration}} minutes long. Please make sure you are in a quiet environment with a stable internet connection before you begin.

Available template variables:
  {{name}} — Candidate name
  {{campaign_name}} — Campaign name
  {{link}} — Unique interview link
  {{duration}} — Duration in minutes
  {{email}} — Candidate email

Good luck!

Best regards,
The Hiring Team`
};

export default function AdminSettings() {
    const [smtp, setSmtp] = useState({ host: '', port: 587, secure: false, user: '', password: '', from_name: 'Zuper Hire', from_email: '' });
    const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const [screenshotStats, setScreenshotStats] = useState(null);
    const [cleanupDays, setCleanupDays] = useState(30);
    const [cleaning, setCleaning] = useState(false);
    const { toasts, show } = useToast();

    const loadScreenshotStats = () => {
        fetch('/api/admin/screenshots/cleanup')
            .then(r => r.json()).then(setScreenshotStats);
    };

    const runCleanup = async () => {
        setCleaning(true);
        const res = await fetch('/api/admin/screenshots/cleanup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ days: cleanupDays })
        });
        const d = await res.json();
        setCleaning(false);
        if (d.success) {
            show(`Cleaned up ${d.deletedByAge + d.deletedByCount} screenshots. ${d.remaining} remaining.`, 'success');
            loadScreenshotStats();
        }
    };

    useEffect(() => {
        fetch('/api/admin/settings')
            .then(r => r.json())
            .then(d => {
                if (d.smtp) setSmtp(d.smtp);
                if (d.email_template) setTemplate(d.email_template);
            })
            .finally(() => setLoading(false));
        loadScreenshotStats();
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ smtp, email_template: template })
            });
            if (res.ok) show('Settings saved!', 'success');
            else show('Failed to save settings', 'error');
        } catch { show('Network error', 'error'); }
        finally { setSaving(false); }
    };

    const sendTest = async () => {
        if (!testEmail.trim()) return;
        setSendingTest(true);
        try {
            // Create a dummy test — just send to the test email using the configured SMTP
            const res = await fetch('/api/admin/settings/test-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: testEmail })
            });
            const data = await res.json();
            if (res.ok) show(`Test email sent to ${testEmail}`, 'success');
            else show(data.error || 'Failed to send test email', 'error');
        } catch { show('Network error', 'error'); }
        finally { setSendingTest(false); }
    };

    if (loading) return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner lg" />
        </div>
    );

    return (
        <div className="container" style={{ maxWidth: 860 }}>
            <ToastContainer toasts={toasts} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link href="/admin">
                        <button className="button outline" style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                            <ArrowLeft size={14} /> Admin
                        </button>
                    </Link>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mail size={18} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.4px' }}>Email Settings</h1>
                        <p style={{ fontSize: 12, opacity: 0.4 }}>Configure SMTP and invitation template</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <ThemeToggle />
                    <button onClick={save} disabled={saving} className="button" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                        {saving ? <><div className="spinner sm" /> Saving...</> : <><Save size={14} /> Save Settings</>}
                    </button>
                </div>
            </div>

            {/* SMTP Configuration */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={16} color="#60a5fa" /> SMTP Configuration
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ gridColumn: '1/-1' }}>
                        <label style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 6 }}>SMTP Host</label>
                        <input type="text" className="input" value={smtp.host} onChange={e => setSmtp(s => ({ ...s, host: e.target.value }))} placeholder="smtp.gmail.com or smtp.sendgrid.net" />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 6 }}>Port</label>
                        <input type="number" className="input" value={smtp.port} onChange={e => setSmtp(s => ({ ...s, port: parseInt(e.target.value) || 587 }))} placeholder="587" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                            <div
                                onClick={() => setSmtp(s => ({ ...s, secure: !s.secure }))}
                                style={{ width: 44, height: 24, borderRadius: 12, background: smtp.secure ? '#3b82f6' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
                            >
                                <div style={{ position: 'absolute', top: 3, left: smtp.secure ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                            </div>
                            TLS/SSL (port 465)
                        </label>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 6 }}>SMTP Username</label>
                        <input type="text" className="input" value={smtp.user} onChange={e => setSmtp(s => ({ ...s, user: e.target.value }))} placeholder="your@email.com or API key" />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 6 }}>SMTP Password</label>
                        <div style={{ position: 'relative' }}>
                            <input type={showPw ? 'text' : 'password'} className="input" value={smtp.password} onChange={e => setSmtp(s => ({ ...s, password: e.target.value }))} placeholder="••••••••" style={{ paddingRight: 42 }} />
                            <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0 }}>
                                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 6 }}>From Name</label>
                        <input type="text" className="input" value={smtp.from_name} onChange={e => setSmtp(s => ({ ...s, from_name: e.target.value }))} placeholder="Zuper Hire" />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 6 }}>From Email</label>
                        <input type="email" className="input" value={smtp.from_email} onChange={e => setSmtp(s => ({ ...s, from_email: e.target.value }))} placeholder="noreply@yourcompany.com" />
                    </div>
                </div>

                {/* Quick presets */}
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Quick Presets</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[
                            { name: 'Gmail', host: 'smtp.gmail.com', port: 587, secure: false },
                            { name: 'Outlook', host: 'smtp.office365.com', port: 587, secure: false },
                            { name: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, secure: false },
                            { name: 'Mailgun', host: 'smtp.mailgun.org', port: 587, secure: false },
                        ].map(preset => (
                            <button key={preset.name} type="button" onClick={() => setSmtp(s => ({ ...s, host: preset.host, port: preset.port, secure: preset.secure }))}
                                style={{ padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.08)', color: '#60a5fa' }}>
                                {preset.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Test email */}
                <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 6 }}>Send Test Email</label>
                        <input type="email" className="input" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@example.com" />
                    </div>
                    <button onClick={sendTest} disabled={sendingTest || !testEmail.trim()} className="button outline" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 18px', fontSize: 13, whiteSpace: 'nowrap' }}>
                        {sendingTest ? <><div className="spinner sm" /> Sending...</> : <><TestTube size={14} /> Send Test</>}
                    </button>
                </div>
            </div>

            {/* Email Template */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Mail size={16} color="#a78bfa" /> Invitation Email Template
                    </h2>
                    <button onClick={() => setTemplate(DEFAULT_TEMPLATE)} className="button outline" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 12px' }}>
                        <RotateCcw size={13} /> Reset to Default
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 6 }}>Subject</label>
                        <input type="text" className="input" value={template.subject} onChange={e => setTemplate(t => ({ ...t, subject: e.target.value }))} placeholder="Email subject…" />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 6 }}>Body</label>
                        <textarea
                            className="input"
                            value={template.body}
                            onChange={e => setTemplate(t => ({ ...t, body: e.target.value }))}
                            rows={14}
                            style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7 }}
                        />
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Available Variables</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {[
                                ['{{name}}', 'Candidate name'],
                                ['{{campaign_name}}', 'Campaign name'],
                                ['{{link}}', 'Interview link'],
                                ['{{duration}}', 'Duration (minutes)'],
                                ['{{email}}', 'Candidate email'],
                            ].map(([v, desc]) => (
                                <div key={v} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 7px', borderRadius: 5, background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>{v}</code>
                                    <span style={{ opacity: 0.45 }}>{desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Screenshot Storage */}
            <div style={{ marginTop: 28, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px 28px' }}>
                <h2 style={{ fontWeight: 700, fontSize: 17, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Camera size={18} color="#60a5fa" /> Screenshot Storage
                </h2>
                <p style={{ fontSize: 13, opacity: 0.5, marginBottom: 20 }}>
                    Surveillance screenshots are stored as base64 in the database. The system automatically keeps the latest 30 per candidate per type (camera / screen). Use cleanup to remove old data manually.
                </p>
                {screenshotStats && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                        {[
                            { label: 'Total stored', value: screenshotStats.total },
                            ...( screenshotStats.byType || []).map(t => ({ label: t.type, value: t.n })),
                            { label: 'Oldest', value: screenshotStats.oldest ? new Date(screenshotStats.oldest).toLocaleDateString() : '—' },
                        ].map(s => (
                            <div key={s.label} style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
                                <div style={{ fontSize: 11, opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{s.label}</div>
                                <div style={{ fontWeight: 700, fontSize: 18 }}>{s.value}</div>
                            </div>
                        ))}
                    </div>
                )}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: 13, opacity: 0.6 }}>Delete screenshots older than</label>
                    <input
                        type="number" min={1} max={365}
                        value={cleanupDays}
                        onChange={e => setCleanupDays(parseInt(e.target.value) || 30)}
                        style={{ width: 70, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(15,23,42,0.6)', color: 'var(--foreground)', fontSize: 13 }}
                    />
                    <label style={{ fontSize: 13, opacity: 0.6 }}>days</label>
                    <button onClick={runCleanup} disabled={cleaning} className="danger-btn button" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', fontSize: 13 }}>
                        {cleaning ? <><div className="spinner sm" /> Cleaning…</> : <><Trash2 size={14} /> Run Cleanup</>}
                    </button>
                </div>
            </div>

            {/* Save button (bottom) */}
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={save} disabled={saving} className="button" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, padding: '12px 28px', fontSize: 15 }}>
                    {saving ? <><div className="spinner sm" /> Saving...</> : <><Save size={15} /> Save All Settings</>}
                </button>
            </div>
        </div>
    );
}
