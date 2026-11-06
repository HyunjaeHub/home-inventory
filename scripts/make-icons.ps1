# 앱 아이콘 PNG 만들기 (Windows PowerShell)
# assets/icon/app-icon.svg와 같은 좌표(120 기준)로 그린다. 아이콘을 바꾸면 두 파일을 함께 고친다.
#   powershell -ExecutionPolicy Bypass -File scripts/make-icons.ps1
Add-Type -AssemblyName System.Drawing

$BG = '#DCD7FF'
$SHELF = '#4B3FB0'

function Color($hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }

function RoundRect($g, $s, $x, $y, $w, $h, $r, $fill, $stroke = $null, $strokeW = 0) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $X = $x * $s; $Y = $y * $s; $W = $w * $s; $H = $h * $s; $R = [Math]::Min($r * $s, [Math]::Min($W, $H) / 2)
  $d = $R * 2
  if ($d -le 0) { $path.AddRectangle((New-Object System.Drawing.RectangleF $X, $Y, $W, $H)) }
  else {
    $path.AddArc($X, $Y, $d, $d, 180, 90)
    $path.AddArc($X + $W - $d, $Y, $d, $d, 270, 90)
    $path.AddArc($X + $W - $d, $Y + $H - $d, $d, $d, 0, 90)
    $path.AddArc($X, $Y + $H - $d, $d, $d, 90, 90)
    $path.CloseFigure()
  }
  $g.FillPath((New-Object System.Drawing.SolidBrush (Color $fill)), $path)
  if ($stroke) { $g.DrawPath((New-Object System.Drawing.Pen (Color $stroke), ($strokeW * $s)), $path) }
}

# $background: 바탕을 칠할지 (스플래시용은 투명)
function Draw($size, $out, $background = $true, $scale = 1.0) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.PixelOffsetMode = 'HighQuality'
  if ($background) { $g.Clear((Color $BG)) } else { $g.Clear([System.Drawing.Color]::Transparent) }
  $s = $size / 120 * $scale
  # 축소할 때도 가운데에 오도록
  $g.TranslateTransform(($size - 120 * $s) / 2, ($size - 120 * $s) / 2)

  RoundRect $g $s 22 56 76 6 3 $SHELF
  RoundRect $g $s 22 92 76 6 3 $SHELF
  RoundRect $g $s 28 30 18 26 9 '#FFFFFF' $SHELF 3
  $g.FillEllipse((New-Object System.Drawing.SolidBrush (Color $SHELF)), 33 * $s, 39 * $s, 8 * $s, 8 * $s)
  RoundRect $g $s 52 34 14 22 3 '#1F4FB8'
  RoundRect $g $s 56 28 6 7 2 '#1F4FB8'
  RoundRect $g $s 72 38 20 18 3 '#E07A3F'
  RoundRect $g $s 30 70 26 22 4 '#2E8B63'
  RoundRect $g $s 62 66 12 26 3 '#FFFFFF'
  RoundRect $g $s 78 74 14 18 3 '#2F6F73'

  $g.Dispose()
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "$out ($size px)"
}

$root = Split-Path -Parent $PSScriptRoot
Draw 1024 "$root/assets/images/icon.png"            # 앱 아이콘 (iOS·Expo)
Draw 180  "$root/public/apple-touch-icon.png"       # 아이폰 홈 화면 웹앱
Draw 48   "$root/assets/images/favicon.png"         # 웹 파비콘
Draw 512  "$root/assets/images/splash-icon.png" $false  # 스플래시 (바탕은 app.json 색)
# Android 적응형 아이콘: 바탕은 app.json 색, 그림은 가운데 안전 영역(약 66%)에
Draw 1024 "$root/assets/images/android-icon-foreground.png" $false 0.66
