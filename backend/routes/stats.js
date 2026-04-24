const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { PartyEmail, EmailLog, ReconciliationSession, sequelize } = require('../models');

// GET /api/stats — Aggregate telemetry for dashboard
router.get('/', requireAuth, async (req, res) => {
  try {
    const totalParties = await PartyEmail.count();
    
    // Success Rate & Failures (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const emailStats = await sequelize.query(`
      SELECT 
        status as _id,
        COUNT(*) as count
      FROM EmailLogs
      WHERE createdAt >= :thirtyDaysAgo
      GROUP BY status
    `, {
      replacements: { thirtyDaysAgo },
      type: sequelize.QueryTypes.SELECT
    });

    const sent = emailStats.find(s => s._id === 'SENT')?.count || 0;
    const failed = emailStats.find(s => s._id === 'FAILED')?.count || 0;
    const totalEmails = sent + failed;
    const successRate = totalEmails > 0 ? ((sent / totalEmails) * 100).toFixed(1) : 0;

    // Daily Transmission History (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0,0,0,0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const transmissionHistory = await sequelize.query(`
      SELECT 
        FORMAT(createdAt, 'yyyy-MM-dd') as _id,
        SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed
      FROM EmailLogs
      WHERE createdAt >= :sevenDaysAgo
      GROUP BY FORMAT(createdAt, 'yyyy-MM-dd')
      ORDER BY _id ASC
    `, {
      replacements: { sevenDaysAgo },
      type: sequelize.QueryTypes.SELECT
    });

    // Processing Volume (Reconciliation Sessions)
    const processingHistory = await sequelize.query(`
      SELECT 
        FORMAT(createdAt, 'yyyy-MM-dd') as _id,
        COUNT(*) as count
      FROM ReconciliationSessions
      WHERE createdAt >= :sevenDaysAgo
      GROUP BY FORMAT(createdAt, 'yyyy-MM-dd')
      ORDER BY _id ASC
    `, {
      replacements: { sevenDaysAgo },
      type: sequelize.QueryTypes.SELECT
    });

    // Recent Activity Feed
    const recentActivity = await EmailLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Map ISO dates to day names for frontend charts
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const iso = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];
      
      const trans = transmissionHistory.find(t => t._id === iso);
      const proc = processingHistory.find(p => p._id === iso);
      
      chartData.push({
        name: dayName,
        sent: trans?.sent || 0,
        failed: trans?.failed || 0,
        processed: proc?.count || 0
      });
    }

    res.json({
      success: true,
      data: {
        kpis: {
          totalParties,
          successRate: `${successRate}%`,
          pendingQueue: 0, // Conceptual for now
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
