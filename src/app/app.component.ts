import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  personCircle, 
  homeOutline, 
  mapOutline, 
  alertCircleOutline, 
  settingsOutline, 
  moon, 
  sunny,
  closeOutline,
  person,
  helpCircleOutline,
  informationCircleOutline,
  menuOutline
} from 'ionicons/icons';
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
  styleUrls: ['app.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    IonApp,
    IonRouterOutlet,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon
  ],
})
export class AppComponent {
  themeService = inject(ThemeService);
  private menuCtrl = inject(MenuController);

  constructor() {
    addIcons({
      'person-circle': personCircle,
      'home-outline': homeOutline,
      'map-outline': mapOutline,
      'alert-circle-outline': alertCircleOutline,
      'settings-outline': settingsOutline,
      'moon': moon,
      'sunny': sunny,
      'close-outline': closeOutline,
      'person': person,
      'help-circle-outline': helpCircleOutline,
      'information-circle-outline': informationCircleOutline,
      'menu-outline': menuOutline
    });
    this.initializeApp();
  }

  initializeApp() {
    // Asegurar que el menú esté habilitado para gestos
    this.menuCtrl.enable(true, 'main-menu');
  }
}
