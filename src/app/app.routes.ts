import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'mapa',
    loadComponent: () =>
      import('./pages/mapa/mapa.page').then((m) => m.MapaPage),
  },
  {
    path: 'reportar',
    loadComponent: () =>
      import('./pages/reportar/reportar.page').then((m) => m.ReportarPage),
  },
  {
    path: 'ajustes',
    loadComponent: () =>
      import('./pages/ajustes/ajustes.page').then((m) => m.AjustesPage),
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
];
