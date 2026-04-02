import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { MapaService, TipoResiduo } from '../../services/mapa.service';

interface StatCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  trend?: string;
}

interface RecentActivity {
  id: string;
  type: string;
  location: string;
  date: Date;
  status: 'completed' | 'pending';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="dashboard-container">
        <!-- Stats Grid -->
        <div class="stats-grid">
          @for (stat of stats(); track stat.title) {
            <div class="stat-card {{ stat.color }}">
              <div class="stat-icon">
                <ion-icon [name]="stat.icon"></ion-icon>
              </div>
              <div class="stat-content">
                <h3>{{ stat.value }}</h3>
                <p>{{ stat.title }}</p>
                @if (stat.trend) {
                  <small class="trend">{{ stat.trend }}</small>
                }
              </div>
            </div>
          }
        </div>

        <!-- Quick Actions -->
        <div class="section">
          <h2>Acciones Rápidas</h2>
          <div class="quick-actions">
            <ion-button expand="block" routerLink="/mapa" class="action-btn primary">
              <ion-icon name="map-outline" slot="start"></ion-icon>
              Ver Mapa de Rutas
            </ion-button>
            <ion-button expand="block" routerLink="/reportar" class="action-btn secondary">
              <ion-icon name="camera-outline" slot="start"></ion-icon>
              Reportar Residuo
            </ion-button>
          </div>
        </div>

        <!-- Puntos de Recogida Cercanos -->
        <div class="section">
          <h2>Puntos de Recogida Cercanos</h2>
          <ion-list class="ecox-list">
            @for (punto of puntosRecogida().slice(0, 3); track punto.id) {
              <ion-item routerLink="/mapa" [queryParams]="{ punto: punto.id }">
                <div class="tipo-badge {{ punto.tipo }}" slot="start"></div>
                <ion-label>
                  <h3>{{ punto.nombre }}</h3>
                  <p>{{ punto.direccion }}</p>
                  <small>{{ punto.horario }}</small>
                </ion-label>
                <ion-icon name="chevron-forward" slot="end"></ion-icon>
              </ion-item>
            }
          </ion-list>
        </div>

        <!-- Tipos de Residuos -->
        <div class="section">
          <h2>Tipos de Residuos Aceptados</h2>
          <div class="residuos-grid">
            @for (tipo of tiposResiduo; track tipo.key) {
              <div class="residuo-item">
                <div class="residuo-icon {{ tipo.key }}">
                  <ion-icon [name]="tipo.icon"></ion-icon>
                </div>
                <span>{{ tipo.label }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .dashboard-container {
      padding: 16px;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--ecox-card);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      border: 1px solid rgba(80, 250, 123, 0.1);
    }

    .stat-card.green { border-left: 4px solid #50fa7b; }
    .stat-card.blue { border-left: 4px solid #8be9fd; }
    .stat-card.orange { border-left: 4px solid #ffb86c; }
    .stat-card.purple { border-left: 4px solid #bd93f9; }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(80, 250, 123, 0.1);
    }

    .stat-icon ion-icon {
      font-size: 24px;
      color: var(--ecox-accent);
    }

    .stat-content h3 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: var(--ion-text-color);
    }

    .stat-content p {
      margin: 4px 0 0;
      font-size: 12px;
      color: var(--ecox-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .trend {
      color: #50fa7b;
      font-size: 11px;
    }

    /* Sections */
    .section {
      margin-bottom: 24px;
    }

    .section h2 {
      margin: 0 0 12px 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--ion-text-color);
    }

    /* Quick Actions */
    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .action-btn {
      --border-radius: 12px;
      height: 48px;
      font-weight: 500;
    }

    .action-btn.primary {
      --background: var(--ecox-accent);
      --color: #121212;
    }

    .action-btn.secondary {
      --background: rgba(139, 233, 253, 0.1);
      --color: var(--ecox-secondary);
      --border-color: var(--ecox-secondary);
      --border-style: solid;
      --border-width: 1px;
    }

    /* Lista Ecox */
    .ecox-list {
      background: var(--ecox-card);
      border-radius: 12px;
      overflow: hidden;
    }

    ion-item {
      --background: transparent;
      --padding-start: 12px;
      --padding-end: 12px;
    }

    .tipo-badge {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .tipo-badge.plastico { background: #3498db; }
    .tipo-badge.vidrio { background: #2ecc71; }
    .tipo-badge.papel { background: #f39c12; }
    .tipo-badge.organico { background: #27ae60; }
    .tipo-badge.especial { background: #e74c3c; }

    ion-label h3 {
      margin: 0;
      font-weight: 600;
      color: var(--ion-text-color);
    }

    ion-label p {
      margin: 4px 0;
      font-size: 13px;
      color: var(--ecox-secondary);
    }

    ion-label small {
      color: var(--ecox-accent);
      font-size: 11px;
    }

    /* Residuos Grid */
    .residuos-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
    }

    .residuo-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .residuo-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ecox-card);
    }

    .residuo-icon ion-icon {
      font-size: 28px;
    }

    .residuo-icon.plastico { color: #3498db; }
    .residuo-icon.vidrio { color: #2ecc71; }
    .residuo-icon.papel { color: #f39c12; }
    .residuo-icon.organico { color: #27ae60; }
    .residuo-icon.especial { color: #e74c3c; }

    .residuo-item span {
      font-size: 11px;
      color: var(--ecox-secondary);
      text-align: center;
    }
  `]
})
export class DashboardPage {
  puntosRecogida = this.mapaService.puntosRecogidaSignal;

  stats = computed<StatCard[]>(() => [
    {
      title: 'Puntos Activos',
      value: this.puntosRecogida().length.toString(),
      icon: 'location',
      color: 'green',
      trend: '+2 esta semana'
    },
    {
      title: 'Residuos Reportados',
      value: '12',
      icon: 'trash-bin',
      color: 'blue',
      trend: '+5 este mes'
    },
    {
      title: 'Rutas Completadas',
      value: '8',
      icon: 'navigate',
      color: 'orange'
    },
    {
      title: 'Eco Puntos',
      value: '450',
      icon: 'leaf',
      color: 'purple'
    }
  ]);

  tiposResiduo = [
    { key: 'plastico', label: 'Plástico', icon: 'water' },
    { key: 'vidrio', label: 'Vidrio', icon: 'wine' },
    { key: 'papel', label: 'Papel', icon: 'document-text' },
    { key: 'organico', label: 'Orgánico', icon: 'nutrition' },
    { key: 'especial', label: 'Especial', icon: 'warning' },
  ];

  constructor(private mapaService: MapaService) {}
}
