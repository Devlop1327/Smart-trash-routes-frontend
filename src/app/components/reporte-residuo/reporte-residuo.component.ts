import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonIcon, 
  IonSelect, 
  IonSelectOption,
  ToastController 
} from '@ionic/angular/standalone';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { HttpClient } from '@angular/common/http';
import { TipoResiduo } from '../../services/mapa.service';
import { environment } from '../../../environments/environment';
import { addIcons } from 'ionicons';
import { 
  information, 
  personOutline, 
  mailOutline, 
  pricetagOutline, 
  documentTextOutline, 
  scaleOutline, 
  camera, 
  trashOutline, 
  refreshOutline, 
  checkmarkCircleOutline, 
  cameraOutline, 
  arrowForwardOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-reporte-residuo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonIcon, IonSelect, IonSelectOption],
  templateUrl: './reporte-residuo.component.html',
  styleUrls: ['./reporte-residuo.component.scss']
})
export class ReporteResiduoComponent {
  reporteForm: FormGroup;
  imagenPreview = signal<string | null>(null);
  mostrarOpcionesFoto = signal(false);

  tiposResiduo = [
    { value: TipoResiduo.PLASTICO, label: 'Plástico' },
    { value: TipoResiduo.VIDRIO, label: 'Vidrio' },
    { value: TipoResiduo.PAPEL, label: 'Papel' },
    { value: TipoResiduo.ORGANICO, label: 'Orgánico' },
    { value: TipoResiduo.ESPECIAL, label: 'Especial' }
  ];

  constructor(
    private fb: FormBuilder, 
    private toastCtrl: ToastController,
    private http: HttpClient
  ) {
    addIcons({
      'information': information,
      'person-outline': personOutline,
      'mail-outline': mailOutline,
      'pricetag-outline': pricetagOutline,
      'document-text-outline': documentTextOutline,
      'scale-outline': scaleOutline,
      'camera': camera,
      'trash-outline': trashOutline,
      'refresh-outline': refreshOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'camera-outline': cameraOutline,
      'arrow-forward-outline': arrowForwardOutline
    });

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
        quality: 60,
        width: 800,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Evidencia Fotográfica',
        promptLabelCancel: 'Cancelar',
        promptLabelPhoto: 'Elegir de la galería',
        promptLabelPicture: 'Tomar foto'
      });

      this.imagenPreview.set(image.dataUrl || null);
    } catch (error) {
      console.error('Error tomando foto:', error);
    }
  }

  eliminarFoto() {
    this.imagenPreview.set(null);
  }

  async enviarReporte() {
    if (!this.reporteForm.valid) {
      return;
    }

    const { nombre, correo, tipo, descripcion, cantidad } = this.reporteForm.value;
    
    // Concatenar cantidad en la descripción
    const descAmpliada = `${descripcion}\n- Cantidad aprox: ${cantidad} kg`;

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
    this.http.post(`${environment.apiUrl}/reportes`, formData).subscribe({
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
