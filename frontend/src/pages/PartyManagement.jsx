import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Space, 
  Card, 
  Typography, 
  Tag, 
  Modal, 
  Upload, 
  Row, 
  Col, 
  Tooltip, 
  Badge, 
  App as AntdApp 
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  UploadOutlined,
  DownloadOutlined,
  UsergroupAddOutlined,
  MailOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { getPartyEmails, updatePartyEmail, uploadPartyEmails, downloadPartyEmailsCsv, triggerDownload } from '../services/api';

const { Title, Text } = Typography;
const { Dragger } = Upload;

export default function PartyManagement() {
  const [parties, setParties] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const { message } = AntdApp.useApp();
  
  const [editingKey, setEditingKey] = useState('');
  const [editFormData, setEditFormData] = useState({});
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = async () => {
    setFetching(true);
    try {
      const res = await getPartyEmails();
      setParties(res.data.data || []);
    } catch {
      message.error('Failed to load party emails');
    } finally {
      setFetching(false);
    }
  };

  const isEditing = (record) => (record.id || record._id) === editingKey;

  const edit = (record) => {
    setEditingKey(record.id || record._id);
    setEditFormData({ ...record });
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (key) => {
    try {
      const res = await updatePartyEmail(key, editFormData);
      message.success('Party details updated successfully');
      setParties(p => p.map(item => (item.id || item._id) === key ? res.data.data : item));
      setEditingKey('');
    } catch (err) {
      message.error('Update failed');
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkFile) return message.error('No file selected');
    setUploading(true);
    try {
      await uploadPartyEmails(bulkFile);
      message.success('Bulk import successful');
      setShowBulkUpload(false);
      setBulkFile(null);
      loadParties();
    } catch (err) {
      message.error('Bulk import failed');
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await downloadPartyEmailsCsv();
      triggerDownload(res.data, 'party_emails.csv');
      message.success('Exported to CSV');
    } catch {
      message.error('Export failed');
    }
  };

  const filteredParties = parties.filter(p => 
    p.partyCode?.toLowerCase().includes(search.toLowerCase()) ||
    p.partyName?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'Party Code',
      dataIndex: 'partyCode',
      key: 'code',
      width: '15%',
      render: (text, record) => isEditing(record) ? (
        <Input 
          value={editFormData.partyCode} 
          onChange={e => setEditFormData({...editFormData, partyCode: e.target.value})} 
        />
      ) : <Text strong>{text}</Text>
    },
    {
      title: 'Party Name',
      dataIndex: 'partyName',
      key: 'name',
      width: '25%',
      render: (text, record) => isEditing(record) ? (
        <Input 
          value={editFormData.partyName} 
          onChange={e => setEditFormData({...editFormData, partyName: e.target.value})} 
        />
      ) : text
    },
    {
      title: 'Email Address',
      dataIndex: 'email',
      key: 'email',
      width: '30%',
      render: (text, record) => isEditing(record) ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input 
            prefix={<MailOutlined />} 
            value={editFormData.email} 
            onChange={e => setEditFormData({...editFormData, email: e.target.value})} 
            placeholder="Primary Email"
          />
          <Input 
            prefix={<MailOutlined />} 
            value={editFormData.cc} 
            onChange={e => setEditFormData({...editFormData, cc: e.target.value})} 
            placeholder="CC Email (comma separated)"
          />
        </Space>
      ) : (
        <Space direction="vertical" size={0}>
          <Text>{text || <Text type="secondary" italic>No email</Text>}</Text>
          {record.cc && <Text type="secondary" style={{ fontSize: 11 }}>CC: {record.cc}</Text>}
        </Space>
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: '15%',
      render: (_, record) => record.email ? <Tag color="success">Verified</Tag> : <Tag color="error">Missing Email</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '15%',
      align: 'right',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button type="primary" size="small" icon={<SaveOutlined />} onClick={() => save(record.id || record._id)} />
            <Button size="small" icon={<CloseOutlined />} onClick={cancel} />
          </Space>
        ) : (
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => edit(record)} 
            disabled={editingKey !== ''}
          />
        );
      }
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row justify="space-between" align="bottom">
        <Col>
          <Title level={2} style={{ margin: 0 }}>Party Emails</Title>
          <Text type="secondary">Manage contact information for your vendors and customers.</Text>
        </Col>
        <Col>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>Export CSV</Button>
            <Button type="primary" icon={<UploadOutlined />} onClick={() => setShowBulkUpload(true)}>Bulk Import</Button>
          </Space>
        </Col>
      </Row>

      <Card variant="borderless">
        <Input
          placeholder="Search by code, name, or email..."
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          onChange={e => setSearch(e.target.value)}
          size="large"
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
        <Table
          columns={columns}
          dataSource={filteredParties}
          loading={fetching}
          rowKey={record => record.id || record._id}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title="Bulk Import Parties"
        open={showBulkUpload}
        onCancel={() => setShowBulkUpload(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowBulkUpload(false)}>Cancel</Button>,
          <Button key="submit" type="primary" loading={uploading} disabled={!bulkFile} onClick={handleBulkSubmit}>
            Import Now
          </Button>
        ]}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', paddingTop: 16 }}>
          <Text type="secondary">
            Upload an Excel file (.xlsx) with 'Party Code', 'Party Name', and 'Email' columns to update your registry in bulk.
          </Text>
          <Dragger
            multiple={false}
            beforeUpload={(file) => {
              setBulkFile(file);
              return false;
            }}
            onRemove={() => setBulkFile(null)}
            accept=".xlsx"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
          </Dragger>
        </Space>
      </Modal>
    </Space>
  );
}
