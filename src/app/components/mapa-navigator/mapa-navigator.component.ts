import { Component, OnInit, AfterViewInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { interval, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MapaService, PuntoRecogida, RutaUsuario } from '../../services/mapa.service';
import { RutasService, Ruta } from '../../services/rutas.service';

// Iconos SVG inline
const ICON_ROUTE = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="m9 9 2 2 4-4"/></svg>`;
const ICON_CLOSE = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
const ICON_REFRESH = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>`;
const ICON_VISIBILITY = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;

@Component({
  selector: 'app-mapa-navigator',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './mapa-navigator.component.html',
  styleUrls: ['./mapa-navigator.component.scss']
})
export class MapaNavigatorComponent implements OnInit, AfterViewInit, OnDestroy {
  private mapaService = inject(MapaService);
  private rutasService = inject(RutasService);
  private route = inject(ActivatedRoute);

  puntosRecogida = this.mapaService.puntosRecogidaSignal;
  rutaActual = this.mapaService.rutaActualSignal;
  posicionUsuario = this.mapaService.posicionUsuarioSignal;
  rutasAdmin = this.mapaService.rutasAdminSignal;
  rutaSeleccionada = this.mapaService.rutaAdminSeleccionadaSignal;

  // UI  State
  mostrarSelectorRutas = signal(false);
  cargandoRutas = signal(false);
  ultimaActualizacion = signal<string>('');
  rutaIdFromQuery = signal<string | null>(null);

  // Iconos
  ICON_ROUTE = ICON_ROUTE;
  ICON_CLOSE = ICON_CLOSE;
  ICON_REFRESH = ICON_REFRESH;
  ICON_VISIBILITY = ICON_VISIBILITY;

  toggleSelectorRutas() {
    this.mostrarSelectorRutas.update(v => !v);
  }

  private pollingSubscription: Subscription | null = null;

  ngOnInit() {
    // Leer query params para ver si viene una ruta específica
    this.route.queryParams.subscribe(params => {
      if (params['rutaId']) {
        this.rutaIdFromQuery.set(params['rutaId']);
        console.log('📍 Ruta seleccionada desde URL:', params['rutaId']);
      }
    });

    // Cargar rutas del admin al iniciar (con cache si existe)
    this.cargarRutasAdmin(false);

    // Polling automático cada 2 minutos - usa cache si no ha cambiado
    this.pollingSubscription = interval(120000).subscribe(() => {
      console.log('🔄 Polling automático (usará cache si está fresco)');
      this.cargarRutasAdmin(false);
    });
  }

  ngOnDestroy() {
    // Limpiar el polling al destruir el componente
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.mapaService.inicializarMapa('mapa');
  }

  tiempoEstimado(): string {
    const duracion = this.rutaActual()?.duracion;
    return duracion ? Math.round(duracion).toString() : 'N/A';
  }

  seleccionarPunto(punto: PuntoRecogida) {
    this.mapaService.calcularRutaHaciaPunto(punto);
  }

  limpiarRuta() {
    this.mapaService.limpiarRuta();
  }

  // ==================== RUTAS DEL ADMIN ====================

  cargarRutasAdmin(forceRefresh = false) {
    this.cargandoRutas.set(true);

    // Si hay un rutaId en los query params, obtener esa ruta específica
    const rutaId = this.rutaIdFromQuery();
    if (rutaId && !forceRefresh) {
      this.rutasService.obtenerRuta(rutaId).subscribe({
        next: (ruta) => {
          console.log('✅ Ruta específica cargada:', ruta.nombre_ruta);
          // Agregar a la lista de rutas y seleccionarla
          this.mapaService.cargarRutasAdmin(false);
          // Esperar a que las rutas se carguen y luego seleccionar
          setTimeout(() => {
            this.seleccionarRutaAdmin(ruta);
            this.cargandoRutas.set(false);
          }, 500);
        },
        error: (err) => {
          console.error('❌ Error cargando ruta específica:', err);
          // Fallback: cargar todas las rutas
          this.mapaService.cargarRutasAdmin(forceRefresh);
          setTimeout(() => {
            this.cargandoRutas.set(false);
          }, 300);
        }
      });
      return;
    }

    this.mapaService.cargarRutasAdmin(forceRefresh);
    // Registrar hora de actualización
    const hora = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    // Tiempo mínimo para feedback visual
    setTimeout(() => {
      this.cargandoRutas.set(false);
      this.ultimaActualizacion.set(`Actualizado: ${hora}`);
    }, 300);
  }

  seleccionarRutaAdmin(ruta: Ruta) {
    this.mapaService.seleccionarRutaAdmin(ruta);
    // Mostrar el selector de rutas cuando se selecciona una
    this.mostrarSelectorRutas.set(true);
  }
}
