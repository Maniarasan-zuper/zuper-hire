import db from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request, { params }) {
    const { id } = await params;

    const original = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
    if (!original) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const newId = crypto.randomUUID();
    const newName = `Copy of ${original.name}`;

    try {
        const cloneCampaign = db.transaction(() => {
            // Create New Campaign
            db.prepare(`
                INSERT INTO campaigns (
                    id, name, duration, proctoring, status, 
                    randomize_questions, question_count, difficulty_mix
                ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)
            `).run(
                newId, newName, original.duration, original.proctoring,
                original.randomize_questions, original.question_count, original.difficulty_mix
            );

            // Fetch original questions
            const originalQuestions = db.prepare('SELECT * FROM questions WHERE campaign_id = ?').all(id);

            // Clone questions
            for (const q of originalQuestions) {
                db.prepare(`
                    INSERT INTO questions (
                        id, campaign_id, title, description, default_code, 
                        test_cases, difficulty, category, question_type, 
                        options, correct_answer, points
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    crypto.randomUUID(), newId, q.title, q.description, q.default_code,
                    q.test_cases, q.difficulty, q.category, q.question_type,
                    q.options, q.correct_answer, q.points
                );
            }
        });

        cloneCampaign();

        return NextResponse.json({ success: true, newId });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
