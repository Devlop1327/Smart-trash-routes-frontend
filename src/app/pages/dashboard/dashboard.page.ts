import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { AlertController, ActionSheetController, ModalController, MenuController, IonIcon, IonMenuButton } from '@ionic/angular/standalone';
import { RouterLink, Router } from '@angular/router';
import { RutasService, Ruta } from '../../services/rutas.service';
import { NotificationsService } from '../../services/notifications.service';
import { NotificationCenterComponent } from '../../components/notification-center/notification-center.component';
import { RouteSelectorComponent } from '../../components/route-selector/route-selector.component';
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
  person
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
export class DashboardPage implements OnInit {
  private router = inject(Router);
  private rutasService = inject(RutasService);
  private alertController = inject(AlertController);
  private actionSheetController = inject(ActionSheetController);
  private modalController = inject(ModalController);
  private menuCtrl = inject(MenuController);
  public notificationsService = inject(NotificationsService);

  constructor() {
    addIcons({
      menuOutline,
      notificationsOutline,
      map,
      navigate,
      bus,
      chevronForwardOutline,
      radioButtonOnOutline,
      busOutline
    });
  }

  abrirMenu() {
    this.menuCtrl.open('main-menu');
  }

  // Signals para datos reactivos
  rutas = signal<Ruta[]>([]);
  cargandoRutas = signal<boolean>(true);
  rutaEnProgreso = signal<EstadoRecoleccion | null>(null);

  // Calendario semanal
  diasSemana: DiaCalendario[] = [];

  ngOnInit() {
    // Inicializar con una simulación inmediata para evitar saltos en la UI
    this.simularRutaEnProgreso(null);
    
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
  }

  cargarDatos() {
    // Cargar rutas del backend
    this.rutasService.listarRutas().subscribe({
      next: (rutas) => {
        this.rutas.set(rutas);
        this.cargandoRutas.set(false);

        // Simular una ruta en progreso (la primera ruta si existe)
        if (rutas.length > 0) {
          this.simularRutaEnProgreso(rutas[0]);
        }
      },
      error: (err) => {
        console.error('Error cargando rutas:', err);
        this.cargandoRutas.set(false);
        // Datos de fallback
        this.simularRutaEnProgreso(null);
      }
    });
  }

  private simularRutaEnProgreso(ruta: Ruta | null) {
    // Simulación de ruta en progreso - en producción vendría del backend
    const ahora = new Date();
    const horaLlegada = new Date(ahora.getTime() + 12 * 60000); // 12 minutos

    this.rutaEnProgreso.set({
      estado: 'en_camino',
      tiempoEstimado: 12,
      horaLlegada: horaLlegada.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      distancia: 'A 3 cuadras de tu ubicación',
      nombreRuta: ruta?.nombre_ruta || 'Ruta Norte - Tu zona'
    });
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
        selectedRutaId: null // Podría persistir esto si fuera necesario
      },
      cssClass: 'premium-modal',
      initialBreakpoint: 0.8,
      breakpoints: [0, 0.5, 0.8, 1.0],
      handle: true
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    
    if (data) {
      this.simularRutaEnProgreso(data);
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
