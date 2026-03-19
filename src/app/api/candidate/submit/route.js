import db from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
    const { candidateId, questionId, code, status, tabSwitches, points_earned, test_cases_passed, test_cases_total } = await request.json();

    if (!candidateId || !questionId) {
        return NextResponse.json({ error: 'Missing candidate details' }, { status: 400 });
    }

    // Snapshot question title at submission time so future question edits don't affect past results
    const question = db.prepare('SELECT title FROM questions WHERE id = ?').get(questionId);
    const titleSnapshot = question?.title || null;

    const id = crypto.randomUUID();
    db.prepare(`
        INSERT INTO submissions (id, candidate_id, question_id, code, status, tab_switches, points_earned, test_cases_passed, test_cases_total, question_title_snapshot)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, candidateId, questionId, code, status, tabSwitches || 0, points_earned || 0, test_cases_passed || 0, test_cases_total || 0, titleSnapshot);

    return NextResponse.json({ success: true, submissionId: id }, { status: 201 });
}
