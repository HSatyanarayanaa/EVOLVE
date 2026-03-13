require('dotenv').config();
const { __getSheetsClient } = require('./sheets');

async function formatCheckboxes() {
    try {
        const sheets = await __getSheetsClient();
        const sheetId = process.env.GOOGLE_SHEET_ID;

        // Get the sheet ID (gid) of Sheet1
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: sheetId,
        });
        const sheet = spreadsheet.data.sheets[0];
        const sheetGid = sheet.properties.sheetId;

        console.log("Fetching rows to evaluate conditions...");
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'Sheet1!A:V',
        });
        const rows = res.data.values || [];

        // First, CLEAR all validation in Column U (row 2 onwards)
        const requests = [
            {
                setDataValidation: {
                    range: {
                        sheetId: sheetGid,
                        startRowIndex: 1,
                        startColumnIndex: 20,
                        endColumnIndex: 21,
                    },
                    rule: null // clears validation
                }
            }
        ];

        // Now, add validation ONLY where B (index 1) and H (index 7) are filled
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const bFilled = row[1] && row[1].trim() !== '';
            const hFilled = row[7] && row[7].trim() !== '';

            if (bFilled && hFilled) {
                requests.push({
                    setDataValidation: {
                        range: {
                            sheetId: sheetGid,
                            startRowIndex: i,
                            endRowIndex: i + 1,
                            startColumnIndex: 20, // Column U
                            endColumnIndex: 21,
                        },
                        rule: {
                            condition: {
                                type: 'BOOLEAN',
                            },
                            showCustomUi: true,
                        },
                    }
                });
            }
        }

        console.log(`Applying ${requests.length} updates...`);
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: sheetId,
            requestBody: { requests },
        });

        console.log("✅ Successfully formatted Column U based on conditions!");
    } catch (err) {
        console.error("❌ Error formatting checkboxes:", err.message);
    }
}

formatCheckboxes();
