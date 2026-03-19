import db from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Verify admin session helper
function getAdmin(request) {
    const token = request.cookies.get('admin_session')?.value;
    if (!token) return null;
    return db.prepare(`
        SELECT a.id, a.username FROM admin_sessions s
        JOIN admins a ON s.admin_id = a.id
        WHERE s.token = ? AND s.expires_at > datetime('now')
    `).get(token);
}

export async function GET(request, { params }) {
    const { candidateId } = await params;
    const comments = db.prepare(
        'SELECT * FROM candidate_comments WHERE candidate_id = ? ORDER BY created_at DESC'
    ).all(candidateId);
    return NextResponse.json({ comments });
}

export async function POST(request, { params }) {
    const { candidateId } = await params;
    const admin = getAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { comment } = await request.json();
    if (!comment?.trim()) return NextResponse.json({ error: 'Comment is required' }, { status: 400 });

    const id = crypto.randomUUID();
    db.prepare(
        'INSERT INTO candidate_comments (id, candidate_id, admin_id, admin_username, comment) VALUES (?, ?, ?, ?, ?)'
    ).run(id, candidateId, admin.id, admin.username, comment.trim());

    const created = db.prepare('SELECT * FROM candidate_comments WHERE id = ?').get(id);
    return NextResponse.json({ comment: created }, { status: 201 });
}

export async function DELETE(request, { params }) {
    const { candidateId } = await params;
    const admin = getAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { commentId } = await request.json();
    db.prepare('DELETE FROM candidate_comments WHERE id = ? AND candidate_id = ?').run(commentId, candidateId);
    return NextResponse.json({ success: true });
}
