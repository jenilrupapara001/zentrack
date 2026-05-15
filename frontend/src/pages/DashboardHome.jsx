import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Tag, 
  Button, 
  Typography, 
  Space, 
  Empty, 
  Spin, 
  Alert 
} from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
  SyncOutlined,
  HistoryOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { getDashboardStats } from '../services/api';
import { useRefresh } from '../context/RefreshContext';
import DayWiseEmailLogs from '../components/DayWiseEmailLogs';

const { Title, Text } = Typography;
const COLORS = ['#1677ff', '#52c41a', '#faad14', '#f5222d'];

export default function DashboardHome() {
  const { refreshKey } = useRefresh();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await getDashboardStats();
      setStats(res.data.data);
    } catch (err) {
      console.error("Stats fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  if (loading) {
    return (
      <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', paddingTop: '20vh' }}>
        <Spin size="large" description="Loading Dashboard..." />
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Alert
          title="Connection Error"
          description="Could not connect to the server. Please check your connection and try again."
          type="error"
          showIcon
          action={
            <Button size="small" type="primary" onClick={fetchStats}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const { kpis, chartData, recentActivity } = stats;
  const isNewUser = kpis.totalParties === 0;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Header */}
      <Row justify="space-between" align="bottom">
        <Col>
          <Title level={2} style={{ margin: 0 }}>Dashboard Overview</Title>
          <Text type="secondary">Monitor your payment reconciliation and email delivery status.</Text>
        </Col>
        <Col>
          <Button icon={<SyncOutlined />} onClick={fetchStats}>Refresh</Button>
        </Col>
      </Row>

      {/* Welcome Card for New Users */}
      {isNewUser && (
        <Card 
          style={{ 
            background: 'linear-gradient(90deg, #1677ff 0%, #003eb3 100%)', 
            borderRadius: 16,
            border: 'none'
          }}
          styles={{ body: { color: '#fff', padding: '32px' } }}
        >
          <Row gutter={24} align="middle">
            <Col flex="auto">
              <Title level={3} style={{ color: '#fff', margin: '0 0 8px 0' }}>Welcome to ZenTrack</Title>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>
                You haven't added any party emails yet. Start by setting up your party directory to begin automated reconciliation.
              </Text>
            </Col>
            <Col>
              <Button 
                type="default" 
                size="large" 
                icon={<ArrowRightOutlined />} 
                onClick={() => navigate('/parties')}
                style={{ height: 48, padding: '0 32px', fontWeight: 600 }}
              >
                Setup Parties
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      {/* KPI Stats */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" hoverable>
            <Statistic
              title="Total Parties"
              value={kpis.totalParties}
              prefix={<UserOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" hoverable>
            <Statistic
              title="Success Rate"
              value={kpis.successRate}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" hoverable>
            <Statistic
              title="Emails Sent"
              value={kpis.totalSent}
              prefix={<ClockCircleOutlined style={{ color: '#13c2c2' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" hoverable>
            <Statistic
              title="Emails Failed"
              value={kpis.totalFailed}
              prefix={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
              styles={{ content: { color: kpis.totalFailed > 0 ? '#cf1322' : 'inherit' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card 
            title={<span><HistoryOutlined /> Email History (7 Days)</span>} 
            variant="borderless"
            styles={{ body: { height: 350 } }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="sent" stroke="#1677ff" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="failed" stroke="#f5222d" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={<span><BarChartOutlined /> Reconciliation Activity</span>} 
            variant="borderless"
            styles={{ body: { height: 350 } }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="processed" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Day-wise Logs & Recent Activity */}
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title="Activity Log" variant="borderless">
            <DayWiseEmailLogs />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

// Helper icons for charts
function BarChartOutlined() {
  return <LineChartOutlined style={{ transform: 'rotate(90deg)' }} />;
}
