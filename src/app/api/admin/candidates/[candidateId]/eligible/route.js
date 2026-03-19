import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
    const { candidateId } = await params;
    const { eligible } = await request.json();

    const candidate = db.prepare('SELECT id FROM candidates WHERE id = ?').get(candidateId);
    if (!candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });

    db.prepare('UPDATE candidates SET eligible_next_round = ? WHERE id = ?')
        .run(eligible ? 1 : 0, candidateId);

    return NextResponse.json({ success: true, eligible_next_round: eligible ? 1 : 0 });
}
