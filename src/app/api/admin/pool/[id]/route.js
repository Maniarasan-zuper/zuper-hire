import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
    const { id } = await params;
    const { title, description, default_code, test_cases, difficulty, category, question_type = 'coding', options = [], correct_answer = '', tags = [], points } = await request.json();

    const result = db.prepare(`
        UPDATE question_pool
        SET title = ?, description = ?, default_code = ?, test_cases = ?, difficulty = ?, category = ?, question_type = ?, options = ?, correct_answer = ?, tags = ?, points = ?
        WHERE id = ?
    `).run(title, description, default_code, JSON.stringify(test_cases), difficulty, category, question_type, JSON.stringify(options), correct_answer, JSON.stringify(tags), points !== undefined ? points : 100, id);

    if (result.changes === 0) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
}

export async function DELETE(_request, { params }) {
    const { id } = await params;
    const result = db.prepare('DELETE FROM question_pool WHERE id = ?').run(id);
    if (result.changes === 0) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
}
