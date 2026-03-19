import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_session')?.value;
        if (!token) return NextResponse.json({ admin: null });

        const session = db.prepare(`
            SELECT s.*, a.username, a.role
            FROM admin_sessions s
            JOIN admins a ON a.id = s.admin_id
            WHERE s.token = ? AND s.expires_at > datetime('now')
        `).get(token);

        if (!session) return NextResponse.json({ admin: null });
        return NextResponse.json({ admin: { id: session.admin_id, username: session.username, role: session.role } });
    } catch {
        return NextResponse.json({ admin: null });
    }
}
