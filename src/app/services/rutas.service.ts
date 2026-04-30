import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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
  private apiUrl = 'http://localhost:8000/api/rutas';

  /**
   * GET /api/rutas - Listar todas las rutas
   */
  listarRutas(): Observable<Ruta[]> {
    return this.http
      .get<ApiResponse<Ruta[]>>(this.apiUrl)
      .pipe(map((res) => res.data || []));
  }

  /**
   * GET /api/rutas/<ruta_id> - Obtener una ruta específica
   */
  obtenerRuta(rutaId: string): Observable<Ruta> {
    return this.http
      .get<ApiResponse<Ruta>>(`${this.apiUrl}/${encodeURIComponent(rutaId)}`)
      .pipe(map((res) => res.data));
  }
}
