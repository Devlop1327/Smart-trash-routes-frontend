import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Ajustes</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-list>
        <ion-item>
          <ion-label>Tema Oscuro</ion-label>
          <ion-toggle 
            [checked]="isDark()" 
            (ionChange)="toggleTheme()">
          </ion-toggle>
        </ion-item>

        <ion-item>
          <ion-label>Notificaciones</ion-label>
          <ion-toggle [checked]="true"></ion-toggle>
        </ion-item>

        <ion-item>
          <ion-label>GPS Siempre Activo</ion-label>
          <ion-toggle [checked]="false"></ion-toggle>
        </ion-item>
      </ion-list>

      <ion-list-header>
        <ion-label>Información</ion-label>
      </ion-list-header>

      <ion-list>
        <ion-item>
          <ion-label>Versión</ion-label>
          <ion-note slot="end">1.0.0</ion-note>
        </ion-item>

        <ion-item>
          <ion-label>Desarrollado por</ion-label>
          <ion-note slot="end">STR Team</ion-note>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styles: [`
    ion-content {
      --background: var(--ecox-bg);
    }

    ion-list {
      background: var(--ecox-card);
      margin: 16px;
      border-radius: 12px;
    }

    ion-list-header {
      background: var(--ecox-card);
      margin: 16px 16px 0 16px;
      border-radius: 12px 12px 0 0;
    }

    ion-item {
      --background: transparent;
    }

    ion-note {
      color: var(--ecox-secondary);
    }
  `]
})
export class AjustesPage {
  isDark = this.themeService.isDark;

  constructor(private themeService: ThemeService) {}

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
