import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { ActionSheetController, ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { TipoResiduo } from '../../services/mapa.service';

@Component({
  selector: 'app-reporte-residuo',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './reporte-residuo.component.html',
  styleUrls: ['./reporte-residuo.component.scss']
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

  constructor(
    private fb: FormBuilder, 
    private actionSheetCtrl: ActionSheetController,
    private toastCtrl: ToastController,
    private http: HttpClient
  ) {
    this.reporteForm = this.fb.group({
      nombre: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
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

  async gestionarFoto() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Gestionar Foto',
      buttons: [
        {
          text: 'Tomar nueva foto',
          icon: 'camera',
          handler: () => {
            this.tomarFoto();
          }
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.eliminarFoto();
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          icon: 'close'
        }
      ]
    });
    await actionSheet.present();
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
    if (!this.reporteForm.valid || !this.ubicacion()) {
      return;
    }

    const { nombre, correo, tipo, descripcion, cantidad } = this.reporteForm.value;
    
    // Concatenar cantidad y ubicación en la descripción
    const ubicacionValue = this.ubicacion();
    const descAmpliada = `${descripcion}\n- Cantidad aprox: ${cantidad} kg\n- Ubicación GPS: ${ubicacionValue?.latitude}, ${ubicacionValue?.longitude}`;

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('correo', correo);
    formData.append('asunto', `Reporte de Residuo: ${tipo}`);
    formData.append('descripcion', descAmpliada);

    if (this.imagenPreview()) {
      // Enviar el base64 directamente
      formData.append('evidencia_url', this.imagenPreview()!);
    }

    console.log('Enviando reporte...', formData);
    
    // Enviar a la API
    this.http.post('http://localhost:8000/reportes', formData).subscribe({
      next: async (res) => {
        const toast = await this.toastCtrl.create({
          message: 'Reporte enviado con éxito. ¡Gracias por tu colaboración!',
          duration: 3000,
          color: 'success',
          position: 'top'
        });
        toast.present();

        // Resetear formulario
        this.reporteForm.reset({ tipo: TipoResiduo.PLASTICO });
        this.imagenPreview.set(null);
        this.ubicacion.set(null);
      },
      error: async (err) => {
        console.error('Error enviando reporte:', err);
        const toast = await this.toastCtrl.create({
          message: 'Error al enviar el reporte. Inténtalo de nuevo más tarde.',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        toast.present();
      }
    });
  }
}
