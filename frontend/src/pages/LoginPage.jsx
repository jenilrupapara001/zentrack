import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, App as AntdApp } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { login } from '../services/api';

const { Title, Text } = Typography;

export default function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const { message } = AntdApp.useApp();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await login(values);
      message.success('Login successful! Welcome back.');
      onLogin();
    } catch (err) {
      message.error(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#f0f2f5',
      padding: '20px'
    }}>
      <Card 
        style={{ width: '100%', maxWidth: 400, borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
        styles={{ body: { padding: '40px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ 
            width: 64, 
            height: 64, 
            background: '#1677ff', 
            borderRadius: 16, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#fff',
            fontSize: 32
          }}>
            <LoginOutlined />
          </div>
          <Title level={2} style={{ margin: 0 }}>ZenTrack</Title>
          <Text type="secondary">Payment Reconciliation System</Text>
        </div>

        <Form
          name="login"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Please enter your username!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Enter your username" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter your password!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" />
          </Form.Item>

          <Form.Item style={{ marginTop: 32 }}>
            <Button type="primary" htmlType="submit" loading={loading} block icon={<LoginOutlined />}>
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            &copy; {new Date().getFullYear()} ZenTrack. All rights reserved.
          </Text>
        </div>
      </Card>
    </div>
  );
}
