import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Upload, 
  Switch, 
  Input, 
  Badge, 
  Empty, 
  Spin, 
  App as AntdApp,
  Collapse,
  List,
  Tag
} from 'antd';
import {
  InboxOutlined,
  FileSearchOutlined,
  DownloadOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UsergroupAddOutlined,
  HistoryOutlined,
  SyncOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { 
  uploadReconciliationFiles, 
  downloadPartywiseExcel, 
  triggerDownload,
  getSession
} from '../services/api';
import { useRefresh } from '../context/RefreshContext';

const { Title, Text } = Typography;
const { Dragger } = Upload;

export default function ReconciliationView() {
  const navigate = useNavigate();
  const { refreshKey } = useRefresh();
  const { message } = AntdApp.useApp();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [syncToDatabase, setSyncToDatabase] = useState(false);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await getSession();
        if (res.data.data) {
          setResults(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch session", err);
      }
    };
    fetchLatest();
  }, []);

  const handleProcess = async () => {
    if (!file) return message.error('Please select an Excel file');
    setLoading(true);
    try {
      const res = await uploadReconciliationFiles(file, syncToDatabase);
      if (res.data.success) {
        setResults(res.data.data);
        message.success(`Processing complete! Found ${res.data.data.summary?.matched || 0} party matches.`);
        
        setTimeout(() => {
          navigate(`/sender?sessionId=${res.data.data.sessionId}`);
        }, 1500);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Processing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDownload = async () => {
    setDownloading(true);
    try {
      const res = await downloadPartywiseExcel();
      triggerDownload(res.data, `Reconciliation_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch {
      message.error('Export failed');
    } finally {
      setDownloading(false);
    }
  };

  const matchedData = results?.matchedResults || [];
  const filteredResults = matchedData.filter(r => 
    r.partyCode.toLowerCase().includes(search.toLowerCase()) ||
    r.partyName.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { title: 'Inv. No.', dataIndex: 'Inv. No.', key: 'inv' },
    { title: 'Date', dataIndex: 'Pur. Date', key: 'date' },
    { 
      title: 'Debit Amount', 
      dataIndex: 'Debit Amount', 
      key: 'debit',
      render: val => val ? `₹${val.toLocaleString('en-IN')}` : '-'
    },
    { 
      title: 'Settled Amount', 
      dataIndex: 'Bank Payment', 
      key: 'settled',
      render: val => <Text strong type="success">₹{val.toLocaleString('en-IN')}</Text>
    }
  ];

  const collapseItems = filteredResults.map(entry => ({
    key: entry.partyCode,
    label: (
      <Row style={{ width: '100%', paddingRight: 24 }} align="middle">
        <Col flex="auto">
          <Space direction="vertical" size={0}>
            <Text strong>{entry.partyName} ({entry.partyCode})</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{entry.emails[0]} • {entry.payments.length} records</Text>
          </Space>
        </Col>
        <Col>
          <Text strong style={{ fontSize: 16 }}>
            ₹{entry.payments.reduce((acc, curr) => acc + (curr['Bank Payment'] || 0), 0).toLocaleString('en-IN')}
          </Text>
        </Col>
      </Row>
    ),
    children: (
      <Table 
        dataSource={entry.payments} 
        columns={columns} 
        pagination={false} 
        size="small" 
        rowKey={(record, idx) => idx}
      />
    )
  }));

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row justify="space-between" align="bottom">
        <Col>
          <Title level={2} style={{ margin: 0 }}>Reconciliation</Title>
          <Text type="secondary">Upload and match payment records with party details.</Text>
        </Col>
        <Col>
          {results && (
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              onClick={handleBulkDownload} 
              loading={downloading}
            >
              Export Results
            </Button>
          )}
        </Col>
      </Row>

      <Card title="Upload Payment Sheet" variant="borderless">
        <Dragger
          multiple={false}
          beforeUpload={(file) => {
            setFile(file);
            return false;
          }}
          onRemove={() => setFile(null)}
          accept=".xlsx"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">Support for .xlsx payment sheets. Strictly single file upload.</p>
        </Dragger>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32 }}>
          <Space>
            <Text>Sync to Party Database</Text>
            <Switch 
              checked={syncToDatabase} 
              onChange={setSyncToDatabase} 
            />
          </Space>
          
          <Button 
            type="primary" 
            size="large" 
            icon={<SyncOutlined spin={loading} />} 
            onClick={handleProcess}
            loading={loading}
            disabled={!file}
            style={{ minWidth: 200 }}
          >
            Start Matching
          </Button>
        </div>
      </Card>

      {results && (
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless">
              <Statistic title="Matched Parties" value={results.summary.matched} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless">
              <Statistic title="Entries Skipped" value={results.summary.skipped} prefix={<InfoCircleOutlined style={{ color: '#faad14' }} />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless">
              <Statistic title="Missing Emails" value={results.summary.withoutEmail} prefix={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless">
              <Statistic title="Records Processed" value={matchedData.length} prefix={<HistoryOutlined style={{ color: '#1677ff' }} />} />
            </Card>
          </Col>
        </Row>
      )}

      {results && (
        <Card 
          title="Matching Results" 
          variant="borderless"
          extra={
            <Input.Search 
              placeholder="Search party..." 
              onSearch={setSearch} 
              onChange={e => setSearch(e.target.value)}
              style={{ width: 250 }} 
            />
          }
        >
          <Collapse ghost expandIconPosition="end" items={collapseItems} />
        </Card>
      )}

      {results && (
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title="Exceptions (Skipped Lines)" variant="borderless" styles={{ body: { maxHeight: 300, overflowY: 'auto' } }}>
              <List
                size="small"
                dataSource={results.skipLogLines}
                renderItem={item => <List.Item><Text type="secondary" style={{ fontSize: 12 }}>{item}</Text></List.Item>}
                locale={{ emptyText: 'No exceptions found' }}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Missing Email Mappings" variant="borderless" styles={{ body: { maxHeight: 300, overflowY: 'auto' } }}>
              <List
                size="small"
                dataSource={results.partiesWithoutEmail}
                renderItem={item => (
                  <List.Item extra={<Tag color="red">{item.paymentCount} records</Tag>}>
                    <Text strong>{item.partyName}</Text> <Text type="secondary">({item.partyCode})</Text>
                  </List.Item>
                )}
                locale={{ emptyText: 'All parties have email mappings' }}
              />
            </Card>
          </Col>
        </Row>
      )}
    </Space>
  );
}
