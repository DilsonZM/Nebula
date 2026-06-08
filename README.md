# ✨ Nebula

**Partículas magnéticas interactivas con enlaces neón galácticos.**

Una experiencia web visual donde cientos de partículas cobran vida alrededor de tu cursor y se enlazan con líneas neón estilo galaxia al hacer clic.

![Nebula](https://img.shields.io/badge/Nebula-v1.0-00f0ff?style=for-the-badge)

## 🚀 Demo en vivo

**[✨ Ver Nebula en acción](https://dilsonzm.github.io/Nebula/)**

O abre [`index.html`](index.html) localmente en cualquier navegador moderno. No requiere instalación ni dependencias.

## 🎮 Cómo usar

- **Mueve el mouse** → las partículas cercanas te siguen como atraídas magnéticamente
- **Haz clic** → dispara un pulso magnético que atrae partículas al punto y las enlaza con líneas neón galaxia
- **Scroll** → zoom dinámico (1× a 4×), las partículas crecen proporcionalmente

## 🎛️ Panel de control neón

Panel glass-morphism en la esquina superior derecha con sliders personalizados:

| Control | Rango | Descripción |
|---------|-------|-------------|
| **Partículas** | 20 → 500 | Cantidad total de partículas en pantalla |
| **Fuerza del imán** | 0.2× → 3× | Intensidad de atracción y del pulso magnético |
| **Radio de captura** | 30px → 250px | Distancia para que las partículas empiecen a seguir al mouse |
| **Máx. siguiendo** | 1 → 40 | Máximo de partículas siguiendo al mouse simultáneamente |
| **Zoom** | 1× → 4× | Zoom dinámico centrado en la pantalla |

> 💡 **Tip:** El clic está ligado a la fuerza del imán. Con poca fuerza apenas atrae partículas cercanas; con mucha fuerza crea un pulso que abarca casi toda la pantalla.

## ✨ Características

- 🧲 **Sistema de correa magnética** — las partículas siguen al mouse pero tienen distancia máxima desde su base, creando un efecto natural de "tensar y soltar"
- 🌌 **Enlaces neón galaxia** — líneas con doble capa (halo exterior + núcleo brillante) y gradientes turquesa → púrpura → magenta → cian
- ⚡ **Pulso magnético visual** — anillo que se expande mostrando el radio del campo magnético al hacer clic
- 🎨 **Partículas adaptativas** — el sistema detecta tu dispositivo y ajusta la cantidad óptima de partículas
- 📱 **Soporte móvil completo** — touch, pinch-to-zoom, panel bottom-sheet, touch targets grandes
- 🖥️ **Detección de dispositivo** — badge temporal muestra si detectó Desktop, Tablet, Mobile o Touch Laptop
- 🔍 **Zoom dinámico** — con scroll del mouse, slider o pinch con dos dedos
- 🎛️ **UI sci-fi** con bordes neón, glass-morphism y tipografía monospace

## 📱 Soporte móvil

Nebula detecta automáticamente el dispositivo al cargar:

| Dispositivo | Detección | Partículas por defecto |
|-------------|-----------|----------------------|
| 🖥 **Desktop** | Sin touch | 180 |
| 💻 **Touch Laptop** | Touch + pantalla grande | 160 |
| 📱 **Tablet** | Touch + pantalla mediana | 140 |
| 📱 **Mobile** | Touch + pantalla chica | 90 |

**Controles táctiles:**
- **1 dedo:** seguir + enlazar (como mouse)
- **2 dedos (pinch):** zoom in/out
- **Panel:** se abre como bottom-sheet en móvil, panel flotante en desktop
- **Safe areas:** respeta el notch del iPhone

## 📂 Estructura del proyecto

```
nebula/
├── index.html          # Estructura HTML + meta tags
├── css/
│   └── style.css       # Estilos + media queries (desktop/tablet/mobile)
├── js/
│   └── nebula.js       # Lógica completa + detección de dispositivo
└── README.md
```

## 🛠️ Tecnología

HTML + Canvas API + CSS puro. **Cero dependencias externas.** Un solo archivo de ~650 líneas.

## 📄 Licencia

MIT — úsalo como quieras.

---

*Hecho con ✨ y magnetismo cósmico*
