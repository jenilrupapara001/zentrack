import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Tag, 
  Button, 
  Input, 
  Select, 
  Space, 
  Card, 
  Typography, 
  Row, 
  Col, 
  Badge, 
  Switch, 
  Tooltip,
  App as AntdApp 
} from 'antd';
import {
  SearchOutlined,
  SyncOutlined,
  DownloadOutlined,
  FileTextOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { 
  downloadEmailLogTxt, 
  downloadEmailLogExcel, 
  triggerDownload, 
  getEmailLogs,
  retryEmails
} from '../services/api';

const { Title, Text } = Typography;

export default function LogsReporting() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [retryingId, setRetryingId] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const { message } = AntdApp.useApp();

  useEffect(() => {
    fetchLogs();
    
    let interval;
    if (isLive) {
      interval = setInterval(() => {
        pollLogs();
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getEmailLogs();
      setLogs(res.data.data || []);
    } catch {
      message.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const pollLogs = async () => {
    try {
      const res = await getEmailLogs();
      setLogs(res.data.data || []);
    } catch (err) {
      console.error('Polling error:', err);
    }
  };

  const handleRetrySingle = async (logId) => {
    setRetryingId(logId);
    try {
      const res = await retryEmails([logId]);
      if (res.data.success) {
        message.success('Email resent successfully');
        await fetchLogs();
      }
    } catch (err) {
      message.error('Retry failed');
    } finally {
      setRetryingId(null);
    }
  };

  const handleTxt = async () => {
    try {
      const res = await downloadEmailLogTxt();
      triggerDownload(res.data, 'audit_log.txt');
    } catch {
      message.warning('No logs available for export');
    }
  };

  const handleExcel = async () => {
    try {
      const res = await downloadEmailLogExcel();
      triggerDownload(res.data, 'analytical_report.xlsx');
    } catch {
      message.warning('Report generation failed');
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = (log.partyName || '').toLowerCase().includes(search.toLowerCase()) || 
                         (log.partyCode || '').toLowerCase().includes(search.toLowerCase()) ||
                         (log.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || 
                         (statusFilter === 'SENT' && log.status === 'SENT') ||
                         (statusFilter === 'FAILED' && log.status === 'FAILED');
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'time',
      width: '20%',
      render: date => <Text type="secondary" style={{ fontSize: 12 }}>{new Date(date).toLocaleString()}</Text>
    },
    {
      title: 'Party',
      key: 'party',
      width: '25%',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.partyName || record.partyCode}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{record.email}</Text>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: status => (
        <Tag 
          color={status === 'SENT' ? 'success' : 'error'} 
          icon={status === 'SENT' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {status}
        </Tag>
      )
    },
    {
      title: 'Error Message',
      dataIndex: 'error',
      key: 'error',
      width: '25%',
      render: error => error ? <Text type="danger" style={{ fontSize: 12 }}>{error}</Text> : <Text type="secondary">—</Text>
    },
    {
      title: 'Action',
      key: 'action',
      width: '15%',
      align: 'right',
      render: (_, record) => record.status === 'FAILED' && (
        <Tooltip title="Retry sending">
          <Button 
            type="text" 
            icon={<ReloadOutlined spin={retryingId === (record.id || record._id)} />} 
            onClick={() => handleRetrySingle(record.id || record._id)} 
            disabled={retryingId !== null}
          />
        </Tooltip>
      )
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row justify="space-between" align="bottom">
        <Col>
          <Title level={2} style={{ margin: 0 }}>Logs & History</Title>
          <Text type="secondary">View and export communication history and delivery statuses.</Text>
        </Col>
        <Col>
          <Space>
            <Button icon={<FileTextOutlined />} onClick={handleTxt}>Raw Log</Button>
            <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExcel}>Report Export</Button>
          </Space>
        </Col>
      </Row>

      <Card variant="borderless">
        <Row gutter={16} align="middle" style={{ marginBottom: 24 }}>
          <Col flex="auto">
            <Input 
              placeholder="Search by party or email..." 
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              onChange={e => setSearch(e.target.value)}
              size="large"
            />
          </Col>
          <Col>
            <Select 
              defaultValue="All" 
              style={{ width: 150 }} 
              onChange={setStatusFilter}
              size="large"
            >
              <Select.Option value="All">All Status</Select.Option>
              <Select.Option value="SENT">Success</Select.Option>
              <Select.Option value="FAILED">Failed</Select.Option>
            </Select>
          </Col>
          <Col>
            <Space>
              <Text type="secondary" size="small">Live Monitoring</Text>
              <Switch checked={isLive} onChange={setIsLive} />
            </Space>
          </Col>
        </Row>

        <Table 
          columns={columns} 
          dataSource={filteredLogs} 
          loading={loading}
          rowKey={record => record.id || record._id}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
        />
      </Card>
    </Space>
  );
}
