import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
import { ThemeService } from '../../services/theme.service';

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

  constructor(private themeService: ThemeService) {}

  async ngOnInit() {
    await this.checkGpsPermission();
  }

  private async checkGpsPermission(): Promise<void> {
    try {
      const permission = await Geolocation.requestPermissions();
      // Check if location permission is granted
      const hasLocation = permission.location === 'granted';
      this.gpsAlwaysActive.set(hasLocation);
    } catch (error) {
      console.error('Error checking GPS permission:', error);
      this.gpsAlwaysActive.set(false);
    }
  }

  async toggleGpsAlways(): Promise<void> {
    try {
      const permission = await Geolocation.requestPermissions();
      const isGranted = permission.location === 'granted';
      this.gpsAlwaysActive.set(isGranted);
    } catch (error) {
      console.error('Error requesting GPS permission:', error);
      this.gpsAlwaysActive.set(false);
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
