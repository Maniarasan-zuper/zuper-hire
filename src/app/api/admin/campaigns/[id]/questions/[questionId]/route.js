import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
    const { id, questionId } = await params;
    const result = db.prepare('DELETE FROM questions WHERE id = ? AND campaign_id = ?').run(questionId, id);
    if (result.changes === 0) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
}
