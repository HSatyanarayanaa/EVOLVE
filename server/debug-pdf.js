const { generateTicketPDF } = require('./email');
const fs = require('fs');

async function debug() {
    const data = {
        teamName: 'DEBUG TEAM',
        rowIndex: 99,
        participants: [{ name: 'Tester', email: 'test@example.com' }],
        transactionId: 'TXN_DEBUG'
    };
    try {
        const buffer = await generateTicketPDF(data);
        fs.writeFileSync('debug-ticket.pdf', buffer);
        console.log('PDF saved to debug-ticket.pdf');
    } catch (err) {
        console.error(err);
    }
}

debug();
