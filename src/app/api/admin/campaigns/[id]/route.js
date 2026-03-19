import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const { id } = await params;
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ campaign });
}

export async function PUT(request, { params }) {
    const { id } = await params;
    const body = await request.json();

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const duration = body.duration !== undefined ? body.duration : campaign.duration;
    const status = body.status !== undefined ? body.status : campaign.status;

    if (status === 'live') {
        const questionCount = db.prepare('SELECT COUNT(*) as count FROM questions WHERE campaign_id = ?').get(id).count;
        if (questionCount === 0) {
            return NextResponse.json({ error: 'Cannot make campaign live without at least one question.' }, { status: 400 });
        }
    }

    const proctoring = body.proctoring !== undefined ? body.proctoring : (campaign.proctoring || 'full');
    const randomize_questions = body.randomize_questions !== undefined ? (body.randomize_questions ? 1 : 0) : (campaign.randomize_questions || 0);
    const question_count = body.question_count !== undefined ? body.question_count : (campaign.question_count || 0);
    const difficulty_mix = body.difficulty_mix !== undefined ? JSON.stringify(body.difficulty_mix) : (campaign.difficulty_mix || '{}');

    db.prepare('UPDATE campaigns SET duration = ?, status = ?, proctoring = ?, randomize_questions = ?, question_count = ?, difficulty_mix = ? WHERE id = ?')
        .run(duration, status, proctoring, randomize_questions, question_count, difficulty_mix, id);
    return NextResponse.json({ success: true, duration, status, proctoring, randomize_questions, question_count, difficulty_mix });
}
