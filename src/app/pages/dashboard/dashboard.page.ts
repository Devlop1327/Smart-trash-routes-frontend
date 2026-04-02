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
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
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
