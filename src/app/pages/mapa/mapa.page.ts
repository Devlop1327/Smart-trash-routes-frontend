import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, MenuController, ViewWillEnter } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { MapaNavigatorComponent } from '../../components/mapa-navigator/mapa-navigator.component';
import { MapaService } from '../../services/mapa.service';

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
  
  posicionUsuario = this.mapaService.posicionUsuarioSignal;
  rutasAdmin = this.mapaService.rutasAdminSignal;
  rutaSeleccionada = this.mapaService.rutaAdminSeleccionadaSignal;
  
  mostrarSelectorRutas = signal(false);
  searchTerm = signal('');

  ionViewWillEnter() {
    this.menuCtrl.enable(true, 'main-menu');
  }

  rutasFiltradas = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const routes = this.rutasAdmin();
    if (!term) return routes;
    return routes.filter(r => 
      r.nombre_ruta.toLowerCase().includes(term)
    );
  });

  toggleSelectorRutas() {
    this.mostrarSelectorRutas.update(v => !v);
  }

  openMenu() {
    this.menuCtrl.open('main-menu');
  }

  seleccionarRuta(ruta: any) {
    this.mapaService.seleccionarRutaAdmin(ruta);
  }

  centrarEnUsuario() {
    this.mapaService.obtenerPosicionActual();
  }
}
