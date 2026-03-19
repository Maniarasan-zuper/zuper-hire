'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Users, Plus, Trash2, Key, CheckCircle, AlertTriangle, X, LogOut, Shield, ArrowLeft } from 'lucide-react';
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
    const icons = { success: <CheckCircle size={15} />, error: <AlertTriangle size={15} />, info: <span>i</span> };
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

export default function SuperAdminDashboard() {
    const router = useRouter();
    const [admins, setAdmins] = useState([]);
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ username: '', password: '' });
    const [resetTarget, setResetTarget] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const { toasts, show } = useToast();

    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.json())
            .then(d => {
                if (!d.admin || d.admin.role !== 'superadmin') {
                    router.replace('/admin/login');
                    return;
                }
                setMe(d.admin);
                return fetch('/api/superadmin/admins').then(r => r.json());
            })
            .then(d => { if (d?.admins) setAdmins(d.admins); })
            .catch(() => router.replace('/admin/login'))
            .finally(() => setLoading(false));
    }, [router]);

    const addAdmin = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/superadmin/admins', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAdmin)
        });
        const data = await res.json();
        if (!res.ok) { show(data.error || 'Failed to add admin', 'error'); return; }
        show('Admin added successfully!', 'success');
        setNewAdmin({ username: '', password: '' });
        setShowAdd(false);
        fetch('/api/superadmin/admins').then(r => r.json()).then(d => setAdmins(d.admins || []));
    };

    const deleteAdmin = async (id) => {
        const res = await fetch(`/api/superadmin/admins/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) { show(data.error || 'Failed', 'error'); return; }
        setAdmins(prev => prev.filter(a => a.id !== id));
        show('Admin removed.', 'info');
        setDeleteTarget(null);
    };

    const resetPassword = async (id) => {
        if (!newPassword.trim()) return;
        const res = await fetch(`/api/superadmin/admins/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPassword })
        });
        if (!res.ok) { show('Failed to reset password', 'error'); return; }
        show('Password reset successfully!', 'success');
        setResetTarget(null);
        setNewPassword('');
    };

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.replace('/admin/login');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                <div className="spinner lg" />
                <span style={{ opacity: 0.4, fontSize: 14 }}>Loading...</span>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: 860 }}>
            <ToastContainer toasts={toasts} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={20} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.4px' }}>Super Admin</h1>
                        <p style={{ fontSize: 12, opacity: 0.4 }}>Signed in as <strong>{me?.username}</strong></p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Link href="/admin">
                        <button className="button outline" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            <ArrowLeft size={14} /> Admin Panel
                        </button>
                    </Link>
                    <ThemeToggle />
                    <button onClick={logout} className="button outline" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}>
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
                <div className="stat-card" style={{ borderTop: '3px solid #f59e0b' }}>
                    <div className="stat-label">Total Admins</div>
                    <div className="stat-value" style={{ color: '#fbbf24' }}>{admins.length}</div>
                </div>
                <div className="stat-card" style={{ borderTop: '3px solid #8b5cf6' }}>
                    <div className="stat-label">Super Admins</div>
                    <div className="stat-value" style={{ color: '#a78bfa' }}>{admins.filter(a => a.role === 'superadmin').length}</div>
                </div>
                <div className="stat-card" style={{ borderTop: '3px solid #3b82f6' }}>
                    <div className="stat-label">Regular Admins</div>
                    <div className="stat-value" style={{ color: '#60a5fa' }}>{admins.filter(a => a.role === 'admin').length}</div>
                </div>
            </div>

            {/* Admin list header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={18} /> Admin Accounts
                </h2>
                <button onClick={() => setShowAdd(v => !v)} className="button" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 16px' }}>
                    {showAdd ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Admin</>}
                </button>
            </div>

            {/* Add admin form */}
            {showAdd && (
                <form onSubmit={addAdmin} className="card" style={{ marginBottom: 16, border: '1px solid rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.04)', padding: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Username</label>
                            <input type="text" className="input" value={newAdmin.username} onChange={e => setNewAdmin(f => ({ ...f, username: e.target.value }))} required placeholder="username" />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Password</label>
                            <input type="password" className="input" value={newAdmin.password} onChange={e => setNewAdmin(f => ({ ...f, password: e.target.value }))} required placeholder="••••••••" />
                        </div>
                        <button type="submit" className="button success" style={{ padding: '12px 20px', fontWeight: 700 }}>Create</button>
                    </div>
                </form>
            )}

            {/* Admin table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {admins.map(admin => (
                    <div key={admin.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderLeft: `4px solid ${admin.role === 'superadmin' ? '#f59e0b' : '#3b82f6'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, background: admin.role === 'superadmin' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.12)', color: admin.role === 'superadmin' ? '#fbbf24' : '#60a5fa', flexShrink: 0 }}>
                                {admin.username[0].toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 15 }}>{admin.username}</div>
                                <div style={{ fontSize: 12, opacity: 0.45 }}>
                                    {new Date(admin.created_at).toLocaleDateString()} · {admin.role}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', padding: '3px 10px', borderRadius: 99, background: admin.role === 'superadmin' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.1)', color: admin.role === 'superadmin' ? '#fbbf24' : '#60a5fa', border: `1px solid ${admin.role === 'superadmin' ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.25)'}` }}>
                                {admin.role === 'superadmin' ? '★ Super' : 'Admin'}
                            </span>
                            {admin.id !== me?.id && (
                                <>
                                    <button onClick={() => { setResetTarget(admin); setNewPassword(''); }} className="button outline" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                                        <Key size={12} /> Reset PW
                                    </button>
                                    {admin.role !== 'superadmin' && (
                                        <button onClick={() => setDeleteTarget(admin)} className="danger-btn button" style={{ padding: '6px 10px', fontSize: 12 }}>
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Reset password modal */}
            {resetTarget && (
                <div className="modal-backdrop" onClick={() => setResetTarget(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Reset Password — {resetTarget.username}</h3>
                        <input
                            type="password" className="input" placeholder="New password"
                            value={newPassword} onChange={e => setNewPassword(e.target.value)}
                            style={{ marginBottom: 16 }} autoFocus
                        />
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setResetTarget(null)} className="button outline" style={{ padding: '9px 18px', fontSize: 13 }}>Cancel</button>
                            <button onClick={() => resetPassword(resetTarget.id)} className="button" style={{ padding: '9px 18px', fontSize: 13, fontWeight: 700 }}>Reset Password</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirm modal */}
            {deleteTarget && (
                <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <AlertTriangle size={20} color="#f87171" />
                            </div>
                            <div>
                                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Remove Admin</h3>
                                <p style={{ fontSize: 14, opacity: 0.6 }}>Remove <strong>{deleteTarget.username}</strong>? They will lose all access immediately.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteTarget(null)} className="button outline" style={{ padding: '9px 18px', fontSize: 13 }}>Cancel</button>
                            <button onClick={() => deleteAdmin(deleteTarget.id)} className="danger-btn button" style={{ padding: '9px 18px', fontSize: 13 }}>Remove Admin</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
