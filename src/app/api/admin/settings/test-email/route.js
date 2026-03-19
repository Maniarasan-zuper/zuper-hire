import db from '@/lib/db';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
    const { to } = await request.json();
    if (!to) return NextResponse.json({ error: 'Recipient email required' }, { status: 400 });

    const row = db.prepare("SELECT value FROM app_settings WHERE key = 'smtp'").get();
    if (!row) return NextResponse.json({ error: 'SMTP not configured' }, { status: 400 });

    const smtp = JSON.parse(row.value);
    if (!smtp.host || !smtp.from_email) {
        return NextResponse.json({ error: 'SMTP host and from_email are required' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port || 587,
        secure: smtp.secure || false,
        auth: smtp.user ? { user: smtp.user, pass: smtp.password } : undefined,
    });

    try {
        await transporter.sendMail({
            from: `"${smtp.from_name || 'Zuper Hire'}" <${smtp.from_email}>`,
            to,
            subject: 'Zuper Hire — Test Email',
            text: 'This is a test email from Zuper Hire. Your SMTP configuration is working correctly!',
        });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
