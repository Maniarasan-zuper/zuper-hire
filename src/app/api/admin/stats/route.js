import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    // ── Campaigns ─────────────────────────────────────────────────────────────
    const totalCampaigns = db.prepare("SELECT COUNT(*) as n FROM campaigns").get().n;
    const liveCampaigns = db.prepare("SELECT COUNT(*) as n FROM campaigns WHERE status = 'live' OR status IS NULL").get().n;
    const archivedCampaigns = db.prepare("SELECT COUNT(*) as n FROM campaigns WHERE status = 'archived'").get().n;

    // ── Candidates ────────────────────────────────────────────────────────────
    const totalCandidates = db.prepare("SELECT COUNT(*) as n FROM candidates").get().n;
    const invitedCandidates = db.prepare("SELECT COUNT(*) as n FROM candidates WHERE status = 'invited' OR status IS NULL").get().n;
    const startedCandidates = db.prepare("SELECT COUNT(*) as n FROM candidates WHERE status = 'started'").get().n;
    const completedCandidates = db.prepare("SELECT COUNT(*) as n FROM candidates WHERE status = 'completed'").get().n;
    const eligibleCandidates = db.prepare("SELECT COUNT(*) as n FROM candidates WHERE eligible_next_round = 1").get().n;

    // ── Submissions ───────────────────────────────────────────────────────────
    const totalSubmissions = db.prepare("SELECT COUNT(*) as n FROM submissions").get().n;
    const passedSubmissions = db.prepare("SELECT COUNT(*) as n FROM submissions WHERE status = 'passed'").get().n;
    const avgScore = db.prepare("SELECT AVG(points_earned) as avg FROM submissions WHERE points_earned > 0").get().avg || 0;
    const totalPointsEarned = db.prepare("SELECT SUM(points_earned) as s FROM submissions").get().s || 0;

    // ── Question Pool ─────────────────────────────────────────────────────────
    const poolTotal = db.prepare("SELECT COUNT(*) as n FROM question_pool").get().n;
    const poolByDiff = db.prepare("SELECT difficulty, COUNT(*) as n FROM question_pool GROUP BY difficulty").all();
    const poolByType = db.prepare("SELECT question_type, COUNT(*) as n FROM question_pool GROUP BY question_type").all();
    const poolByCategory = db.prepare("SELECT category, COUNT(*) as n FROM question_pool GROUP BY category ORDER BY n DESC").all();

    // ── Integrity ─────────────────────────────────────────────────────────────
    const highTabSwitches = db.prepare("SELECT COUNT(*) as n FROM candidates WHERE tab_switches >= 5").get().n;
    const avgTabSwitches = db.prepare("SELECT AVG(tab_switches) as avg FROM candidates WHERE tab_switches > 0").get().avg || 0;
    const totalScreenshots = db.prepare("SELECT COUNT(*) as n FROM screenshots").get().n;

    // ── Activity: submissions per day (last 30 days) ──────────────────────────
    const submissionsPerDay = db.prepare(`
        SELECT date(created_at) as day, COUNT(*) as n
        FROM submissions
        WHERE created_at >= date('now', '-30 days')
        GROUP BY day
        ORDER BY day ASC
    `).all();

    // ── Activity: new candidates per day (last 30 days) ───────────────────────
    const candidatesPerDay = db.prepare(`
        SELECT date(created_at) as day, COUNT(*) as n
        FROM candidates
        WHERE created_at >= date('now', '-30 days')
        GROUP BY day
        ORDER BY day ASC
    `).all();

    // ── Top campaigns by candidate count ──────────────────────────────────────
    const topCampaigns = db.prepare(`
        SELECT camp.id, camp.name, camp.status,
            COUNT(DISTINCT c.id) as candidate_count,
            COUNT(DISTINCT CASE WHEN c.status = 'completed' THEN c.id END) as completed_count,
            COALESCE(SUM(s.points_earned), 0) as total_points,
            COALESCE(AVG(CASE WHEN c.status = 'completed' THEN
                (SELECT SUM(s2.points_earned) FROM submissions s2 WHERE s2.candidate_id = c.id)
            END), 0) as avg_score
        FROM campaigns camp
        LEFT JOIN candidates c ON c.campaign_id = camp.id
        LEFT JOIN submissions s ON s.candidate_id = c.id
        GROUP BY camp.id
        ORDER BY candidate_count DESC
        LIMIT 10
    `).all();

    // ── Completion rate per campaign ──────────────────────────────────────────
    const completionRate = totalCandidates > 0
        ? Math.round((completedCandidates / totalCandidates) * 100)
        : 0;

    const passRate = totalSubmissions > 0
        ? Math.round((passedSubmissions / totalSubmissions) * 100)
        : 0;

    return NextResponse.json({
        campaigns: { total: totalCampaigns, live: liveCampaigns, archived: archivedCampaigns },
        candidates: {
            total: totalCandidates,
            invited: invitedCandidates,
            started: startedCandidates,
            completed: completedCandidates,
            eligible: eligibleCandidates,
            completionRate,
        },
        submissions: {
            total: totalSubmissions,
            passed: passedSubmissions,
            passRate,
            avgScore: Math.round(avgScore),
            totalPointsEarned,
        },
        pool: {
            total: poolTotal,
            byDifficulty: poolByDiff,
            byType: poolByType,
            byCategory: poolByCategory,
        },
        integrity: {
            highTabSwitches,
            avgTabSwitches: Math.round(avgTabSwitches * 10) / 10,
            totalScreenshots,
        },
        activity: {
            submissionsPerDay,
            candidatesPerDay,
        },
        topCampaigns,
    });
}
