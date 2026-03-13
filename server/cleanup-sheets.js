require('dotenv').config();
const { __getSheetsClient } = require('./sheets');

async function cleanupSheets() {
    try {
        const sheets = await __getSheetsClient();
        const sheetId = process.env.GOOGLE_SHEET_ID;

        console.log("Fetching rows to evaluate conditions...");
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'Sheet1!A:W',
        });
        const rows = res.data.values || [];

        const updates = [];

        // 1. Ensure "Ticket Emailed" is in the header (Column W / Index 22)
        const headerRow = rows[0] || [];
        if (headerRow[22] !== 'Ticket Emailed') {
            updates.push({
                range: 'Sheet1!W1',
                values: [['Ticket Emailed']]
            });
        }

        // 2. Clear out "FALSE" in Column U (Index 20) for empty rows
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const timestamp = row[0];
            const teamName = row[1];

            // If row has no timestamp or team name, but has something in Column U or V
            if (!timestamp && !teamName) {
                // We should clear this row's contents from A to W
                updates.push({
                    range: `Sheet1!A${i + 1}:W${i + 1}`,
                    values: [['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']]
                });
            } else if (teamName && row[20] === undefined) {
                // Initialize existing team "Confirmed" to FALSE if empty
                updates.push({
                    range: `Sheet1!U${i + 1}`,
                    values: [['FALSE']]
                });
                updates.push({
                    range: `Sheet1!W${i + 1}`,
                    values: [['FALSE']]
                });
            } else if (teamName && row[22] === undefined) {
                // Initialize Ticket Emailed to FALSE
                updates.push({
                    range: `Sheet1!W${i + 1}`,
                    values: [['FALSE']]
                });
            }
        }

        if (updates.length > 0) {
            console.log(`Applying ${updates.length} cell/row updates...`);
            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: sheetId,
                requestBody: {
                    valueInputOption: 'RAW',
                    data: updates
                }
            });
            console.log("✅ Successfully updated cell values!");
        } else {
            console.log("No cell updates needed.");
        }

    } catch (err) {
        console.error("❌ Error formatting checkboxes:", err.message);
    }
}

cleanupSheets();
