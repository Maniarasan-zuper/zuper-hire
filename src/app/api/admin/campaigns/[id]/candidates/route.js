import db from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request, { params }) {
    const { id } = await params;
    const candidates = db.prepare(`
        SELECT c.*,
            COUNT(s.id) as submission_count,
            COALESCE(SUM(s.points_earned), 0) as total_points,
            MAX(s.created_at) as last_submission_at
        FROM candidates c
        LEFT JOIN submissions s ON s.candidate_id = c.id
        WHERE c.campaign_id = ?
        GROUP BY c.id
        ORDER BY total_points DESC, c.created_at DESC
    `).all(id);
    return NextResponse.json({ candidates });
}

export async function POST(request, { params }) {
    const { id } = await params;
    const { name, email } = await request.json();
    if (!name?.trim() || !email?.trim()) {
        return NextResponse.json({ error: 'Name and email required' }, { status: 400 });
    }
    const campaign = db.prepare('SELECT id FROM campaigns WHERE id = ?').get(id);
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    let candidate = db.prepare('SELECT id FROM candidates WHERE email = ? AND campaign_id = ?').get(email.trim().toLowerCase(), id);
    if (!candidate) {
        const newId = crypto.randomUUID();
        db.prepare('INSERT INTO candidates (id, email, name, campaign_id, status) VALUES (?, ?, ?, ?, ?)').run(newId, email.trim().toLowerCase(), name.trim(), id, 'invited');
        candidate = { id: newId };
    }
    return NextResponse.json({ candidateId: candidate.id }, { status: 201 });
}
