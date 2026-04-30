import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { NotificationsService, Notification } from '../../services/notifications.service';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="modal-toolbar">
        <ion-title>Notificaciones</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="modal-content">
      <div class="header-actions" *ngIf="notifications().length > 0">
        <ion-button fill="clear" size="small" (click)="notificationsService.markAllAsRead()">
          Marcar todas como leídas
        </ion-button>
        <ion-button fill="clear" size="small" color="danger" (click)="notificationsService.clearAll()">
          Limpiar historial
        </ion-button>
      </div>

      <div class="empty-state" *ngIf="notifications().length === 0">
        <div class="empty-icon-bg">
          <ion-icon name="notifications-off-outline"></ion-icon>
        </div>
        <h3>No tienes notificaciones</h3>
        <p>Te avisaremos cuando haya novedades en tu ruta de recolección.</p>
      </div>

      <ion-list class="notification-list" lines="none">
        <ion-item-sliding *ngFor="let n of notifications()" class="notification-item-wrapper">
          <ion-item-options side="start">
            <ion-item-option color="primary" (click)="notificationsService.markAsRead(n.id)" *ngIf="!n.read">
              <ion-icon slot="icon-only" name="checkmark-done"></ion-icon>
            </ion-item-option>
          </ion-item-options>

          <ion-item class="notification-item" [class.unread]="!n.read" (click)="notificationsService.markAsRead(n.id)">
            <div class="type-indicator" [class]="n.type"></div>
            <div class="notification-content">
              <div class="notif-header">
                <span class="notif-title">{{ n.title }}</span>
                <span class="notif-time">{{ formatTime(n.timestamp) }}</span>
              </div>
              <p class="notif-message">{{ n.message }}</p>
            </div>
            <div class="unread-dot" *ngIf="!n.read"></div>
          </ion-item>

          <ion-item-options side="end">
            <ion-item-option color="danger" (click)="confirmDelete(n.id)">
              <ion-icon slot="icon-only" name="trash"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
    </ion-content>
  `,
  styles: [`
    .modal-toolbar {
      --background: var(--ion-background-color);
      --padding-top: 10px;
      --padding-bottom: 10px;
      
      ion-title {
        font-weight: 800;
        font-size: 24px;
        letter-spacing: -0.5px;
      }
    }

    .modal-content {
      --background: var(--ion-background-color);
    }

    .header-actions {
      display: flex;
      justify-content: space-between;
      padding: 0 16px;
      margin-top: 8px;
      
      ion-button {
        font-weight: 700;
        font-size: 12px;
        text-transform: none;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 70%;
      padding: 40px;
      text-align: center;

      .empty-icon-bg {
        width: 80px;
        height: 80px;
        background: var(--ion-color-step-100);
        border-radius: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
        
        ion-icon {
          font-size: 40px;
          color: var(--ion-color-step-400);
        }
      }

      h3 {
        font-weight: 700;
        margin-bottom: 8px;
        color: var(--ion-text-color);
      }

      p {
        color: var(--ion-color-step-500);
        font-size: 14px;
        line-height: 1.5;
      }
    }

    .notification-list {
      background: transparent;
      padding: 12px;
    }

    .notification-item-wrapper {
      margin-bottom: 12px;
      border-radius: 16px;
      overflow: hidden;
    }

    .notification-item {
      --background: var(--ion-color-step-50);
      --padding-start: 16px;
      --inner-padding-end: 16px;
      --min-height: 80px;
      border-radius: 16px;
      border: 1px solid var(--ion-color-step-100);

      &.unread {
        --background: var(--ion-background-color);
        border-color: var(--ion-color-primary-tint, #006d5b33);
        box-shadow: 0 4px 12px rgba(0, 109, 91, 0.05);

        .notif-title {
          font-weight: 800;
        }
      }
    }

    .type-indicator {
      width: 4px;
      height: 40px;
      border-radius: 2px;
      margin-right: 16px;
      
      &.info { background: #3b82f6; }
      &.success { background: #10b981; }
      &.warning { background: #f59e0b; }
      &.alert { background: #ef4444; }
    }

    .notification-content {
      width: 100%;
      padding: 12px 0;
    }

    .notif-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .notif-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--ion-text-color);
    }

    .notif-time {
      font-size: 11px;
      color: var(--ion-color-step-500);
      font-weight: 500;
    }

    .notif-message {
      font-size: 13px;
      color: var(--ion-color-step-600);
      margin: 0;
      line-height: 1.4;
    }

    .unread-dot {
      width: 8px;
      height: 8px;
      background: #006d5b;
      border-radius: 50%;
      margin-left: 8px;
    }
  `]
})
export class NotificationCenterComponent {
  notificationsService = inject(NotificationsService);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);

  notifications = this.notificationsService.allNotifications;

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async confirmDelete(id: string) {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar notificación?',
      message: 'Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.notificationsService.deleteNotification(id);
          }
        }
      ]
    });
    await alert.present();
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Ahora';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
    return date.toLocaleDateString();
  }
}
