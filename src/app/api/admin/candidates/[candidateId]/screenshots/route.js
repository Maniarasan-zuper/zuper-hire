import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const { candidateId } = await params;

    const screenshots = db.prepare(`
    SELECT * FROM screenshots 
    WHERE candidate_id = ? 
    ORDER BY created_at DESC
  `).all(candidateId);

    return NextResponse.json({ screenshots });
}
