import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { AlertController, ActionSheetController, ModalController, MenuController, IonIcon, IonMenuButton } from '@ionic/angular/standalone';
import { RouterLink, Router } from '@angular/router';
import { RutasService, Ruta } from '../../services/rutas.service';
import { NotificationsService } from '../../services/notifications.service';
import { NotificationCenterComponent } from '../../components/notification-center/notification-center.component';
import { RouteSelectorComponent } from '../../components/route-selector/route-selector.component';
import { LiveVehiclesModalComponent } from '../../components/live-vehicles-modal/live-vehicles-modal.component';
import { MapaService } from '../../services/mapa.service';
import { HttpClientModule } from '@angular/common/http';
import { 
  menuOutline, 
  notificationsOutline, 
  map, 
  navigate, 
  bus, 
  chevronForwardOutline, 
  radioButtonOnOutline, 
  busOutline,
  homeOutline,
  alertCircleOutline,
  settingsOutline,
  moon,
  sunny,
  closeOutline,
  person,
  timeOutline
} from 'ionicons/icons';

interface EstadoRecoleccion {
  estado: 'en_camino' | 'completado' | 'pendiente';
  tiempoEstimado: number;
  horaLlegada: string;
  distancia: string;
  nombreRuta: string;
}

interface DiaCalendario {
  nombre: string;
  fecha: number;
  estado: 'collected' | 'pending' | 'scheduled' | 'no-service';
  esHoy: boolean;
  esFinDeSemana: boolean;
  seleccionado?: boolean;
  nota?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, IonIcon, IonMenuButton, RouterLink, HttpClientModule],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private rutasService = inject(RutasService);
  private alertController = inject(AlertController);
  private actionSheetController = inject(ActionSheetController);
  private modalController = inject(ModalController);
  private menuCtrl = inject(MenuController);
  public notificationsService = inject(NotificationsService);
  private mapaService = inject(MapaService);
  private pollInterval: any;

  public liveTrackingCount = this.mapaService.trackingCount;

  constructor() {
    addIcons({
      menuOutline,
      notificationsOutline,
      map,
      navigate,
      bus,
      'chevron-forward-outline': chevronForwardOutline,
      'radio-button-on-outline': radioButtonOnOutline,
      'bus-outline': busOutline,
      timeOutline
    });
  }

  abrirMenu() {
    this.menuCtrl.open('main-menu');
  }

  // Signals para datos reactivos
  rutas = signal<Ruta[]>([]);
  cargandoRutas = signal<boolean>(true);
  activeAssignments = signal<any[]>([]);
  activeVehiclesCount = computed(() => this.activeAssignments().length);
  rutaSeleccionadaUsuario = signal<Ruta | null>(null);

  infoRutaSeleccionada = computed(() => {
    const ruta = this.rutaSeleccionadaUsuario();
    const assignments = this.activeAssignments();
    const truckPositions = this.mapaService.camionesPositions();
    const userPos = this.mapaService.posicionUsuarioSignal();

    if (!ruta) {
      return {
        seleccionada: false,
        activa: false,
        nombre: 'Sin selección',
        mensaje: 'Selecciona una ruta para ver su estado'
      };
    }

    // Buscar si esta ruta específica tiene una asignación activa
    // Usamos == para permitir comparaciones entre string y number si fuera el caso
    const asigActiva = assignments.find((asig: any) => 
      asig.id_ruta == ruta.id_ruta || 
      asig.ruta?.id_ruta == ruta.id_ruta
    );
    
    if (!asigActiva) {
      return {
        seleccionada: true,
        activa: false,
        nombre: ruta.nombre_ruta,
        mensaje: 'Este vehículo no está en circulación'
      };
    }

    // Si hay asignación pero no tenemos GPS aún
    if (!truckPositions.has(asigActiva.id_asignacion) || !userPos) {
      return {
        seleccionada: true,
        activa: false, // Lo marcamos como no activa para el estilo, pero con mensaje diferente
        nombre: ruta.nombre_ruta,
        mensaje: 'En circulación (Buscando señal GPS...)'
      };
    }

    // Calcular datos reales si está activa y tiene GPS
    const truckPos = truckPositions.get(asigActiva.id_asignacion)!;
    const distKm = this.calcularDistancia(userPos, truckPos);
    
    const tiempoMin = Math.max(1, Math.round((distKm / 25) * 60));
    const ahora = new Date();
    const llegada = new Date(ahora.getTime() + tiempoMin * 60000);

    return {
      seleccionada: true,
      activa: true,
      nombre: ruta.nombre_ruta,
      mensaje: '', 
      distancia: distKm < 1 ? `A ${Math.round(distKm * 1000)} metros` : `A ${distKm.toFixed(1)} km`,
      tiempo: tiempoMin,
      horaLlegada: llegada.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    };
  });

  rutaEnProgreso = computed(() => {
    const assignments = this.activeAssignments();
    const userPos = this.mapaService.posicionUsuarioSignal();
    const truckPositions = this.mapaService.camionesPositions();

    if (!userPos || assignments.length === 0) return null;

    // Filtrar asignaciones que tengan una posición de GPS conocida
    const activeWithPos = assignments.filter((asig: any) => truckPositions.has(asig.id_asignacion));
    
    if (activeWithPos.length === 0) return null;

    // Encontrar la más cercana al usuario
    let closestAsig = activeWithPos[0];
    let minDistance = Infinity;

    activeWithPos.forEach((asig: any) => {
      const truckPos = truckPositions.get(asig.id_asignacion)!;
      const dist = this.calcularDistancia(userPos, truckPos);
      if (dist < minDistance) {
        minDistance = dist;
        closestAsig = asig;
      }
    });

    const truckPos = truckPositions.get(closestAsig.id_asignacion)!;
    const distKm = this.calcularDistancia(userPos, truckPos);
    
    // Estimación simple: 25km/h promedio considerando paradas
    const tiempoMin = Math.max(1, Math.round((distKm / 25) * 60)); 
    
    const ahora = new Date();
    const llegada = new Date(ahora.getTime() + tiempoMin * 60000);

    return {
      estado: 'en_camino',
      tiempoEstimado: tiempoMin,
      horaLlegada: llegada.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      distancia: distKm < 1 ? `A ${Math.round(distKm * 1000)} metros` : `A ${distKm.toFixed(1)} km`,
      nombreRuta: closestAsig.ruta?.nombre_ruta || 'Ruta activa'
    } as EstadoRecoleccion;
  });

  // Calendario semanal
  diasSemana: DiaCalendario[] = [];

  ngOnInit() {
    this.cargarDatos();
    this.generarCalendario();
    this.cargarNotas();
    
    // Notificación de bienvenida si no hay ninguna
    if (this.notificationsService.unreadCount() === 0) {
      this.notificationsService.addNotification(
        '¡Bienvenido!',
        'Gracias por usar Smart Trash Routes. Aquí recibirás avisos sobre tu servicio.',
        'info'
      );
    }

    // Iniciar polling cada 10 segundos
    this.pollInterval = setInterval(() => {
      this.actualizarAsignacionesActivas();
    }, 10000);
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  cargarDatos() {
    // Cargar rutas del backend
    this.rutasService.listarRutas().subscribe({
      next: (rutas) => {
        this.rutas.set(rutas);
        this.cargandoRutas.set(false);
      },
      error: (err) => {
        console.error('Error cargando rutas:', err);
        this.cargandoRutas.set(false);
      }
    });

    this.actualizarAsignacionesActivas();
  }

  actualizarAsignacionesActivas() {
    this.rutasService.obtenerAsignacionesActivas().subscribe({
      next: (asignaciones) => {
        this.activeAssignments.set(asignaciones);
      },
      error: (err) => console.error('Error cargando asignaciones activas:', err)
    });
  }

  private calcularDistancia(p1: [number, number], p2: [number, number]): number {
    const R = 6371; // Radio Tierra km
    const dLat = (p2[1] - p1[1]) * Math.PI / 180;
    const dLon = (p2[0] - p1[0]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(p1[1] * Math.PI / 180) * Math.cos(p2[1] * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private generarCalendario() {
    const hoy = new Date();
    const diasSemanaNombres = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const dias: DiaCalendario[] = [];

    // Generar 7 días empezando desde el lunes de esta semana
    const diaActual = hoy.getDay(); // 0 = domingo, 1 = lunes, etc.
    const lunesOffset = diaActual === 0 ? -6 : 1; // Ajustar para que empiece en lunes

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - (diaActual === 0 ? 6 : diaActual - 1) + i);

      const esHoy = i === (diaActual === 0 ? 6 : diaActual - 1);
      const diaSemana = fecha.getDay();
      const esFinDeSemana = diaSemana === 0 || diaSemana === 6;

      // Determinar estado basado en la posición relativa a hoy
      let estado: 'collected' | 'pending' | 'scheduled' | 'no-service';
      if (esFinDeSemana) {
        estado = 'no-service';
      } else if (esHoy) {
        estado = 'pending';
      } else if (fecha < hoy) {
        estado = 'collected';
      } else {
        estado = 'scheduled';
      }

      dias.push({
        nombre: diasSemanaNombres[diaSemana],
        fecha: fecha.getDate(),
        estado,
        esHoy,
        esFinDeSemana
      });
    }

    this.diasSemana = dias;
  }

  private guardarNotas() {
    const notas: {[key: string]: string} = {};
    this.diasSemana.forEach(dia => {
      if (dia.nota) {
        notas[`${dia.nombre}-${dia.fecha}`] = dia.nota;
      }
    });
    localStorage.setItem('smart_trash_notas', JSON.stringify(notas));
  }

  private cargarNotas() {
    const notasStr = localStorage.getItem('smart_trash_notas');
    if (notasStr) {
      const notas = JSON.parse(notasStr);
      this.diasSemana.forEach(dia => {
        const key = `${dia.nombre}-${dia.fecha}`;
        if (notas[key]) {
          dia.nota = notas[key];
        }
      });
    }
  }

  // Helper para obtener el color de fondo del ícono
  getIconBackground(colorHex: string | undefined): string {
    return colorHex || '#006d5b';
  }

  async seleccionarDia(dia: DiaCalendario) {
    console.log('Día seleccionado:', dia);
    this.diasSemana.forEach(d => d.seleccionado = false);
    dia.seleccionado = true;

    let estadoMensaje = '';
    switch(dia.estado) {
      case 'collected': estadoMensaje = 'La recolección ya se realizó este día.'; break;
      case 'pending': estadoMensaje = 'La recolección está programada para hoy.'; break;
      case 'scheduled': estadoMensaje = 'Recolección programada para este día.'; break;
      case 'no-service': estadoMensaje = 'No hay servicio programado para este día.'; break;
    }

    const alert = await this.alertController.create({
      header: `Día ${dia.nombre} ${dia.fecha}`,
      subHeader: estadoMensaje,
      inputs: [
        {
          name: 'nota',
          type: 'textarea',
          placeholder: 'Escribe una nota aquí...',
          value: dia.nota || ''
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: (data) => {
            dia.nota = data.nota;
            this.guardarNotas();
          }
        }
      ],
      cssClass: 'modern-alert'
    });

    await alert.present();
  }

  async seleccionarRuta() {
    const modal = await this.modalController.create({
      component: RouteSelectorComponent,
      componentProps: {
        routes: this.rutas(),
        selectedRutaId: null,
        activeAssignments: this.activeAssignments()
      },
      cssClass: 'premium-modal',
      initialBreakpoint: 0.8,
      breakpoints: [0, 0.5, 0.8, 1.0],
      handle: true
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    
    if (data) {
      this.rutaSeleccionadaUsuario.set(data);
      this.notificationsService.addNotification(
        'Ruta Seleccionada',
        `Ahora estás siguiendo la ruta: ${data.nombre_ruta}`,
        'success'
      );
    }
  }

  async abrirNotificaciones() {
    const modal = await this.modalController.create({
      component: NotificationCenterComponent,
      cssClass: 'premium-modal',
      initialBreakpoint: 0.9,
      breakpoints: [0, 0.5, 0.9],
      handle: true
    });
    return await modal.present();
  }

  abrirMapa() {
    this.router.navigate(['/mapa']);
  }

  abrirRutas() {
    this.router.navigate(['/rutas']);
  }

  async abrirVehiculosEnRuta() {
    const modal = await this.modalController.create({
      component: LiveVehiclesModalComponent,
      componentProps: {
        assignments: this.activeAssignments()
      },
      cssClass: 'premium-modal',
      initialBreakpoint: 0.7,
      breakpoints: [0, 0.5, 0.7, 0.9],
      handle: true
    });

    await modal.present();
  }

  async reportarIncidencia() {
    const alert = await this.alertController.create({
      header: 'Reportar Incidencia',
      message: '¿Qué tipo de problema deseas reportar?',
      buttons: [
        {
          text: 'Basura no recogida',
          handler: () => this.confirmarReporte('Basura no recogida')
        },
        {
          text: 'Camión con retraso',
          handler: () => this.confirmarReporte('Camión con retraso')
        },
        {
          text: 'Otro',
          handler: () => this.confirmarReporte('Otro problema')
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  private async confirmarReporte(tipo: string) {
    const alert = await this.alertController.create({
      header: 'Reporte Enviado',
      message: `Gracias por tu reporte de: ${tipo}. Nuestro equipo lo revisará pronto.`,
      buttons: ['Aceptar']
    });
    await alert.present();
    
    this.notificationsService.addNotification(
      'Reporte Recibido',
      `Tu reporte sobre "${tipo}" ha sido enviado correctamente.`,
      'success'
    );
  }
}
