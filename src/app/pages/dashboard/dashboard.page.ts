import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { RutasService, Ruta } from '../../services/rutas.service';
import { HttpClientModule } from '@angular/common/http';

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
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, HttpClientModule],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  private rutasService = inject(RutasService);
  private alertController = inject(AlertController);

  // Signals para datos reactivos
  rutas = signal<Ruta[]>([]);
  cargandoRutas = signal<boolean>(true);
  rutaEnProgreso = signal<EstadoRecoleccion | null>(null);

  // Calendario semanal
  diasSemana: DiaCalendario[] = [];

  ngOnInit() {
    this.cargarDatos();
    this.generarCalendario();
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

  // Helper para obtener el color de fondo del ícono
  getIconBackground(colorHex: string | undefined): string {
    return colorHex || '#006d5b';
  }

  async seleccionarDia(dia: DiaCalendario) {
    this.diasSemana.forEach(d => d.seleccionado = false);
    dia.seleccionado = true;

    let mensaje = '';
    switch(dia.estado) {
      case 'collected': mensaje = 'La recolección ya se realizó este día.'; break;
      case 'pending': mensaje = 'La recolección está programada para hoy.'; break;
      case 'scheduled': mensaje = 'Recolección programada para este día.'; break;
      case 'no-service': mensaje = 'No hay servicio programado para este día.'; break;
    }

    const alert = await this.alertController.create({
      header: `Día ${dia.nombre} ${dia.fecha}`,
      message: mensaje,
      buttons: ['OK'],
      cssClass: 'modern-alert'
    });

    await alert.present();
  }
}
