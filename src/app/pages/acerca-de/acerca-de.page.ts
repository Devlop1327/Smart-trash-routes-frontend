import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, MenuController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  menuOutline, 
  informationCircleOutline, 
  heartOutline, 
  codeOutline, 
  mapOutline, 
  notificationsOutline, 
  documentTextOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-acerca-de',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './acerca-de.page.html',
  styleUrls: ['./acerca-de.page.scss'],
})
export class AcercaDePage {
  private menuCtrl = inject(MenuController);

  constructor() {
    addIcons({ 
      menuOutline, 
      informationCircleOutline, 
      heartOutline, 
      codeOutline, 
      mapOutline, 
      notificationsOutline, 
      documentTextOutline 
    });
  }

  toggleMenu() {
    this.menuCtrl.toggle('main-menu');
  }
}
