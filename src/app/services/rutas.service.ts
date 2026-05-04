import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Ruta {
  id_ruta: string;
  nombre_ruta: string;
  perfil_id?: string;
  shape?: {
    type: string;
    coordinates: number[][];
  };
  color_hex?: string;
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class RutasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/rutas`;

  /**
   * GET /api/rutas - Listar todas las rutas
   */
  listarRutas(): Observable<Ruta[]> {
    return this.http
      .get<any>(this.apiUrl)
      .pipe(
        map((res) => {
          // Si la respuesta tiene una propiedad 'data', la usamos. Si no, asumimos que la respuesta es el array directamente.
          if (res && res.data) return res.data;
          if (Array.isArray(res)) return res;
          return [];
        })
      );
  }

  /**
   * GET /api/rutas/<ruta_id> - Obtener una ruta específica
   */
  obtenerRuta(rutaId: string): Observable<Ruta> {
    return this.http
      .get<any>(`${this.apiUrl}/${encodeURIComponent(rutaId)}`)
      .pipe(
        map((res) => {
          if (res && res.data) return res.data;
          return res;
        })
      );
  }

  /**
   * GET /api/publico/rutas/activas - Obtener asignaciones activas (en curso)
   */
  obtenerAsignacionesActivas(): Observable<any[]> {
    // environment.apiUrl ya termina en '/api'
    return this.http
      .get<any>(`${environment.apiUrl}/publico/rutas/activas`)
      .pipe(
        map((res) => {
          if (res && res.data) return res.data;
          if (Array.isArray(res)) return res;
          return [];
        })
      );
  }
}
