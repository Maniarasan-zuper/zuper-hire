import db from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
    const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all();
    return NextResponse.json({ campaigns });
}

export async function POST(request) {
    const body = await request.json();
    const id = crypto.randomUUID();

    const duration = body.duration || 60;
    const status = body.status || 'draft';
    const proctoring = body.proctoring || 'full';

    db.prepare('INSERT INTO campaigns (id, name, duration, status, proctoring) VALUES (?, ?, ?, ?, ?)').run(id, body.name, duration, status, proctoring);

    return NextResponse.json({ id, name: body.name, duration, status, proctoring }, { status: 201 });
}
