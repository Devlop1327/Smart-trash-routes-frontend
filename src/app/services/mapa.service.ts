import { Injectable, signal, inject } from '@angular/core';
import { Map, View, Overlay } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Feature } from 'ol';
import { Point, LineString, MultiLineString } from 'ol/geom';
import { Style, Icon, Stroke, Fill, Circle as CircleStyle, Text } from 'ol/style';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import { Geolocation } from '@capacitor/geolocation';
import { Zoom } from 'ol/control';
import { GeoJSON } from 'ol/format';
import { defaults as defaultInteractions, DragPan, MouseWheelZoom } from 'ol/interaction';
import { RutasService, Ruta } from './rutas.service';
import { environment } from '../../environments/environment';

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

  private capaCamiones: VectorLayer | null = null;
  private popupOverlay: any = null;
  private camionesFeatures: globalThis.Map<number, Feature> = new globalThis.Map();
  private websockets: globalThis.Map<number, WebSocket> = new globalThis.Map();
  private asignacionesActivasMap: globalThis.Map<number, any> = new globalThis.Map();

  // Estados de conexión para la UI
  private _trackingStatus = signal<'conectando' | 'conectado' | 'error' | 'inactivo'>('inactivo');
  private _trackingCount = signal<number>(0);
  private truckFocusId = signal<number | null>(null);
  private offscreenIndicator: HTMLElement | null = null;

  readonly trackingStatus = this._trackingStatus.asReadonly();
  readonly trackingCount = this._trackingCount.asReadonly();
  readonly camionesPositions = signal<globalThis.Map<number, [number, number]>>(new globalThis.Map());
  readonly asignacionesActivas = signal<any[]>([]);

  readonly posicionUsuarioSignal = this.posicionUsuario.asReadonly();
  readonly puntosRecogidaSignal = this.puntosRecogida.asReadonly();
  readonly rutaActualSignal = this.rutaActual.asReadonly();
  readonly rutasAdminSignal = this.rutasAdmin.asReadonly();
  readonly rutaAdminSeleccionadaSignal = this.rutaAdminSeleccionada.asReadonly();

  private rutasService = inject(RutasService);

  constructor() {
    // Ya no pedimos ubicación al inicio por defecto
    this.iniciarRastreoCamiones();
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
      interactions: defaultInteractions({
        dragPan: false, // Desactivamos el por defecto para poner el nuestro
        mouseWheelZoom: false
      }).extend([
        new DragPan({
          condition: (event) => true, // Permitir siempre
        }),
        new MouseWheelZoom({
          duration: 250
        })
      ]),
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

    this.cargarCallesBuenaventura();
    this.iniciarCapaCamiones();
    this.iniciarPopup();
    
    setTimeout(() => {
      this.mapa?.updateSize();
    }, 200);

    // Listener de clics para el popup
    this.mapa?.on('click', (evt) => {
      const feature = this.mapa?.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (feature && feature.get('type') === 'camion') {
        this.truckFocusId.set(feature.get('idAsignacion'));
        this.mostrarPopupCamion(feature, evt.coordinate);
      } else {
        this.ocultarPopup();
        this.truckFocusId.set(null);
      }
    });

    // Listener para el indicador fuera de pantalla
    this.mapa?.on('postrender', () => this.actualizarIndicadorFueraDePantalla());

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

  public centrarMapaEnPosicion(coords: [number, number], zoom: number = 15): void {
    if (!this.mapa) return;

    this.mapa.getView().animate({
      center: fromLonLat(coords),
      zoom: zoom,
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
    const activeRouteIds = new Set(this.asignacionesActivas().map(a => a.id_ruta));

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
        const isLive = activeRouteIds.has(ruta.id_ruta);

        const estilo = new Style({
          stroke: new Stroke({ color: color, width: isLive ? 8 : 5 }),
          text: isLive ? new Text({
            text: '🔴 VIVO',
            font: 'black 10px Inter, sans-serif',
            fill: new Fill({ color: '#ffffff' }),
            stroke: new Stroke({ color: '#ff0000', width: 3 }),
            offsetY: -10,
            placement: 'line',
            repeat: 1000
          }) : undefined
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
  seleccionarRutaAdmin(ruta: Ruta | null): void {
    if (!this.mapa) return;

    if (!ruta) {
      this.limpiarRutaAdminSeleccionada();
      return;
    }

    if (!ruta.shape) {
      console.warn('[DEBUG] Ruta sin shape', ruta);
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

  // ==================== RASTREO DE CAMIONES EN VIVO ====================

  private iniciarCapaCamiones(): void {
    if (!this.mapa) return;

    this.capaCamiones = new VectorLayer({
      source: new VectorSource(),
      properties: { name: 'camiones-activos' },
      zIndex: 25 // Por encima de todo
    });

    this.mapa.addLayer(this.capaCamiones);
  }

  private iniciarRastreoCamiones(): void {
    // Primera carga
    this.consultarAsignacionesActivas();

    // Polling cada 5 segundos para detectar nuevos camiones en ruta
    setInterval(() => {
      this.consultarAsignacionesActivas();
    }, 5000);
  }

  private consultarAsignacionesActivas(): void {
    this.rutasService.obtenerAsignacionesActivas().subscribe({
      next: (asignaciones) => {
        if (asignaciones.length > 0) {
          this._trackingStatus.set('conectando');
        } else {
          this._trackingStatus.set('inactivo');
        }

        asignaciones.forEach(asig => {
          // Guardar la información completa de la asignación
          if (asig.id_asignacion) {
            this.asignacionesActivasMap.set(asig.id_asignacion, asig);
          }
          this.conectarWebSocketCamion(asig.id_asignacion);
        });
        
        this.asignacionesActivas.set(asignaciones);
        this._trackingCount.set(this.websockets.size);
      },
      error: (err) => {
        console.error('Error obteniendo asignaciones activas:', err);
        this._trackingStatus.set('error');
      }
    });
  }

  private conectarWebSocketCamion(idAsignacion: number): void {
    if (this.websockets.has(idAsignacion)) return;

    let wsUrl = environment.apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    wsUrl = wsUrl.replace('/api', '');
    
    const finalWsUrl = `${wsUrl}/ws/public/asignacion/${idAsignacion}`;

    const ws = new WebSocket(finalWsUrl);

    ws.onopen = () => {
      this._trackingStatus.set('conectado');
      this.websockets.set(idAsignacion, ws);
      this._trackingCount.set(this.websockets.size);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.evento === 'posicion_actualizada') {
          const lat = data.latitud !== undefined ? data.latitud : (data.data && data.data.lat);
          const lon = data.longitud !== undefined ? data.longitud : (data.data && data.data.lon);

          if (lat && lon) {
            this.actualizarPosicionCamion(idAsignacion, parseFloat(lon), parseFloat(lat), data.id_ruta);
          } else {
            console.warn(`[Rastreo] Posición incompleta en mensaje:`, data);
          }
        } else if (data.evento === 'recorrido_finalizado' || data.evento === 'asignacion_cancelada') {
          this.removerCamion(idAsignacion);
        }
      } catch (e) {
        console.error('Error parseando mensaje WS:', e);
      }
    };

    ws.onerror = (error) => {
      console.error(`[Rastreo] Error en WebSocket ${idAsignacion}:`, error);
      this._trackingStatus.set('error');
    };

    ws.onclose = (event) => {
      this.websockets.delete(idAsignacion);
      this._trackingCount.set(this.websockets.size);
      if (this.websockets.size === 0) {
        this._trackingStatus.set('inactivo');
      }
    };
  }

  private actualizarPosicionCamion(idAsignacion: number, lon: number, lat: number, idRuta?: string): void {
    if (!this.capaCamiones) {
      console.error('[Rastreo] Capa de camiones no inicializada');
      return;
    }
    const source = this.capaCamiones.getSource();
    if (!source) return;

    let feature = this.camionesFeatures.get(idAsignacion);

    // Obtener información rica de la asignación
    const infoAsig = this.asignacionesActivasMap.get(idAsignacion);
    const nombreRuta = infoAsig?.ruta?.nombre_ruta || idRuta || infoAsig?.id_ruta || 'Desconocida';
    const placaVehiculo = infoAsig?.vehiculo?.placa || 'Desconocido';

    if (!feature) {
      feature = new Feature({
        geometry: new Point(fromLonLat([lon, lat])),
        type: 'camion',
        idAsignacion: idAsignacion,
        nombreRuta: nombreRuta,
        placaVehiculo: placaVehiculo
      });

      // Estilo ultra-visible: Círculo blanco + Texto (Emoji)
      // Esto garantiza que se vea incluso si el SVG falla
      const estiloCamion = [
        new Style({
          image: new CircleStyle({
            radius: 20,
            fill: new Fill({ color: '#fff' }),
            stroke: new Stroke({ color: '#000', width: 2 })
          })
        }),
        new Style({
          text: new Text({
            text: '🚛',
            scale: 2.5,
            offsetY: 0
          })
        })
      ];

      feature.setStyle(estiloCamion);
      source.addFeature(feature);
      this.camionesFeatures.set(idAsignacion, feature);
      
      // Centrar el mapa en el camión la primera vez
      this.mapa?.getView().animate({
        center: fromLonLat([lon, lat]),
        zoom: 16,
        duration: 1000
      });
    } else {
      const geometry = feature.getGeometry() as Point;
      if (geometry) {
        geometry.setCoordinates(fromLonLat([lon, lat]));
      }
      feature.set('nombreRuta', nombreRuta);
      feature.set('placaVehiculo', placaVehiculo);
    }

    // Actualizar señal de posiciones para componentes externos (Dashboard)
    this.camionesPositions.update(map => {
      map.set(idAsignacion, [lon, lat]);
      return new globalThis.Map(map);
    });
  }

  private removerCamion(idAsignacion: number): void {
    // Cerrar WS
    const ws = this.websockets.get(idAsignacion);
    if (ws) {
      ws.close();
      this.websockets.delete(idAsignacion);
    }

    // Remover marcador
    if (this.capaCamiones) {
      const source = this.capaCamiones.getSource();
      const feature = this.camionesFeatures.get(idAsignacion);
      if (source && feature) {
        source.removeFeature(feature);
      }
      this.camionesFeatures.delete(idAsignacion);
    }
    
    // Remover de posiciones
    this.camionesPositions.update(map => {
      map.delete(idAsignacion);
      return new globalThis.Map(map);
    });
  }

  /**
   * Enfoca el mapa en el camión que está cubriendo una ruta específica
   */
  enfocarCamionPorRuta(idRuta: string): void {
    const asig = this.asignacionesActivas().find(a => a.id_ruta === idRuta);
    if (asig) {
      this.truckFocusId.set(asig.id_asignacion);
      const pos = this.camionesPositions().get(asig.id_asignacion);
      if (pos) {
        console.log(`[Rastreo] Enfocando camión de la ruta ${idRuta} en posición:`, pos);
        this.centrarMapaEnPosicion(pos, 17);
        
        // Abrir el popup del camión si existe el feature
        const feature = this.camionesFeatures.get(asig.id_asignacion);
        if (feature) {
          this.mostrarPopupCamion(feature, fromLonLat(pos));
        }
      } else {
        console.warn(`[Rastreo] No hay posición conocida para el camión de la ruta ${idRuta}`);
      }
    }
  }

  private actualizarIndicadorFueraDePantalla(): void {
    const idAsig = this.truckFocusId();
    if (!idAsig || !this.mapa) {
      if (this.offscreenIndicator) this.offscreenIndicator.style.display = 'none';
      return;
    }

    const feature = this.camionesFeatures.get(idAsig);
    if (!feature) {
      if (this.offscreenIndicator) this.offscreenIndicator.style.display = 'none';
      return;
    }

    const geometry = feature.getGeometry() as Point;
    const coords = geometry.getCoordinates();
    const pixel = this.mapa.getPixelFromCoordinate(coords);
    const size = this.mapa.getSize();

    if (!pixel || !size) return;

    const margin = 40;
    const isOffscreen = pixel[0] < margin || pixel[0] > size[0] - margin || 
                        pixel[1] < margin || pixel[1] > size[1] - margin;

    if (!isOffscreen) {
      if (this.offscreenIndicator) this.offscreenIndicator.style.display = 'none';
      return;
    }

    if (!this.offscreenIndicator) {
      this.crearIndicadorFueraDePantalla();
    }

    if (this.offscreenIndicator) {
      this.offscreenIndicator.style.display = 'flex';
      
      // Calcular posición en el borde
      let x = Math.max(margin, Math.min(size[0] - margin, pixel[0]));
      let y = Math.max(margin, Math.min(size[1] - margin, pixel[1]));
      
      this.offscreenIndicator.style.left = `${x}px`;
      this.offscreenIndicator.style.top = `${y}px`;

      // Calcular ángulo para la flecha
      const centerX = size[0] / 2;
      const centerY = size[1] / 2;
      const angle = Math.atan2(pixel[1] - centerY, pixel[0] - centerX);
      this.offscreenIndicator.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
    }
  }

  private crearIndicadorFueraDePantalla(): void {
    const indicator = document.createElement('div');
    indicator.className = 'offscreen-truck-indicator';
    indicator.style.position = 'absolute';
    indicator.style.zIndex = '1000';
    indicator.style.width = '40px';
    indicator.style.height = '40px';
    indicator.style.backgroundColor = '#00FF88';
    indicator.style.borderRadius = '50%';
    indicator.style.boxShadow = '0 0 15px rgba(0, 255, 136, 0.5)';
    indicator.style.display = 'none';
    indicator.style.alignItems = 'center';
    indicator.style.justifyContent = 'center';
    indicator.style.cursor = 'pointer';
    indicator.style.pointerEvents = 'auto';

    const arrow = document.createElement('div');
    arrow.innerHTML = '▲';
    arrow.style.color = '#000';
    arrow.style.fontSize = '18px';
    indicator.appendChild(arrow);

    indicator.onclick = () => {
      const id = this.truckFocusId();
      if (id) this.enfocarCamion(id);
    };

    const mapElement = this.mapa?.getTargetElement();
    if (mapElement) {
      mapElement.appendChild(indicator);
      this.offscreenIndicator = indicator;
    }
  }

  private iniciarPopup(): void {
    if (!this.mapa) return;

    // Crear el elemento HTML del popup dinámicamente
    const container = document.createElement('div');
    container.id = 'popup-camion';
    container.style.background = 'rgba(10, 25, 47, 0.95)';
    container.style.color = '#fff';
    container.style.padding = '10px 15px';
    container.style.borderRadius = '8px';
    container.style.border = '1px solid #00E5FF';
    container.style.fontSize = '14px';
    container.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)';
    container.style.minWidth = '180px';
    container.style.pointerEvents = 'none';
    container.style.display = 'none';
    container.style.position = 'absolute';
    container.style.zIndex = '1000';
    
    document.body.appendChild(container);

    this.popupOverlay = new Overlay({
      element: container,
      autoPan: {
        animation: {
          duration: 250
        }
      },
      offset: [0, -40] // Desplazar hacia arriba para no tapar el icono
    });

    this.mapa.addOverlay(this.popupOverlay);
  }

  private mostrarPopupCamion(feature: any, coordinate: any): void {
    const element = this.popupOverlay.getElement();
    const nombreRuta = feature.get('nombreRuta');
    const placa = feature.get('placaVehiculo');
    const idAsig = feature.get('idAsignacion');

    element.innerHTML = `
      <div style="font-weight: bold; color: #00E5FF; margin-bottom: 6px; border-bottom: 1px solid rgba(0,229,255,0.2); padding-bottom: 4px;">
        ${nombreRuta}
      </div>
      <div style="display: flex; flex-direction: column; gap: 3px; font-size: 13px;">
        <div>Placa: <span style="color: #00FF88; font-weight: bold;">${placa}</span></div>
        <div style="font-size: 11px; opacity: 0.7;">ID Asig: #${idAsig}</div>
        <div style="font-size: 10px; color: #00FF88; margin-top: 4px; display: flex; items-center; gap: 4px;">
          <span style="display: inline-block; width: 6px; height: 6px; background: #00FF88; border-radius: 50%; animation: pulse 1s infinite;"></span>
          En vivo
        </div>
      </div>
    `;
    
    element.style.display = 'block';
    this.popupOverlay.setPosition(coordinate);
  }

  private ocultarPopup(): void {
    if (this.popupOverlay) {
      const element = this.popupOverlay.getElement();
      if (element) element.style.display = 'none';
    }
  }

  /**
   * Enfoca el mapa en un camión específico
   */
  public enfocarCamion(idAsignacion: number): void {
    this.truckFocusId.set(idAsignacion);
    const feature = this.camionesFeatures.get(idAsignacion);
    if (feature && this.mapa) {
      const geometry = feature.getGeometry() as Point;
      if (geometry) {
        const coords = geometry.getCoordinates();
        this.mapa.getView().animate({
          center: coords,
          zoom: 17,
          duration: 1000
        });
        
        // Mostrar popup automáticamente al enfocar
        setTimeout(() => {
          this.mostrarPopupCamion(feature, coords);
        }, 1100);
      }
    } else {
      console.warn(`[MapaService] No se encontró el camión con ID ${idAsignacion} para enfocar.`);
    }
  }
}
