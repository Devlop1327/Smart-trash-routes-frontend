import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
import { ThemeService } from '../../services/theme.service';
import { MapaService } from '../../services/mapa.service';
import { addIcons } from 'ionicons';
import { 
  menuOutline, 
  moon, 
  sunny, 
  notificationsOutline, 
  navigateOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './ajustes.page.html',
  styleUrls: ['./ajustes.page.scss'],
})
export class AjustesPage implements OnInit {
  isDark = this.themeService.isDark;
  gpsAlwaysActive = signal<boolean>(false);
  notificationsActive = signal<boolean>(true);

  constructor(
    private themeService: ThemeService,
    private mapaService: MapaService
  ) {
    addIcons({ 
      'menu-outline': menuOutline, 
      'moon': moon, 
      'sunny': sunny, 
      'notifications-outline': notificationsOutline, 
      'navigate-outline': navigateOutline 
    });
  }

  async ngOnInit() {
    await this.checkGpsPermission();
  }

  private readonly GPS_KEY = 'str_gps_active';

  private async checkGpsPermission(): Promise<void> {
    try {
      // Primero verificar el estado real de los permisos
      const permission = await Geolocation.checkPermissions();
      const isGranted = permission.location === 'granted';
      
      const saved = localStorage.getItem(this.GPS_KEY);
      const isSavedActive = saved === 'true';

      // Solo se activa si hay permiso real Y el usuario lo guardó como activo
      this.gpsAlwaysActive.set(isGranted && isSavedActive);
      
      // Sincronizar localStorage si el permiso fue revocado externamente
      if (!isGranted && isSavedActive) {
        localStorage.setItem(this.GPS_KEY, 'false');
      }
    } catch (error) {
      console.warn('Error checking GPS permission (posiblemente entorno Web):', error);
      const saved = localStorage.getItem(this.GPS_KEY);
      this.gpsAlwaysActive.set(saved === 'true');
    }
  }

  async toggleGpsAlways(): Promise<void> {
    try {
      if (this.gpsAlwaysActive()) {
        this.gpsAlwaysActive.set(false);
        localStorage.setItem(this.GPS_KEY, 'false');
      } else {
        try {
          const permission = await Geolocation.requestPermissions();
          if (permission.location !== 'granted') {
            console.warn('Permiso de ubicación denegado por el usuario.');
            this.gpsAlwaysActive.set(false);
            localStorage.setItem(this.GPS_KEY, 'false');
            return;
          }
        } catch (e) {
          console.warn('requestPermissions no soportado o falló, verificando estado actual...');
          // Fallback para web: intentar obtener posición para disparar el prompt del navegador
          try {
            await Geolocation.getCurrentPosition();
          } catch (posError) {
            console.error('El usuario denegó el acceso en el navegador.');
            this.gpsAlwaysActive.set(false);
            localStorage.setItem(this.GPS_KEY, 'false');
            return;
          }
        }
        
        // Si llegamos aquí, es que tenemos permiso
        this.gpsAlwaysActive.set(true);
        localStorage.setItem(this.GPS_KEY, 'true');
        this.mapaService.obtenerPosicionActual();
      }
    } catch (error) {
      console.error('Error general en toggle GPS:', error);
      this.gpsAlwaysActive.set(false);
      localStorage.setItem(this.GPS_KEY, 'false');
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleNotifications() {
    this.notificationsActive.set(!this.notificationsActive());
  }
}
