import { Injectable, signal, computed } from '@angular/core';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'alert';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private notificationsList = signal<Notification[]>([]);

  // Notificaciones no leídas
  unreadCount = computed(() => 
    this.notificationsList().filter(n => !n.read).length
  );

  // Lista completa de notificaciones
  allNotifications = computed(() => this.notificationsList());

  constructor() {
    this.loadFromStorage();
  }

  addNotification(title: string, message: string, type: Notification['type'] = 'info') {
    const newNotification: Notification = {
      id: Date.now().toString(),
      title,
      message,
      timestamp: new Date(),
      read: false,
      type
    };

    this.notificationsList.update(prev => [newNotification, ...prev]);
    this.saveToStorage();
  }

  markAsRead(id: string) {
    this.notificationsList.update(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    this.saveToStorage();
  }

  markAllAsRead() {
    this.notificationsList.update(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    this.saveToStorage();
  }

  deleteNotification(id: string) {
    this.notificationsList.update(prev => 
      prev.filter(n => n.id !== id)
    );
    this.saveToStorage();
  }

  clearAll() {
    this.notificationsList.set([]);
    this.saveToStorage();
  }

  private saveToStorage() {
    localStorage.setItem('smart_trash_notifications', JSON.stringify(this.notificationsList()));
  }

  private loadFromStorage() {
    const stored = localStorage.getItem('smart_trash_notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convertir strings de fecha a objetos Date
        const formatted = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        this.notificationsList.set(formatted);
      } catch (e) {
        console.error('Error loading notifications', e);
      }
    }
  }
}
