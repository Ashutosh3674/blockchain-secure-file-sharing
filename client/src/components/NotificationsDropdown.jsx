import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Share2,
  Clock,
  Download,
  ShieldAlert,
  X,
  ExternalLink,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { notificationService } from '../services/notificationService';

/**
 * 🔔 NotificationsDropdown.jsx
 * Interactive notification center drawer & quick trigger lab.
 * Implements the 4 canonical user notifications:
 * 1. 🔔 "Rahul shared a file with you."
 * 2. 🔔 "Your access to Report.pdf expires tomorrow."
 * 3. 🔔 "Your file was downloaded."
 * 4. 🔔 "Access to Project.pdf was revoked."
 */
export const NotificationsDropdown = ({ onShowToast }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((list) => {
      setNotifications([...list]);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'file_shared':
        return <Share2 size={16} color="var(--accent-cyan)" />;
      case 'access_expiring':
        return <Clock size={16} color="var(--accent-amber)" />;
      case 'file_downloaded':
        return <Download size={16} color="var(--accent-emerald)" />;
      case 'access_revoked':
        return <ShieldAlert size={16} color="var(--accent-rose)" />;
      default:
        return <Bell size={16} color="var(--accent-cyan)" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'file_shared':
        return 'rgba(0, 242, 254, 0.4)';
      case 'access_expiring':
        return 'rgba(245, 158, 11, 0.4)';
      case 'file_downloaded':
        return 'rgba(16, 185, 129, 0.4)';
      case 'access_revoked':
        return 'rgba(244, 63, 94, 0.4)';
      default:
        return 'rgba(255, 255, 255, 0.1)';
    }
  };

  const formatTimestamp = (ts) => {
    const diffMs = Date.now() - ts;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(ts).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  // Quick Simulation Triggers matching user's exact specification
  const triggerSimulatedNotif = (scenario) => {
    let notif;
    if (scenario === 1) {
      notif = notificationService.notifyFileShared('Rahul', 'Project_Alpha_Blueprint.pdf');
    } else if (scenario === 2) {
      notif = notificationService.notifyAccessExpiring('Report.pdf', 'tomorrow');
    } else if (scenario === 3) {
      notif = notificationService.notifyFileDownloaded('Rahul', 'Quarterly_Security_Audit.pdf');
    } else if (scenario === 4) {
      notif = notificationService.notifyAccessRevoked('Project.pdf', 'Ashutosh');
    }
    if (onShowToast) onShowToast(`🔔 ${notif.message}`, 'info');
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary"
        title="View Real-Time Notifications"
        style={{
          position: 'relative',
          padding: '0.45rem 0.75rem',
          fontSize: '0.85rem',
          borderColor: unreadCount > 0 ? 'rgba(0, 242, 254, 0.45)' : 'rgba(255, 255, 255, 0.1)',
          background: unreadCount > 0 ? 'rgba(0, 242, 254, 0.08)' : undefined,
        }}
      >
        <Bell size={17} color={unreadCount > 0 ? 'var(--accent-cyan)' : 'var(--text-secondary)'} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'linear-gradient(135deg, #00f2fe 0%, #3b82f6 100%)',
              color: '#050b14',
              borderRadius: '9999px',
              fontWeight: 800,
              fontSize: '0.68rem',
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 10px rgba(0, 242, 254, 0.6)',
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Center Dropdown Panel */}
      {isOpen && (
        <div
          className="glass-card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '380px',
            maxWidth: '92vw',
            maxHeight: '520px',
            overflowY: 'auto',
            background: 'linear-gradient(160deg, rgba(13, 18, 33, 0.98) 0%, rgba(20, 27, 48, 0.98) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.8), 0 0 30px rgba(0, 242, 254, 0.12)',
            zIndex: 9999,
            padding: '1rem',
            animation: 'slideUp 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(0,242,254,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={15} color="var(--accent-cyan)" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Notifications</h4>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {unreadCount > 0 && (
                <button
                  onClick={() => notificationService.markAllAsRead()}
                  className="btn btn-secondary"
                  title="Mark all as read"
                  style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                >
                  <CheckCheck size={12} />
                  <span>Mark Read</span>
                </button>
              )}
              <button
                onClick={() => notificationService.clearAll()}
                className="btn btn-secondary"
                title="Clear all notifications"
                style={{ padding: '2px 6px', fontSize: '0.7rem', color: '#fda4af' }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                flex: 1,
                padding: '0.3rem',
                fontSize: '0.75rem',
                borderRadius: '6px',
                background: filter === 'all' ? 'rgba(0,242,254,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filter === 'all' ? 'var(--accent-cyan)' : 'transparent'}`,
                color: filter === 'all' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: filter === 'all' ? 700 : 500,
              }}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              style={{
                flex: 1,
                padding: '0.3rem',
                fontSize: '0.75rem',
                borderRadius: '6px',
                background: filter === 'unread' ? 'rgba(0,242,254,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filter === 'unread' ? 'var(--accent-cyan)' : 'transparent'}`,
                color: filter === 'unread' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: filter === 'unread' ? 700 : 500,
              }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          {filteredNotifs.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              <Bell size={24} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
              <p style={{ margin: 0 }}>No notifications to display</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
              {filteredNotifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => notificationService.markAsRead(n.id)}
                  style={{
                    background: n.isRead ? 'rgba(0,0,0,0.25)' : 'rgba(0, 242, 254, 0.05)',
                    border: `1px solid ${n.isRead ? 'rgba(255,255,255,0.06)' : getBorderColor(n.type)}`,
                    borderLeft: `3px solid ${n.isRead ? 'rgba(255,255,255,0.15)' : getBorderColor(n.type)}`,
                    borderRadius: '8px',
                    padding: '0.65rem 0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                    <div style={{ marginTop: '2px', flexShrink: 0 }}>
                      {getIcon(n.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {n.title}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {formatTimestamp(n.timestamp)}
                        </span>
                      </div>
                      <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: n.isRead ? 'var(--text-secondary)' : '#f8fafc', fontWeight: n.isRead ? 400 : 500 }}>
                        {n.message}
                      </p>
                      {n.actor && (
                        <div style={{ marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span>Origin:</span>
                          <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{n.actor}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        notificationService.clearNotification(n.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        opacity: 0.6,
                      }}
                      title="Dismiss"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Simulation Trigger Lab (Matches user prompt requirements) */}
          <div style={{ marginTop: '0.9rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.45rem' }}>
              ⚡ Test Canonical Notification Triggers:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => triggerSimulatedNotif(1)}
                className="btn btn-secondary"
                style={{ fontSize: '0.68rem', padding: '0.25rem 0.4rem', justifyContent: 'flex-start' }}
                title="Rahul shared a file with you"
              >
                <span>🔔 File Shared</span>
              </button>
              <button
                type="button"
                onClick={() => triggerSimulatedNotif(2)}
                className="btn btn-secondary"
                style={{ fontSize: '0.68rem', padding: '0.25rem 0.4rem', justifyContent: 'flex-start' }}
                title="Your access to Report.pdf expires tomorrow"
              >
                <span>⏰ Access Expiring</span>
              </button>
              <button
                type="button"
                onClick={() => triggerSimulatedNotif(3)}
                className="btn btn-secondary"
                style={{ fontSize: '0.68rem', padding: '0.25rem 0.4rem', justifyContent: 'flex-start' }}
                title="Your file was downloaded"
              >
                <span>📥 File Downloaded</span>
              </button>
              <button
                type="button"
                onClick={() => triggerSimulatedNotif(4)}
                className="btn btn-secondary"
                style={{ fontSize: '0.68rem', padding: '0.25rem 0.4rem', justifyContent: 'flex-start' }}
                title="Access to Project.pdf was revoked"
              >
                <span>🚫 Access Revoked</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
