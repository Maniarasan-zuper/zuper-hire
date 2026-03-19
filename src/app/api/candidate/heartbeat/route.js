import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { candidateId, campaignId, tabSwitches } = await request.json();
        if (!candidateId) return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 });

        // Update last active, tab switches, and status
        db.prepare(`
            UPDATE candidates 
            SET last_active_at = CURRENT_TIMESTAMP, 
                tab_switches = ?,
                status = CASE WHEN status = 'invited' OR status IS NULL THEN 'started' ELSE status END
            WHERE id = ?
        `).run(tabSwitches || 0, candidateId);

        if (campaignId) {
            const campaign = db.prepare('SELECT status FROM campaigns WHERE id = ?').get(campaignId);
            if (campaign?.status === 'archived') {
                return NextResponse.json({ status: 'archived' });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
