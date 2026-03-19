import db from '@/lib/db';
import { NextResponse } from 'next/server';

// DELETE /api/admin/screenshots/cleanup
// Deletes all screenshots older than `days` days (default 30)
// Also enforces max 30 screenshots per candidate per type
export async function POST(request) {
    const body = await request.json().catch(() => ({}));
    const days = Math.max(1, parseInt(body.days) || 30);

    // Delete screenshots older than `days` days
    const byAge = db.prepare(`
        DELETE FROM screenshots WHERE created_at < datetime('now', '-${days} days')
    `).run();

    // Enforce max 30 per candidate per type (keep most recent)
    const candidates = db.prepare('SELECT DISTINCT candidate_id, type FROM screenshots').all();
    let byCount = 0;
    for (const { candidate_id, type } of candidates) {
        const overflow = db.prepare(`
            DELETE FROM screenshots
            WHERE candidate_id = ? AND type = ?
              AND id NOT IN (
                SELECT id FROM screenshots
                WHERE candidate_id = ? AND type = ?
                ORDER BY created_at DESC
                LIMIT 30
              )
        `).run(candidate_id, type, candidate_id, type);
        byCount += overflow.changes;
    }

    const remaining = db.prepare('SELECT COUNT(*) as n FROM screenshots').get().n;

    return NextResponse.json({
        success: true,
        deletedByAge: byAge.changes,
        deletedByCount: byCount,
        remaining
    });
}

// GET — return current storage stats
export async function GET() {
    const total = db.prepare('SELECT COUNT(*) as n FROM screenshots').get().n;
    const byType = db.prepare('SELECT type, COUNT(*) as n FROM screenshots GROUP BY type').all();
    const oldest = db.prepare('SELECT MIN(created_at) as d FROM screenshots').get()?.d;
    const newest = db.prepare('SELECT MAX(created_at) as d FROM screenshots').get()?.d;

    return NextResponse.json({ total, byType, oldest, newest });
}
