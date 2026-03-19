import db from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/admin/candidates/history?email=...
// Returns all campaign participations for a candidate by email
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 });

    const candidates = db.prepare(`
        SELECT c.*, camp.name as campaign_name, camp.status as campaign_status, camp.duration as campaign_duration
        FROM candidates c
        JOIN campaigns camp ON c.campaign_id = camp.id
        WHERE c.email = ?
        ORDER BY c.created_at DESC
    `).all(email);

    const history = candidates.map(c => {
        const submissions = db.prepare(`
            SELECT s.*, COALESCE(s.question_title_snapshot, q.title, '[Deleted]') as question_title,
                   q.points as question_points, q.question_type
            FROM submissions s
            LEFT JOIN questions q ON s.question_id = q.id
            WHERE s.candidate_id = ?
        `).all(c.id);

        const totalPoints = submissions.reduce((sum, s) => sum + (s.points_earned || 0), 0);
        const maxPoints = submissions.reduce((sum, s) => sum + (s.question_points || 100), 0);
        const passed = submissions.filter(s => s.status === 'Passed').length;

        return {
            candidateId: c.id,
            campaignId: c.campaign_id,
            campaignName: c.campaign_name,
            campaignStatus: c.campaign_status,
            candidateStatus: c.status,
            eligible_next_round: c.eligible_next_round,
            tab_switches: c.tab_switches,
            created_at: c.created_at,
            submissions,
            totalPoints,
            maxPoints,
            passedCount: passed,
            totalCount: submissions.length,
            scorePercent: maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0,
        };
    });

    return NextResponse.json({ email, history });
}
