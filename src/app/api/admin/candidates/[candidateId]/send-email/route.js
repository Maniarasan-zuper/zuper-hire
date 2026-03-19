import db from '@/lib/db';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

function getSetting(key) {
    const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
    return row ? JSON.parse(row.value) : null;
}

function renderTemplate(template, vars) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] || '');
}

export async function POST(request, { params }) {
    const { candidateId } = await params;
    const candidate = db.prepare(`
        SELECT c.*, camp.name as campaign_name, camp.duration
        FROM candidates c
        JOIN campaigns camp ON camp.id = c.campaign_id
        WHERE c.id = ?
    `).get(candidateId);
    if (!candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });

    const smtp = getSetting('smtp');
    if (!smtp?.host || !smtp?.from_email) {
        return NextResponse.json({ error: 'SMTP not configured. Go to Admin Settings to set up email.' }, { status: 400 });
    }

    const emailTemplate = getSetting('email_template') || {
        subject: "You've been invited to {{campaign_name}}",
        body: "Hello {{name}},\n\nJoin here: {{link}}"
    };

    const body = await request.json().catch(() => ({}));
    const baseUrl = body.baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const link = `${baseUrl}/candidate/login?campaignId=${candidate.campaign_id}&email=${encodeURIComponent(candidate.email)}`;

    const vars = {
        name: candidate.name,
        campaign_name: candidate.campaign_name,
        duration: candidate.duration,
        link,
        email: candidate.email,
    };

    const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port || 587,
        secure: smtp.secure || false,
        auth: smtp.user ? { user: smtp.user, pass: smtp.password } : undefined,
    });

    try {
        await transporter.sendMail({
            from: `"${smtp.from_name || 'Zuper Hire'}" <${smtp.from_email}>`,
            to: candidate.email,
            subject: renderTemplate(emailTemplate.subject, vars),
            text: renderTemplate(emailTemplate.body, vars),
        });
        db.prepare("UPDATE candidates SET invited_at = datetime('now'), status = 'invited' WHERE id = ?").run(candidateId);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: `Failed to send email: ${err.message}` }, { status: 500 });
    }
}
