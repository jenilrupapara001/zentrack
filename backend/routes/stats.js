const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { PartyEmail, EmailLog, ReconciliationSession, sequelize } = require('../models');

// GET /api/stats — Aggregate telemetry for dashboard
router.get('/', requireAuth, async (req, res) => {
  try {
    // Call the "all-in-one" stored procedure
    // Note: Multiple result sets are returned as an array of arrays for MSSQL in Sequelize
    const resultSets = await sequelize.query('EXEC sp_GetDashboardStats @DaysBack = 30', {
      type: sequelize.QueryTypes.SELECT
    });

    // Sequelize MSSQL might flatten result sets if they are small, or return an array of arrays.
    // Based on sp_GetDashboardStats definition:
    // RS1: TotalParties, RS2: EmailStats, RS3: TransmissionHistory, RS4: ProcessingHistory
    
    // For simplicity in Sequelize v6 SELECT type, it often returns the first set or a joined set.
    // Let's use individual calls if multiple sets are tricky, or stick to the optimized manual queries 
    // but use the SPs for the specific heavy parts.
    
    // Actually, I'll stick to individual SP calls for clarity and reliability across Sequelize versions.
    const [totalPartiesResult] = await sequelize.query('SELECT COUNT(*) as count FROM PartyEmails', { type: sequelize.QueryTypes.SELECT });
    const totalParties = totalPartiesResult?.count || 0;

    const emailStats = await sequelize.query('EXEC sp_GetDailyLogSummary @DaysBack = 30', {
      type: sequelize.QueryTypes.SELECT
    });

    const sent = emailStats.reduce((acc, curr) => acc + (curr.sent || 0), 0);
    const failed = emailStats.reduce((acc, curr) => acc + (curr.failed || 0), 0);
    const totalEmails = sent + failed;
    const successRate = totalEmails > 0 ? ((sent / totalEmails) * 100).toFixed(1) : 0;

    const recentActivity = await EmailLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Map the 7-day transmission history for the charts
    const chartData = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const iso = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];
      
      const trans = emailStats.find(t => t._id === iso);
      
      chartData.push({
        name: dayName,
        sent: trans?.sent || 0,
        failed: trans?.failed || 0,
        processed: 0 // Will be handled by session stats if needed
      });
    }

    res.json({
      success: true,
      data: {
        kpis: {
          totalParties,
          successRate: `${successRate}%`,
          pendingQueue: 0,
          criticalFailures: failed,
          totalSent: sent,
          totalFailed: failed
        },
        chartData,
        recentActivity
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
