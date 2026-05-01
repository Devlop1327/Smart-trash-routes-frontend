import { Component, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import { closeOutline, notificationsOffOutline, trashOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss'],
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
