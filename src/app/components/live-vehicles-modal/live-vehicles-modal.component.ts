import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, bus, mapOutline, busOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { MapaService } from '../../services/mapa.service';

@Component({
  selector: 'app-live-vehicles-modal',
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent],
  templateUrl: './live-vehicles-modal.component.html',
  styleUrls: ['./live-vehicles-modal.component.scss']
})
export class LiveVehiclesModalComponent {
  @Input() assignments: any[] = [];

  private modalCtrl = inject(ModalController);
  private router = inject(Router);
  private mapaService = inject(MapaService);

  constructor() {
    addIcons({ closeOutline, bus, mapOutline, busOutline });
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  verEnMapa(asig: any) {
    this.modalCtrl.dismiss(asig);
    
    // Navegar al mapa
    this.router.navigate(['/mapa']);
    
    // Dar tiempo a que cargue el mapa y enfocar el camión
    setTimeout(() => {
      this.mapaService.enfocarCamion(asig.id_asignacion);
    }, 800);
  }
}
