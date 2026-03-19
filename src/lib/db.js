import sqlite3 from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = sqlite3(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    duration INTEGER DEFAULT 60,
    status TEXT DEFAULT 'live',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS question_pool (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    default_code TEXT,
    test_cases TEXT,
    difficulty TEXT DEFAULT 'Easy',
    category TEXT DEFAULT 'Problem Solving',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    campaign_id TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    default_code TEXT,
    test_cases TEXT, 
    difficulty TEXT DEFAULT 'Easy',
    category TEXT DEFAULT 'Problem Solving',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    campaign_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email, campaign_id)
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    candidate_id TEXT,
    question_id TEXT,
    code TEXT,
    status TEXT, 
    tab_switches INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS screenshots (
    id TEXT PRIMARY KEY,
    candidate_id TEXT,
    type TEXT,
    image_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Migration: add proctoring to campaigns ───────────────────────────────────
try {
    const campaignCols = db.prepare("PRAGMA table_info(campaigns)").all();
    if (!campaignCols.some(c => c.name === 'proctoring')) {
        db.exec("ALTER TABLE campaigns ADD COLUMN proctoring TEXT DEFAULT 'full'");
    }
} catch { }

// ── Migration: add monitor_index to screenshots ──────────────────────────────
try {
    const cols = db.prepare("PRAGMA table_info(screenshots)").all();
    if (!cols.some(c => c.name === 'monitor_index')) {
        db.exec('ALTER TABLE screenshots ADD COLUMN monitor_index INTEGER DEFAULT 0');
    }
} catch { }

// ── Migration: add question_type, options, correct_answer to question_pool ──
try {
    const qpCols = db.prepare("PRAGMA table_info(question_pool)").all();
    const qpNames = qpCols.map(c => c.name);
    if (!qpNames.includes('question_type')) db.exec("ALTER TABLE question_pool ADD COLUMN question_type TEXT DEFAULT 'coding'");
    if (!qpNames.includes('options')) db.exec("ALTER TABLE question_pool ADD COLUMN options TEXT DEFAULT '[]'");
    if (!qpNames.includes('correct_answer')) db.exec("ALTER TABLE question_pool ADD COLUMN correct_answer TEXT DEFAULT ''");
    if (!qpNames.includes('tags')) db.exec("ALTER TABLE question_pool ADD COLUMN tags TEXT DEFAULT '[]'");
    if (!qpNames.includes('points')) db.exec("ALTER TABLE question_pool ADD COLUMN points INTEGER DEFAULT 100");
} catch { }

// ── Migration: add question_type, options, correct_answer, points to questions ──
try {
    const qCols = db.prepare("PRAGMA table_info(questions)").all();
    const qNames = qCols.map(c => c.name);
    if (!qNames.includes('question_type')) db.exec("ALTER TABLE questions ADD COLUMN question_type TEXT DEFAULT 'coding'");
    if (!qNames.includes('options')) db.exec("ALTER TABLE questions ADD COLUMN options TEXT DEFAULT '[]'");
    if (!qNames.includes('correct_answer')) db.exec("ALTER TABLE questions ADD COLUMN correct_answer TEXT DEFAULT ''");
    if (!qNames.includes('points')) db.exec("ALTER TABLE questions ADD COLUMN points INTEGER DEFAULT 100");
} catch { }

// ── Migration: add scoring columns to submissions ─────────────────────────────
try {
    const sCols = db.prepare("PRAGMA table_info(submissions)").all();
    const sNames = sCols.map(c => c.name);
    if (!sNames.includes('points_earned')) db.exec("ALTER TABLE submissions ADD COLUMN points_earned INTEGER DEFAULT 0");
    if (!sNames.includes('test_cases_passed')) db.exec("ALTER TABLE submissions ADD COLUMN test_cases_passed INTEGER DEFAULT 0");
    if (!sNames.includes('test_cases_total')) db.exec("ALTER TABLE submissions ADD COLUMN test_cases_total INTEGER DEFAULT 0");
} catch { }

// ── Migration: add randomize settings to campaigns ───────────────────────────
try {
    const campCols2 = db.prepare("PRAGMA table_info(campaigns)").all();
    const campNames2 = campCols2.map(c => c.name);
    if (!campNames2.includes('randomize_questions')) db.exec("ALTER TABLE campaigns ADD COLUMN randomize_questions INTEGER DEFAULT 0");
    if (!campNames2.includes('question_count')) db.exec("ALTER TABLE campaigns ADD COLUMN question_count INTEGER DEFAULT 0");
    if (!campNames2.includes('difficulty_mix')) db.exec("ALTER TABLE campaigns ADD COLUMN difficulty_mix TEXT DEFAULT '{}'");
} catch { }

// ── Migration: add candidate status + invite tracking ────────────────────────
try {
    const cCols = db.prepare("PRAGMA table_info(candidates)").all();
    const cNames = cCols.map(c => c.name);
    if (!cNames.includes('last_active_at')) db.exec("ALTER TABLE candidates ADD COLUMN last_active_at DATETIME");
    if (!cNames.includes('status')) db.exec("ALTER TABLE candidates ADD COLUMN status TEXT DEFAULT 'invited'");
    if (!cNames.includes('invited_at')) db.exec("ALTER TABLE candidates ADD COLUMN invited_at DATETIME");
    if (!cNames.includes('reset_at')) db.exec("ALTER TABLE candidates ADD COLUMN reset_at DATETIME");
    if (!cNames.includes('assigned_questions')) db.exec("ALTER TABLE candidates ADD COLUMN assigned_questions TEXT DEFAULT NULL");
    if (!cNames.includes('tab_switches')) db.exec("ALTER TABLE candidates ADD COLUMN tab_switches INTEGER DEFAULT 0");
} catch { }

// ── Create app_settings table ─────────────────────────────────────────────────
db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
`);

// ── Create admins + sessions tables ──────────────────────────────────────────
db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS admin_sessions (
        id TEXT PRIMARY KEY,
        admin_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// ── Seed default super admin if none exist ────────────────────────────────────
const superAdminExists = db.prepare("SELECT id FROM admins WHERE role = 'superadmin'").get();
if (!superAdminExists) {
    const defaultPassword = process.env.SUPER_ADMIN_PASSWORD || 'superadmin123';
    const passwordHash = crypto.createHash('sha256').update(defaultPassword).digest('hex');
    db.prepare("INSERT INTO admins (id, username, password_hash, role) VALUES (?, ?, ?, ?)")
        .run(crypto.randomUUID(), 'superadmin', passwordHash, 'superadmin');
}

// ── Migration: add question_title_snapshot to submissions ────────────────────
try {
    const sCols2 = db.prepare("PRAGMA table_info(submissions)").all();
    if (!sCols2.some(c => c.name === 'question_title_snapshot')) {
        db.exec("ALTER TABLE submissions ADD COLUMN question_title_snapshot TEXT DEFAULT NULL");
    }
} catch { }

// ── Migration: add eligible_next_round to candidates ─────────────────────────
try {
    const cCols2 = db.prepare("PRAGMA table_info(candidates)").all();
    if (!cCols2.some(c => c.name === 'eligible_next_round')) {
        db.exec("ALTER TABLE candidates ADD COLUMN eligible_next_round INTEGER DEFAULT 0");
    }
} catch { }

// ── Create candidate_comments table ──────────────────────────────────────────
db.exec(`
    CREATE TABLE IF NOT EXISTS candidate_comments (
        id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL,
        admin_id TEXT NOT NULL,
        admin_username TEXT NOT NULL,
        comment TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// ── Migration: fix candidates table (email UNIQUE → composite UNIQUE on email+campaign_id) ──
const migrateRun = db.transaction(() => {
    const indices = db.prepare("PRAGMA index_list(candidates)").all();
    const hasOldUniqueOnEmail = indices.some(idx => {
        if (!idx.unique) return false;
        const cols = db.prepare(`PRAGMA index_info(${idx.name})`).all();
        return cols.length === 1 && cols[0].name === 'email';
    });

    if (hasOldUniqueOnEmail) {
        db.exec(`
            CREATE TABLE IF NOT EXISTS candidates_v2 (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                name TEXT NOT NULL,
                campaign_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(email, campaign_id)
            );
            INSERT OR IGNORE INTO candidates_v2 SELECT * FROM candidates;
            DROP TABLE candidates;
            ALTER TABLE candidates_v2 RENAME TO candidates;
        `);
    }
});
migrateRun();

export default db;
