'use client';
import { useState, useEffect, useRef, use } from 'react';
import Editor from '@monaco-editor/react';
import { useRouter } from 'next/navigation';
import { Maximize, Minimize, Play, Send, Camera, ShieldAlert, CheckCircle, Clock, AlertTriangle, X } from 'lucide-react';

// ── Confirm modal ──────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }) {
    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Send size={20} color="#34d399" />
                    </div>
                    <div>
                        <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{title}</h3>
                        <p style={{ fontSize: 14, opacity: 0.6, lineHeight: 1.65 }}>{message}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} className="button outline" style={{ padding: '10px 20px', fontSize: 14 }}>
                        <X size={13} style={{ display: 'inline', marginRight: 5 }} /> Cancel
                    </button>
                    <button onClick={onConfirm} className="button success" style={{ padding: '10px 20px', fontSize: 14 }}>
                        <Send size={13} style={{ display: 'inline', marginRight: 5 }} /> {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CandidateInterview({ params }) {
    const resolvedParams = use(params);
    const campaignId = resolvedParams.campaignId;
    const router = useRouter();

    const [questions, setQuestions] = useState([]);
    const [campaign, setCampaign] = useState(null);
    const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
    // Per-question code state
    const [codeMap, setCodeMap] = useState({});
    const [submittedSet, setSubmittedSet] = useState(new Set());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [tabSwitches, setTabSwitches] = useState(0);
    const [testResults, setTestResults] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showFinalModal, setShowFinalModal] = useState(false);

    // Security
    const [permissionsGranted, setPermissionsGranted] = useState(false);
    const [permissionError, setPermissionError] = useState(null);
    const [mediaStreams, setMediaStreams] = useState(null);
    const [screenStreams, setScreenStreams] = useState([]); // multi-monitor
    const [timeLeft, setTimeLeft] = useState(0);
    const videoRef = useRef(null);
    const screenRef = useRef(null);
    const screenRefsExtra = useRef([]); // for additional monitors
    const canvasRef = useRef(null);
    // WebRTC: peer connections keyed by campaignId (one per session)
    const peerConnRef = useRef(null);
    const sseRef = useRef(null);

    useEffect(() => {
        const candidateId = localStorage.getItem('candidateId');
        if (!candidateId) router.push('/candidate/login');
    }, [router]);

    useEffect(() => {
        const candidateId = localStorage.getItem('candidateId');
        fetch(`/api/candidate/questions/${campaignId}?candidateId=${candidateId || ''}`)
            .then(res => res.json())
            .then(data => {
                if (data.questions?.length > 0) {
                    setQuestions(data.questions);
                    const savedMap = {};
                    data.questions.forEach(q => {
                        const saved = localStorage.getItem(`code_${campaignId}_${q.id}`);
                        savedMap[q.id] = saved ?? q.default_code;
                    });
                    setCodeMap(savedMap);
                }
            });

        fetch(`/api/admin/campaigns/${campaignId}`)
            .then(res => res.json())
            .then(data => {
                if (data.campaign) {
                    if (data.campaign.status === 'archived') {
                        router.replace('/candidate/login?error=archived');
                    } else {
                        setCampaign(data.campaign);
                    }
                }
            });
    }, [campaignId]);

    // Tab-switch tracker — use visibilitychange so browser-native dialogs/alerts don't count
    useEffect(() => {
        if (!permissionsGranted) return;
        const handleVisibility = () => {
            if (document.hidden) setTabSwitches(prev => prev + 1);
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [permissionsGranted]);

    // Fullscreen tracker
    useEffect(() => {
        const onChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    useEffect(() => {
        if (campaign?.duration) setTimeLeft(campaign.duration * 60);
        // Auto-grant permissions for campaigns with no proctoring
        if (campaign?.proctoring === 'none' && !permissionsGranted) {
            setPermissionsGranted(true);
        }
    }, [campaign]);

    useEffect(() => {
        if (!permissionsGranted || timeLeft <= 0) return;
        const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timerId);
    }, [permissionsGranted]);

    useEffect(() => {
        if (permissionsGranted && timeLeft === 0 && !isSubmitting) handleAutoSubmit();
    }, [timeLeft, permissionsGranted]);

    useEffect(() => {
        if (permissionsGranted && mediaStreams) {
            if (videoRef.current && !videoRef.current.srcObject) videoRef.current.srcObject = mediaStreams.camera;
            if (screenRef.current && !screenRef.current.srcObject) screenRef.current.srcObject = mediaStreams.screen;
        }
    }, [permissionsGranted, mediaStreams]);

    // Attach extra screen streams to hidden video elements
    useEffect(() => {
        screenStreams.forEach((stream, i) => {
            const el = screenRefsExtra.current[i];
            if (el && !el.srcObject) el.srcObject = stream;
        });
    }, [screenStreams]);

    // ── Stop all media streams and release camera/screen indicators ────────
    const stopAllStreams = (streams, extraStreams) => {
        if (videoRef.current) videoRef.current.srcObject = null;
        if (screenRef.current) screenRef.current.srcObject = null;
        screenRefsExtra.current.forEach(el => { if (el) el.srcObject = null; });
        if (streams?.camera) streams.camera.getTracks().forEach(t => t.stop());
        if (streams?.screen) streams.screen.getTracks().forEach(t => t.stop());
        (extraStreams || []).forEach(s => s.getTracks().forEach(t => t.stop()));
        setMediaStreams(null);
        setScreenStreams([]);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => stopAllStreams(mediaStreams, screenStreams);
    }, [mediaStreams, screenStreams]);

    // ── WebRTC: answer admin offers to stream screen live ──────────────────
    const iceQueueRef = useRef([]);
    // peerConnRef is already declared above, no need to redeclare.

    useEffect(() => {
        if (!permissionsGranted || !mediaStreams?.screen) return;
        const candidateId = localStorage.getItem('candidateId');
        if (!candidateId) return;

        console.log('[WebRTC] Starting signaling listener...');

        let sse;
        const connectSSE = () => {
            if (sse) sse.close();
            sse = new EventSource(
                `/api/admin/campaigns/${campaignId}/signal?role=candidate&candidateId=${candidateId}`
            );
            sseRef.current = sse;

            sse.onmessage = async (e) => {
                const msg = JSON.parse(e.data);
                if (msg.type === 'ping') return;

                if (msg.type === 'offer') {
                    console.log('[WebRTC] Received offer from admin. Setting up connection...');
                    if (peerConnRef.current) peerConnRef.current.close();

                    // Reset ICE queue for new connection
                    iceQueueRef.current = [];

                    const pc = new RTCPeerConnection({
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:stun1.l.google.com:19302' },
                            { urls: 'stun:stun2.l.google.com:19302' },
                            { urls: 'stun:stun3.l.google.com:19302' },
                            { urls: 'stun:stun.services.mozilla.com' }
                        ]
                    });
                    peerConnRef.current = pc;

                    // Add screen tracks
                    mediaStreams.screen.getVideoTracks().forEach(track => {
                        pc.addTrack(track, mediaStreams.screen);
                    });

                    pc.onicecandidate = ({ candidate }) => {
                        if (candidate) {
                            fetch(`/api/admin/campaigns/${campaignId}/signal`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ type: 'ice', candidateId, ice: candidate, from: 'candidate' })
                            }).catch(() => { });
                        }
                    };

                    pc.onconnectionstatechange = () => {
                        console.log(`[WebRTC] Connection state: ${pc.connectionState}`);
                    };

                    await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    await fetch(`/api/admin/campaigns/${campaignId}/signal`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'answer', candidateId, sdp: answer })
                    });

                    console.log('[WebRTC] Answer sent. Processing queued ICE candidates...');
                    while (iceQueueRef.current.length > 0) {
                        const ice = iceQueueRef.current.shift();
                        try { await pc.addIceCandidate(new RTCIceCandidate(ice)); } catch (e) { }
                    }
                } else if (msg.type === 'ice') {
                    const pc = peerConnRef.current;
                    if (pc && pc.remoteDescription) {
                        try { await pc.addIceCandidate(new RTCIceCandidate(msg.ice)); } catch (e) { }
                    } else {
                        iceQueueRef.current.push(msg.ice);
                    }
                }
            };

            sse.onerror = () => {
                console.log('[WebRTC] Signaling connection lost, retrying in 3s...');
                setTimeout(connectSSE, 3000);
            };
        };

        connectSSE();

        return () => {
            if (sse) sse.close();
            if (peerConnRef.current) peerConnRef.current.close();
        };
    }, [permissionsGranted, mediaStreams?.screen, campaignId]);

    // ── Surveillance & Heartbeat ───────────────────────────────────────────
    useEffect(() => {
        if (!permissionsGranted) return;
        const proctoring = campaign?.proctoring || 'full';
        const candidateId = localStorage.getItem('candidateId');

        // Initial capture and heartbeat
        const runSurveillance = () => {
            if (proctoring === 'full') captureAndSend('camera', videoRef.current, 0);
            if (mediaStreams?.screen) captureAndSend('screen', screenRef.current, 0);
            screenStreams.forEach((_stream, i) => {
                const el = screenRefsExtra.current[i];
                if (el) captureAndSend('screen', el, i + 1);
            });
        };

        const runHeartbeat = async () => {
            try {
                const res = await fetch('/api/candidate/heartbeat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ candidateId, campaignId, tabSwitches })
                });
                const data = await res.json();
                if (data.status === 'archived') {
                    alert('This campaign has been archived. Your session is now closed.');
                    router.push('/');
                }
            } catch (err) { }
        };

        let surveillanceInterval = null;
        if (proctoring !== 'none') {
            // First capture after 1s
            setTimeout(runSurveillance, 1000);
            // Higher frequency capture for "live" feel
            surveillanceInterval = setInterval(runSurveillance, 3000);
        }
        runHeartbeat();

        // Heartbeat Interval - 10 seconds
        const heartbeatInterval = setInterval(runHeartbeat, 10000);

        // Monitor if tracks are still active
        const monitorTracksInterval = setInterval(() => {
            if (!permissionsGranted) return;
            const camTrack = mediaStreams?.camera?.getVideoTracks()[0];
            const screenTrack = mediaStreams?.screen?.getVideoTracks()[0];

            const isCamOk = proctoring !== 'full' || (camTrack && camTrack.readyState === 'live' && camTrack.enabled);
            const isScreenOk = (proctoring === 'none') || (screenTrack && screenTrack.readyState === 'live' && screenTrack.enabled);

            if (!isCamOk || !isScreenOk) {
                console.log('[Surveillance] Track lost, forcing re-permission...');
                setPermissionsGranted(false);
                setPermissionError('⚠ Surveillance connection interrupted. Please re-allow access to continue.');
            }
        }, 5000);

        return () => {
            if (surveillanceInterval) clearInterval(surveillanceInterval);
            clearInterval(heartbeatInterval);
            clearInterval(monitorTracksInterval);
        };
    }, [permissionsGranted, campaignId, tabSwitches, mediaStreams, screenStreams]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { });
        else if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
    };

    const currentQuestion = questions[activeQuestionIdx];
    const currentCode = currentQuestion ? (codeMap[currentQuestion.id] ?? currentQuestion.default_code) : '';

    const handleCodeChange = (val) => {
        if (!currentQuestion) return;
        const newMap = { ...codeMap, [currentQuestion.id]: val || '' };
        setCodeMap(newMap);
        // Autosave to localStorage
        localStorage.setItem(`code_${campaignId}_${currentQuestion.id}`, val || '');
    };

    // Helper: request and validate a single screen stream (must be entire monitor)
    const requestEntireScreen = async () => {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'monitor' }, audio: false });
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();
            if (!settings.displaySurface || settings.displaySurface === 'monitor') {
                return stream; // ✓ valid entire screen
            }
            // Wrong surface — stop and loop to re-prompt
            stream.getTracks().forEach(t => t.stop());
            setPermissionError('⚠ You selected a window or tab. You MUST select "Entire Screen". Please try again.');
            // Small delay so error is visible before browser re-opens the picker
            await new Promise(res => setTimeout(res, 1200));
            setPermissionError(null);
        }
    };

    // Permissions & Surveillance
    const requestPermissions = async () => {
        setPermissionError(null);
        const proctoring = campaign?.proctoring || 'full';
        let cameraStream = null;
        let firstScreen = null;
        let extraScreens = [];
        try {
            if (proctoring === 'full') {
                cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            }
            if (proctoring === 'full' || proctoring === 'screen') {
                firstScreen = await requestEntireScreen();

                // Prompt for additional monitors
                try {
                    let addMore = true;
                    while (addMore) {
                        // eslint-disable-next-line no-alert
                        addMore = window.confirm('Do you have additional monitors? Click OK to share another screen, or Cancel to continue.');
                        if (addMore) {
                            const extra = await requestEntireScreen();
                            extraScreens.push(extra);
                        }
                    }
                } catch { /* cancelled */ }
            }

            setMediaStreams({ camera: cameraStream, screen: firstScreen });
            setScreenStreams(extraScreens);

            // If user clicks "Stop Sharing" on the browser bar, force them to re-enable
            if (firstScreen) {
                firstScreen.getVideoTracks()[0].oninactive = () => {
                    setPermissionsGranted(false);
                    setPermissionError('⚠ Screen sharing was stopped. You must re-enable it to continue the interview.');
                };
            }
            if (cameraStream) {
                cameraStream.getVideoTracks()[0].oninactive = () => {
                    setPermissionsGranted(false);
                    setPermissionError('⚠ Camera access was lost or stopped. You must re-enable it to continue the interview.');
                };
            }

            setPermissionsGranted(true);
            toggleFullscreen();
        } catch (e) {
            if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
            if (firstScreen) firstScreen.getTracks().forEach(t => t.stop());
            extraScreens.forEach(s => s.getTracks().forEach(t => t.stop()));
            if (e.name !== 'NotAllowedError' && e.message?.includes('MUST')) return; // loop handled above
            setPermissionError(
                e.name === 'NotAllowedError'
                    ? `Access denied. ${proctoring === 'full' ? 'You must allow Camera and Screen Recording.' : 'You must allow Screen Recording.'}`
                    : 'Permission required to start the interview.'
            );
        }
    };

    const captureAndSend = (type, videoElement, monitorIndex = 0) => {
        if (!videoElement || !canvasRef.current) return;
        if (videoElement.paused) videoElement.play().catch(() => { });

        const candidateId = localStorage.getItem('candidateId');
        const canvas = canvasRef.current;

        // Ensure we have dimensions
        if (videoElement.videoWidth === 0) return;

        // Limit resolution for speed
        const maxW = 1280;
        const scale = Math.min(1, maxW / videoElement.videoWidth);
        canvas.width = videoElement.videoWidth * scale;
        canvas.height = videoElement.videoHeight * scale;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        const imageData = canvas.toDataURL('image/jpeg', 0.4);
        fetch('/api/candidate/screenshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidateId, type, imageData, monitorIndex })
        }).catch(() => { });
    };

    const handleRun = async () => {
        if (!currentQuestion) return;
        setIsRunning(true);
        setTestResults(null);
        try {
            const res = await fetch('/api/candidate/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: currentCode, questionId: currentQuestion.id, candidateId: localStorage.getItem('candidateId') })
            });
            setTestResults(await res.json());
        } catch { } finally {
            setIsRunning(false);
        }
    };

    const submitQuestion = async () => {
        if (!currentQuestion || isSubmitting) return;
        setIsSubmitting(true);
        setShowSubmitModal(false);
        try {
            const maxPts = currentQuestion.points || 100;
            let status = 'Submitted (Not Evaluated)';
            let points_earned = 0, test_cases_passed = 0, test_cases_total = 0;

            if (currentQuestion.question_type === 'mcq') {
                const isCorrect = currentCode === currentQuestion.correct_answer;
                status = isCorrect ? 'Passed' : 'Failed';
                points_earned = isCorrect ? maxPts : 0;
            } else if (testResults) {
                test_cases_passed = testResults.passingCount ?? (testResults.results?.filter(r => r.passed).length || 0);
                test_cases_total = testResults.totalCount ?? (testResults.results?.length || 0);
                status = testResults.allPassed ? 'Passed' : 'Failed';
                points_earned = test_cases_total > 0 ? Math.round(maxPts * (test_cases_passed / test_cases_total)) : 0;
            }

            await fetch('/api/candidate/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateId: localStorage.getItem('candidateId'),
                    questionId: currentQuestion.id,
                    code: currentCode, status, tabSwitches,
                    points_earned, test_cases_passed, test_cases_total
                })
            });
            setSubmittedSet(prev => new Set([...prev, currentQuestion.id]));
        } catch { } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinalSubmit = async () => {
        setShowFinalModal(false);
        setIsSubmitting(true);
        const candidateId = localStorage.getItem('candidateId');

        // Submit all unsubmitted questions
        for (const q of questions) {
            if (!submittedSet.has(q.id)) {
                const code = codeMap[q.id] ?? q.default_code;
                await fetch('/api/candidate/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        candidateId,
                        questionId: q.id, code,
                        status: 'Submitted (Not Evaluated)', tabSwitches
                    })
                }).catch(() => { });
            }
        }

        // Mark as finished in DB
        await fetch('/api/candidate/finish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidateId })
        }).catch(() => { });

        stopAllStreams(mediaStreams, screenStreams);
        setIsSubmitting(false);
        router.push('/');
    };

    const handleAutoSubmit = async () => {
        const candidateId = localStorage.getItem('candidateId');
        for (const q of questions) {
            if (!submittedSet.has(q.id)) {
                const code = codeMap[q.id] ?? q.default_code;
                await fetch('/api/candidate/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        candidateId,
                        questionId: q.id, code,
                        status: 'Submitted (Not Evaluated)', tabSwitches
                    })
                }).catch(() => { });
            }
        }

        // Mark as finished
        await fetch('/api/candidate/finish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidateId })
        }).catch(() => { });

        stopAllStreams(mediaStreams, screenStreams);
        router.push('/');
    };

    const handleQuestionChange = (idx) => {
        if (idx !== activeQuestionIdx) {
            setActiveQuestionIdx(idx);
            setTestResults(null);
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isUrgent = timeLeft > 0 && timeLeft <= 300; // last 5 mins
    const allSubmitted = questions.length > 0 && questions.every(q => submittedSet.has(q.id));

    if (questions.length === 0) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                <div className="spinner lg" />
                <span style={{ opacity: 0.5, fontSize: 14 }}>Loading interview...</span>
            </div>
        );
    }

    // ── Permissions gate ──────────────────────────────
    const proctoring = campaign?.proctoring || 'full';

    if (!permissionsGranted) {
        const monitoringItems = [
            { tag: 'FORMAT', tagColor: '#60a5fa', tagBg: 'rgba(59,130,246,0.12)', text: <span>You must complete <strong>{questions.length} question{questions.length !== 1 ? 's' : ''}</strong>.</span> },
            { tag: 'TIME', tagColor: '#a78bfa', tagBg: 'rgba(139,92,246,0.12)', text: <span>You have <strong>{campaign?.duration || 60} minutes</strong> to complete this test.</span> },
            { tag: 'RULES', tagColor: '#f87171', tagBg: 'rgba(239,68,68,0.12)', text: <span style={{ color: '#fca5a5' }}>Tab switching or leaving the window is <strong>recorded and flagged</strong>.</span> },
            ...(proctoring === 'full' ? [{
                tag: 'MONITORING', tagColor: '#fbbf24', tagBg: 'rgba(245,158,11,0.12)',
                text: <span style={{ color: '#fde68a' }}>You MUST allow <strong>Camera</strong> and <strong>Entire Screen</strong> sharing. Sharing a window or tab is <strong>not allowed</strong> and will be rejected.</span>
            }] : proctoring === 'screen' ? [{
                tag: 'MONITORING', tagColor: '#fbbf24', tagBg: 'rgba(245,158,11,0.12)',
                text: <span style={{ color: '#fde68a' }}>You MUST share your <strong>Entire Screen</strong> (not a window or tab). If you share the wrong surface, you will be prompted again.</span>
            }] : [{
                tag: 'OPEN', tagColor: '#34d399', tagBg: 'rgba(16,185,129,0.12)',
                text: <span style={{ color: '#6ee7b7' }}>No camera or screen recording required for this assessment.</span>
            }]),
        ];

        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', padding: 24, overflowY: 'auto'
            }}>
                <div className="card" style={{ maxWidth: 560, width: '100%', boxShadow: '0 32px 64px rgba(0,0,0,0.5)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                            <ShieldAlert size={28} color="#60a5fa" />
                        </div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                            {mediaStreams ? 'Attention Required' : 'Interview Instructions'}
                        </h1>
                        <p style={{ fontSize: 13, opacity: 0.45 }}>
                            {mediaStreams ? 'Surveillance connection lost. Please re-grant access.' : 'Read carefully before proceeding'}
                        </p>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {monitoringItems.map(item => (
                                <div key={item.tag} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: item.tagColor, background: item.tagBg, padding: '4px 10px', borderRadius: 6, flexShrink: 0, marginTop: 1 }}>{item.tag}</span>
                                    <span style={{ fontSize: 14, lineHeight: 1.5 }}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {permissionError && (
                        <div className="alert alert-error" style={{ marginBottom: 16 }}>
                            <ShieldAlert size={15} style={{ flexShrink: 0 }} />
                            <span>{permissionError}</span>
                        </div>
                    )}

                    <button onClick={requestPermissions} className="button" style={{ width: '100%', padding: '15px', fontSize: 15, fontWeight: 700, boxShadow: '0 0 24px rgba(59,130,246,0.2)' }}>
                        {proctoring === 'none' ? 'I Agree — Begin Interview' : 'I Agree — Grant Access & Begin Interview'}
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16, fontSize: 12, opacity: 0.35 }}>
                        {proctoring !== 'none' && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Camera size={12} /> {proctoring === 'full' ? 'Live Proctoring' : 'Screen Recording'}</span>}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><ShieldAlert size={12} /> Anti-Cheat Active</span>
                    </div>
                </div>
            </div>
        );
    }

    // ── Main Interview IDE ────────────────────────────
    return (
        <div className="editor-layout">
            {/* Primary screen capture (hidden) */}
            <video ref={screenRef} autoPlay playsInline muted style={{ position: 'fixed', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }} />
            {/* Extra monitor captures (hidden) */}
            {screenStreams.map((_, i) => (
                <video key={i} ref={el => { screenRefsExtra.current[i] = el; }} autoPlay playsInline muted style={{ position: 'fixed', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }} />
            ))}
            <canvas ref={canvasRef} style={{ position: 'fixed', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }} />

            {/* Header */}
            <header className="editor-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src="/zuper_logo.png" alt="Zuper Hire" style={{ height: 22, width: 'auto' }} className="dark-logo" />
                        <img src="/zuper_logo_light.png" alt="Zuper Hire" style={{ height: 22, width: 'auto' }} className="light-logo" />
                        <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.5px' }}>Zuper Hire</span>
                    </div>

                    {/* Question tabs */}
                    <div style={{ display: 'flex', gap: 6 }}>
                        {questions.map((q, idx) => {
                            const isDone = submittedSet.has(q.id);
                            const isActive = idx === activeQuestionIdx;
                            return (
                                <button
                                    key={q.id}
                                    onClick={() => handleQuestionChange(idx)}
                                    style={{
                                        padding: '5px 14px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                                        cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s',
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        ...(isActive ? {
                                            background: '#2563eb', color: '#fff', borderColor: 'rgba(96,165,250,0.4)',
                                            boxShadow: '0 2px 12px rgba(59,130,246,0.35)'
                                        } : isDone ? {
                                            background: 'rgba(16,185,129,0.15)', color: '#34d399', borderColor: 'rgba(16,185,129,0.3)'
                                        } : {
                                            background: 'transparent', color: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.08)'
                                        })
                                    }}
                                >
                                    {isDone && <CheckCircle size={12} />}
                                    Q{idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Timer */}
                    <div style={{
                        fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 18, letterSpacing: '0.1em',
                        padding: '5px 14px', borderRadius: 8,
                        background: isUrgent ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)',
                        color: isUrgent ? '#f87171' : '#e2e8f0',
                        border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        display: 'flex', alignItems: 'center', gap: 7,
                        animation: isUrgent ? 'blink 1.5s infinite' : 'none'
                    }}>
                        <Clock size={14} style={{ opacity: 0.7 }} />
                        {formatTime(timeLeft)}
                    </div>

                    {/* Recording — only shown when proctoring is active */}
                    {proctoring !== 'none' && (
                        <div className="recording-indicator">
                            <div className="recording-dot" /> REC
                        </div>
                    )}

                    {/* Tab switches */}
                    {tabSwitches > 0 && (
                        <div style={{
                            background: 'rgba(245,158,11,0.12)', color: '#fbbf24',
                            border: '1px solid rgba(245,158,11,0.3)',
                            padding: '4px 10px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: 5
                        }}>
                            <AlertTriangle size={12} /> {tabSwitches}× focus lost
                        </div>
                    )}

                    {/* Fullscreen toggle */}
                    <button onClick={toggleFullscreen} className="button outline" style={{ padding: '6px 10px' }}>
                        {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                    </button>

                    {/* Final submit */}
                    <button
                        onClick={() => setShowFinalModal(true)}
                        disabled={isSubmitting}
                        className="button"
                        style={{
                            padding: '7px 14px', fontSize: 13, fontWeight: 700,
                            background: allSubmitted ? 'linear-gradient(135deg, #10b981, #059669)' : undefined,
                            boxShadow: allSubmitted ? '0 0 20px rgba(16,185,129,0.3)' : undefined
                        }}
                    >
                        {isSubmitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><div className="spinner sm" /> Submitting...</span>
                        ) : allSubmitted ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={13} /> End Interview</span>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Send size={13} /> End Interview</span>
                        )}
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="editor-workspace">
                {/* Left Pane - Problem */}
                <div className="problem-description" style={{ position: 'relative', height: 'calc(100vh - 64px)', overflowY: 'auto', width: '40%' }}>
                    {/* PiP webcam — only shown when camera proctoring is active */}
                    {proctoring === 'full' && (
                        <div style={{ position: 'absolute', top: 20, right: 20, width: 128, height: 96, borderRadius: 10, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 20 }}>
                            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                        </div>
                    )}

                    {/* Submitted badge */}
                    {currentQuestion && submittedSet.has(currentQuestion.id) && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                            <CheckCircle size={13} /> Submitted
                        </div>
                    )}

                    <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14, paddingRight: 150, letterSpacing: '-0.3px' }}>
                        {currentQuestion?.title}
                    </h2>

                    {currentQuestion && (
                        <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', background: 'rgba(59,130,246,0.12)', padding: '3px 9px', borderRadius: 99, border: '1px solid rgba(59,130,246,0.3)' }}>
                                {currentQuestion.question_type === 'mcq' ? 'MCQ' : 'Coding'}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', background: 'rgba(245,158,11,0.12)', padding: '3px 9px', borderRadius: 99, border: '1px solid rgba(245,158,11,0.3)', marginLeft: 'auto' }}>
                                {currentQuestion.points || 100} pts
                            </span>
                        </div>
                    )}

                    <div style={{ opacity: 0.85, whiteSpace: 'pre-wrap', lineHeight: 1.75, background: 'rgba(0,0,0,0.2)', padding: '16px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', fontSize: 14 }}>
                        {currentQuestion?.description}
                    </div>

                    {currentQuestion?.question_type !== 'mcq' && (
                        <div style={{ marginTop: 28 }}>
                            <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', opacity: 0.5, marginBottom: 12 }}>Sample Test Cases</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {currentQuestion?.test_cases?.map((tc, idx) => (
                                    <div key={idx} style={{ background: 'rgba(30,41,59,0.35)', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(100,116,139,0.25)' }}>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, marginBottom: 6 }}>
                                            <span style={{ opacity: 0.45, display: 'inline-block', width: 72 }}>Input:</span>
                                            <span style={{ color: '#93c5fd' }}>{tc.input}</span>
                                        </div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                                            <span style={{ opacity: 0.45, display: 'inline-block', width: 72 }}>Expected:</span>
                                            <span style={{ color: '#6ee7b7' }}>{tc.expectedOutput}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Pane - Editor or MCQ */}
                <div className="editor-pane" style={{ width: '60%', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                    {currentQuestion?.question_type === 'mcq' ? (
                        /* ── MCQ Pane ── */
                        <div style={{ height: '100%', overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', opacity: 0.4, marginBottom: 4 }}>
                                Select one answer
                            </div>
                            {(currentQuestion.options || []).map((opt, i) => {
                                const isSelected = currentCode === opt;
                                const isSubmitted = submittedSet.has(currentQuestion.id);
                                return (
                                    <button
                                        key={i}
                                        disabled={isSubmitted}
                                        onClick={() => !isSubmitted && handleCodeChange(opt)}
                                        style={{
                                            textAlign: 'left', padding: '16px 20px', borderRadius: 12, cursor: isSubmitted ? 'default' : 'pointer',
                                            border: `2px solid ${isSelected ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.07)'}`,
                                            background: isSelected ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
                                            color: isSelected ? '#93c5fd' : 'rgba(255,255,255,0.8)',
                                            fontSize: 15, fontWeight: isSelected ? 600 : 400, transition: 'all 0.15s',
                                            display: 'flex', alignItems: 'center', gap: 14
                                        }}
                                    >
                                        <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${isSelected ? '#3b82f6' : 'rgba(255,255,255,0.2)'}`, background: isSelected ? '#3b82f6' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                                        </div>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14 }}>{String.fromCharCode(65 + i)}. {opt}</span>
                                    </button>
                                );
                            })}
                            <div style={{ marginTop: 'auto', paddingTop: 24 }}>
                                <button
                                    onClick={() => setShowSubmitModal(true)}
                                    disabled={isSubmitting || submittedSet.has(currentQuestion?.id) || !currentCode}
                                    className={submittedSet.has(currentQuestion?.id) ? 'button outline' : 'button success'}
                                    style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!currentCode && !submittedSet.has(currentQuestion?.id)) ? 0.5 : 1 }}
                                >
                                    {submittedSet.has(currentQuestion?.id) ? <><CheckCircle size={14} /> Submitted</> : <><Send size={14} /> Submit Answer</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ── Coding Pane ── */
                        <>
                            <div className="editor-container">
                                <Editor
                                    height="100%"
                                    defaultLanguage="javascript"
                                    theme="vs-dark"
                                    value={currentCode}
                                    onChange={handleCodeChange}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        fontFamily: 'JetBrains Mono, monospace',
                                        scrollBeyondLastLine: false,
                                        padding: { top: 24, bottom: 24 },
                                        smoothScrolling: true,
                                        cursorBlinking: 'smooth',
                                        lineNumbers: 'on',
                                        wordWrap: 'on',
                                    }}
                                />
                            </div>

                            {/* Terminal / Test Results */}
                            <div className="test-results" style={{ display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', opacity: 0.5 }}>Output</h3>
                                        {testResults && (
                                            <span style={{ fontSize: 12, fontWeight: 700, color: testResults.allPassed ? '#34d399' : '#f87171' }}>
                                                {testResults.allPassed ? '✓ All Passed' : `✗ ${testResults.results?.filter(r => !r.passed).length} Failed`}
                                            </span>
                                        )}
                                        {testResults && !testResults.allPassed && testResults.results?.some(r => r.passed) && (
                                            <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 600 }}>
                                                ({testResults.results.filter(r => r.passed).length}/{testResults.results.length} passed — partial credit)
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={handleRun} disabled={isRunning} className="button outline" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '6px 14px', background: 'rgba(255,255,255,0.03)' }}>
                                            {isRunning ? <><div className="spinner sm" /> Running...</> : <><Play size={13} color="#60a5fa" /> Run</>}
                                        </button>
                                        <button
                                            onClick={() => setShowSubmitModal(true)}
                                            disabled={isSubmitting || submittedSet.has(currentQuestion?.id)}
                                            className={submittedSet.has(currentQuestion?.id) ? 'button outline' : 'button success'}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '6px 14px', opacity: submittedSet.has(currentQuestion?.id) ? 0.6 : 1 }}
                                        >
                                            {submittedSet.has(currentQuestion?.id) ? <><CheckCircle size={13} /> Submitted</> : <><Send size={13} /> Submit Q{activeQuestionIdx + 1}</>}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    {!testResults && (
                                        <div style={{ textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, fontSize: 13, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                            Run your code to see output
                                        </div>
                                    )}
                                    {testResults?.results?.map((res, idx) => (
                                        <div key={idx} style={{
                                            marginBottom: 10, padding: '12px 14px', borderRadius: 8,
                                            fontFamily: 'var(--font-mono)', fontSize: 13,
                                            background: res.passed ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                                            border: `1px solid ${res.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <span className={`badge ${res.passed ? 'passed' : 'failed'}`} style={{ fontSize: 11 }}>Case {idx + 1}</span>
                                                <span style={{ color: res.passed ? '#34d399' : '#f87171', fontWeight: 700 }}>{res.passed ? '✓' : '✗'}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: '4px 8px', opacity: 0.85 }}>
                                                <span style={{ opacity: 0.45 }}>Expected:</span>
                                                <span style={{ color: '#6ee7b7' }}>{res.expected}</span>
                                                <span style={{ opacity: 0.45 }}>Actual:</span>
                                                <span style={{ color: res.passed ? '#6ee7b7' : '#fca5a5' }}>{res.actual}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Submit current question modal */}
            {showSubmitModal && (
                <ConfirmModal
                    title={`Submit Q${activeQuestionIdx + 1}: ${currentQuestion?.title}`}
                    message="Once submitted, you can still view the question but cannot edit the submission. You can continue to other questions after submitting."
                    confirmLabel="Submit Answer"
                    onConfirm={submitQuestion}
                    onCancel={() => setShowSubmitModal(false)}
                />
            )}

            {/* Final submit / end interview modal */}
            {showFinalModal && (
                <div className="modal-backdrop" onClick={() => setShowFinalModal(false)}>
                    <div className="modal-box" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <AlertTriangle size={22} color="#f87171" />
                            </div>
                            <div>
                                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>End Interview?</h3>
                                <p style={{ fontSize: 14, opacity: 0.6, lineHeight: 1.65 }}>
                                    This will submit all questions and close your session. Any unsubmitted answers will be submitted automatically.
                                </p>
                            </div>
                        </div>

                        {/* Per-question status */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
                            {questions.map((q, idx) => (
                                <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx < questions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>Q{idx + 1}: {q.title}</span>
                                    <span style={{
                                        fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                                        background: submittedSet.has(q.id) ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.12)',
                                        color: submittedSet.has(q.id) ? '#34d399' : '#fbbf24',
                                        border: `1px solid ${submittedSet.has(q.id) ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.25)'}`
                                    }}>
                                        {submittedSet.has(q.id) ? '✓ Submitted' : '○ Pending'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowFinalModal(false)} className="button outline" style={{ padding: '10px 18px', fontSize: 13 }}>Keep Working</button>
                            <button onClick={handleFinalSubmit} className="button" style={{ padding: '10px 18px', fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                                End Interview →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
