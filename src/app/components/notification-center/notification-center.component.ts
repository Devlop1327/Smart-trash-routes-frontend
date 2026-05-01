import { Component, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import { closeOutline, notificationsOffOutline, trashOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { NotificationsService, Notification } from '../../services/notifications.service';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="modal-wrapper-std">
      <header class="modal-header-std">
        <div class="header-inner">
          <h2 class="modal-title-std">Notificaciones</h2>
          <button class="close-btn-std" (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>
      </header>

      <div class="modal-body-std">
        <div class="header-actions" *ngIf="notifications().length > 0">
          <button class="action-link-std" (click)="notificationsService.markAllAsRead()">
            Marcar todas como leídas
          </button>
          <button class="action-link-std color-danger" (click)="notificationsService.clearAll()">
            Limpiar historial
          </button>
        </div>

        <div class="empty-state" *ngIf="notifications().length === 0">
          <div class="empty-icon-bg">
            <ion-icon name="notifications-off-outline"></ion-icon>
          </div>
          <h3>No tienes notificaciones</h3>
          <p>Te avisaremos cuando haya novedades en tu ruta de recolección.</p>
        </div>

        <div class="notification-list-std">
          <div *ngFor="let n of notifications()" 
               class="notif-card-std" 
               [class.is-unread]="!n.read"
               (click)="notificationsService.markAsRead(n.id)">
            <div class="notif-accent" [class]="n.type"></div>
            <div class="notif-content-std">
              <div class="notif-header-std">
                <span class="notif-title-std">{{ n.title }}</span>
                <span class="notif-time-std">{{ formatTime(n.timestamp) }}</span>
              </div>
              <p class="notif-msg-std">{{ n.message }}</p>
            </div>
            <div class="notif-actions-std">
              <button class="delete-btn-std" (click)="confirmDelete(n.id); $event.stopPropagation()">
                <ion-icon name="trash-outline"></ion-icon>
              </button>
            </div>
            <div class="unread-mark" *ngIf="!n.read"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-wrapper-std {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
    }

    .modal-header-std {
      background: white;
      padding: 20px;
      border-bottom: 1px solid #e2e8f0;

      .header-inner {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-title-std {
        margin: 0;
        font-size: 22px;
        font-weight: 800;
        color: #1e293b;
      }

      .close-btn-std {
        background: #f1f5f9;
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        ion-icon { font-size: 20px; color: #64748b; }
      }
    }

    .modal-body-std {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .header-actions {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
      padding: 0 4px;

      .action-link-std {
        background: none;
        border: none;
        font-size: 13px;
        font-weight: 700;
        color: #059669;
        padding: 4px;
        
        &.color-danger { color: #ef4444; }
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60%;
      text-align: center;
      
      .empty-icon-bg {
        width: 72px;
        height: 72px;
        background: #f1f5f9;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        ion-icon { font-size: 32px; color: #cbd5e1; }
      }

      h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #1e293b; }
      p { font-size: 14px; color: #64748b; margin: 0; line-height: 1.5; }
    }

    .notification-list-std {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .notif-card-std {
      background: white;
      border-radius: 16px;
      padding: 16px;
      display: flex;
      gap: 16px;
      border: 1px solid #e2e8f0;
      position: relative;
      transition: all 0.2s ease;

      &.is-unread {
        border-color: #d1fae5;
        background: #f0fdf4;
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.05);
      }

      &:active { transform: scale(0.98); }
    }

    .notif-accent {
      width: 4px;
      height: 40px;
      border-radius: 2px;
      flex-shrink: 0;
      &.info { background: #3b82f6; }
      &.success { background: #10b981; }
      &.warning { background: #f59e0b; }
      &.alert { background: #ef4444; }
    }

    .notif-content-std {
      flex: 1;
    }

    .notif-header-std {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;

      .notif-title-std { font-size: 15px; font-weight: 700; color: #1e293b; }
      .notif-time-std { font-size: 11px; color: #94a3b8; font-weight: 600; }
    }

    .notif-msg-std { font-size: 13px; color: #64748b; margin: 0; line-height: 1.4; }

    .notif-actions-std {
      display: flex;
      align-items: flex-start;
    }

    .delete-btn-std {
      background: none;
      border: none;
      padding: 4px;
      ion-icon { font-size: 18px; color: #cbd5e1; }
      &:active ion-icon { color: #ef4444; }
    }

    .unread-mark {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 8px;
      height: 8px;
      background: #059669;
      border-radius: 50%;
    }

    :host-context(.dark) .modal-wrapper-std,
    :host-context([data-theme='dark']) .modal-wrapper-std {
      background: linear-gradient(to bottom, #083d6a 0%, #2e6ea5 100%);
      
      .modal-header-std { 
        background: transparent; 
        border-color: rgba(255, 255, 255, 0.1); 
        .modal-title-std { color: white; } 
        .close-btn-std { background: rgba(255, 255, 255, 0.1); ion-icon { color: white; } } 
      }
      
      .notif-card-std { 
        background: rgba(255, 255, 255, 0.05); 
        backdrop-filter: blur(10px); 
        border-color: rgba(255, 255, 255, 0.1); 
        .notif-title-std { color: white; } 
        .notif-msg-std { color: rgba(255, 255, 255, 0.7); } 
      }
      
      .notif-card-std.is-unread { 
        background: rgba(16, 185, 129, 0.15); 
        border-color: rgba(16, 185, 129, 0.3); 
      }

      .empty-state {
        .empty-icon-bg { background: rgba(255, 255, 255, 0.1); ion-icon { color: white; } }
        h3 { color: white; }
        p { color: rgba(255, 255, 255, 0.6); }
      }

      .action-link-std { color: #34d399; &.color-danger { color: #f87171; } }
    }
  `]
})
export class NotificationCenterComponent {
  notificationsService = inject(NotificationsService);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);

  notifications = this.notificationsService.allNotifications;

  constructor() {
    addIcons({ closeOutline, notificationsOffOutline, trashOutline });
  }

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
