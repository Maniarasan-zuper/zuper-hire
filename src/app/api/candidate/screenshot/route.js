import db from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
    try {
        const { candidateId, type, imageData, monitorIndex = 0 } = await request.json();

        if (!candidateId || !type || !imageData) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const id = crypto.randomUUID();
        db.prepare(`
            INSERT INTO screenshots (id, candidate_id, type, image_data, monitor_index)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, candidateId, type, imageData, monitorIndex);

        // Optional: Keep only the most recent snapshots to avoid bloat (keep last 30)
        db.prepare(`
            DELETE FROM screenshots 
            WHERE candidate_id = ? AND type = ? 
            AND id NOT IN (
                SELECT id FROM screenshots 
                WHERE candidate_id = ? AND type = ? 
                ORDER BY created_at DESC LIMIT 30
            )
        `).run(candidateId, type, candidateId, type);

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
