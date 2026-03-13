/* ═══════════════════════════════════════════════════
   EVOLVE 1.0 — Express Server
   POST /api/register — Save registration to Google Sheets
   POST /api/send-ticket — Send PDF ticket via email
   ═══════════════════════════════════════════════════ */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { appendRegistration, getRow, getAllRows, updateProblemSelection, getConfirmedTeams } = require('./sheets');
const { sendTicketEmails, sendProblemReleaseEmails } = require('./email');

const app = express();
const PORT = process.env.PORT || 3000;
const isVercel = process.env.VERCEL === '1';

// ── Middleware & Security ──────────────────────────────
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Add basic security headers
app.use(helmet());

// Rate Limiter for Registration to prevent spam
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5, // Limit each IP to 5 registrations per `window`
    message: {
        success: false,
        message: 'Too many registrations from this IP, please try again after an hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(cors());
app.use(express.json());

// ── Serve static frontend files ──────────────────────
app.use(express.static(path.join(__dirname, '..')));

// ── API Routes ───────────────────────────────────────

/**
 * POST /api/register
 * Body: { teamName, college, participants: [{name, reg, phone, email}], transactionId }
 */
app.post('/api/register', registerLimiter, async (req, res) => {
    try {
        const { teamName, college, participants, transactionId } = req.body;

        // Validate required fields
        if (!teamName || !college || !transactionId) {
            return res.status(400).json({
                success: false,
                message: 'Team name, college, and transaction ID are required.',
            });
        }

        if (!participants || participants.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'At least 2 participants are required.',
            });
        }

        // Validate mandatory participants (first 2)
        for (let i = 0; i < 2; i++) {
            const p = participants[i];
            if (!p || !p.name || !p.reg || !p.phone || !p.email) {
                return res.status(400).json({
                    success: false,
                    message: `Participant ${i + 1} must have all fields filled (name, register number, phone, email).`,
                });
            }
            // Domain validation check
            if (college.toLowerCase().includes('srm') || college.toLowerCase().includes('rajalakshmi')) {
                // Feel free to adjust these domains based on who you're targeting
            }
        }

        // Append to Google Sheets
        const result = await appendRegistration(req.body);

        console.log(`✅ Team "${teamName}" registered (row ${result.rowIndex})`);

        res.json({
            success: true,
            message: 'Registration successful!',
            rowIndex: result.rowIndex,
        });
    } catch (error) {
        console.error('❌ Registration error:', error.message);
        
        // Pass known validation errors to the client
        const errorMessage = error.message.includes('already registered') 
            ? error.message 
            : 'Server error during registration. Please try again.';

        res.status(500).json({
            success: false,
            message: errorMessage,
        });
    }
});

/**
 * POST /api/send-ticket
 * Body: { rowIndex } — the row number in the Google Sheet
 * Reads the row data, generates PDF, sends email
 */
app.post('/api/send-ticket', async (req, res) => {
    try {
        const { rowIndex } = req.body;

        if (!rowIndex) {
            return res.status(400).json({
                success: false,
                message: 'Row index is required.',
            });
        }

        const data = await getRow(rowIndex);
        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found.',
            });
        }

        await sendTicketEmails(data);

        console.log(`✉️  Ticket sent for team "${data.teamName}" (row ${rowIndex})`);

        res.json({
            success: true,
            message: `Ticket email sent to team "${data.teamName}"!`,
        });
    } catch (error) {
        console.error('❌ Email error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to send ticket email: ' + error.message,
        });
    }
});

/**
 * GET /api/registrations
 * Returns all registered teams (for admin dashboard or debugging)
 */
app.get('/api/registrations', async (req, res) => {
    try {
        const rows = await getAllRows();
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('❌ Fetch error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch registrations.',
        });
    }
});

/**
 * POST /api/select-problem
 * Body: { teamName, problemId }
 * Team leader selects a problem statement
 */
app.post('/api/select-problem', async (req, res) => {
    try {
        const { teamName, problemId } = req.body;

        if (!teamName || !problemId) {
            return res.status(400).json({
                success: false,
                message: 'Team name and problem ID are required.',
            });
        }

        const result = await updateProblemSelection(teamName, problemId);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }

        console.log(`🎯 Team "${teamName}" selected problem: ${problemId} (row ${result.rowIndex})`);

        res.json({
            success: true,
            message: `Problem ${problemId} selected for team "${teamName}"!`,
        });
    } catch (error) {
        console.error('❌ Problem selection error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to select problem statement.',
        });
    }
});

/**
 * POST /api/notify-problems-released
 * Admin endpoint — sends email to all confirmed participants
 * Requires x-admin-secret header
 */
app.post('/api/notify-problems-released', async (req, res) => {
    try {
        const adminSecret = req.headers['x-admin-secret'];
        if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. Admin secret missing or invalid.',
            });
        }

        const confirmed = await getConfirmedTeams();

        if (confirmed.length === 0) {
            return res.json({ success: true, message: 'No confirmed teams to notify.' });
        }

        // Collect all participant emails
        const allEmails = [];
        confirmed.forEach(team => {
            team.participants.forEach(p => {
                if (p.email) allEmails.push(p.email);
            });
        });

        const unique = [...new Set(allEmails)];
        await sendProblemReleaseEmails(unique);

        console.log(`📧 Problem release notification sent to ${unique.length} participants`);

        res.json({
            success: true,
            message: `Notification sent to ${unique.length} participants from ${confirmed.length} teams.`,
        });
    } catch (error) {
        console.error('❌ Notification error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to send notifications: ' + error.message,
        });
    }
});

/**
 * GET /api/cron/check-confirmed
 * Triggered by Vercel Cron to auto-send tickets for manual sheet confirmations
 */
app.get('/api/cron/check-confirmed', async (req, res) => {
    try {
        console.log('⏰ Cron: Checking for newly confirmed teams...');
        const rows = await getAllRows();
        const pending = rows.filter(r =>
            r.confirmed.toUpperCase() === 'TRUE' &&
            r.ticketEmailed.toUpperCase() !== 'TRUE'
        );

        let sentCount = 0;
        for (const team of pending) {
            console.log(`⏳ Cron: Auto-sending ticket to team "${team.teamName}"...`);
            await sendTicketEmails(team);
            await require('./sheets').markTicketEmailed(team.rowIndex);
            sentCount++;
        }

        res.json({ success: true, message: `Cron job completed. Sent ${sentCount} tickets.` });
    } catch (error) {
        console.error('❌ Cron error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── Catch-all: serve index.html for SPA routing ─────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── Start server (only locally, Vercel handles this automatically) ──
if (!isVercel) {
    // ── Automatic Email Polling (Local Logic) ──────────
    // Checks Google Sheets every 60 seconds for newly confirmed teams
    setInterval(async () => {
        try {
            const rows = await getAllRows();
            const pending = rows.filter(r =>
                r.confirmed.toUpperCase() === 'TRUE' &&
                r.ticketEmailed.toUpperCase() !== 'TRUE'
            );

            for (const team of pending) {
                console.log(`⏳ Auto-sending ticket to newly confirmed team "${team.teamName}"...`);
                await sendTicketEmails(team);
                await require('./sheets').markTicketEmailed(team.rowIndex);
                console.log(`✅ Ticket sent to "${team.teamName}" & stored in column W.`);
            }
        } catch (err) {
            console.error('Polling error:', err.message);
        }
    }, 60000);

    app.listen(PORT, () => {
        console.log(`
  ╔══════════════════════════════════════════╗
  ║    EVOLVE 1.0 Server Running           ║
  ║    http://localhost:${PORT}               ║
  ╚══════════════════════════════════════════╝
  `);
    });
}

module.exports = app;
