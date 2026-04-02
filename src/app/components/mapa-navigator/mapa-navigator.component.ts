import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MapaService, PuntoRecogida, RutaUsuario } from '../../services/mapa.service';

@Component({
  selector: 'app-mapa-navigator',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="mapa-container">
      <div id="mapa" class="mapa"></div>
      
      <div class="info-panel">
        @if (rutaActual()) {
          <div class="ruta-info">
            <h3>Ruta Activa</h3>
            <p><strong>Distancia:</strong> {{ rutaActual()?.distancia?.toFixed(2) || 'N/A' }} km</p>
            <p><strong>Tiempo estimado:</strong> {{ tiempoEstimado() }} min</p>
            <ion-button (click)="limpiarRuta()" color="danger" fill="clear">
              Limpiar Ruta
            </ion-button>
          </div>
        }
        
        <div class="puntos-lista">
          <h4>Puntos de Recogida</h4>
          @for (punto of puntosRecogida(); track punto.id) {
            <div class="punto-item" (click)="seleccionarPunto(punto)">
              <div class="punto-icon {{ punto.tipo }}"></div>
              <div class="punto-info">
                <strong>{{ punto.nombre }}</strong>
                <p>{{ punto.direccion }}</p>
                <small>{{ punto.horario }}</small>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mapa-container {
      position: relative;
      height: 100vh;
      width: 100%;
    }
    
    .mapa {
      height: 60vh;
      width: 100%;
    }
    
    .info-panel {
      height: 40vh;
      overflow-y: auto;
      padding: 16px;
      background: var(--ecox-card);
      border-top: 1px solid var(--ecox-accent);
    }
    
    .ruta-info {
      background: var(--ecox-accent);
      color: var(--ecox-bg);
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .puntos-lista h4 {
      margin: 0 0 12px 0;
      color: var(--ecox-accent);
    }
    
    .punto-item {
      display: flex;
      align-items: center;
      padding: 12px;
      margin-bottom: 8px;
      background: var(--ecox-bg);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .punto-item:hover {
      transform: translateX(4px);
      box-shadow: 0 2px 8px rgba(80, 250, 123, 0.3);
    }
    
    .punto-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
    }
    
    .punto-icon.plastico { background: #3498db; }
    .punto-icon.vidrio { background: #2ecc71; }
    .punto-icon.papel { background: #f39c12; }
    .punto-icon.organico { background: #27ae60; }
    .punto-icon.especial { background: #e74c3c; }
    
    .punto-info {
      flex: 1;
    }
    
    .punto-info strong {
      display: block;
      margin-bottom: 4px;
    }
    
    .punto-info p {
      margin: 0 0 4px 0;
      font-size: 0.9em;
    }
    
    .punto-info small {
      color: var(--ecox-secondary);
      font-size: 0.8em;
    }
  `]
})
export class MapaNavigatorComponent implements OnInit, OnDestroy {
  puntosRecogida = this.mapaService.puntosRecogidaSignal;
  rutaActual = this.mapaService.rutaActualSignal;
  posicionUsuario = this.mapaService.posicionUsuarioSignal;

  constructor(private mapaService: MapaService) {}

  ngOnInit() {
    this.mapaService.inicializarMapa('mapa');
  }

  ngOnDestroy() {
    // Cleanup si es necesario
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
}
