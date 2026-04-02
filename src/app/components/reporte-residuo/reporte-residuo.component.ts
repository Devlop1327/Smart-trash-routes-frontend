import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { TipoResiduo } from '../../services/mapa.service';

@Component({
  selector: 'app-reporte-residuo',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-title>Reportar Residuo</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content [fullscreen]="true">
      <form [formGroup]="reporteForm" class="reporte-form">
        <ion-item>
          <ion-label position="stacked">Tipo de Residuo</ion-label>
          <ion-select formControlName="tipo" placeholder="Selecciona el tipo">
            @for (tipo of tiposResiduo; track tipo.value) {
              <ion-select-option [value]="tipo.value">
                {{ tipo.label }}
              </ion-select-option>
            }
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Descripción</ion-label>
          <ion-textarea 
            formControlName="descripcion" 
            placeholder="Describe el residuo y su ubicación..."
            rows="4">
          </ion-textarea>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Cantidad</ion-label>
          <ion-input 
            formControlName="cantidad" 
            type="number" 
            placeholder="Ej: 5 kg">
          </ion-input>
        </ion-item>

        <div class="foto-section">
          <h4>Evidencia Fotográfica</h4>
          @if (imagenPreview()) {
            <div class="preview-container">
              <img [src]="imagenPreview()" alt="Preview" class="preview-image" />
              <ion-button 
                (click)="eliminarFoto()" 
                color="danger" 
                fill="clear" 
                size="small">
                <ion-icon name="trash"></ion-icon>
              </ion-button>
            </div>
          } @else {
            <ion-button 
              (click)="tomarFoto()" 
              expand="block" 
              fill="outline">
              <ion-icon name="camera" slot="start"></ion-icon>
              Tomar Foto
            </ion-button>
          }
        </div>

        <div class="ubicacion-section">
          <h4>Ubicación Actual</h4>
          @if (ubicacion()) {
            <div class="ubicacion-info">
              <p><strong>Lat:</strong> {{ ubicacion()?.latitude?.toFixed(6) || 'N/A' }}</p>
              <p><strong>Lng:</strong> {{ ubicacion()?.longitude?.toFixed(6) || 'N/A' }}</p>
              <ion-button 
                (click)="actualizarUbicacion()" 
                fill="clear" 
                size="small">
                <ion-icon name="refresh"></ion-icon>
                Actualizar
              </ion-button>
            </div>
          } @else {
            <ion-button 
              (click)="actualizarUbicacion()" 
              expand="block" 
              fill="outline">
              <ion-icon name="location" slot="start"></ion-icon>
              Obtener Ubicación
            </ion-button>
          }
        </div>

        <div class="acciones">
          <ion-button 
            type="submit" 
            expand="block" 
            [disabled]="!reporteForm.valid || !imagenPreview() || !ubicacion()"
            (click)="enviarReporte()">
            <ion-icon name="send" slot="start"></ion-icon>
            Enviar Reporte
          </ion-button>
        </div>
      </form>
    </ion-content>
  `,
  styles: [`
    .reporte-form {
      padding: 16px;
    }

    .foto-section, .ubicacion-section {
      margin: 20px 0;
      padding: 16px;
      background: var(--ecox-card);
      border-radius: 8px;
    }

    .foto-section h4, .ubicacion-section h4 {
      margin: 0 0 12px 0;
      color: var(--ecox-accent);
    }

    .preview-container {
      position: relative;
      text-align: center;
    }

    .preview-image {
      max-width: 100%;
      max-height: 200px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .ubicacion-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ubicacion-info p {
      margin: 0;
      font-size: 0.9em;
    }

    .acciones {
      margin-top: 24px;
    }
  `]
})
export class ReporteResiduoComponent {
  reporteForm: FormGroup;
  imagenPreview = signal<string | null>(null);
  ubicacion = signal<{latitude: number, longitude: number} | null>(null);

  tiposResiduo = [
    { value: TipoResiduo.PLASTICO, label: 'Plástico' },
    { value: TipoResiduo.VIDRIO, label: 'Vidrio' },
    { value: TipoResiduo.PAPEL, label: 'Papel' },
    { value: TipoResiduo.ORGANICO, label: 'Orgánico' },
    { value: TipoResiduo.ESPECIAL, label: 'Especial' }
  ];

  constructor(private fb: FormBuilder) {
    this.reporteForm = this.fb.group({
      tipo: [TipoResiduo.PLASTICO, Validators.required],
      descripcion: ['', Validators.required],
      cantidad: ['', [Validators.required, Validators.min(0.1)]]
    });
  }

  async tomarFoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      this.imagenPreview.set(image.dataUrl || null);
    } catch (error) {
      console.error('Error tomando foto:', error);
    }
  }

  eliminarFoto() {
    this.imagenPreview.set(null);
  }

  async actualizarUbicacion() {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true
      });

      this.ubicacion.set({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
    }
  }

  async enviarReporte() {
    if (!this.reporteForm.valid || !this.imagenPreview() || !this.ubicacion()) {
      return;
    }

    const reporte = {
      ...this.reporteForm.value,
      imagen: this.imagenPreview(),
      ubicacion: this.ubicacion(),
      fecha: new Date().toISOString()
    };

    console.log('Enviando reporte:', reporte);
    
    // Aquí iría la lógica para enviar a tu API
    // await this.apiService.enviarReporte(reporte);

    // Resetear formulario
    this.reporteForm.reset();
    this.imagenPreview.set(null);
    this.ubicacion.set(null);
  }
}
