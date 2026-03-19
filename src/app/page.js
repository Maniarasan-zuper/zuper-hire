import Link from 'next/link';
import { Shield, Clock, Code2, BarChart3, Camera, Users, Zap, ExternalLink } from 'lucide-react';

const features = [
    {
        icon: <Code2 size={22} />,
        iconColor: '#3b82f6',
        iconBg: 'rgba(59,130,246,0.12)',
        title: 'Live Code Execution',
        desc: 'Monaco editor with real-time JavaScript execution and test case validation — exactly like a real IDE.'
    },
    {
        icon: <Shield size={22} />,
        iconColor: '#8b5cf6',
        iconBg: 'rgba(139,92,246,0.12)',
        title: 'Proctored Sessions',
        desc: 'Camera feed, full-screen capture, tab-switch detection, and focus loss tracking — all stored securely per candidate.'
    },
    {
        icon: <Clock size={22} />,
        iconColor: '#f59e0b',
        iconBg: 'rgba(245,158,11,0.12)',
        title: 'Time-Bounded Assessments',
        desc: 'Customizable countdowns with auto-submit on expiry. Candidates never lose progress unexpectedly.'
    },
    {
        icon: <BarChart3 size={22} />,
        iconColor: '#10b981',
        iconBg: 'rgba(16,185,129,0.12)',
        title: 'Candidate Analytics',
        desc: 'Per-candidate pass/fail metrics, tab-switch frequency, code review, and eligibility tracking — all in one dashboard.'
    },
    {
        icon: <Camera size={22} />,
        iconColor: '#ef4444',
        iconBg: 'rgba(239,68,68,0.12)',
        title: 'Surveillance Logs',
        desc: 'Periodic camera and screen snapshots stored per candidate. Reviewable any time from the admin panel.'
    },
    {
        icon: <Users size={22} />,
        iconColor: '#06b6d4',
        iconBg: 'rgba(6,182,212,0.12)',
        title: 'Multi-Round Campaigns',
        desc: 'Run simultaneous hiring rounds with their own question sets, durations, and candidate pools. Move top candidates to the next round with one click.'
    },
];

export default function Home() {
    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Nav */}
            <nav style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 32px', borderBottom: '1px solid var(--border)',
                background: 'var(--surface)', backdropFilter: 'blur(16px)',
                position: 'sticky', top: 0, zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src="/zuper_logo.png" alt="Zuper" style={{ height: 32, width: 'auto' }} className="dark-logo" />
                    <img src="/zuper_logo_light.png" alt="Zuper" style={{ height: 32, width: 'auto' }} className="light-logo" />
                    <div>
                        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>Zuper Hire</span>
                        <span style={{ fontSize: 11, opacity: 0.4, marginLeft: 8, fontWeight: 500 }}>Internal Platform</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <a href="https://www.zuper.co" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, opacity: 0.5, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--foreground)', textDecoration: 'none' }}>
                        zuper.co <ExternalLink size={11} />
                    </a>
                    <Link href="/admin">
                        <button className="button outline" style={{ fontSize: 13, padding: '7px 16px' }}>Admin Portal</button>
                    </Link>
                    <Link href="/candidate/login">
                        <button className="button" style={{ fontSize: 13, padding: '7px 16px' }}>Take Assessment</button>
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <div className="hero-section">
                <div style={{
                    position: 'absolute', top: '20%', left: '10%',
                    width: 400, height: 400,
                    background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute', top: '10%', right: '10%',
                    width: 350, height: 350,
                    background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />

                {/* Zuper logo prominent */}
                <div style={{ marginBottom: 28 }}>
                    <img src="/zuper_logo.png" alt="Zuper" style={{ height: 48, width: 'auto', margin: '0 auto' }} className="dark-logo mx-auto" />
                    <img src="/zuper_logo_light.png" alt="Zuper" style={{ height: 48, width: 'auto', margin: '0 auto' }} className="light-logo mx-auto" />
                </div>

                <div className="hero-tag">
                    <Zap size={12} />
                    Zuper Engineering · Internal Hiring Tool
                </div>

                <h1 className="hero-title">
                    <span className="bg-clip-text text-transparent" style={{
                        backgroundImage: 'linear-gradient(135deg, var(--foreground) 0%, var(--primary) 100%)'
                    }}>
                        Technical Assessments
                    </span>
                    <br />
                    <span className="bg-clip-text text-transparent" style={{
                        backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                    }}>
                        built for Zuper hiring.
                    </span>
                </h1>

                <p className="hero-subtitle">
                    Zuper Hire is an internal platform for running proctored technical interviews.
                    Admins create campaigns, assign questions, and review results — all in one place.
                </p>

                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/admin">
                        <button className="button" style={{
                            padding: '14px 28px', fontSize: 15, fontWeight: 700,
                            boxShadow: '0 0 40px rgba(59,130,246,0.25)'
                        }}>
                            Admin Portal →
                        </button>
                    </Link>
                    <a href="https://www.zuper.co" target="_blank" rel="noopener noreferrer">
                        <button className="button outline" style={{ padding: '14px 28px', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                            About Zuper <ExternalLink size={15} />
                        </button>
                    </a>
                </div>

                {/* About Zuper strip */}
                <div style={{
                    marginTop: 52, padding: '20px 32px',
                    background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)',
                    borderRadius: 14, maxWidth: 680, margin: '52px auto 0',
                    display: 'flex', alignItems: 'center', gap: 20, textAlign: 'left'
                }}>
                    <img src="/zuper_logo.png" alt="Zuper" style={{ height: 36, width: 'auto', flexShrink: 0 }} className="dark-logo" />
                    <img src="/zuper_logo_light.png" alt="Zuper" style={{ height: 36, width: 'auto', flexShrink: 0 }} className="light-logo" />
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>About Zuper</div>
                        <div style={{ fontSize: 13, opacity: 0.6, lineHeight: 1.6 }}>
                            Zuper is a field service management platform helping businesses streamline their operations.
                            This tool is exclusively for evaluating candidates joining the Zuper engineering team.{' '}
                            <a href="https://www.zuper.co" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', opacity: 1 }}>
                                Learn more at zuper.co →
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features */}
            <div className="feature-grid">
                {features.map(f => (
                    <div key={f.title} className="feature-card">
                        <div className="feature-icon" style={{ background: f.iconBg, color: f.iconColor }}>
                            {f.icon}
                        </div>
                        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{f.title}</h3>
                        <p style={{ fontSize: 14, opacity: 0.6, lineHeight: 1.65 }}>{f.desc}</p>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div style={{
                borderTop: '1px solid var(--border)',
                padding: '32px 24px',
                textAlign: 'center',
                background: 'rgba(var(--primary-rgb), 0.02)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
                    <img src="/zuper_logo.png" alt="Zuper" style={{ height: 22, width: 'auto' }} className="dark-logo" />
                    <img src="/zuper_logo_light.png" alt="Zuper" style={{ height: 22, width: 'auto' }} className="light-logo" />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Zuper Hire</span>
                    <span style={{ opacity: 0.3, fontSize: 12 }}>· Internal Tool · Not for public use</span>
                </div>
                <a href="https://www.zuper.co" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, opacity: 0.45, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    zuper.co <ExternalLink size={11} />
                </a>
            </div>
        </div>
    );
}
