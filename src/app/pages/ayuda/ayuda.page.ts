import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, MenuController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  menuOutline, 
  helpCircleOutline, 
  mapOutline, 
  notificationsOutline, 
  documentTextOutline, 
  chevronDownOutline, 
  chevronUpOutline,
  bulbOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-ayuda',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './ayuda.page.html',
  styleUrls: ['./ayuda.page.scss'],
})
export class AyudaPage {
  private menuCtrl = inject(MenuController);

  faqs = [
    {
      pregunta: '¿Cómo rastreo el camión en tiempo real?',
      respuesta: 'En la pantalla principal, selecciona la tarjeta "Ver Mapa". Allí podrás ver las rutas activas y la ubicación aproximada del camión recolector.',
      abierta: false,
      icon: 'map-outline'
    },
    {
      pregunta: '¿Qué significan los puntos en el calendario?',
      respuesta: 'Un punto verde indica que el servicio fue recolectado. Un punto naranja indica que está pendiente para el día de hoy.',
      abierta: false,
      icon: 'bulb-outline'
    },
    {
      pregunta: '¿Cómo puedo reportar un problema?',
      respuesta: 'Ve a la sección "Reportar" en el menú lateral. Allí podrás subir una foto y describir el problema relacionado con la basura en tu zona.',
      abierta: false,
      icon: 'document-text-outline'
    },
    {
      pregunta: '¿Las notificaciones son automáticas?',
      respuesta: 'Sí, recibirás una notificación cuando el camión esté cerca de tu zona si tienes activada la opción en Ajustes.',
      abierta: false,
      icon: 'notifications-outline'
    }
  ];

  constructor() {
    addIcons({ 
      menuOutline, 
      helpCircleOutline, 
      mapOutline, 
      notificationsOutline, 
      documentTextOutline, 
      chevronDownOutline, 
      chevronUpOutline,
      bulbOutline
    });
  }

  toggleFaq(index: number) {
    this.faqs[index].abierta = !this.faqs[index].abierta;
  }
}
