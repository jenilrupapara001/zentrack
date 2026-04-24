const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'payment_reconciliation',
  process.env.DB_USER || 'sa',
  process.env.DB_PASSWORD || 'YourPassword123',
  {
    host: process.env.DB_SERVER || 'localhost',
    port: process.env.DB_PORT || 1433,
    dialect: 'mssql',
    dialectOptions: {
      options: {
        encrypt: true, // For Azure
        trustServerCertificate: true // Change to true for local dev / self-signed certs
      }
    },
    logging: false, // Set to console.log to see SQL queries
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQL Server connected via Sequelize');
    
    // Sync models
    // In production, you might want to use migrations instead of sync
    await sequelize.sync();
    console.log('✅ SQL Server models synchronized');
  } catch (error) {
    console.error('❌ SQL Server connection error:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
