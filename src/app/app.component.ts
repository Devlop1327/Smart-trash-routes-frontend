import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp,
  IonRouterOutlet,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonToggle,
  MenuController
} from '@ionic/angular/standalone';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [
    RouterLink,
    IonApp,
    IonRouterOutlet,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonToggle
  ],
})
export class AppComponent {
  themeService = inject(ThemeService);
  private menuCtrl = inject(MenuController);

  constructor() {
    this.initializeApp();
  }

  initializeApp() {
    // Asegurar que el menú esté habilitado para gestos
    this.menuCtrl.enable(true, 'main-menu');
  }
}
