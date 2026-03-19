import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_session')?.value;
        if (token) {
            db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
        }
        const response = NextResponse.json({ success: true });
        response.cookies.delete('admin_session');
        return response;
    } catch {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
