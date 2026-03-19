import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

async function requireSuperAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    if (!token) return null;
    return db.prepare(`
        SELECT a.* FROM admin_sessions s
        JOIN admins a ON a.id = s.admin_id
        WHERE s.token = ? AND s.expires_at > datetime('now') AND a.role = 'superadmin'
    `).get(token) || null;
}

export async function DELETE(request, { params }) {
    const me = await requireSuperAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (id === me.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });

    const target = db.prepare('SELECT id, role FROM admins WHERE id = ?').get(id);
    if (!target) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    if (target.role === 'superadmin') return NextResponse.json({ error: 'Cannot delete a superadmin' }, { status: 403 });

    db.prepare('DELETE FROM admin_sessions WHERE admin_id = ?').run(id);
    db.prepare('DELETE FROM admins WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
}

export async function PUT(request, { params }) {
    const me = await requireSuperAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { password } = await request.json();
    if (!password?.trim()) return NextResponse.json({ error: 'Password required' }, { status: 400 });

    const target = db.prepare('SELECT id FROM admins WHERE id = ?').get(id);
    if (!target) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(passwordHash, id);
    return NextResponse.json({ success: true });
}
