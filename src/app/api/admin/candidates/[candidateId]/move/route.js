import db from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Move a candidate to another campaign (creates a fresh candidate record in the target campaign)
export async function POST(request, { params }) {
    const { candidateId } = await params;
    const { targetCampaignId } = await request.json();

    if (!targetCampaignId) return NextResponse.json({ error: 'Target campaign is required' }, { status: 400 });

    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidateId);
    if (!candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });

    const campaign = db.prepare("SELECT id, status FROM campaigns WHERE id = ?").get(targetCampaignId);
    if (!campaign) return NextResponse.json({ error: 'Target campaign not found' }, { status: 404 });
    if (campaign.status === 'archived') return NextResponse.json({ error: 'Target campaign is archived' }, { status: 400 });

    // Check if candidate already exists in target campaign
    const existing = db.prepare('SELECT id FROM candidates WHERE email = ? AND campaign_id = ?')
        .get(candidate.email, targetCampaignId);
    if (existing) return NextResponse.json({ error: 'Candidate already exists in that campaign' }, { status: 409 });

    const newId = crypto.randomUUID();
    db.prepare(`
        INSERT INTO candidates (id, email, name, campaign_id, status, invited_at)
        VALUES (?, ?, ?, ?, 'invited', datetime('now'))
    `).run(newId, candidate.email, candidate.name, targetCampaignId);

    return NextResponse.json({ success: true, newCandidateId: newId });
}
