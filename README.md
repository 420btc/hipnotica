# Hypnagogic Quest

Bienvenido a **Hypnagogic Quest**, una aplicación web inmersiva diseñada como un portal digital para explorar los fascinantes y misteriosos paisajes de la conciencia, los sueños y los estados liminales entre la vigilia y el sueño. Este proyecto es una invitación a navegar por las profundidades de tu propia mente a través de dos experiencias únicas: un juego conceptual que desafía tu percepción de la realidad y una herramienta avanzada para capturar los susurros del subconsciente.

## ✨ Experiencias Principales

Hypnagogic Quest te ofrece dos herramientas distintas para tu viaje interior:

### 1. Juego Inception (`InceptionGame`)

Sumérgete en un juego de palabras que te transporta a través de diferentes niveles de un sueño, donde la realidad se distorsiona progresivamente.

- **Niveles de Sueño**: Viaja a través de múltiples niveles, desde la "Realidad" hasta el "Limbo Profundo".
- **Distorsión de Palabras**: En cada nivel, las palabras se transforman y distorsionan. Tu objetivo es escribir la palabra original antes de que cambie.
- **Mecánicas de Juego**: 
    - **Ir más profundo**: Desciende a un nivel de sueño más profundo, aumentando la dificultad.
    - **Kick (Patada)**: Intenta subir un nivel para "despertar".
    - **Tiempo Distorsionado**: El tiempo corre a diferentes velocidades según la profundidad del sueño.
- **Sistema de Puntuación**: Gana puntos por cada respuesta correcta.
- **Interfaz Temática**: La apariencia visual y los colores cambian dinámicamente para reflejar el nivel de sueño actual, creando una atmósfera inmersiva.

### 2. Grabadora de Sueños (`DreamRecorder`)

Una herramienta avanzada para capturar, analizar y gestionar grabaciones de audio, ideal para registrar pensamientos, sueños o cualquier evento sonoro durante la noche.

- **Grabación de Alta Calidad**: Captura audio desde el micrófono con controles para iniciar y detener la grabación.
- **Análisis de Audio en Tiempo Real**: Visualiza el audio mientras grabas con tres gráficos simultáneos: forma de onda, espectro de frecuencias y análisis de ruido.
- **Gestión de Grabaciones**: Guarda tus grabaciones, añade notas, tipo de sueño y etiquetas. Descarga los archivos de audio y analiza estadísticas clave.
- **Detección Automática**: El sistema puede probar y seleccionar automáticamente un micrófono funcional.

## 🚀 Stack Tecnológico

Este proyecto está construido con un conjunto de tecnologías modernas para garantizar un alto rendimiento y una excelente experiencia de desarrollo.

- **Framework**: [Next.js](https://nextjs.org/) (v15)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React](https://react.dev/) (v19)
- **Componentes UI**: [Shadcn/ui](https://ui.shadcn.com/) - Una colección de componentes reutilizables construidos sobre Radix UI y Tailwind CSS.
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Visualización de Datos**: Gráficos personalizados renderizados con la API de Canvas.
- **Iconos**: [Lucide React](https://lucide.dev/)
- **Gestión de Estado**: React Hooks (`useState`, `useEffect`, `useRef`).
- **Linting y Formateo**: ESLint y Prettier integrados en Next.js.

## 🛠️ Instalación y Puesta en Marcha

Sigue estos pasos para configurar y ejecutar el proyecto en tu máquina local.

### Prerrequisitos

- [Node.js](https://nodejs.org/en/) (versión 18.x o superior)
- [pnpm](https://pnpm.io/installation) (o puedes usar `npm` o `yarn`)

### Pasos

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/420btc/hipnotica.git
   cd hipnotica
   ```

2. **Instala las dependencias:**
   ```bash
   pnpm install
   ```
   o si usas npm:
   ```bash
   npm install
   ```

3. **Ejecuta el servidor de desarrollo:**
   ```bash
   pnpm run dev
   ```
   o si usas npm:
   ```bash
   npm run dev
   ```

4. **Abre la aplicación en tu navegador:**
   Visita [http://localhost:3000](http://localhost:3000) para ver la aplicación en funcionamiento.

## 📖 Uso de la Aplicación

- **Página Principal**: Al iniciar, verás un menú principal donde puedes elegir entre el "Juego Inception" y la "Grabadora de Sueños".
- **Navegación**: Utiliza los botones "Volver" para regresar al menú principal desde cualquiera de las dos secciones.
- **Juego Inception**:
    - Lee las instrucciones y haz clic en "Comenzar Aventura".
    - Escribe la palabra que ves en el campo de texto y presiona Enter.
    - Usa los botones "Más Profundo" o "Kick" para navegar por los niveles del sueño.
- **Grabadora de Sueños**: 
    - Haz clic en "Iniciar Grabación" para comenzar a capturar audio.
    - Habla en tu micrófono y observa cómo los gráficos en tiempo real reaccionan.
    - Detén la grabación y se añadirá a la lista de "Grabaciones Recientes".
    - Expande una grabación para añadir notas o descargarla.

## 📂 Estructura del Proyecto

El código fuente está organizado de la siguiente manera para mantener la claridad y la escalabilidad:

```
. 
├── app/ # Contiene las páginas y layouts principales de Next.js 
├── components/ # Componentes de React reutilizables 
│ ├── ui/ # Componentes de bajo nivel de Shadcn/ui 
│ ├── dream-recorder.tsx # Componente principal de la grabadora 
│ └── inception-game.tsx # Componente principal del juego 
├── hooks/ # Hooks personalizados de React 
├── lib/ # Funciones de utilidad (ej. `cn` para clases de Tailwind) 
├── public/ # Archivos estáticos como imágenes y fuentes 
└── styles/ # Archivos de estilos globales 
```

---

¡Gracias por explorar Hypnagogic Quest! Si tienes alguna idea o sugerencia, no dudes en contribuir.
