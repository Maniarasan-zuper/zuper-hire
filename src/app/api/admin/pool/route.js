import db from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
    const pool = db.prepare('SELECT * FROM question_pool ORDER BY created_at DESC').all();
    return NextResponse.json({
        pool: pool.map(q => ({
            ...q,
            test_cases: q.test_cases ? JSON.parse(q.test_cases) : [],
            options: q.options ? JSON.parse(q.options) : [],
            tags: q.tags ? JSON.parse(q.tags) : [],
        }))
    });
}

export async function POST(request) {
    const { title, description, default_code, test_cases, difficulty, category, question_type = 'coding', options = [], correct_answer = '', tags = [], points } = await request.json();
    const id = crypto.randomUUID();
    db.prepare(`
        INSERT INTO question_pool (id, title, description, default_code, test_cases, difficulty, category, question_type, options, correct_answer, tags, points)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, description, default_code || '', JSON.stringify(test_cases || []), difficulty || 'Easy', category || 'Problem Solving', question_type, JSON.stringify(options), correct_answer, JSON.stringify(tags), points || 100);
    return NextResponse.json({ success: true, id }, { status: 201 });
}
