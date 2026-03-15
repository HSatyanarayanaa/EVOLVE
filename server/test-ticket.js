const { generateTicketPDF } = require('./email');
const fs = require('fs');
const path = require('path');

async function testTicket() {
  const mockData = {
    teamName: 'Cyber Knights',
    rowIndex: 42,
    participants: [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }],
    transactionId: 'TXN123456789'
  };

  console.log('Generating ticket for:', mockData.teamName);
  
  try {
    const pdfBuffer = await generateTicketPDF(mockData);
    const outputPath = path.join(__dirname, 'test-ticket.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log('Ticket generated successfully at:', outputPath);
  } catch (err) {
    console.error('Error generating ticket:', err);
  }
}

testTicket();
