# Leyenda de Colores de las Calles en el Mapa

Los colores de las calles en el mapa de la aplicación representan los diferentes **tipos de vías** según su importancia y uso, diseñados con colores brillantes (estilo neón) para destacar en el diseño visual de la aplicación. 

A continuación se detalla el significado de cada color basado en la configuración del mapa (`mapa.service.ts`):

*   🟩 **Verde Esmeralda Neón (`#00FF88`)**: Vías **Primarias y Secundarias**. Son las avenidas principales y calles de mayor tráfico en Buenaventura. Se representan con las líneas más gruesas del mapa.
*   🟦 **Cyan Brillante / Celeste (`#00E5FF`)**: Vías **Terciarias** y calles por defecto. Son calles conectoras de importancia media.
*   🟨 **Amarillo Dorado (`#FFB800`)**: Vías **Residenciales**. Son las calles internas de los barrios y vecindarios.
*   🟧 **Coral / Rojizo (`#FF6B6B`)**: Vías **Peatonales**. Zonas de acceso exclusivo para peatones.
*   🟪 **Púrpura (`#C084FC`)**: Vías **de Servicio** o calles sin clasificar. Suelen ser accesos privados, vías industriales o callejones menores.

> [!NOTE]
> Además de los colores de las calles, la **ruta trazada para los camiones** se muestra resaltada en un color específico de cada ruta (por defecto turquesa) con un contorno blanco muy grueso. Las calles principales también muestran su nombre en color blanco con un borde negro para facilitar la lectura sobre los distintos fondos.
