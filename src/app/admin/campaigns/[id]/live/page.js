'use client';
import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import {
    Monitor, Camera, Users, ArrowLeft,
    Activity, RefreshCw, X,
    Maximize2
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function LiveMonitoring({ params }) {
    const resolvedParams = use(params);
    const campaignId = resolvedParams.id;

    const [campaign, setCampaign] = useState(null);
    const [activeCandidates, setActiveCandidates] = useState([]);   // from heartbeat/DB
    const [selectedFeed, setSelectedFeed] = useState(null);
    const [modalView, setModalView] = useState('screen');
    const [wrtcStatuses, setWrtcStatuses] = useState({}); // candidateId -> status string

    const peerConns = useRef({});
    const iceQueues = useRef({}); // candidateId -> [ice...]
    const sseRef = useRef(null);
    const [remoteStreams, setRemoteStreams] = useState({});
    const videoRefs = useRef({});          // candidateId → <video> element
    const selectedVideoRef = useRef(null);

    // ── Fetch list of live candidates (heartbeat-based) ──────────
    const fetchLiveCandidates = async () => {
        try {
            const res = await fetch(`/api/admin/campaigns/${campaignId}/live`);
            const data = await res.json();
            if (data.candidates) setActiveCandidates(data.candidates);
        } catch { }
    };

    // ── Kick off WebRTC offer to one candidate ───────────────────
    const startWebRTC = async (candidateId) => {
        if (peerConns.current[candidateId]) return;

        console.log(`[WebRTC] Initiating P2P connection for ${candidateId}...`);
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun.services.mozilla.com' }
            ]
        });
        peerConns.current[candidateId] = pc;
        iceQueues.current[candidateId] = [];

        pc.addTransceiver('video', { direction: 'recvonly' });

        pc.ontrack = (event) => {
            console.log(`[WebRTC] Success! Received track/stream for ${candidateId}`);
            let stream = event.streams[0];
            if (!stream) {
                console.log(`[WebRTC] No stream found in event, creating one from track...`);
                stream = new MediaStream([event.track]);
            }

            setRemoteStreams(prev => ({ ...prev, [candidateId]: stream }));
            setWrtcStatuses(prev => ({ ...prev, [candidateId]: 'connected' }));
        };

        pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
                fetch(`/api/admin/campaigns/${campaignId}/signal`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'ice', candidateId, ice: candidate, from: 'admin' })
                }).catch(() => { });
            }
        };

        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            console.log(`[WebRTC] ${candidateId} Connection state: ${state}`);
            if (state === 'failed' || state === 'disconnected') {
                // Potential cleanup or retry logic
            }
            setWrtcStatuses(prev => ({
                ...prev,
                [candidateId]: ['connected', 'completed'].includes(state) ? 'connected' : state === 'failed' ? 'failed' : 'connecting'
            }));
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await fetch(`/api/admin/campaigns/${campaignId}/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'offer', candidateId, sdp: offer })
        });
        setWrtcStatuses(prev => ({ ...prev, [candidateId]: 'connecting' }));
    };

    useEffect(() => {
        const sse = new EventSource(`/api/admin/campaigns/${campaignId}/signal?role=admin`);
        sseRef.current = sse;

        sse.onmessage = async (e) => {
            const msg = JSON.parse(e.data);
            const pc = peerConns.current[msg.candidateId];
            if (!pc) return;

            if (msg.type === 'answer') {
                await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                // Process queued ICE
                const queue = iceQueues.current[msg.candidateId] || [];
                while (queue.length > 0) {
                    const ice = queue.shift();
                    try { await pc.addIceCandidate(new RTCIceCandidate(ice)); } catch { }
                }
            } else if (msg.type === 'ice' && msg.from === 'candidate') {
                if (pc.remoteDescription) {
                    try { await pc.addIceCandidate(new RTCIceCandidate(msg.ice)); } catch { }
                } else {
                    if (!iceQueues.current[msg.candidateId]) iceQueues.current[msg.candidateId] = [];
                    iceQueues.current[msg.candidateId].push(msg.ice);
                }
            }
        };
        return () => sse.close();
    }, [campaignId]);

    // ── Poll list of active candidates + auto-connect ────────────
    useEffect(() => {
        fetch(`/api/admin/campaigns/${campaignId}`)
            .then(r => r.json())
            .then(d => setCampaign(d.campaign));

        fetchLiveCandidates();
        const interval = setInterval(fetchLiveCandidates, 5000);
        return () => clearInterval(interval);
    }, [campaignId]);

    // When a new candidate appears → auto-initiate WebRTC
    useEffect(() => {
        // Auto-connect new ones
        activeCandidates.forEach(c => {
            if (!peerConns.current[c.id]) {
                startWebRTC(c.id);
            }
        });

        // Auto-cleanup stale ones
        const activeIds = new Set(activeCandidates.map(c => c.id));
        Object.keys(peerConns.current).forEach(cid => {
            if (!activeIds.has(cid)) {
                console.log(`[WebRTC] Cleaning up stale connection for ${cid}`);
                closeWebRTC(cid);
            }
        });
    }, [activeCandidates]);

    // ── Sync remote streams to video elements ───────────────────
    useEffect(() => {
        // 1. Sync hidden background grid videos + ensure they play
        Object.entries(remoteStreams).forEach(([candidateId, stream]) => {
            const el = videoRefs.current[candidateId];
            if (el && el.srcObject !== stream) {
                el.srcObject = stream;
                el.play().catch(() => { });
            }
        });

        // 2. Sync active fullscreen modal video
        if (selectedFeed && selectedVideoRef.current) {
            const stream = remoteStreams[selectedFeed.id];
            if (stream && selectedVideoRef.current.srcObject !== stream) {
                selectedVideoRef.current.srcObject = stream;
                selectedVideoRef.current.play().catch(() => { });
            }
        }
    }, [remoteStreams, selectedFeed]);

    // Auto-retry failed connections (only on explicit failure, not slow connects)
    useEffect(() => {
        const interval = setInterval(() => {
            activeCandidates.forEach(c => {
                const status = wrtcStatuses[c.id];
                if (status === 'failed') {
                    console.log(`[WebRTC] Connection for ${c.id} failed, retrying...`);
                    const pc = peerConns.current[c.id];
                    if (pc) pc.close();
                    delete peerConns.current[c.id];
                    startWebRTC(c.id);
                }
            });
        }, 30000); // Check every 30s — give ICE enough time to negotiate
        return () => clearInterval(interval);
    }, [activeCandidates, wrtcStatuses]);

    const closeWebRTC = (candidateId) => {
        const pc = peerConns.current[candidateId];
        if (pc) { pc.close(); delete peerConns.current[candidateId]; }
        setRemoteStreams(prev => { const n = { ...prev }; delete n[candidateId]; return n; });
    };

    return (
        <div className="container" style={{ paddingBottom: 100 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link href={`/admin/campaigns/${campaignId}`}>
                        <button className="button outline" style={{ padding: '8px 12px' }}>
                            <ArrowLeft size={16} />
                        </button>
                    </Link>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <Activity size={20} color="#3b82f6" />
                            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.7px' }}>Live Monitoring</h1>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99,
                                background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)'
                            }}>
                                <div className="recording-dot" style={{ width: 6, height: 6 }} />
                                WebRTC Live
                            </span>
                        </div>
                        <p style={{ fontSize: 13, opacity: 0.5 }}>{campaign?.name} · Real-time video from active candidates</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, opacity: 0.4, fontWeight: 700, textTransform: 'uppercase' }}>Active</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: activeCandidates.length > 0 ? '#34d399' : 'var(--foreground)' }}>
                            {activeCandidates.length}
                        </div>
                    </div>
                    <ThemeToggle />
                    <button onClick={fetchLiveCandidates} className="button outline" style={{ padding: '10px 14px' }}>
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {activeCandidates.length === 0 ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: 400, gap: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px dashed var(--border)'
                }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={32} style={{ opacity: 0.2 }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No active candidates</h3>
                        <p style={{ fontSize: 14, opacity: 0.5 }}>Candidates will appear here once they start the interview.</p>
                        <p style={{ fontSize: 12, opacity: 0.35, marginTop: 8 }}>Live streams connect automatically via WebRTC. No delay.</p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {activeCandidates.map(candidate => {
                        const status = wrtcStatuses[candidate.id] || 'connecting';
                        const isConnected = status === 'connected' && remoteStreams[candidate.id];

                        return (
                            <div key={candidate.id} className="card" style={{ padding: '16px 20px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card-bg)', position: 'relative' }}>
                                {/* Background Video element (Hidden) to maintain connection */}
                                <div style={{ display: 'none' }}>
                                    <video
                                        ref={el => {
                                            videoRefs.current[candidate.id] = el;
                                            if (el && remoteStreams[candidate.id]) el.srcObject = remoteStreams[candidate.id];
                                        }}
                                        autoPlay playsInline muted
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <div
                                            style={{ fontWeight: 700, fontSize: 16, cursor: 'pointer', color: 'var(--primary)' }}
                                            onClick={() => setSelectedFeed(candidate)}
                                        >
                                            {candidate.name}
                                        </div>
                                        <div style={{ fontSize: 11, opacity: 0.5, fontWeight: 500 }}>
                                            {campaign?.name}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                        <span style={{
                                            fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                                            background: isConnected ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                            color: isConnected ? '#34d399' : '#fbbf24',
                                            border: `1px solid ${isConnected ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`
                                        }}>
                                            {isConnected ? 'LIVE' : 'WAITING'}
                                        </span>
                                        <button
                                            className="button outline"
                                            style={{ padding: '4px 10px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}
                                            onClick={() => setSelectedFeed(candidate)}
                                        >
                                            <Maximize2 size={10} /> VIEW LIVE
                                        </button>
                                        <button
                                            className="button outline"
                                            style={{ padding: '4px 10px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24', borderColor: 'rgba(245,158,11,0.3)' }}
                                            title="Reconnect stream"
                                            onClick={() => {
                                                const pc = peerConns.current[candidate.id];
                                                if (pc) pc.close();
                                                delete peerConns.current[candidate.id];
                                                setRemoteStreams(prev => { const n = { ...prev }; delete n[candidate.id]; return n; });
                                                setWrtcStatuses(prev => ({ ...prev, [candidate.id]: 'connecting' }));
                                                startWebRTC(candidate.id);
                                            }}
                                        >
                                            <RefreshCw size={10} /> RECONNECT
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedFeed && (() => {
                const latestCandidate = activeCandidates.find(c => c.id === selectedFeed.id) || selectedFeed;
                const isLive = !!remoteStreams[selectedFeed.id];

                return (
                    <div className="modal-backdrop" onClick={() => setSelectedFeed(null)} style={{ background: 'rgba(0,0,0,0.95)', zIndex: 1000 }}>
                        <div style={{ position: 'relative', width: '95vw', maxWidth: 1200 }} onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setSelectedFeed(null)}
                                style={{
                                    position: 'absolute', top: -48, right: 0, zIndex: 10,
                                    background: 'rgba(255,255,255,0.1)', border: 'none',
                                    borderRadius: '50%', width: 40, height: 40,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: '#fff'
                                }}
                            >
                                <X size={20} />
                            </button>
                            <div style={{ background: '#000', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
                                    {isLive ? (
                                        <video
                                            ref={el => {
                                                selectedVideoRef.current = el;
                                                if (el && remoteStreams[selectedFeed.id]) {
                                                    if (el.srcObject !== remoteStreams[selectedFeed.id]) {
                                                        el.srcObject = remoteStreams[selectedFeed.id];
                                                        el.play().catch(() => { });
                                                    }
                                                }
                                            }}
                                            autoPlay playsInline muted
                                            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                                        />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            {modalView === 'screen' ? (
                                                latestCandidate.latestScreen?.image_data ? (
                                                    <img
                                                        src={latestCandidate.latestScreen.image_data}
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.9 }}
                                                        alt="Fallback Screen"
                                                    />
                                                ) : (
                                                    <div style={{ textAlign: 'center', opacity: 0.2 }}>
                                                        <Monitor size={64} style={{ marginBottom: 16 }} />
                                                        <div>Screen connection pending...</div>
                                                    </div>
                                                )
                                            ) : (
                                                latestCandidate.latestCamera?.image_data ? (
                                                    <img
                                                        src={latestCandidate.latestCamera.image_data}
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.9 }}
                                                        alt="Fallback Camera"
                                                    />
                                                ) : (
                                                    <div style={{ textAlign: 'center', opacity: 0.2 }}>
                                                        <Camera size={64} style={{ marginBottom: 16 }} />
                                                        <div>Camera connection pending...</div>
                                                    </div>
                                                )
                                            )}
                                            <div style={{ position: 'absolute', bottom: 30, right: 30, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: '10px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontSize: 13, fontWeight: 500 }}>
                                                <div className="spinner sm" style={{ borderTopColor: '#3b82f6' }} />
                                                <span>Live HD Feed establishing...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ padding: '16px 28px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div className={`recording-dot ${isLive ? 'active' : ''}`} style={{ width: 8, height: 8, background: isLive ? '#10b981' : '#f59e0b' }} />
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedFeed.name}</div>
                                            <div style={{ fontSize: 11, opacity: 0.5, fontWeight: 500, display: 'flex', gap: 12 }}>
                                                <span>{isLive ? 'Live HD Stream Active' : 'Fallback Snapshot Feed'}</span>
                                                {!isLive && (
                                                    <div style={{ display: 'flex', gap: 4 }}>
                                                        <button onClick={() => setModalView('screen')} style={{ background: modalView === 'screen' ? 'rgba(59,130,246,0.2)' : 'transparent', border: 'none', color: modalView === 'screen' ? '#60a5fa' : '#888', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, cursor: 'pointer' }}>SCREEN</button>
                                                        <button onClick={() => setModalView('camera')} style={{ background: modalView === 'camera' ? 'rgba(59,130,246,0.2)' : 'transparent', border: 'none', color: modalView === 'camera' ? '#60a5fa' : '#888', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, cursor: 'pointer' }}>CAMERA</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button
                                            className="button outline"
                                            style={{ padding: '10px 20px', fontSize: 13, background: 'rgba(255,255,255,0.05)' }}
                                            onClick={() => {
                                                const pc = peerConns.current[selectedFeed.id];
                                                if (pc) pc.close();
                                                delete peerConns.current[selectedFeed.id];
                                                startWebRTC(selectedFeed.id);
                                            }}
                                        >
                                            <RefreshCw size={14} /> Reset Connection
                                        </button>
                                        {isLive && (
                                            <button
                                                className="button primary"
                                                style={{ padding: '10px 22px', fontSize: 13, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                                                onClick={() => selectedVideoRef.current?.requestFullscreen()}
                                            >
                                                <Maximize2 size={16} /> Native Fullscreen
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
