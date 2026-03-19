import db from '@/lib/db';
import { NextResponse } from 'next/server';

function pickRandom(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
}

export async function GET(request, { params }) {
    const { campaignId } = await params;
    const url = new URL(request.url);
    const candidateId = url.searchParams.get('candidateId');

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    if (campaign.status === 'archived') return NextResponse.json({ error: 'This campaign is no longer active.' }, { status: 403 });

    let allQuestions = db.prepare('SELECT * FROM questions WHERE campaign_id = ? ORDER BY created_at ASC').all(campaignId);
    allQuestions = allQuestions.map(q => ({
        ...q,
        test_cases: JSON.parse(q.test_cases || '[]'),
        options: JSON.parse(q.options || '[]'),
    }));

    // Randomization
    if (campaign.randomize_questions && candidateId) {
        const candidate = db.prepare('SELECT assigned_questions FROM candidates WHERE id = ?').get(candidateId);
        if (candidate?.assigned_questions) {
            // Already assigned — return same set
            const assignedIds = JSON.parse(candidate.assigned_questions);
            const filtered = allQuestions.filter(q => assignedIds.includes(q.id));
            return NextResponse.json({ questions: filtered });
        }

        // Pick questions now
        const mix = JSON.parse(campaign.difficulty_mix || '{}');
        const targetCount = campaign.question_count || allQuestions.length;
        let picked = [];

        if (Object.keys(mix).length > 0) {
            for (const [diff, count] of Object.entries(mix)) {
                const pool = allQuestions.filter(q => q.difficulty === diff && !picked.some(p => p.id === q.id));
                picked.push(...pickRandom(pool, count));
            }
            // Fill remaining slots if count > sum of mix
            const remaining = targetCount - picked.length;
            if (remaining > 0) {
                const rest = allQuestions.filter(q => !picked.some(p => p.id === q.id));
                picked.push(...pickRandom(rest, remaining));
            }
        } else {
            picked = pickRandom(allQuestions, targetCount);
        }

        // Save assignment
        db.prepare('UPDATE candidates SET assigned_questions = ? WHERE id = ?').run(JSON.stringify(picked.map(q => q.id)), candidateId);
        return NextResponse.json({ questions: picked });
    }

    return NextResponse.json({ questions: allQuestions });
}
