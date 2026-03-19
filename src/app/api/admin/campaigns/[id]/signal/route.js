/**
 * WebRTC Signaling API - Server-Sent Events (SSE) based
 * 
 * How it works:
 * 1. Admin POSTs an offer SDP → stored in memory keyed by campaignId+candidateId
 * 2. Candidate GETs offers via SSE stream → receives the offer
 * 3. Candidate POSTs an answer SDP → stored in memory
 * 4. Admin GETs answers via SSE stream → completes WebRTC handshake
 * 5. Both sides exchange ICE candidates via POST /ice
 *
 * Uses in-process Map (works in single-server dev). For production, use Redis pubsub.
 */

import { NextResponse } from 'next/server';

// In-memory signal store (shared across requests in same process)
const signalStore = global._signalStore || (global._signalStore = {
    offers: new Map(),    // key: `${campaignId}:${candidateId}` → {sdp, from}
    answers: new Map(),   // key: `${campaignId}:${candidateId}` → {sdp}
    iceCandidates: new Map(), // key: `${campaignId}:${candidateId}:${role}` → [ice...]
    adminControllers: new Map(), // key: campaignId → Set of SSE controllers (admin viewers)
    candidateControllers: new Map(), // key: `${campaignId}:${candidateId}` → SSE controller  
});

function getKey(campaignId, candidateId) {
    return `${campaignId}:${candidateId}`;
}

export async function GET(request, { params }) {
    const { id: campaignId } = await params;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // 'admin' or 'candidate'
    const candidateId = searchParams.get('candidateId');

    // SSE stream
    const encoder = new TextEncoder();
    let controller;

    const stream = new ReadableStream({
        start(c) {
            controller = c;

            const send = (data) => {
                try {
                    c.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                } catch { }
            };

            // Register this controller
            if (role === 'admin') {
                if (!signalStore.adminControllers.has(campaignId)) {
                    signalStore.adminControllers.set(campaignId, new Set());
                }
                signalStore.adminControllers.get(campaignId).add(send);

                // Send any pending answers immediately
                for (const [key, answer] of signalStore.answers.entries()) {
                    if (key.startsWith(campaignId + ':')) {
                        const cId = key.split(':')[1];
                        send({ type: 'answer', candidateId: cId, sdp: answer.sdp });
                    }
                }
                // Send any pending ICE from candidates
                for (const [key, ices] of signalStore.iceCandidates.entries()) {
                    if (key.startsWith(campaignId + ':') && key.endsWith(':candidate')) {
                        const cId = key.split(':')[1];
                        ices.forEach(ice => send({ type: 'ice', candidateId: cId, ice, from: 'candidate' }));
                    }
                }

            } else if (role === 'candidate' && candidateId) {
                const key = getKey(campaignId, candidateId);
                signalStore.candidateControllers.set(key, send);

                // Send pending offer immediately
                const offer = signalStore.offers.get(key);
                if (offer) send({ type: 'offer', sdp: offer.sdp });

                // Send pending ICE from admin
                const iceKey = `${key}:admin`;
                const ices = signalStore.iceCandidates.get(iceKey) || [];
                ices.forEach(ice => send({ type: 'ice', ice, from: 'admin' }));
            }

            // Shared Heartbeat & Abort logic
            const pingInterval = setInterval(() => {
                send({ type: 'ping' });
            }, 5000);

            request.signal.addEventListener('abort', () => {
                clearInterval(pingInterval);
                if (role === 'admin') {
                    const set = signalStore.adminControllers.get(campaignId);
                    if (set) set.delete(send);
                } else if (role === 'candidate' && candidateId) {
                    signalStore.candidateControllers.delete(getKey(campaignId, candidateId));
                }
            });
        },
        cancel() { }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}

export async function POST(request, { params }) {
    const { id: campaignId } = await params;
    const body = await request.json();
    const { type, candidateId, sdp, ice } = body;
    const key = getKey(campaignId, candidateId);

    if (type === 'offer') {
        // Clear previous session data for this candidate
        signalStore.answers.delete(key);
        signalStore.iceCandidates.delete(`${key}:admin`);
        signalStore.iceCandidates.delete(`${key}:candidate`);

        // Admin is sending offer to candidate
        signalStore.offers.set(key, { sdp });
        console.log(`[WebRTC] Offer sent to ${candidateId}`);

        // Notify the candidate's SSE stream
        const candidateSend = signalStore.candidateControllers.get(key);
        if (candidateSend) candidateSend({ type: 'offer', sdp });

        return NextResponse.json({ success: true });

    } else if (type === 'answer') {
        // Candidate is sending answer to admin
        signalStore.answers.set(key, { sdp });
        console.log(`[WebRTC] Answer received from ${candidateId}`);

        // Notify all admin SSE streams for this campaign
        const admins = signalStore.adminControllers.get(campaignId);
        if (admins) admins.forEach(send => send({ type: 'answer', candidateId, sdp }));

        return NextResponse.json({ success: true });

    } else if (type === 'ice') {
        const from = body.from; // 'admin' or 'candidate'
        console.log(`[WebRTC] ICE candidate from ${from} for ${candidateId}`);

        if (from === 'admin') {
            // Admin ICE → forward to candidate
            const iceKey = `${key}:admin`;
            if (!signalStore.iceCandidates.has(iceKey)) signalStore.iceCandidates.set(iceKey, []);
            signalStore.iceCandidates.get(iceKey).push(ice);

            const candidateSend = signalStore.candidateControllers.get(key);
            if (candidateSend) candidateSend({ type: 'ice', ice, from: 'admin' });

        } else if (from === 'candidate') {
            // Candidate ICE → forward to admin
            const iceKey = `${key}:candidate`;
            if (!signalStore.iceCandidates.has(iceKey)) signalStore.iceCandidates.set(iceKey, []);
            signalStore.iceCandidates.get(iceKey).push(ice);

            const admins = signalStore.adminControllers.get(campaignId);
            if (admins) admins.forEach(send => send({ type: 'ice', candidateId, ice, from: 'candidate' }));
        }

        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}
