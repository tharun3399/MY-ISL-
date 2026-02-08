

import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../Sidebar/Sidebar';
import './Account.css';

export default function Account() {
  const { user, setState, authenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update form state whenever user data changes
  useEffect(() => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = () => {
    setEditMode(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
    setEditMode(false);
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/update-profile`,
        form,
        { withCredentials: true }
      );
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      if (setState) {
        setState({ authenticated: true, user: res.data.user, loading: false });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
      if (setState) {
        setState({ authenticated: false, user: null, loading: false });
      }
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="account-page">
          <div className="account-card premium-shadow">
            <div className="account-header">
              <div className="account-avatar">
                {form.name ? form.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="account-title">
                <h2>{form.name || 'User'}</h2>
              </div>
            </div>
            <div className="account-details">
              <div className="account-detail-row">
                <span className="account-label">Name:</span>
                {editMode ? (
                  <input
                    className="account-input"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    disabled={loading}
                    maxLength={100}
                    required
                  />
                ) : (
                  <span className="account-value">{form.name}</span>
                )}
              </div>
              <div className="account-detail-row">
                <span className="account-label">Email:</span>
                {editMode ? (
                  <input
                    className="account-input"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                    type="email"
                    maxLength={100}
                    required
                  />
                ) : (
                  <span className="account-value">{form.email}</span>
                )}
              </div>
              <div className="account-detail-row">
                <span className="account-label">Phone:</span>
                {editMode ? (
                  <input
                    className="account-input"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={loading}
                    type="tel"
                    maxLength={15}
                    pattern="^\+?[0-9]{8,15}$"
                  />
                ) : (
                  <span className="account-value">{form.phone || '—'}</span>
                )}
              </div>
            </div>
            <div className="account-footer">
              {error && <div className="account-error">{error}</div>}
              {success && <div className="account-success">{success}</div>}
              {editMode ? (
                <div className="account-actions">
                  <button className="account-btn save" onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button className="account-btn cancel" onClick={handleCancel} disabled={loading}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="account-actions">
                  <button className="account-btn edit" onClick={handleEdit}>
                    Edit
                  </button>
                  <button className="account-btn logout" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
              <span className="account-note">Thank you for being a valued member of ISL Academy!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
