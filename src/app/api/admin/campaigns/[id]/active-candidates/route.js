import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const { id } = await params;
    // Candidates active within last 90 seconds
    const active = db.prepare(`
        SELECT c.id, c.name, c.email, c.last_active_at
        FROM candidates c
        WHERE c.campaign_id = ?
          AND c.last_active_at >= datetime('now', '-90 seconds')
        ORDER BY c.last_active_at DESC
    `).all(id);
    return NextResponse.json({ active });
}
