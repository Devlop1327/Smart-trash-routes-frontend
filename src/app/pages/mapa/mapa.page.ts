import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MapaNavigatorComponent } from '../../components/mapa-navigator/mapa-navigator.component';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, IonicModule, MapaNavigatorComponent],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-buttons slot="end">
        </ion-buttons>
        <ion-title>Mapa de Rutas</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <app-mapa-navigator></app-mapa-navigator>
    </ion-content>
  `
})
export class MapaPage {}
