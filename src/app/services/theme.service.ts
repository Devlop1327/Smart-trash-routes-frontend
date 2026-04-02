import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private isDarkSignal = signal<boolean>(true);

  readonly isDark = this.isDarkSignal.asReadonly();

  constructor() {
    this.loadTheme();
  }

  async loadTheme(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: this.THEME_KEY });
      const isDark = value === null ? true : value === 'true';
      this.setTheme(isDark);
    } catch (error) {
      console.error('Error cargando tema:', error);
      this.setTheme(true);
    }
  }

  async toggleTheme(): Promise<void> {
    const newTheme = !this.isDarkSignal();
    this.setTheme(newTheme);
    await this.saveTheme(newTheme);
  }

  private setTheme(isDark: boolean): void {
    this.isDarkSignal.set(isDark);
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    // Add/remove Ionic dark palette classes for proper theming
    document.body.classList.toggle('ion-palette-dark', isDark);
    document.documentElement.classList.toggle('ion-palette-dark', isDark);
    
    // Also add the 'dark' class for compatibility
    document.body.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }

  private async saveTheme(isDark: boolean): Promise<void> {
    try {
      await Preferences.set({
        key: this.THEME_KEY,
        value: isDark.toString()
      });
    } catch (error) {
      console.error('Error guardando tema:', error);
    }
  }
}
