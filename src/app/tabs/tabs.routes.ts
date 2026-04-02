import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'mapa',
        loadComponent: () =>
          import('../pages/mapa/mapa.page').then((m) => m.MapaPage),
      },
      {
        path: 'reportar',
        loadComponent: () =>
          import('../pages/reportar/reportar.page').then((m) => m.ReportarPage),
      },
      {
        path: 'ajustes',
        loadComponent: () =>
          import('../pages/ajustes/ajustes.page').then((m) => m.AjustesPage),
      },
      {
        path: '',
        redirectTo: '/tabs/mapa',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/mapa',
    pathMatch: 'full',
  },
];
