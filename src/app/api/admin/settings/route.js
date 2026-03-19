import db from '@/lib/db';
import { NextResponse } from 'next/server';

const DEFAULTS = {
    smtp: { host: '', port: 587, secure: false, user: '', password: '', from_name: 'Zuper Hire', from_email: '' },
    email_template: {
        subject: 'You\'ve been invited to a technical assessment — {{campaign_name}}',
        body: `Hello {{name}},\n\nYou have been invited to complete a technical assessment for {{campaign_name}}.\n\nClick the link below to start your interview:\n{{link}}\n\nThe assessment is {{duration}} minutes long.\n\nGood luck!\n\nBest regards,\nThe Hiring Team`
    }
};

function getSetting(key) {
    const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
    return row ? JSON.parse(row.value) : DEFAULTS[key];
}

export async function GET() {
    return NextResponse.json({
        smtp: getSetting('smtp'),
        email_template: getSetting('email_template')
    });
}

export async function PUT(request) {
    const body = await request.json();
    if (body.smtp !== undefined) {
        db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run('smtp', JSON.stringify(body.smtp));
    }
    if (body.email_template !== undefined) {
        db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run('email_template', JSON.stringify(body.email_template));
    }
    return NextResponse.json({ success: true });
}
