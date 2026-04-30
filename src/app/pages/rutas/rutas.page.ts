import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { RutasService, Ruta } from '../../services/rutas.service';
import { MapaService } from '../../services/mapa.service';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './rutas.page.html',
  styleUrls: ['./rutas.page.scss'],
})
export class RutasPage implements OnInit {
  private rutasService = inject(RutasService);
  private mapaService = inject(MapaService);
  private router = inject(Router);

  rutas: Ruta[] = [];
  cargando = true;
  error: string | null = null;

  ngOnInit() {
    this.cargarRutas();
  }

  cargarRutas() {
    this.cargando = true;
    this.error = null;

    this.rutasService.listarRutas().subscribe({
      next: (rutas) => {
        this.rutas = rutas;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando rutas:', err);
        this.error = 'No se pudieron cargar las rutas. Intenta de nuevo.';
        this.cargando = false;
      }
    });
  }

  verRutaEnMapa(ruta: Ruta) {
    // Guardar la ruta seleccionada en el servicio
    this.mapaService.seleccionarRutaAdmin(ruta);
    // Navegar al mapa
    this.router.navigate(['/mapa'], {
      queryParams: { rutaId: ruta.id_ruta }
    });
  }

  // Generar color de fondo para el ícono basado en el color de la ruta
  getIconBackground(colorHex: string | undefined): string {
    return colorHex || '#006d5b';
  }
}
