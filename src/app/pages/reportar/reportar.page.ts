import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReporteResiduoComponent } from '../../components/reporte-residuo/reporte-residuo.component';

@Component({
  selector: 'app-reportar',
  standalone: true,
  imports: [CommonModule, IonicModule, ReporteResiduoComponent],
  templateUrl: './reportar.page.html',
  styleUrls: ['./reportar.page.scss'],
})
export class ReportarPage {}
