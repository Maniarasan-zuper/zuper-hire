import db from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request, { params }) {
  const { id } = await params; // campaign id
  const { poolId } = await request.json();

  const poolQ = db.prepare('SELECT * FROM question_pool WHERE id = ?').get(poolId);
  if (!poolQ) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

  const qId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO questions (id, campaign_id, title, description, default_code, test_cases, difficulty, category, question_type, options, correct_answer, points)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(qId, id, poolQ.title, poolQ.description, poolQ.default_code, poolQ.test_cases, poolQ.difficulty, poolQ.category, poolQ.question_type || 'coding', poolQ.options || '[]', poolQ.correct_answer || '', poolQ.points || 100);

  return NextResponse.json({ id: qId }, { status: 201 });
}
