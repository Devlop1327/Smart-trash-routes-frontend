import { Component, Input, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Ruta } from '../../services/rutas.service';
import { addIcons } from 'ionicons';
import { searchOutline, closeOutline, mapOutline, chevronForwardOutline, checkmarkCircle } from 'ionicons/icons';

@Component({
  selector: 'app-route-selector',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './route-selector.component.html',
  styleUrls: ['./route-selector.component.scss'],
})
export class RouteSelectorComponent implements OnInit {
  @Input() routes: Ruta[] = [];
  @Input() selectedRutaId: string | null = null;

  private modalCtrl = inject(ModalController);
  searchText = signal('');

  constructor() {
    addIcons({ searchOutline, closeOutline, mapOutline, chevronForwardOutline, checkmarkCircle });
  }

  ngOnInit() {}

  filteredRoutes = computed(() => {
    const term = this.searchText().toLowerCase().trim();
    if (!term) return this.routes;
    return this.routes.filter(r => r.nombre_ruta.toLowerCase().includes(term));
  });

  cancelar() {
    this.modalCtrl.dismiss();
  }

  seleccionar(ruta: Ruta) {
    this.modalCtrl.dismiss(ruta);
  }
}
