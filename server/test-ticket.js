const { sendTicketEmails } = require('./email');
require('dotenv').config();

async function testTicket() {
  const mockData = {
    teamName: 'CYBER KNIGHTS',
    rowIndex: 42,
    college: 'Rajalakshmi Institute of Technology',
    participants: [
      { name: 'Satya', email: 'satya.hari3011@gmail.com' },
      { name: 'Bob', email: 'bob@example.com' },
      { name: 'Charlie', email: 'charlie@example.com' }
    ],
    transactionId: 'TXN_FINAL_LEGACY_001',
    ticketId: 'E-42'
  };

  console.log('🚀 Final E2E Delivery for:', mockData.teamName);
  
  try {
    const result = await sendTicketEmails(mockData);
    console.log('✅ Final Ticket emailed successfully:', result.data.id);
  } catch (err) {
    console.error('❌ Error during final delivery:', err);
  }
}

testTicket();
