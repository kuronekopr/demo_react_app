import React from 'react';
import { LayoutDashboard, Timer, CheckSquare, Activity, Settings, User } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', name: 'ダッシュボード', icon: LayoutDashboard },
    { id: 'focus', name: 'フォーカス', icon: Timer },
    { id: 'tasks', name: 'タスク', icon: CheckSquare },
    { id: 'metrics', name: 'ステータス', icon: Activity },
  ];

  return (
    <aside className="glass-panel sidebar">
      {/* Brand Section */}
      <div className="sidebar-brand-section">
        <div className="brand-header">
          <div className="brand-logo-container">
            <span className="brand-logo-text">N</span>
            <div className="shimmer-effect brand-shimmer"></div>
          </div>
          <div>
            <h1 className="brand-title">
              Nexus<span className="text-gradient">Flow</span>
            </h1>
            <p className="brand-subtitle">PROD v1.0.0</p>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="sidebar-nav">
          <p className="nav-label">MENU</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-button ${isActive ? 'active' : ''}`}
              >
                {isActive && <div className="nav-button-indicator"></div>}
                <Icon
                  size={18}
                  className={`nav-button-icon ${isActive ? 'active-icon' : ''}`}
                />
                <span className="nav-button-text">{item.name}</span>
                <div className="nav-button-shimmer"></div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User / Settings Footer Section */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar-container">
            <User size={20} className="user-avatar-icon" />
          </div>
          <div className="user-info">
            <p className="user-name">DEMO USER</p>
            <p className="user-email">demo@nexusflow.io</p>
          </div>
        </div>

        <button className="nav-button footer-button">
          <Settings size={18} />
          <span className="nav-button-text">環境設定</span>
        </button>
      </div>
    </aside>
  );
};
