# Descargador de Calles - Buenaventura

Script Node.js para descargar automáticamente las calles de Buenaventura, Colombia desde OpenStreetMap.

## Uso

```bash
npm run download:streets
```

## Salida

- **Archivo**: `src/assets/data/buenaventura-streets.geojson`
- **Formato**: GeoJSON estándar compatible con Leaflet
- **Proyección**: WGS84 (EPSG:4326)

## Tipos de vías incluidas

- `primary` - Vías principales
- `secondary` - Vías secundarias  
- `tertiary` - Vías terciarias
- `residential` - Calles residenciales
- `unclassified` - Vías sin clasificar
- `living_street` - Calles peatonales
- `pedestrian` - Zonas peatonales
- `service` - Vías de servicio
- `road` - Vías genéricas

## Propiedades del GeoJSON

Cada feature incluye:

```json
{
  "id": 123456,
  "highway": "residential",
  "name": "Calle 1",
  "surface": "asphalt",
  "oneway": false,
  "lanes": 2
}
```

## Uso en Angular + Leaflet

```typescript
import * as L from 'leaflet';

// Cargar calles
const streetsData = await fetch('assets/data/buenaventura-streets.geojson')
  .then(r => r.json());

// Agregar al mapa
L.geoJSON(streetsData, {
  style: {
    color: '#3388ff',
    weight: 2,
    opacity: 0.6
  },
  onEachFeature: (feature, layer) => {
    if (feature.properties.name) {
      layer.bindPopup(feature.properties.name);
    }
  }
}).addTo(map);
```

## Notas

- Los datos provienen de OpenStreetMap (licencia ODbL)
- Se excluyen caminos rurales muy detallados para mantener el archivo ligero
- Tamaño típico: ~500KB - 2MB
