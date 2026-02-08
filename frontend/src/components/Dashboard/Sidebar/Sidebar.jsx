import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../../context/AuthContext'
import DashboardIcon from './icons/dashboard-monitor.png'
import LearningIcon from './icons/lesson.png'
import PracticeIcon from './icons/practice.png'
import SettingsIcon from './icons/settings-sliders.png'
import UserIcon from './icons/user.png'
import ISLIcon from './icons/icon.png'
import './Sidebar.css'

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const navigate = useNavigate()
  const { authState, logout } = useContext(AuthContext)
  const user = authState?.user || {}
  const [menuOpen, setMenuOpen] = useState(isOpen)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Sync isOpen prop with menuOpen state
  useEffect(() => {
    setMenuOpen(isOpen)
  }, [isOpen])

  const menuItems = [
    { icon: DashboardIcon, label: 'Dashboard', id: 'dashboard' },
    { icon: LearningIcon, label: 'Learning Path', id: 'learning' },
    { icon: PracticeIcon, label: 'Practice Mode', id: 'practice' },
    { icon: LearningIcon, label: 'Communities', id: 'communities' }
  ]

  const systemItems = [
    { icon: SettingsIcon, label: 'Settings', id: 'settings' },
    { icon: UserIcon, label: 'Account', id: 'account' }
  ]

  const vidlearnItems = [
    { icon: LearningIcon, label: 'VidLearn', id: 'vidlearn' }
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const closeSidebarOnMobile = () => {
    setMenuOpen(false)
    onClose()
  }

  const handleMenuClick = (itemId) => {
    closeSidebarOnMobile()
    switch(itemId) {
      case 'dashboard':
        navigate('/dashboard')
        break
      case 'learning':
        navigate('/learning-path')
        break
      case 'practice':
        navigate('/practice-mode')
        break
      case 'communities':
        navigate('/communities')
        break
      case 'account':
        navigate('/account')
        break
      case 'vidlearn':
        navigate('/vidlearn')
        break
      default:
        break
    }
  }

  return (
    <aside className={`sidebar ${menuOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <img src={ISLIcon} alt="ISL Logo" className="isl-logo" style={{ width: 36, height: 36, marginRight: 8 }} />
          <span className="logo-name blink">ISL Academy</span>
        </div>
        <button 
          className="sidebar-collapse-btn" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className="collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isCollapsed ? (
              <polyline points="9 18 15 12 9 6"></polyline>
            ) : (
              <polyline points="15 18 9 12 15 6"></polyline>
            )}
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav" onClick={closeSidebarOnMobile}>
        <div className="menu-section">
          <h3 className="menu-label">MENU</h3>
          <ul className="menu-list">
            {menuItems.map(item => (
              <li key={item.id} className="menu-item">
                <a href="#" className="menu-link active" onClick={(e) => {
                  e.preventDefault()
                  handleMenuClick(item.id)
                }}>
                  <img src={item.icon} alt={item.label} className="menu-icon" />
                  <span className="menu-text">{item.label}</span>
                  {item.id === 'dashboard' && <span className="menu-dot"></span>}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="menu-section">
          <h3 className="menu-label">SYSTEM</h3>
          <ul className="menu-list">
            {systemItems.map(item => (
              <li key={item.id} className="menu-item">
                <a href="#" className="menu-link" onClick={e => {
                  e.preventDefault();
                  handleMenuClick(item.id);
                }}>
                  <img src={item.icon} alt={item.label} className="menu-icon" />
                  <span className="menu-text" >{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="menu-section">
          <h3 className="menu-label">VIDLEARN</h3>
          <ul className="menu-list">
            {vidlearnItems.map(item => (
              <li key={item.id} className="menu-item">
                <a href="#" className="menu-link" onClick={e => {
                  e.preventDefault();
                  handleMenuClick(item.id);
                }}>
                  <img src={item.icon} alt={item.label} className="menu-icon" />
                  <span className="menu-text" >{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="sidebar-footer" onClick={closeSidebarOnMobile}>
        <div className="user-card">
          <div className="user-avatar">{user.name?.charAt(0) || 'U'}</div>
          <div className="user-info">
            <div className="user-name">{user.name || 'User'}</div>
            <div className="user-email">{user.email || 'user@example.com'}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  )
}
