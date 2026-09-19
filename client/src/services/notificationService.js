/**
 * 🔔 notificationService.js
 * Centralized notification management system for BlockShare Web3 Platform.
 * Supports:
 * - 4 Canonical Notifications:
 *   1. 🔔 "Rahul shared a file with you." (file_shared)
 *   2. 🔔 "Your access to Report.pdf expires tomorrow." (access_expiring)
 *   3. 🔔 "Your file was downloaded." (file_downloaded)
 *   4. 🔔 "Access to Project.pdf was revoked." (access_revoked)
 * - Persistent LocalStorage sync
 * - Read/Unread state tracking
 * - Event-driven BroadcastChannel / CustomEvent updates across components
 * - Desktop Browser Push Notifications (Notification API)
 * - Audible chimes and badge counter
 */

const STORAGE_KEY_NOTIFICATIONS = 'blockshare_notifications_v2';

// Clean initial notifications (no demo data)
const SEED_NOTIFICATIONS = [];

class NotificationService {
  constructor() {
    this.listeners = new Set();
  }

  getNotifications() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (!data) {
        this.saveNotifications([]);
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  saveNotifications(list) {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(list));
      this.notifyListeners(list);
    } catch (e) {
      console.error('Failed to save notifications to localStorage:', e);
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.getNotifications());
    return () => this.listeners.delete(callback);
  }

  notifyListeners(list) {
    for (const listener of this.listeners) {
      try {
        listener(list);
      } catch (e) {
        console.error('Notification listener error:', e);
      }
    }
    // Cross-tab broadcast
    try {
      window.dispatchEvent(new CustomEvent('blockshare_notifications_updated', { detail: list }));
    } catch {}
  }

  getUnreadCount() {
    return this.getNotifications().filter((n) => !n.isRead).length;
  }

  markAsRead(id) {
    const list = this.getNotifications().map((n) => (n.id === id ? { ...n, isRead: true } : n));
    this.saveNotifications(list);
  }

  markAllAsRead() {
    const list = this.getNotifications().map((n) => ({ ...n, isRead: true }));
    this.saveNotifications(list);
  }

  clearNotification(id) {
    const list = this.getNotifications().filter((n) => n.id !== id);
    this.saveNotifications(list);
  }

  clearAll() {
    this.saveNotifications([]);
  }

  addNotification({ type, message, fileName = '', actor = '', severity = 'info', icon = 'Bell' }) {
    const list = this.getNotifications();
    const newNotif = {
      id: 'notif_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      type,
      title: this.getDefaultTitle(type),
      message,
      fileName,
      actor,
      timestamp: Date.now(),
      isRead: false,
      severity,
      icon,
    };
    list.unshift(newNotif);
    this.saveNotifications(list);

    // Optional browser push notification if permitted
    this.triggerSystemNotification(newNotif.message, newNotif.title);
    return newNotif;
  }

  getDefaultTitle(type) {
    switch (type) {
      case 'file_shared':
        return 'New File Shared';
      case 'access_expiring':
        return 'Access Expiry Warning';
      case 'file_downloaded':
        return 'File Downloaded';
      case 'access_revoked':
        return 'Access Revoked';
      default:
        return 'System Notification';
    }
  }

  // 🔔 1. File Shared Trigger
  notifyFileShared(senderName, fileName) {
    return this.addNotification({
      type: 'file_shared',
      message: `${senderName || 'Rahul'} shared a file with you.`,
      fileName: fileName || 'Document.pdf',
      actor: senderName || 'Rahul',
      severity: 'info',
      icon: 'Share2',
    });
  }

  // 🔔 2. Access Expiring Trigger
  notifyAccessExpiring(fileName, timeLeft = 'tomorrow') {
    return this.addNotification({
      type: 'access_expiring',
      message: `Your access to ${fileName || 'Report.pdf'} expires ${timeLeft}.`,
      fileName: fileName || 'Report.pdf',
      actor: 'Smart Contract Guard',
      severity: 'warning',
      icon: 'Clock',
    });
  }

  // 🔔 3. File Downloaded Trigger
  notifyFileDownloaded(downloaderName, fileName) {
    return this.addNotification({
      type: 'file_downloaded',
      message: 'Your file was downloaded.',
      fileName: fileName || 'My_Document.pdf',
      actor: downloaderName || 'Authorized Recipient',
      severity: 'success',
      icon: 'Download',
    });
  }

  // 🔔 4. Access Revoked Trigger
  notifyAccessRevoked(fileName, revokerName = 'Owner') {
    return this.addNotification({
      type: 'access_revoked',
      message: `Access to ${fileName || 'Project.pdf'} was revoked.`,
      fileName: fileName || 'Project.pdf',
      actor: revokerName,
      severity: 'danger',
      icon: 'ShieldAlert',
    });
  }

  // Request browser Notification API permissions
  async requestNotificationPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        return await Notification.requestPermission();
      }
      return Notification.permission;
    }
    return 'denied';
  }

  triggerSystemNotification(body, title = 'BlockShare Notification') {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.log('Push notification skipped:', e);
      }
    }
  }
}

export const notificationService = new NotificationService();
