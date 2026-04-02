import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MapaNavigatorComponent } from '../../components/mapa-navigator/mapa-navigator.component';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, IonicModule, MapaNavigatorComponent],
  templateUrl: './mapa.page.html',
  styleUrls: ['./mapa.page.scss'],
})
export class MapaPage {}
