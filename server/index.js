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
const { sendTicketEmails, sendProblemReleaseEmails, sendProblemSelectionEmail } = require('./email');
const PROBLEM_STATEMENTS = require('./problemStatements');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware & Security ──────────────────────────────
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Add basic security headers
app.use(helmet());

// Rate Limiter for Registration to prevent spam
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 10, // Increased limit for testing
    message: {
        success: false,
        message: 'Too many registrations from this IP, please try again after an hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(cors({
    origin: ['https://hsatyanarayanaa.github.io', 'http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret']
}));
app.use(express.json());

// ── Serve static frontend files ──────────────────────
app.use(express.static(path.join(__dirname, '..')));

// ── Health Check (for Ping Service) ──────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'awake', time: new Date().toISOString() });
});

// ── API Routes ───────────────────────────────────────

/**
 * POST /api/register
 * Body: { teamName, college, participants: [{name, reg, phone, email}], transactionId }
 */
const REGISTRATION_CLOSED = true;

app.post('/api/register', registerLimiter, async (req, res) => {
    if (REGISTRATION_CLOSED) {
        return res.status(403).json({
            success: false,
            message: 'Registration is closed.',
        });
    }
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
        
        // Detailed error for debugging
        const errorMessage = error.message.includes('already registered') 
            ? error.message 
            : `Server Error: ${error.message}`;

        res.status(500).json({
            success: false,
            message: errorMessage,
        });
    }
});

/**
 * POST /api/send-ticket
 * Body: { rowIndex } — the row number in the Google Sheet
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
 * Returns all registered teams
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

        // Send problem details email to all participants
        try {
            const data = await getRow(result.rowIndex);
            if (data) {
                const problem = PROBLEM_STATEMENTS.find(p => p.id === problemId);
                if (problem) {
                    await sendProblemSelectionEmail(data, problem);
                } else {
                    console.error(`❌ Problem statement ${problemId} not found in problemStatements.js`);
                }
            }
        } catch (emailErr) {
            console.error('❌ Failed to send problem selection email:', emailErr.message);
        }

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

// ── Catch-all: serve index.html for SPA routing ─────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── Automatic Email Polling ──────────────────────────
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

// ── Start server ─────────────────────────────────────
app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║    EVOLVE 1.0 Server Running           ║
  ║    PORT: ${PORT}                          ║
  ║    ROOT: ${path.join(__dirname, '..')}    ║
  ╚══════════════════════════════════════════╝
  `);
});

module.exports = app;
