Add-Type -AssemblyName System.Drawing

$iconSrc   = "d:\7 SEMESTRE\Nueva carpeta\Assets\icon.png"
$assetsDir = "d:\7 SEMESTRE\Nueva carpeta\Smart-trash-routes-frontend\assets"

# ─── Copiar íconos ────────────────────────────────────────────────────────────
Copy-Item $iconSrc "$assetsDir\icon-only.png" -Force
Copy-Item $iconSrc "$assetsDir\icon.png"      -Force
Write-Host "Icons copied."

# ─── Samplear el color exacto del borde del ícono ────────────────────────────
$iconBmp     = New-Object System.Drawing.Bitmap($iconSrc)
$cornerColor = $iconBmp.GetPixel(4, 4)   # esquina top-left del ícono
$iconBmp.Dispose()
Write-Host "Corner color sampled: R=$($cornerColor.R) G=$($cornerColor.G) B=$($cornerColor.B)"

# ─── Helper: crear splash ────────────────────────────────────────────────────
function Create-Splash($outputPath, $bgColor, $splashSize, $iconSize) {
    $bmp = New-Object System.Drawing.Bitmap($splashSize, $splashSize)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear($bgColor)

    $icon = [System.Drawing.Image]::FromFile($iconSrc)
    $x    = [int](($splashSize - $iconSize) / 2)
    $y    = [int](($splashSize - $iconSize) / 2)
    $g.DrawImage($icon, $x, $y, $iconSize, $iconSize)
    $icon.Dispose()
    $g.Dispose()

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created: $outputPath"
}

# ─── Splash CLARO: fondo = color del borde del ícono → cuadrito invisible ────
Create-Splash "$assetsDir\splash.png" $cornerColor 2732 1800

# ─── Splash OSCURO: fondo navy oscuro, ícono grande centrado ─────────────────
$darkColor = [System.Drawing.Color]::FromArgb(255, 15, 23, 42)
Create-Splash "$assetsDir\splash-dark.png" $darkColor 2732 1800

Write-Host "All splash assets ready."
