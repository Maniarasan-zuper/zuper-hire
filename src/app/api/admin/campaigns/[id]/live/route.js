import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const { id } = await params;

    // Get candidates active in the last 2 minutes
    const liveCandidates = db.prepare(`
        SELECT id, name, email, last_active_at, tab_switches, status
        FROM candidates
        WHERE campaign_id = ? 
        AND last_active_at > datetime('now', '-30 seconds')
        AND (status IS NULL OR status != 'completed')
        ORDER BY last_active_at DESC
    `).all(id);

    const candidatesWithScreens = liveCandidates.map(c => {
        const latestScreen = db.prepare(`
            SELECT image_data, monitor_index, created_at
            FROM screenshots
            WHERE candidate_id = ? AND type = 'screen'
            ORDER BY created_at DESC
            LIMIT 1
        `).get(c.id);

        const latestCamera = db.prepare(`
            SELECT image_data, created_at
            FROM screenshots
            WHERE candidate_id = ? AND type = 'camera'
            ORDER BY created_at DESC
            LIMIT 1
        `).get(c.id);

        return {
            ...c,
            latestScreen: latestScreen || null,
            latestCamera: latestCamera || null
        };
    });

    return NextResponse.json({ candidates: candidatesWithScreens });
}
