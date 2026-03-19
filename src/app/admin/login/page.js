'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Lock, User, AlertTriangle, LogIn } from 'lucide-react';

export default function AdminLogin() {
    const router = useRouter();
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    // Check if already logged in
    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.json())
            .then(d => {
                if (d.admin) {
                    if (d.admin.role === 'superadmin') router.replace('/superadmin');
                    else router.replace('/admin');
                } else {
                    setChecking(false);
                }
            })
            .catch(() => setChecking(false));
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Login failed'); return; }
            if (data.role === 'superadmin') router.replace('/superadmin');
            else router.replace('/admin');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner lg" />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24
        }}>
            <div className="card" style={{ maxWidth: 420, width: '100%', boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ margin: '0 auto 16px' }}>
                        <img src="/zuper_logo.png" alt="Zuper Hire" style={{ height: 48, width: 'auto' }} className="dark-logo mx-auto" />
                        <img src="/zuper_logo_light.png" alt="Zuper Hire" style={{ height: 48, width: 'auto' }} className="light-logo mx-auto" />
                    </div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.7px', marginBottom: 6 }}>Zuper Hire</h1>
                    <p style={{ fontSize: 14, opacity: 0.55 }}>Admin Portal — Sign In</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ position: 'relative' }}>
                        <User size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Username"
                            value={form.username}
                            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                            style={{ paddingLeft: 40 }}
                            required
                            autoFocus
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }} />
                        <input
                            type="password"
                            className="input"
                            placeholder="Password"
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            style={{ paddingLeft: 40 }}
                            required
                        />
                    </div>

                    {error && (
                        <div className="alert alert-error" style={{ fontSize: 13 }}>
                            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                            {error}
                        </div>
                    )}

                    <button type="submit" className="button" disabled={loading} style={{ padding: '13px', fontWeight: 700, fontSize: 15, marginTop: 4 }}>
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <div className="spinner" /> Signing in...
                            </span>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <LogIn size={16} /> Sign In
                            </span>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, opacity: 0.35 }}>
                    Default super admin: <span style={{ fontFamily: 'monospace' }}>superadmin / superadmin123</span>
                </div>
            </div>
        </div>
    );
}
