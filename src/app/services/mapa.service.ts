import { Injectable, signal } from '@angular/core';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Feature } from 'ol';
import { Point, LineString } from 'ol/geom';
import { Style, Icon, Stroke, Fill, Circle as CircleStyle } from 'ol/style';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import { Geolocation } from '@capacitor/geolocation';

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
  private posicionUsuario = signal<[number, number] | null>(null);
  private puntosRecogida = signal<PuntoRecogida[]>([]);
  private rutaActual = signal<RutaUsuario | null>(null);

  readonly posicionUsuarioSignal = this.posicionUsuario.asReadonly();
  readonly puntosRecogidaSignal = this.puntosRecogida.asReadonly();
  readonly rutaActualSignal = this.rutaActual.asReadonly();

  constructor() {
    this.cargarPuntosRecogida();
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
      view: new View({
        center: fromLonLat([-77.0451, 3.8850]), // Buenaventura, Colombia
        zoom: 13,
        minZoom: 12,
        maxZoom: 18,
        extent: extentProyectado // Restringe navegación
      })
    });

    this.obtenerPosicionActual();
    return this.mapa;
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

  private cargarPuntosRecogida(): void {
    const puntos: PuntoRecogida[] = [
      {
        id: '1',
        nombre: 'Centro de Reciclaje - Cascajal',
        tipo: TipoResiduo.PLASTICO,
        coordenadas: [-77.0280, 3.8855],
        direccion: 'Calle 1 # 5-45, Cascajal',
        horario: 'Lun-Sáb 7:00-18:00'
      },
      {
        id: '2',
        nombre: 'Punto Verde - San Antonio',
        tipo: TipoResiduo.VIDRIO,
        coordenadas: [-77.0400, 3.8950],
        direccion: 'Carrera 6 # 4-23, San Antonio',
        horario: 'Lun-Vie 8:00-17:00'
      },
      {
        id: '3',
        nombre: 'Reciclaje Bahía - Malecón',
        tipo: TipoResiduo.ORGANICO,
        coordenadas: [-77.0720, 3.8930],
        direccion: 'Avenida del Malecón # 1-10',
        horario: 'Lun-Sáb 6:00-20:00'
      },
      {
        id: '4',
        nombre: 'Eco Punto - Juan XXIII',
        tipo: TipoResiduo.PAPEL,
        coordenadas: [-77.0350, 3.8800],
        direccion: 'Calle 5 # 8-67, Juan XXIII',
        horario: 'Lun-Vie 7:00-18:00'
      },
      {
        id: '5',
        nombre: 'Punto Limpio - Piñal',
        tipo: TipoResiduo.ESPECIAL,
        coordenadas: [-77.0200, 3.9100],
        direccion: 'Carrera 10 # 12-30, El Piñal',
        horario: 'Mar-Sáb 8:00-16:00'
      },
      {
        id: '6',
        nombre: 'Reciclaje Local - San Pedro',
        tipo: TipoResiduo.PLASTICO,
        coordenadas: [-77.0550, 3.8750],
        direccion: 'Calle 8 # 4-12, San Pedro Claver',
        horario: 'Lun-Sáb 7:00-19:00'
      }
    ];

    this.puntosRecogida.set(puntos);
    this.agregarMarcadoresPuntos(puntos);
  }

  private agregarMarcadoresPuntos(puntos: PuntoRecogida[]): void {
    if (!this.mapa) return;

    const features = puntos.map(punto => {
      const feature = new Feature({
        geometry: new Point(fromLonLat(punto.coordenadas)),
        type: 'punto-recogida',
        punto
      });

      const estilo = this.obtenerEstiloPorTipo(punto.tipo);
      feature.setStyle(estilo);
      return feature;
    });

    const capaPuntos = new VectorLayer({
      source: new VectorSource({
        features
      })
    });

    this.mapa.addLayer(capaPuntos);
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
}
