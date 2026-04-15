const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { PartyEmail, EmailLog, ReconciliationSession } = require('../models');

// GET /api/stats — Aggregate telemetry for dashboard
router.get('/', requireAuth, async (req, res) => {
  const start = Date.now();
  console.log(`📊 Aggregating dashboard stats... [User: ${req.session.authenticated}]`);
  try {
    const totalParties = await PartyEmail.countDocuments();
    
    // Success Rate & Failures (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const emailStats = await EmailLog.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: "$status",
        count: { $sum: 1 }
      }}
    ]);

    const sent = emailStats.find(s => s._id === 'SENT')?.count || 0;
    const failed = emailStats.find(s => s._id === 'FAILED')?.count || 0;
    const totalEmails = sent + failed;
    const successRate = totalEmails > 0 ? ((sent / totalEmails) * 100).toFixed(1) : 0;

    // Daily Transmission History (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0,0,0,0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const transmissionHistory = await EmailLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        sent: { $sum: { $cond: [{ $eq: ["$status", "SENT"] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] } }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Processing Volume (Reconciliation Sessions)
    const processingHistory = await ReconciliationSession.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Recent Activity Feed
    const recentActivity = await EmailLog.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

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
