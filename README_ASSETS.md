# 🎨 Configuración de Iconos y Splash Screen

Este documento detalla los comandos y pasos necesarios para configurar o actualizar los iconos y la pantalla de inicio (splash screen) de la aplicación **Smart Trash Routes**.

## 🛠️ 1. Preparar las imágenes de origen

Las imágenes base deben estar ubicadas en la carpeta `assets/` en la raíz del proyecto. Estas imágenes sirven como fuente para generar todos los tamaños requeridos por las plataformas nativas.

| Archivo | Descripción | Dimensiones Sugeridas |
|---------|-------------|-----------------------|
| `assets/icon-only.png` | Icono principal de la app | 1024x1024 px |
| `assets/splash.png` | Pantalla de inicio | 2732x2732 px |

> **Nota:** La herramienta utiliza estas imágenes para crear las versiones `xxxhdpi`, `xxhdpi`, etc.

## ⚙️ 2. Generar recursos para las plataformas

Utilizamos la herramienta `@capacitor/assets` para automatizar la creación de los recursos.

### 📱 Para Android
Este comando genera los iconos en `android/app/src/main/res/mipmap-*` y las pantallas de splash en `drawable-*`.

```bash
npx @capacitor/assets generate --android
```

### 🌐 Para la Web (PWA)
Este comando genera los iconos para el navegador y el manifiesto de la aplicación web en `src/assets/icons/`.

```bash
npx @capacitor/assets generate --pwa
```

---

## 🚀 Comandos de utilidad usados en la configuración inicial

Si necesitas replicar la configuración inicial que hicimos:

```powershell
# 1. Crear carpeta de activos
mkdir assets

# 2. Copiar la imagen del cliente como fuentes oficiales
copy "src/assets/icon/icon.png.jpeg" "assets/icon-only.png"
copy "src/assets/icon/icon.png.jpeg" "assets/splash.png"

# 3. Generar los recursos
npx -y @capacitor/assets generate --android
npx @capacitor/assets generate --pwa
```

---
Desarrollado para **Smart Trash Routes** 🚛♻️
