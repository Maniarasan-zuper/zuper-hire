import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { candidateId } = await request.json();
        if (!candidateId) return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 });

        db.prepare(`
            UPDATE candidates 
            SET status = 'completed', 
                last_active_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(candidateId);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
