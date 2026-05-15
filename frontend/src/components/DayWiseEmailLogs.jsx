import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Typography, 
  Badge, 
  Button, 
  Space, 
  Empty, 
  Collapse,
  Tag,
  Row,
  Col,
  App as AntdApp 
} from 'antd';
import { 
  CalendarOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  EyeOutlined,
  MailOutlined
} from '@ant-design/icons';
import { getDailyEmailLogs, getEmailLogsByDate } from '../services/api';

const { Text, Title } = Typography;

export default function DayWiseEmailLogs() {
  const [dailyLogs, setDailyLogs] = useState([]);
  const [dateLogs, setDateLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const { message } = AntdApp.useApp();

  useEffect(() => {
    fetchDailyLogs();
  }, []);

  const fetchDailyLogs = async () => {
    setLoading(true);
    try {
      const res = await getDailyEmailLogs();
      if (res.data?.data) {
        setDailyLogs(res.data.data);
      }
    } catch (err) {
      message.error('Failed to fetch daily logs');
    } finally {
      setLoading(false);
    }
  };

  const handleDateExpand = async (date) => {
    if (!date || dateLogs[date]) return;
    
    try {
      const res = await getEmailLogsByDate(date);
      if (res.data?.data) {
        setDateLogs(prev => ({ ...prev, [date]: res.data.data }));
      }
    } catch (err) {
      message.error('Failed to fetch logs for this date');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short',
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const innerColumns = [
    { title: 'Party', dataIndex: 'partyName', key: 'party', render: (text, record) => text || record.partyCode },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: status => <Badge status={status === 'SENT' ? 'success' : 'error'} text={status} />
    },
    { 
      title: 'Time', 
      dataIndex: 'createdAt', 
      key: 'time',
      render: date => new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }
  ];

  const collapseItems = dailyLogs.map((day) => ({
    key: day._id,
    label: (
      <Row style={{ width: '100%' }} align="middle">
        <Col flex="auto">
          <Text strong>{formatDate(day._id)}</Text>
        </Col>
        <Col>
          <Space size="middle">
            <Tag color="success" icon={<CheckCircleOutlined />}>{day.sent || 0}</Tag>
            <Tag color="error" icon={<CloseCircleOutlined />}>{day.failed || 0}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>Total: {(day.sent || 0) + (day.failed || 0)}</Text>
          </Space>
        </Col>
      </Row>
    ),
    children: (
      <Table 
        dataSource={dateLogs[day._id]} 
        columns={innerColumns} 
        pagination={false} 
        size="small" 
        rowKey={record => record.id || record._id}
        loading={!dateLogs[day._id]}
      />
    )
  }));

  if (!loading && !dailyLogs.length) {
    return (
      <Empty 
        image={Empty.PRESENTED_IMAGE_SIMPLE} 
        description={<Text type="secondary">No email history found</Text>} 
      />
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Title level={5} style={{ margin: 0 }}>
        <CalendarOutlined style={{ marginRight: 8 }} />
        Daily Email Statistics
      </Title>
      
      <Collapse 
        ghost 
        accordion 
        items={collapseItems}
        onChange={(keys) => keys[0] && handleDateExpand(keys[0])}
      />
    </Space>
  );
}