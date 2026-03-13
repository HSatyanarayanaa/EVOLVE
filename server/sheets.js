/* ═══════════════════════════════════════════════════
   Google Sheets API Helper
   Appends registration data rows to the spreadsheet
   ═══════════════════════════════════════════════════ */

const { google } = require('googleapis');

let sheetsClient = null;

/**
 * Initialize the Google Sheets API client using service account credentials
 */
async function getSheets() {
    if (sheetsClient) return sheetsClient;

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();
    sheetsClient = google.sheets({ version: 'v4', auth: authClient });
    return sheetsClient;
}

/**
 * Ensure the header row exists in the sheet
 */
async function ensureHeaders() {
    const sheets = await getSheets();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    // Check if first row has headers
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Sheet1!A1:Z1',
    });

    if (!res.data.values || res.data.values.length === 0) {
        const headers = [
            'Timestamp',
            'Team Name',
            'College',
            'P1 Name', 'P1 Reg No', 'P1 Phone', 'P1 Email',
            'P2 Name', 'P2 Reg No', 'P2 Phone', 'P2 Email',
            'P3 Name', 'P3 Reg No', 'P3 Phone', 'P3 Email',
            'P4 Name', 'P4 Reg No', 'P4 Phone', 'P4 Email',
            'Transaction ID',
            'Confirmed',
            'Problem Statement ID',
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: 'Sheet1!A1',
            valueInputOption: 'RAW',
            requestBody: { values: [headers] },
        });
    }
}

/**
 * Append a registration row to the Google Sheet
 * @param {Object} data - Registration data
 * @returns {Object} - { rowIndex }
 */
async function appendRegistration(data) {
    const sheets = await getSheets();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    await ensureHeaders();

    const participants = data.participants || [];

    // Check for duplicate team name
    const existingRows = await getAllRows();
    const isDuplicate = existingRows.some(
        r => r.teamName.toLowerCase() === data.teamName.toLowerCase()
    );

    if (isDuplicate) {
        throw new Error('A team with this name is already registered.');
    }

    const row = [
        new Date().toISOString(),
        data.teamName,
        data.college,
    ];

    // Pad to 4 participants (4 fields each = 16 cells)
    for (let i = 0; i < 4; i++) {
        const p = participants[i] || {};
        row.push(p.name || '', p.reg || '', p.phone || '', p.email || '');
    }

    row.push(data.transactionId || '');
    row.push('FALSE'); // Column U: Confirmed toggle
    row.push('');      // Column V: Problem Statement ID
    row.push('FALSE'); // Column W: Ticket Emailed status

    const res = await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'Sheet1!A:W',
        valueInputOption: 'RAW',
        requestBody: { values: [row] },
    });

    // Get the row number from the updated range
    const updatedRange = res.data.updates?.updatedRange || '';
    const match = updatedRange.match(/!A(\d+)/);
    const rowIndex = match ? parseInt(match[1]) : -1;

    // Conditionally apply checkbox to column U (Confirmed) if B and H are filled
    const bFilled = data.teamName && data.teamName.trim() !== '';
    const hFilled = participants[1] && participants[1].name && participants[1].name.trim() !== '';

    if (rowIndex !== -1 && bFilled && hFilled) {
        try {
            const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
            const sheetGid = spreadsheet.data.sheets[0].properties.sheetId;

            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: sheetId,
                requestBody: {
                    requests: [
                        {
                            setDataValidation: {
                                range: {
                                    sheetId: sheetGid,
                                    startRowIndex: rowIndex - 1,
                                    endRowIndex: rowIndex,
                                    startColumnIndex: 20,
                                    endColumnIndex: 21,
                                },
                                rule: {
                                    condition: { type: 'BOOLEAN' },
                                    showCustomUi: true,
                                },
                            }
                        }
                    ]
                }
            });
        } catch (err) {
            console.error('Failed to apply conditional checkbox:', err.message);
        }
    }

    return { rowIndex };
}

/**
 * Get a specific row by index
 * @param {number} rowIndex - 1-indexed row number
 * @returns {Object} - Parsed registration data
 */
async function getRow(rowIndex) {
    const sheets = await getSheets();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `Sheet1!A${rowIndex}:W${rowIndex}`,
    });

    if (!res.data.values || res.data.values.length === 0) {
        return null;
    }

    const row = res.data.values[0];
    return {
        timestamp: row[0] || '',
        teamName: row[1] || '',
        college: row[2] || '',
        participants: [
            { name: row[3], reg: row[4], phone: row[5], email: row[6] },
            { name: row[7], reg: row[8], phone: row[9], email: row[10] },
            { name: row[11], reg: row[12], phone: row[13], email: row[14] },
            { name: row[15], reg: row[16], phone: row[17], email: row[18] },
        ].filter(p => p.name), // only include participants with names
        transactionId: row[19] || '',
        confirmed: row[20] || 'FALSE',
        problemStatementId: row[21] || '',
        ticketEmailed: row[22] || 'FALSE',
    };
}

/**
 * Get all rows from the sheet
 * @returns {Array} - Array of { rowIndex, data }
 */
async function getAllRows() {
    const sheets = await getSheets();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Sheet1!A:W',
    });

    if (!res.data.values || res.data.values.length <= 1) {
        return [];
    }

    // Skip header row
    return res.data.values.slice(1).map((row, idx) => ({
        rowIndex: idx + 2, // 1-indexed, skip header
        timestamp: row[0] || '',
        teamName: row[1] || '',
        college: row[2] || '',
        participants: [
            { name: row[3], reg: row[4], phone: row[5], email: row[6] },
            { name: row[7], reg: row[8], phone: row[9], email: row[10] },
            { name: row[11], reg: row[12], phone: row[13], email: row[14] },
            { name: row[15], reg: row[16], phone: row[17], email: row[18] },
        ].filter(p => p.name),
        transactionId: row[19] || '',
        confirmed: row[20] || 'FALSE',
        problemStatementId: row[21] || '',
        ticketEmailed: row[22] || 'FALSE',
    }));
}

/**
 * Update the problem statement selection for a team
 * @param {string} teamName - Team name to look up
 * @param {string} problemId - Problem statement ID to assign
 * @returns {Object} - { success, rowIndex }
 */
async function updateProblemSelection(teamName, problemId) {
    const sheets = await getSheets();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Sheet1!A:W',
    });

    if (!res.data.values || res.data.values.length <= 1) {
        return { success: false, message: 'No registrations found' };
    }

    // Find the row matching the team name (column B = index 1)
    let targetRow = -1;
    for (let i = 1; i < res.data.values.length; i++) {
        if (res.data.values[i][1]?.toLowerCase() === teamName.toLowerCase()) {
            targetRow = i + 1; // 1-indexed
            break;
        }
    }

    if (targetRow === -1) {
        return { success: false, message: 'Team not found' };
    }

    // Check if already confirmed
    const confirmed = res.data.values[targetRow - 1][20] || 'FALSE';
    if (confirmed.toUpperCase() !== 'TRUE') {
        return { success: false, message: 'Team is not yet confirmed' };
    }

    // Check if already selected a problem
    const existing = res.data.values[targetRow - 1][21] || '';
    if (existing) {
        return { success: false, message: `Team has already selected problem: ${existing}` };
    }

    // Write problem ID to column V (index 21)
    await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Sheet1!V${targetRow}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[problemId]] },
    });

    return { success: true, rowIndex: targetRow };
}

/**
 * Get all confirmed teams with their participant emails
 * @returns {Array} - Array of { teamName, participants: [{name, email}] }
 */
async function getConfirmedTeams() {
    const rows = await getAllRows();
    return rows.filter(r => r.confirmed.toUpperCase() === 'TRUE');
}

/**
 * Mark a team as having received their ticket email
 * @param {number} rowIndex - The row index in the sheet
 */
async function markTicketEmailed(rowIndex) {
    const sheets = await getSheets();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Sheet1!W${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: { values: [['TRUE']] },
    });
}

module.exports = { appendRegistration, getRow, getAllRows, updateProblemSelection, getConfirmedTeams, markTicketEmailed, __getSheetsClient: getSheets };
