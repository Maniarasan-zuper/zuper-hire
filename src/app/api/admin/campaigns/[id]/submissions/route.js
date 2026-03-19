import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(_request, { params }) {
    const { id } = await params;

    // Use question_title_snapshot when available (preserves title if question was later edited/deleted)
    const submissions = db.prepare(`
        SELECT s.*,
               COALESCE(s.question_title_snapshot, q.title, '[Deleted Question]') as question_title,
               q.points as question_points,
               q.question_type,
               c.name, c.email, c.tab_switches as session_tab_switches,
               c.eligible_next_round
        FROM submissions s
        JOIN candidates c ON s.candidate_id = c.id
        LEFT JOIN questions q ON s.question_id = q.id
        WHERE c.campaign_id = ?
        ORDER BY s.created_at DESC
    `).all(id);

    return NextResponse.json({ submissions });
}
