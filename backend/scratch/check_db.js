require('dotenv').config();
const { PartyEmail, sequelize } = require('../models');

async function checkDB() {
  try {
    await sequelize.authenticate();
    const count = await PartyEmail.count();
    console.log(`Total Parties in DB: ${count}`);
    const parties = await PartyEmail.findAll({ limit: 10, raw: true });
    console.log('Sample Parties:', parties.map(p => ({ code: p.partyCode, name: p.partyName })));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDB();
