require('dotenv').config();
const { getRow } = require('./sheets');

async function test() {
  const data = await getRow(2);
  console.log("Row 2 Data:", data);
}
test().catch(console.error);
