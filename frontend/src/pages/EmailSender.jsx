import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Button, 
  Typography, 
  Space, 
  Badge, 
  Alert, 
  Progress, 
  Divider, 
  Descriptions,
  List,
  App as AntdApp 
} from 'antd';
import {
  MailOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  LockOutlined,
  GoogleOutlined,
  EyeOutlined,
  FileExcelOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import api, {
  sendEmails,
  getSessionById,
  getEmailLogs,
  retryEmails
} from '../services/api';
import DayWiseEmailLogs from '../components/DayWiseEmailLogs';

const { Title, Text, Paragraph } = Typography;

export default function EmailSender({ matchedResults: propResults }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('sessionId');
  const { message, modal } = AntdApp.useApp();

  const [sending, setSending] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gmailStatus, setGmailStatus] = useState({ connected: false, email: null });
  const [emailLogs, setEmailLogs] = useState([]);
  const [retrying, setRetrying] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const activeResults = sessionData?.matchedResults || propResults || [];

  useEffect(() => {
    fetchInitialData();
  }, [sessionId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [gmailRes, sessionRes, logsRes] = await Promise.all([
        api.get('/settings/gmail'),
        sessionId ? getSessionById(sessionId) : Promise.resolve({ data: { success: true, data: null } }),
        getEmailLogs()
      ]);

      if (gmailRes.data) setGmailStatus(gmailRes.data);
      if (sessionRes.data.data) setSessionData(sessionRes.data.data);
      if (logsRes.data?.data) setEmailLogs(logsRes.data.data);
    } catch {
      message.error('Failed to load email session data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendBatch = async () => {
    if (!gmailStatus.connected) return message.warning('Please connect Gmail in Settings first');
    if (!activeResults.length) return message.warning('No emails to send');

    modal.confirm({
      title: 'Confirm Bulk Email Dispatch',
      content: `You are about to send ${activeResults.length} reconciliation emails. Proceed?`,
      okText: 'Send Now',
      cancelText: 'Cancel',
      onOk: async () => {
        setSending(true);
        try {
          const res = await sendEmails({ matchedResults: activeResults, sessionId });
          if (res.data.success) {
            setSendResult(res.data.data);
            const { sentCount, failedCount } = res.data.data;
            if (sentCount > 0) message.success(`${sentCount} emails sent successfully`);
            if (failedCount > 0) message.error(`${failedCount} emails failed to send`);
            await fetchInitialData();
          }
        } catch (err) {
          message.error(err.response?.data?.message || 'Failed to send emails');
        } finally {
          setSending(false);
        }
      }
    });
  };

  const handleRetryFailed = async () => {
    const failedLogs = emailLogs.filter(l => l.status === 'FAILED');
    if (!failedLogs.length) return message.info('No failed emails to retry');

    modal.confirm({
      title: 'Retry Failed Emails',
      content: `Do you want to retry sending ${failedLogs.length} failed emails?`,
      onOk: async () => {
        setRetrying(true);
        try {
          const res = await retryEmails(failedLogs.map(l => l.id || l._id));
          if (res.data.success) {
            message.success('Retry attempt complete');
            await fetchInitialData();
          }
        } catch (err) {
          message.error('Retry failed');
        } finally {
          setRetrying(false);
        }
      }
    });
  };

  const calculateTotal = (payments) => {
    if (!payments) return 0;
    return payments.reduce((acc, curr) => acc + (curr['Bank Payment'] || 0), 0);
  };

  const previewData = {
    to: activeResults[0]?.emails?.[0] || 'example@company.com',
    subject: `Payment Statement - ${activeResults[0]?.partyCode || 'Sample Party'}`,
    body: `Dear Team,\n\nPlease find attached the payment reconciliation statement.\n\nTotal Settled: ₹${calculateTotal(activeResults[0]?.payments).toLocaleString('en-IN')}\nTransactions: ${activeResults[0]?.payments?.length || 0}\n\nRegards,\nAccounts Team`
  };

  const columns = [
    { title: 'Party', dataIndex: 'partyName', key: 'party', render: (text, record) => text || record.partyCode },
    { title: 'Email', dataIndex: 'email', key: 'email', render: email => <Text copyable>{email}</Text> },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: status => <Badge status={status === 'SENT' ? 'success' : 'error'} text={status} />
    },
    { 
      title: 'Date', 
      dataIndex: 'createdAt', 
      key: 'date',
      render: date => new Date(date).toLocaleString()
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2} style={{ margin: 0 }}>Send Emails</Title>
        <Text type="secondary">Review and dispatch reconciliation statements via Gmail.</Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card title="Sender Account" bordered={false}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f5f5f5', borderRadius: 8 }}>
                  <GoogleOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                  <div>
                    <Text strong style={{ display: 'block' }}>{gmailStatus.connected ? 'Gmail Connected' : 'Disconnected'}</Text>
                    <Text type="secondary" size="small">{gmailStatus.email || 'No account linked'}</Text>
                  </div>
                </div>
                <Alert 
                  title="Safe Sending" 
                  description="We automatically add random delays (1-5s) between emails to prevent spam flags." 
                  type="info" 
                  showIcon 
                  icon={<LockOutlined />}
                />
              </Space>
            </Card>

            <DayWiseEmailLogs />
          </Space>
        </Col>

        <Col xs={24} lg={16}>
          <Card 
            title={<span><EyeOutlined /> Email Preview</span>} 
            variant="borderless"
            extra={<Text type="secondary">Sample Preview</Text>}
          >
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="To"><Text strong>{previewData.to}</Text></Descriptions.Item>
                  <Descriptions.Item label="Subject"><Text strong>{previewData.subject}</Text></Descriptions.Item>
                </Descriptions>
              </div>
              <div style={{ padding: 24, minHeight: 200, background: '#fff' }}>
                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{previewData.body}</Paragraph>
                <Divider />
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
                  <FileExcelOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                  <Text size="small">payment_statement.xlsx</Text>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, padding: 24, background: '#f0f5ff', borderRadius: 8 }}>
              {sendResult ? (
                <div style={{ textAlign: 'center' }}>
                  <Title level={4}>Sending Complete</Title>
                  <Row gutter={16} justify="center">
                    <Col span={8}>
                      <Statistic title="Sent" value={sendResult.sentCount} styles={{ content: { color: '#3f8600' } }} prefix={<CheckCircleOutlined />} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="Failed" value={sendResult.failedCount} styles={{ content: { color: '#cf1322' } }} prefix={<CloseCircleOutlined />} />
                    </Col>
                  </Row>
                  <Progress percent={100} status="success" strokeColor="#52c41a" style={{ marginTop: 16 }} />
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<SendOutlined />} 
                    loading={sending} 
                    disabled={!activeResults.length}
                    onClick={handleSendBatch}
                    style={{ minWidth: 200 }}
                  >
                    Send {activeResults.length} Emails
                  </Button>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Dispatching reconciliation statements to all identified parties.</Text>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Card 
        title={<span><HistoryOutlined /> Recent Logs</span>} 
        bordered={false}
        extra={
          <Button 
            size="small" 
            icon={<SyncOutlined spin={retrying} />} 
            onClick={handleRetryFailed}
            disabled={!emailLogs.some(l => l.status === 'FAILED')}
          >
            Retry Failed
          </Button>
        }
      >
        <Table 
          columns={columns} 
          dataSource={emailLogs} 
          rowKey={record => record.id || record._id} 
          size="small"
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </Space>
  );
}
