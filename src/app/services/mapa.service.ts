import { Injectable, signal, inject } from '@angular/core';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Feature } from 'ol';
import { Point, LineString, MultiLineString } from 'ol/geom';
import { Style, Icon, Stroke, Fill, Circle as CircleStyle, Text } from 'ol/style';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import { Geolocation } from '@capacitor/geolocation';
import { Zoom } from 'ol/control';
import { GeoJSON } from 'ol/format';
import { RutasService, Ruta } from './rutas.service';

export enum TipoResiduo {
  PLASTICO = 'plastico',
  VIDRIO = 'vidrio',
  PAPEL = 'papel',
  ORGANICO = 'organico',
  ESPECIAL = 'especial'
}

export interface PuntoRecogida {
  id: string;
  nombre: string;
  tipo: TipoResiduo;
  coordenadas: [number, number];
  direccion: string;
  horario: string;
}

export interface RutaUsuario {
  origen: [number, number];
  destino: [number, number];
  distancia: number;
  duracion: number;
}

@Injectable({
  providedIn: 'root'
})
export class MapaService {
  private mapa: Map | null = null;
  private capaRuta: VectorLayer | null = null;
  private capaCalles: VectorLayer | null = null;
  private capaRutasAdmin: VectorLayer | null = null;
  private posicionUsuario = signal<[number, number] | null>(null);
  private puntosRecogida = signal<PuntoRecogida[]>([]);
  private rutaActual = signal<RutaUsuario | null>(null);
  private rutasAdmin = signal<Ruta[]>([]);
  private rutaAdminSeleccionada = signal<Ruta | null>(null);

  readonly posicionUsuarioSignal = this.posicionUsuario.asReadonly();
  readonly puntosRecogidaSignal = this.puntosRecogida.asReadonly();
  readonly rutaActualSignal = this.rutaActual.asReadonly();
  readonly rutasAdminSignal = this.rutasAdmin.asReadonly();
  readonly rutaAdminSeleccionadaSignal = this.rutaAdminSeleccionada.asReadonly();

  private rutasService = inject(RutasService);

  constructor() {
    // Puntos de recogida eliminados - ahora solo mostramos rutas del admin
  }

  inicializarMapa(target: string): Map {
    // Límites de Buenaventura [minLon, minLat, maxLon, maxLat]
    const limitesBuenaventura = [-77.12, 3.82, -76.98, 3.95];
    const extentProyectado = transformExtent(limitesBuenaventura, 'EPSG:4326', 'EPSG:3857');

    this.mapa = new Map({
      target,
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      controls: [
        new Zoom({
          className: 'ol-zoom ecox-zoom'
        })
      ],
      view: new View({
        center: fromLonLat([-77.0451, 3.8850]), // Buenaventura, Colombia
        zoom: 13,
        minZoom: 12,
        maxZoom: 19,
        extent: extentProyectado // Restringe navegación
      })
    });

    this.obtenerPosicionActual();
    this.cargarCallesBuenaventura();
    return this.mapa;
  }

  private async cargarCallesBuenaventura(): Promise<void> {
    if (!this.mapa) return;

    try {
      const response = await fetch('assets/data/buenaventura-streets.geojson');
      if (!response.ok) {
        console.warn('No se encontró el archivo de calles de Buenaventura');
        return;
      }

      const geojson = await response.json();

      const vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(geojson, {
          featureProjection: 'EPSG:3857'
        })
      });

      // Estilo dinámico basado en propiedades
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const styleFunction = (feature: any): Style => {
        const name = feature.get('name');
        const highway = feature.get('highway');
        
        // Colores según tipo de vía - Colores brillantes del tema Ecox
        let color = '#00E5FF'; // Cyan brillante por defecto
        let width = 2;
        
        switch (highway) {
          case 'primary':
            color = '#00FF88'; // Verde esmeralda neón brillante
            width = 4;
            break;
          case 'secondary':
            color = '#00FF88'; // Verde esmeralda neón
            width = 3;
            break;
          case 'tertiary':
            color = '#00E5FF'; // Cyan brillante
            width = 2.5;
            break;
          case 'residential':
            color = '#FFB800'; // Amarillo dorado brillante
            width = 2;
            break;
          case 'pedestrian':
            color = '#FF6B6B'; // Coral brillante
            width = 2;
            break;
          case 'unclassified':
          case 'service':
            color = '#C084FC'; // Púrpura brillante
            width = 1.5;
            break;
          default:
            color = '#00E5FF'; // Cyan
            width = 1.5;
        }

        const style = new Style({
          stroke: new Stroke({
            color: color,
            width: width
          })
        });

        // Mostrar nombre solo en vías principales - texto BLANCO con halo negro
        if (name && ['primary', 'secondary', 'tertiary'].includes(highway)) {
          style.setText(new Text({
            text: name,
            font: 'bold 10px Inter, sans-serif',
            fill: new Fill({ color: '#ffffff' }), // Texto BLANCO puro
            stroke: new Stroke({ color: '#000000', width: 4 }), // Halo negro grueso para contraste
            offsetY: -10,
            overflow: true,
            placement: 'line'
          }));
        }

        return style;
      };

      this.capaCalles = new VectorLayer({
        source: vectorSource,
        style: styleFunction,
        properties: { name: 'calles-buenaventura' },
        zIndex: 5 // Entre el mapa base (0) y los puntos de recogida (10)
      });

      this.mapa.addLayer(this.capaCalles);

    } catch (error) {
      console.error('Error cargando calles de Buenaventura:', error);
    }
  }

  async obtenerPosicionActual(): Promise<void> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true
      });

      const coords: [number, number] = [
        position.coords.longitude,
        position.coords.latitude
      ];

      this.posicionUsuario.set(coords);
      this.centrarMapaEnPosicion(coords);
      this.agregarMarcadorUsuario(coords);
    } catch (error) {
      console.error('Error obteniendo posición:', error);
    }
  }

  private centrarMapaEnPosicion(coords: [number, number]): void {
    if (!this.mapa) return;

    this.mapa.getView().animate({
      center: fromLonLat(coords),
      zoom: 15,
      duration: 1000
    });
  }

  private agregarMarcadorUsuario(coords: [number, number]): void {
    if (!this.mapa) return;

    const marcadorUsuario = new Feature({
      geometry: new Point(fromLonLat(coords)),
      type: 'usuario'
    });

    const estiloUsuario = new Style({
      image: new CircleStyle({
        radius: 10,
        fill: new Fill({ color: '#4285F4' }), // Azul Google Maps
        stroke: new Stroke({ color: '#ffffff', width: 3 })
      })
    });

    const capaUsuario = new VectorLayer({
      source: new VectorSource({
        features: [marcadorUsuario]
      }),
      style: estiloUsuario
    });

    this.mapa.addLayer(capaUsuario);
  }

  

  private obtenerEstiloPorTipo(tipo: TipoResiduo): Style {
    const iconos = {
      [TipoResiduo.PLASTICO]: 'assets/icons/plastic.svg',
      [TipoResiduo.VIDRIO]: 'assets/icons/glass.svg',
      [TipoResiduo.PAPEL]: 'assets/icons/paper.svg',
      [TipoResiduo.ORGANICO]: 'assets/icons/organic.svg',
      [TipoResiduo.ESPECIAL]: 'assets/icons/special.svg'
    };

    return new Style({
      image: new Icon({
        anchor: [0.5, 1],
        src: iconos[tipo],
        scale: 1.2
      })
    });
  }

  calcularRutaHaciaPunto(puntoDestino: PuntoRecogida): void {
    const origen = this.posicionUsuario();
    if (!origen || !this.mapa) return;

    const ruta: RutaUsuario = {
      origen,
      destino: puntoDestino.coordenadas,
      distancia: this.calcularDistancia(origen, puntoDestino.coordenadas),
      duracion: this.calcularDuracionEstimada(origen, puntoDestino.coordenadas)
    };

    this.rutaActual.set(ruta);
    this.dibujarRuta(origen, puntoDestino.coordenadas);
  }

  private dibujarRuta(origen: [number, number], destino: [number, number]): void {
    if (!this.mapa) return;

    const lineaRuta = new Feature({
      geometry: new LineString([
        fromLonLat(origen),
        fromLonLat(destino)
      ]),
      type: 'ruta'
    });

    const estiloRuta = new Style({
      stroke: new Stroke({
        color: '#50fa7b',
        width: 4,
        lineDash: [10, 5]
      })
    });

    this.capaRuta = new VectorLayer({
      source: new VectorSource({
        features: [lineaRuta]
      }),
      style: estiloRuta,
      properties: { name: 'ruta' }
    });

    this.mapa.addLayer(this.capaRuta);
  }

  private calcularDistancia(origen: [number, number], destino: [number, number]): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(destino[1] - origen[1]);
    const dLon = this.toRad(destino[0] - origen[0]);
    const lat1 = this.toRad(origen[1]);
    const lat2 = this.toRad(destino[1]);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distancia en km
  }

  private toRad(value: number): number {
    return value * Math.PI / 180;
  }

  private calcularDuracionEstimada(origen: [number, number], destino: [number, number]): number {
    const distancia = this.calcularDistancia(origen, destino);
    const velocidadPromedio = 40; // km/h en ciudad
    return (distancia / velocidadPromedio) * 60; // minutos
  }

  limpiarRuta(): void {
    if (this.capaRuta && this.mapa) {
      this.mapa.removeLayer(this.capaRuta);
      this.capaRuta = null;
    }
    this.rutaActual.set(null);
  }

  // ==================== RUTAS DEL ADMIN ====================
  private cacheRutas: Ruta[] | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 60000; // 1 minuto

  /**
   * Carga todas las rutas creadas por el admin desde el backend
   * con cache para evitar llamadas innecesarias
   */
  cargarRutasAdmin(forceRefresh = false): void {
    const now = Date.now();
    
    // Usar cache si está disponible y no ha expirado
    if (!forceRefresh && this.cacheRutas && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      this.rutasAdmin.set(this.cacheRutas);
      this.mostrarRutasAdminEnMapa(this.cacheRutas);
      return;
    }

    const startTime = performance.now();
    
    this.rutasService.listarRutas().subscribe({
      next: (rutas) => {
        const duration = Math.round(performance.now() - startTime);
        
        // Guardar en cache
        this.cacheRutas = rutas;
        this.lastFetchTime = now;
        
        this.rutasAdmin.set(rutas);
        this.mostrarRutasAdminEnMapa(rutas);
      },
      error: (err) => {
        console.error('❌ Error cargando rutas:', err);
        
        // Si hay cache, usarla como fallback
        if (this.cacheRutas) {
          this.rutasAdmin.set(this.cacheRutas);
          this.mostrarRutasAdminEnMapa(this.cacheRutas);
        }
      }
    });
  }

  /**
   * Muestra todas las rutas del admin en el mapa
   */
  private mostrarRutasAdminEnMapa(rutas: Ruta[]): void {
    if (!this.mapa) return;

    // Remover capa anterior si existe
    if (this.capaRutasAdmin) {
      this.mapa.removeLayer(this.capaRutasAdmin);
    }

    const features: Feature[] = [];

    rutas.forEach(ruta => {
      let shapeObj = ruta.shape as any;
      if (typeof shapeObj === 'string') {
        try { shapeObj = JSON.parse(shapeObj); } catch (e) { return; }
      }

      if (shapeObj && shapeObj.coordinates && Array.isArray(shapeObj.coordinates) && shapeObj.coordinates.length > 0) {
        const coords = shapeObj.coordinates as any[];
        let geometry;

        if (shapeObj.type === 'MultiLineString' || (coords[0] && Array.isArray(coords[0]) && Array.isArray(coords[0][0]))) {
          const olCoordsMulti = coords.map((line: any[]) => line.map((c: number[]) => fromLonLat(c)));
          geometry = new MultiLineString(olCoordsMulti);
        } else {
          const olCoords = coords.map((c: number[]) => fromLonLat(c));
          geometry = new LineString(olCoords);
        }

        const lineaRuta = new Feature({
          geometry: geometry,
          type: 'ruta-admin',
          ruta: ruta
        });

        const color = ruta.color_hex || '#2dcecc';
        const estilo = new Style({
          stroke: new Stroke({ color: color, width: 5 })
        });

        lineaRuta.setStyle(estilo);
        features.push(lineaRuta);
      }
    });

    if (features.length > 0) {
      this.capaRutasAdmin = new VectorLayer({
        source: new VectorSource({
          features
        }),
        properties: { name: 'rutas-admin' },
        zIndex: 15 // Por encima de las calles
      });

      this.mapa.addLayer(this.capaRutasAdmin);
      
      // Ajustar vista para mostrar todas las rutas
      const extent = this.capaRutasAdmin.getSource()?.getExtent();
      if (extent) {
        this.mapa.getView().fit(extent, { padding: [50, 50, 50, 50] });
      }
    }
  }

  /**
   * Selecciona y resalta una ruta específica del admin
   */
  seleccionarRutaAdmin(ruta: Ruta): void {

    if (!this.mapa || !ruta.shape) {
      console.warn('[DEBUG] Ruta sin shape o mapa no inicializado', ruta);
      return;
    }

    let shapeObj = ruta.shape as any;
    if (typeof shapeObj === 'string') {
      try {
        shapeObj = JSON.parse(shapeObj);
      } catch (e) {
        console.error('[DEBUG] No se pudo parsear el shape:', shapeObj);
        return;
      }
    }

    if (!shapeObj || !shapeObj.coordinates || !Array.isArray(shapeObj.coordinates) || shapeObj.coordinates.length === 0) {
      console.warn('[DEBUG] La ruta no tiene coordenadas validas o esta vacia:', shapeObj);
      // Limpiamos la ruta de todos modos para que el UI quite la seleccion visual de la anterior
      this.limpiarRutaAdminSeleccionada();
      this.rutaAdminSeleccionada.set(ruta);
      return;
    }

    // Limpiar selección anterior
    this.limpiarRutaAdminSeleccionada();

    // Ahora establecemos la nueva seleccionada
    this.rutaAdminSeleccionada.set(ruta);

    try {
      const coords = shapeObj.coordinates as any[];
      let geometry;

      if (shapeObj.type === 'MultiLineString' || (coords[0] && Array.isArray(coords[0]) && Array.isArray(coords[0][0]))) {
        const olCoordsMulti = coords.map((line: any[]) => line.map((c: number[]) => fromLonLat(c)));
        geometry = new MultiLineString(olCoordsMulti);
      } else {
        const olCoords = coords.map((c: number[]) => fromLonLat(c));
        geometry = new LineString(olCoords);
      }

      const lineaRuta = new Feature({
        geometry: geometry,
        type: 'ruta-admin-seleccionada',
        ruta: ruta
      });

      const color = ruta.color_hex || '#2dcecc';
      const estilo = [
        new Style({
          stroke: new Stroke({ color: 'rgba(255, 255, 255, 0.9)', width: 12 })
        }),
        new Style({
          stroke: new Stroke({ color: color, width: 6 }),
          text: new Text({
            text: ruta.nombre_ruta,
            font: 'bold 14px Inter, sans-serif',
            fill: new Fill({ color: '#ffffff' }),
            stroke: new Stroke({ color: '#000000', width: 4 }),
            offsetY: -15,
            placement: 'line'
          })
        })
      ];

      lineaRuta.setStyle(estilo);

      this.capaRuta = new VectorLayer({
        source: new VectorSource({ features: [lineaRuta] }),
        properties: { name: 'ruta-admin-seleccionada' },
        zIndex: 20
      });

      this.mapa.addLayer(this.capaRuta);

      const extent = this.capaRuta.getSource()?.getExtent();
      
      if (extent && extent.every(v => Number.isFinite(v))) {
        this.mapa.getView().fit(extent, { 
          padding: [30, 30, 30, 30],
          duration: 1000,
          maxZoom: 17
        });
      } else {
        console.error('[DEBUG] El extent calculado no es válido:', extent);
      }
    } catch (e) {
      console.error('[DEBUG] ERROR CRITICO dibujando ruta seleccionada:', e);
    }
  }

  /**
   * Limpia la ruta admin seleccionada
   */
  limpiarRutaAdminSeleccionada(): void {
    if (this.capaRuta && this.mapa) {
      this.mapa.removeLayer(this.capaRuta);
      this.capaRuta = null;
    }
    this.rutaAdminSeleccionada.set(null);
  }

  /**
   * Alternar visibilidad de las rutas del admin
   */
  toggleRutasAdmin(visible: boolean): void {
    if (this.capaRutasAdmin) {
      this.capaRutasAdmin.setVisible(visible);
    }
  }
}
