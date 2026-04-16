#!/usr/bin/env node

/**
 * Script para descargar calles de Buenaventura, Colombia
 * desde OpenStreetMap usando Overpass API
 * Output: GeoJSON listo para Leaflet
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuración
const CONFIG = {
  // Overpass API endpoints (intentar alternativas si uno falla)
  overpassUrls: [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
  ],
  
  // Archivo de salida
  outputDir: path.join(__dirname, '..', 'src', 'assets', 'data'),
  outputFile: 'buenaventura-streets.geojson',
  
  // Query de Overpass para calles de Buenaventura, Colombia
  // Usa bounding box alrededor de Buenaventura (Valle del Cauca)
  // Coordenadas: approx -77.15 a -76.95 (lon), 3.75 a 4.0 (lat)
  overpassQuery: `
    [out:json][timeout:180];
    // Bounding box de Buenaventura, Colombia
    // minLon=-77.15, minLat=3.75, maxLon=-76.95, maxLat=4.0
    (
      way["highway"="primary"](3.75,-77.15,4.0,-76.95);
      way["highway"="secondary"](3.75,-77.15,4.0,-76.95);
      way["highway"="tertiary"](3.75,-77.15,4.0,-76.95);
      way["highway"="residential"](3.75,-77.15,4.0,-76.95);
      way["highway"="unclassified"](3.75,-77.15,4.0,-76.95);
      way["highway"="living_street"](3.75,-77.15,4.0,-76.95);
      way["highway"="pedestrian"](3.75,-77.15,4.0,-76.95);
      way["highway"="service"](3.75,-77.15,4.0,-76.95);
      way["highway"="road"](3.75,-77.15,4.0,-76.95);
      way["highway"="trunk"](3.75,-77.15,4.0,-76.95);
      way["highway"="motorway"](3.75,-77.15,4.0,-76.95);
    );
    out geom;
  `.trim()
};

// Colores ANSI para logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Función para hacer petición HTTP POST
function fetchOverpass(url, query, retryCount = 0) {
  return new Promise((resolve, reject) => {
    const maxRetries = CONFIG.overpassUrls.length;
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'BuenaventuraMapDownloader/1.0'
      }
    };

    log(`\n📡 Intentando con: ${url}`, 'cyan');
    
    const req = https.request(url, options, (res) => {
      let data = '';
      
      // Manejar redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        log(`🔄 Redireccionando a: ${res.headers.location}`, 'yellow');
        return fetchOverpass(res.headers.location, query).then(resolve).catch(reject);
      }
      
      if (res.statusCode !== 200) {
        // Intentar con siguiente URL si hay error
        if (retryCount < maxRetries - 1) {
          log(`⚠️  Error ${res.statusCode}, intentando alternativa...`, 'yellow');
          return fetchOverpass(CONFIG.overpassUrls[retryCount + 1], query, retryCount + 1)
            .then(resolve).catch(reject);
        }
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }

      res.on('data', chunk => data += chunk);
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Error parseando JSON: ' + e.message));
        }
      });
    });

    req.on('error', (err) => {
      if (retryCount < maxRetries - 1) {
        log(`⚠️  Error de conexión, intentando alternativa...`, 'yellow');
        fetchOverpass(CONFIG.overpassUrls[retryCount + 1], query, retryCount + 1)
          .then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      if (retryCount < maxRetries - 1) {
        log(`⏱️  Timeout, intentando alternativa...`, 'yellow');
        fetchOverpass(CONFIG.overpassUrls[retryCount + 1], query, retryCount + 1)
          .then(resolve).catch(reject);
      } else {
        reject(new Error('Timeout'));
      }
    });

    req.setTimeout(120000); // 2 minutos timeout
    req.write(`data=${encodeURIComponent(query)}`);
    req.end();
  });
}

// Convertir respuesta Overpass a GeoJSON
function convertToGeoJSON(overpassData) {
  const features = [];
  
  if (!overpassData.elements || !Array.isArray(overpassData.elements)) {
    throw new Error('Formato de datos inválido');
  }

  overpassData.elements.forEach(element => {
    if (element.type === 'way' && element.geometry) {
      const coordinates = element.geometry.map(node => [node.lon, node.lat]);
      
      // Solo incluir ways con al menos 2 puntos
      if (coordinates.length >= 2) {
        features.push({
          type: 'Feature',
          properties: {
            id: element.id,
            highway: element.tags?.highway || 'unknown',
            name: element.tags?.name || null,
            surface: element.tags?.surface || null,
            oneway: element.tags?.oneway === 'yes',
            lanes: element.tags?.lanes ? parseInt(element.tags.lanes) : null
          },
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        });
      }
    }
  });

  return {
    type: 'FeatureCollection',
    features: features,
    metadata: {
      generated_at: new Date().toISOString(),
      source: 'OpenStreetMap via Overpass API',
      area: 'Buenaventura, Valle del Cauca, Colombia',
      total_features: features.length
    }
  };
}

// Función principal
async function main() {
  log('╔════════════════════════════════════════════════════════╗', 'green');
  log('║   Descargador de Calles - Buenaventura, Colombia       ║', 'green');
  log('╚════════════════════════════════════════════════════════╝', 'green');
  
  try {
    // Crear directorio si no existe
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
      log(`📁 Directorio creado: ${CONFIG.outputDir}`, 'blue');
    }

    log('\n🔍 Descargando datos de OpenStreetMap...', 'yellow');
    log(`⏳ Esto puede tomar 1-2 minutos...`, 'yellow');
    
    // Descargar datos
    const overpassData = await fetchOverpass(CONFIG.overpassUrls[0], CONFIG.overpassQuery);
    
    log(`✅ Datos recibidos: ${overpassData.elements?.length || 0} elementos`, 'green');
    
    // Convertir a GeoJSON
    log('🔄 Convirtiendo a GeoJSON...', 'yellow');
    const geojson = convertToGeoJSON(overpassData);
    
    // Guardar archivo
    const outputPath = path.join(CONFIG.outputDir, CONFIG.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));
    
    // Stats
    const fileSizeKB = (fs.statSync(outputPath).size / 1024).toFixed(2);
    const highwayTypes = {};
    geojson.features.forEach(f => {
      const type = f.properties.highway;
      highwayTypes[type] = (highwayTypes[type] || 0) + 1;
    });
    
    log('\n📊 ESTADÍSTICAS:', 'cyan');
    log(`   📍 Total de vías: ${geojson.features.length}`, 'reset');
    log(`   💾 Tamaño archivo: ${fileSizeKB} KB`, 'reset');
    log(`   📁 Ubicación: ${outputPath}`, 'reset');
    
    log('\n🛣️  TIPOS DE VÍAS:', 'cyan');
    Object.entries(highwayTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        log(`   • ${type}: ${count}`, 'reset');
      });
    
    log('\n✅ ¡Descarga completada exitosamente!', 'green');
    log(`\n💡 Para usar en tu app Ionic/Angular:`, 'cyan');
    log(`   import * as L from 'leaflet';`, 'reset');
    log(`   const streets = await fetch('assets/data/${CONFIG.outputFile}').then(r => r.json());`, 'reset');
    log(`   L.geoJSON(streets).addTo(map);`, 'reset');
    
  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
main();
