import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, MenuController, ViewWillEnter } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { MapaNavigatorComponent } from '../../components/mapa-navigator/mapa-navigator.component';
import { MapaService } from '../../services/mapa.service';
import { ModalController } from '@ionic/angular/standalone';
import { LiveVehiclesModalComponent } from '../../components/live-vehicles-modal/live-vehicles-modal.component';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, IonicModule, MapaNavigatorComponent, FormsModule],
  templateUrl: './mapa.page.html',
  styleUrls: ['./mapa.page.scss'],
})
export class MapaPage implements ViewWillEnter {
  private mapaService = inject(MapaService);
  private menuCtrl = inject(MenuController);
  private modalCtrl = inject(ModalController);
  
  posicionUsuario = this.mapaService.posicionUsuarioSignal;
  rutasAdmin = this.mapaService.rutasAdminSignal;
  rutaSeleccionada = this.mapaService.rutaAdminSeleccionadaSignal;
  
  mostrarSelectorRutas = signal(false);
  searchTerm = signal('');
  today = new Date();

  // Seguimiento en vivo
  trackingStatus = this.mapaService.trackingStatus;
  trackingCount = this.mapaService.trackingCount;
  asignacionesActivas = this.mapaService.asignacionesActivas;

  ionViewWillEnter() {
    this.menuCtrl.enable(true, 'main-menu');
  }

  rutasFiltradas = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const routes = this.rutasAdmin();
    const activeAsigs = this.asignacionesActivas();
    
    // Crear un Set de IDs de rutas activas para búsqueda rápida
    const activeRouteIds = new Set(activeAsigs.map(a => a.id_ruta));

    const filtered = term 
      ? routes.filter(r => r.nombre_ruta.toLowerCase().includes(term))
      : routes;

    // Retornar las rutas con el estado 'isLive' inyectado
    return filtered.map(r => ({
      ...r,
      isLive: activeRouteIds.has(r.id_ruta)
    }));
  });

  toggleSelectorRutas() {
    this.mostrarSelectorRutas.update(v => !v);
  }

  openMenu() {
    this.menuCtrl.open('main-menu');
  }

  seleccionarRuta(ruta: any) {
    this.mapaService.seleccionarRutaAdmin(ruta);
    
    // Si la ruta está en vivo, enfocar automáticamente el camión
    if (ruta && ruta.isLive) {
      setTimeout(() => {
        this.mapaService.enfocarCamionPorRuta(ruta.id_ruta);
      }, 300);
    }
  }

  centrarEnUsuario() {
    this.mapaService.obtenerPosicionActual();
  }

  async abrirModalVehiculos() {
    const modal = await this.modalCtrl.create({
      component: LiveVehiclesModalComponent,
      componentProps: {
        assignments: this.asignacionesActivas()
      },
      breakpoints: [0, 0.5, 0.8],
      initialBreakpoint: 0.5,
      handle: true,
      cssClass: 'premium-modal'
    });
    
    await modal.present();
    
    const { data } = await modal.onDidDismiss();
    if (data) {
      // El modal ya maneja la navegación si es necesario
      console.log('Enfocando camión desde modal:', data.id_asignacion);
    }
  }
}
