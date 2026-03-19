import db from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
    const { email, name, campaignId } = await request.json();

    if (!email || !name || !campaignId) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const campaign = db.prepare('SELECT id, status FROM campaigns WHERE id = ?').get(campaignId);
    if (!campaign) {
        return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 404 });
    }
    if (campaign.status === 'archived') {
        return NextResponse.json({ error: 'This campaign is no longer active.' }, { status: 403 });
    }

    let candidate = db.prepare('SELECT id, status FROM candidates WHERE email = ? AND campaign_id = ?').get(email, campaignId);
    if (candidate?.status === 'completed') {
        return NextResponse.json({ error: 'You have already completed this interview.' }, { status: 403 });
    }

    if (!candidate) {
        const newId = crypto.randomUUID();
        try {
            db.prepare('INSERT INTO candidates (id, email, name, campaign_id) VALUES (?, ?, ?, ?)').run(newId, email, name, campaignId);
            candidate = { id: newId };
        } catch (err) {
            // Composite unique constraint: candidate already exists (race condition), fetch again
            candidate = db.prepare('SELECT id FROM candidates WHERE email = ? AND campaign_id = ?').get(email, campaignId);
            if (!candidate) {
                return NextResponse.json({ error: 'Failed to register candidate. Please try again.' }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ candidateId: candidate.id, campaignId });
}
