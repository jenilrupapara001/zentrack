import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  Tabs, 
  Form, 
  Input, 
  Button, 
  Slider, 
  Typography, 
  Space, 
  Row, 
  Col, 
  Alert, 
  Progress, 
  Statistic, 
  Divider,
  Badge,
  App as AntdApp 
} from 'antd';
import {
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  CloudServerOutlined,
  UserOutlined,
  LockOutlined,
  GoogleOutlined,
  DeleteOutlined,
  SaveOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;

export default function SettingsPage() {
  const [gmailStatus, setGmailStatus] = useState({ connected: false, email: null });
  const [loading, setLoading] = useState(false);
  const [delay, setDelay] = useState(3);
  const { message, modal } = AntdApp.useApp();

  useEffect(() => {
    fetchGmailStatus();
  }, []);

  const fetchGmailStatus = async () => {
    try {
      const res = await api.get('/settings/gmail');
      setGmailStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch Gmail status', err);
    }
  };

  const handleDisconnectGmail = async () => {
    modal.confirm({
      title: 'Disconnect Gmail',
      content: 'Are you sure you want to disconnect your Gmail account?',
      okText: 'Disconnect',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await api.delete('/settings/gmail');
          if (res.data.success) {
            message.success('Gmail Disconnected');
            fetchGmailStatus();
          }
        } catch (err) {
          message.error('Failed to disconnect Gmail');
        }
      }
    });
  };

  const items = [
    {
      key: 'security',
      label: <span><SafetyCertificateOutlined /> Security</span>,
      children: (
        <Card title="Authentication Settings" variant="borderless">
          <Form layout="vertical">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="Admin Password" extra="Used for core settings changes.">
                  <Input.Password placeholder="Enter new password" prefix={<LockOutlined />} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="File Upload Password" extra="Required when uploading payment sheets.">
                  <Input.Password placeholder="Enter upload password" prefix={<LockOutlined />} />
                </Form.Item>
              </Col>
            </Row>
            <Button type="primary" icon={<SaveOutlined />}>Save Security Policy</Button>
          </Form>
          <Divider />
            <Alert
              title="Security Tip"
              description="Rotate your passwords every 90 days to maintain high security standards."
              type="info"
              showIcon
            />
        </Card>
      ),
    },
    {
      key: 'automation',
      label: <span><ThunderboltOutlined /> Automation</span>,
      children: (
        <Card title="Sending Configuration" variant="borderless">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text strong>Delay Between Emails</Text>
              <Slider 
                min={1} 
                max={5} 
                value={delay} 
                onChange={setDelay} 
                marks={{ 1: '1s', 3: '3s', 5: '5s' }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Adding a delay prevents your email from being flagged as spam. Recommended: 3s.
              </Text>
            </div>
            <Button type="primary" icon={<SaveOutlined />}>Save Automation Settings</Button>
          </Space>
        </Card>
      ),
    },
    {
      key: 'infrastructure',
      label: <span><CloudServerOutlined /> Infrastructure</span>,
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={24}>
            <Col span={12}>
              <Card variant="borderless">
                <Statistic 
                  title="Database System" 
                  value="SQL Server" 
                  prefix={<DatabaseOutlined style={{ color: '#1677ff' }} />} 
                />
                <div style={{ marginTop: 8 }}>
                  <Badge status="processing" text="ZenTrackDB • Connected" />
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card variant="borderless">
                <Statistic 
                  title="API Runtime" 
                  value="Node.js 18" 
                  prefix={<GlobalOutlined style={{ color: '#52c41a' }} />} 
                />
                <div style={{ marginTop: 8 }}>
                  <Badge status="processing" text="Running on Port 5001" />
                </div>
              </Card>
            </Col>
          </Row>
          <Card title="System Health" variant="borderless">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">Memory Usage</Text>
                  <Text strong>312MB / 1024MB</Text>
                </div>
                <Progress percent={31} showInfo={false} strokeColor="#1677ff" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">Database Storage</Text>
                  <Text strong>0.8GB / 5GB</Text>
                </div>
                <Progress percent={16} showInfo={false} strokeColor="#52c41a" />
              </div>
            </Space>
          </Card>
        </Space>
      ),
    },
    {
      key: 'account',
      label: <span><UserOutlined /> Account</span>,
      children: (
        <Card title="Gmail Integration" variant="borderless">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div style={{ padding: 24, background: gmailStatus.connected ? '#f6ffed' : '#f0f5ff', borderRadius: 8, border: `1px solid ${gmailStatus.connected ? '#b7eb8f' : '#adc6ff'}` }}>
              <Row align="middle" justify="space-between">
                <Col>
                  <Space align="start" size="middle">
                    <div style={{ padding: 8, background: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <GoogleOutlined style={{ fontSize: 24, color: gmailStatus.connected ? '#52c41a' : '#1677ff' }} />
                    </div>
                    <div>
                      <Text strong style={{ fontSize: 16, display: 'block' }}>Google Cloud (Gmail API)</Text>
                      {gmailStatus.connected ? (
                        <Space>
                          <Text type="success" strong>{gmailStatus.email}</Text>
                          <Badge status="processing" />
                        </Space>
                      ) : (
                        <Text type="secondary">Connect your Gmail to send reconciliation emails.</Text>
                      )}
                    </div>
                  </Space>
                </Col>
                <Col>
                  {gmailStatus.connected ? (
                    <Button danger icon={<DeleteOutlined />} onClick={handleDisconnectGmail}>Disconnect</Button>
                  ) : (
                    <Button 
                      type="primary" 
                      icon={<GoogleOutlined />} 
                      href={`${window.location.origin.includes('localhost') ? 'http://localhost:5001' : ''}/api/auth/google`}
                      target="_blank"
                    >
                      Connect Gmail
                    </Button>
                  )}
                </Col>
              </Row>
            </div>
            <Alert
              title="Why use Gmail API?"
              description="Integrating with the Gmail API provides the best deliverability and security for your outgoing statements compared to standard SMTP."
              type="info"
              showIcon
            />
          </Space>
        </Card>
      ),
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row justify="space-between" align="bottom">
        <Col>
          <Title level={2} style={{ margin: 0 }}>Settings</Title>
          <Text type="secondary">Manage your application configuration and integrations.</Text>
        </Col>
      </Row>

      <Tabs 
        defaultActiveKey="account" 
        items={items} 
        type="card" 
        size="large"
        style={{ marginTop: 16 }}
      />
    </Space>
  );
}
