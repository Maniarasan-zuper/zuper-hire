import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
    const { candidateId } = await params;
    const body = await request.json().catch(() => ({}));
    const reassignQuestions = body.reassignQuestions === true;

    const candidate = db.prepare('SELECT id FROM candidates WHERE id = ?').get(candidateId);
    if (!candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });

    db.prepare('DELETE FROM submissions WHERE candidate_id = ?').run(candidateId);

    // If reassignQuestions=true, clear assigned_questions so a fresh random set is picked next login
    db.prepare(`
        UPDATE candidates
        SET status = 'invited',
            reset_at = datetime('now'),
            assigned_questions = ?
        WHERE id = ?
    `).run(reassignQuestions ? null : (db.prepare('SELECT assigned_questions FROM candidates WHERE id = ?').get(candidateId)?.assigned_questions ?? null), candidateId);

    return NextResponse.json({ success: true, questionsReassigned: reassignQuestions });
}
