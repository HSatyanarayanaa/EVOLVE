const { generateTicketPDF } = require('./server/email');
const fs = require('fs');
const path = require('path');

// Mock data
const mockData = {
  teamName: 'REPLACEMENT STRATEGY TEAM',
  rowIndex: 42,
  participants: [
    { email: 'leader@example.com' },
    { email: 'member1@example.com' },
    { email: 'member2@example.com' }
  ]
};

async function test() {
  console.log('🚀 Generating test ticket with new replacement strategy...');
  try {
    const pdfBuffer = await generateTicketPDF(mockData);
    const outputPath = path.join(__dirname, 'test-ticket.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`✅ Success! Ticket saved to: ${outputPath}`);
  } catch (err) {
    console.error('❌ Error generating ticket:', err);
  }
}

test();
