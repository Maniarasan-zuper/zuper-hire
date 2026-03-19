import db from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request, { params }) {
    const { id } = await params;
    const questions = db.prepare('SELECT * FROM questions WHERE campaign_id = ? ORDER BY created_at ASC').all(id);

    // Parse test cases, options
    const formatted = questions.map(q => ({
        ...q,
        test_cases: JSON.parse(q.test_cases || '[]'),
        options: JSON.parse(q.options || '[]'),
    }));

    return NextResponse.json({ questions: formatted });
}

export async function POST(request, { params }) {
    const { id } = await params;
    const body = await request.json();
    const qId = crypto.randomUUID();

    const question_type = body.question_type || 'coding';
    const options = body.options || [];
    const correct_answer = body.correct_answer || '';

    db.prepare(`
        INSERT INTO questions (id, campaign_id, title, description, default_code, test_cases, difficulty, category, question_type, options, correct_answer, points)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(qId, id, body.title, body.description, body.default_code, JSON.stringify(body.test_cases || []), body.difficulty || 'Easy', body.category || 'Problem Solving', question_type, JSON.stringify(options), correct_answer, body.points || 100);

    return NextResponse.json({ id: qId }, { status: 201 });
}
