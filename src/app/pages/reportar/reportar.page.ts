import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReporteResiduoComponent } from '../../components/reporte-residuo/reporte-residuo.component';

@Component({
  selector: 'app-reportar',
  standalone: true,
  imports: [CommonModule, IonicModule, ReporteResiduoComponent],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Reportar Residuo</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <app-reporte-residuo></app-reporte-residuo>
    </ion-content>
  `
})
export class ReportarPage {}
