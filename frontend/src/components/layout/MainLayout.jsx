import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Input, Badge, Avatar, Space, Typography, ConfigProvider, theme } from 'antd';
import {
  DashboardOutlined,
  FileSearchOutlined,
  UsergroupAddOutlined,
  SendOutlined,
  HistoryOutlined,
  SettingOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BellOutlined,
  LogoutOutlined,
  SearchOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useRefresh } from '../../context/RefreshContext';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

export default function MainLayout({ onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { triggerRefresh } = useRefresh();

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/reconciliation', icon: <FileSearchOutlined />, label: 'Reconciliation' },
    { key: '/parties', icon: <UsergroupAddOutlined />, label: 'Party Emails' },
    { key: '/sender', icon: <SendOutlined />, label: 'Send Emails' },
    { key: '/logs', icon: <HistoryOutlined />, label: 'Logs & History' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={collapsed} 
          theme="light"
          style={{ 
            borderRight: '1px solid #f0f0f0',
            position: 'fixed',
            height: '100vh',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100
          }}
          width={240}
        >
          <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
            <Title level={4} style={{ margin: 0, color: '#1677ff' }}>
              {collapsed ? 'ZT' : 'ZenTrack'}
            </Title>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ borderRight: 0, marginTop: 16 }}
          />
          <div style={{ position: 'absolute', bottom: 16, width: '100%', padding: '0 16px' }}>
            <Button 
              type="text" 
              danger 
              icon={<LogoutOutlined />} 
              onClick={onLogout}
              block
              style={{ textAlign: 'left', padding: '8px 12px' }}
            >
              {!collapsed && 'Sign Out'}
            </Button>
          </div>
        </Sider>
        <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'all 0.2s' }}>
          <Header style={{ 
            padding: '0 24px', 
            background: '#fff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            width: '100%'
          }}>
            <Space size="middle">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '16px', width: 64, height: 64 }}
              />
              <Input
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="Search invoices, parties..."
                variant="borderless"
                style={{ width: 300, background: '#f5f5f5', borderRadius: 8, padding: '8px 12px' }}
              />
            </Space>
            
            <Space size="large">
              <Button 
                icon={<SyncOutlined />} 
                onClick={triggerRefresh}
                style={{ borderRadius: 8 }}
              >
                Sync Data
              </Button>
              <Badge count={5} dot>
                <Button type="text" icon={<BellOutlined />} style={{ fontSize: 18 }} />
              </Badge>
              <Space style={{ marginLeft: 16 }}>
                <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Admin User</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>Finance Dept</div>
                </div>
                <Avatar style={{ backgroundColor: '#1677ff' }}>AD</Avatar>
              </Space>
            </Space>
          </Header>
          <Content style={{ margin: '24px', minHeight: 280 }}>
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
