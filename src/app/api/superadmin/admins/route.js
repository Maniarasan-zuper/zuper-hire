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

export async function GET() {
    const me = await requireSuperAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admins = db.prepare('SELECT id, username, role, created_at FROM admins ORDER BY created_at ASC').all();
    return NextResponse.json({ admins });
}

export async function POST(request) {
    const me = await requireSuperAdmin();
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { username, password } = await request.json();
    if (!username?.trim() || !password?.trim()) {
        return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username.trim());
    if (existing) return NextResponse.json({ error: 'Username already exists' }, { status: 409 });

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO admins (id, username, password_hash, role) VALUES (?, ?, ?, ?)').run(id, username.trim(), passwordHash, 'admin');

    return NextResponse.json({ id, username: username.trim(), role: 'admin' }, { status: 201 });
}
