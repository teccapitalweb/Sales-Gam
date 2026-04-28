# 🏆 SALES ARENA

> Dashboard de ventas en tiempo real estilo videojuego para **TEC CAPITAL × IPCI**.

Proyección en pantalla grande del **TOP 4 vendedores** con barras animadas, avatares cyberpunk, partículas, confeti, y modo idle. La contadora registra ventas desde un **panel de control independiente** y el ranking se actualiza al instante en la pantalla principal — incluso si está abierta en otra pestaña o en otra computadora del mismo navegador.

![Stack](https://img.shields.io/badge/React-18-61dafb?logo=react)
![Stack](https://img.shields.io/badge/Vite-5-646cff?logo=vite)
![Stack](https://img.shields.io/badge/Framer_Motion-11-ff0080)

---

## ✨ Características

### Pantalla principal (modo proyección) — `/`
- **TOP 4** con barras dinámicas que suben en spring animation.
- Avatares animales cyberpunk en SVG con animación idle (respiración).
- HUD con título neón, reloj en tiempo real y total de ventas.
- **Eventos visuales**:
  - `+1` flotante al recibir venta.
  - `▲ SUBE` cuando un vendedor entra al TOP 4.
  - **NEW LEADER** banner gigante + confeti cuando hay nuevo #1.
  - **Burbuja con confeti** cuando alguien fuera del TOP 4 hace una venta.
- **Modo idle** después de 30s sin actividad: partículas se calman + mensaje "ESPERANDO VENTAS".
- Banca con los vendedores 5° en adelante.

### Panel de control — `/#/control`
- Botones organizados **POR PÁGINA** (no por vendedor) como pidió el brief.
- Cada botón muestra: avatar del vendedor, nombre, página, contador de la página y total del vendedor.
- Stats rápidas: ventas totales, líder actual, etc.
- Botones de **deshacer** y **reset** con confirmación.
- Tabla resumen del ranking completo.

---

## 🎨 Diseño

| Elemento     | Decisión |
|---|---|
| Dirección    | Dark premium / Tech / Videojuego |
| Tipografía   | `Orbitron` (display) + `Rajdhani` (body) + `Share Tech Mono` (HUD) |
| Paleta       | Amarillo, Naranja, Azul pastel, Rosa, Verde celeste, Morado |
| Fondo        | Negro profundo + grid CRT + scanlines + partículas conectadas |
| Animaciones  | Framer Motion + canvas-confetti |

Cada vendedor tiene su propio color de la paleta para que la pantalla SIEMPRE tenga las 6 familias visibles cuando hay actividad.

---

## 👥 Vendedores y avatares

| Vendedor   | Avatar    | Color         | Páginas asignadas                  |
|---|---|---|---|
| Josué      | 🐺 Lobo     | Azul pastel   | Sinergia-Bionova                   |
| Ana        | 🦅 Águila   | Amarillo      | AgroTec                            |
| José       | 🐯 Tigre    | Naranja       | Bioterra · Zoorigen                |
| Daisy      | 🦊 Zorro    | Rosa          | IMDIIL · GlobalVet                 |
| Daniela    | 🐈‍⬛ Pantera  | Morado        | Dermalysse                         |
| Ani Reyes  | 🪶 Halcón   | Verde celeste | Synova                             |
| Eli        | 🦁 León     | Naranja-amar. | Visión Pecuaria · Ing. Avícola     |
| Anni       | 🦉 Búho     | Morado-azul   | ICADEM · IMDAC                     |
| Carla      | 🐲 Dragón   | Rosa-naranja  | Fisiotec · Odonteck                |

> Para cambiar páginas, vendedores o colores: edita `src/data/sellers.js`.

---

## 🚀 Cómo correr en local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Abrir en el navegador
# http://localhost:5173/         -> pantalla principal (proyección)
# http://localhost:5173/#/control -> panel de la contadora
```

> **Tip de uso real:** en la compu de la contadora abre `#/control`. En la pantalla grande abre `/`. Pueden ser dos pestañas del mismo navegador o dos computadoras distintas si compartes la pantalla por proyección/cast — siempre que compartan `localStorage` (misma pestaña/máquina).

---

## 🌐 Deploy en GitHub Pages

```bash
# 1. Crear repo público en GitHub (ej: sales-arena)
# 2. Conectar y subir
git init
git add .
git commit -m "feat: sales arena v1"
git branch -M main
git remote add origin https://github.com/teccapitalweb/sales-arena.git
git push -u origin main

# 3. Deploy
npm run deploy
```

Esto publica `dist/` en la rama `gh-pages`. Después en GitHub → Settings → Pages → Source: `gh-pages` branch.

URL final: `https://teccapitalweb.github.io/sales-arena/`

> **Importante:** Como usamos `HashRouter`, las rutas funcionan sin configurar redirects en GH Pages. La URL del panel queda como `https://teccapitalweb.github.io/sales-arena/#/control`.

---

## 📁 Estructura del proyecto

```
sales-arena/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AnimatedBar.jsx        ← barra con shimmer y rolling number
│   │   ├── Avatar.jsx             ← 9 SVG animales cyberpunk
│   │   ├── ControlPanel.jsx       ← vista de la contadora
│   │   ├── EventOverlay.jsx       ← +1 / NEW LEADER / confeti
│   │   ├── IdleMode.jsx           ← cuando no hay actividad
│   │   ├── Leaderboard.jsx        ← vista de proyección
│   │   ├── ParticlesBackground.jsx← partículas canvas
│   │   └── SellerCard.jsx         ← card individual del top 4
│   ├── context/
│   │   └── SalesContext.jsx       ← estado global + sync entre pestañas
│   ├── data/
│   │   └── sellers.js             ← config de vendedores y páginas
│   ├── hooks/
│   │   └── useIdleDetector.js
│   ├── styles/
│   │   └── globals.css            ← variables, fondo HUD, scanlines
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🔧 Personalización rápida

### Cambiar el tiempo del modo idle
`src/components/Leaderboard.jsx` → `useIdleDetector(lastTs, 30000)` (en ms).

### Agregar / quitar páginas
`src/data/sellers.js` → modificar el array `pages` de cada vendedor.

### Cambiar avatares
`src/data/sellers.js` → cambiar `avatar:` por uno de:
`wolf`, `eagle`, `tiger`, `fox`, `panther`, `falcon`, `lion`, `owl`, `dragon`.

### Resetear datos
Botón **RESET** en el panel de control, o desde DevTools:
```js
localStorage.removeItem('sales-arena-state-v1')
```

---

## 🧪 Pendientes / siguientes pasos

- [ ] Conectar a backend real (Firebase / Supabase) para multi-dispositivo verdadero.
- [ ] Sonidos al registrar ventas (con toggle on/off).
- [ ] Histórico diario / semanal / mensual.
- [ ] Modo "fullscreen" automático para proyección.
- [ ] Logs de cierre de jornada exportables a CSV.

---

## 📝 Licencia

Proyecto interno TEC CAPITAL — uso libre dentro de IPCI y consultoras aliadas.

---

**Hecho con 🔥 por Jorge / TEC CAPITAL**
