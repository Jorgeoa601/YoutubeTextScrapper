# StartOS LATAM (YouTube Intelligence Platform)

Plataforma de Inteligencia de Negocios que extrae transcripciones de canales de YouTube (como @starterstory), los analiza con Inteligencia Artificial para identificar *Pain Points* (puntos de dolor) del mercado Latinoamericano, los cruza con un modelo estratégico (Wizard RPM - Tony Robbins) y propone soluciones empresariales listas para ser validadas en el mundo real mediante el framework MVT (Minimum Viable Test).

## Stack Tecnológico

*   **Frontend:** HTML5, CSS3 (Glassmorphism UI), Vanilla JavaScript (Arquitectura sin frameworks para máxima velocidad y ligereza).
*   **Backend:** Funciones Serverless Nativas de Vercel (carpeta `/api`).
*   **Base de Datos:** Supabase (PostgreSQL administrado).
*   **Scraping:** Apify (`pintostudio~youtube-transcript-scraper`).
*   **Inteligencia Artificial:** OpenRouter API (Google Gemini 2.5 Flash recomendado, configurable).
*   **Scheduling:** Vercel Cron (ejecución programada vía `vercel.json`).

Todo el sistema está diseñado para desplegarse unificadamente en Vercel, aprovechando su enrutamiento nativo (`/public` para el Frontend y `/api` para el Backend). No se requiere ningún proveedor de hosting adicional.

---

## Setup Local

### 1. Base de Datos (Supabase)
1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ve al **SQL Editor** y ejecuta la creación de las tablas principales (`channels`, `videos`, `rpm_profiles`, `ai_video_analysis`, `solutions`, `mvt_conversations`, etc).
3. En **Project Settings → API**, copia los siguientes valores:
   *   `Project URL`
   *   `service_role` secret (¡Esta llave debe mantenerse en secreto y solo usarse en el Backend!).

### 2. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto para el desarrollo local:

```env
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENROUTER_API_KEY=sk-or-v1-...
APIFY_TOKEN=apify_api_...
```
*(Nota: El frontend no requiere variables de entorno ya que todas las operaciones de datos y llamadas a la IA están protegidas detrás del proxy serverless en `/api`).*

### 3. Ejecución en Desarrollo
Para correr la aplicación de manera idéntica a producción, utiliza el CLI de Vercel:

```bash
npm install -g vercel
vercel dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## Despliegue en Producción (Vercel)

1. Importa este repositorio en Vercel.
2. **Framework Preset:** Selecciona `Other` (El enrutamiento está predefinido en `vercel.json`).
3. **Root Directory:** Déjalo en `./`.
4. Ve a **Settings → Environment Variables** y añade exactamente las mismas variables de tu archivo `.env` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, `APIFY_TOKEN`).
5. Haz clic en **Deploy**.

Vercel detectará la arquitectura automáticamente:
*   `/api/*.js` → Se convierten en Serverless Functions (Backend).
*   `/public/` → Se sirven como archivos estáticos gracias a las reglas `rewrites` en `vercel.json`.
*   Las tareas programadas (Crons) extraerán nuevos videos silenciosamente en segundo plano.

---

## Módulos Implementados

*   [x] **Fase 1 — Extracción Core:** Sistema de control de canales y scraper asíncrono conectado a Apify.
*   [x] **Fase 2 — Base de Conocimiento:** Procesamiento de transcripciones y análisis de Pain Points con IA.
*   [x] **Fase 3 — Wizard RPM:** Cuestionario de inmersión para definir la Estrella Polar, Resultados, Propósito y Mapa de Acción Masiva.
*   [x] **Fase 4 — Motor de Soluciones:** Algoritmo dinámico que cruza los Pain Points extraídos con la filosofía del perfil RPM para generar ideas de negocio viables.
*   [x] **Fase 5 — Validación MVT:** Panel de control para registrar entrevistas de usuarios, trackear validación en el mundo real y determinar Pivot vs. Perseverancia.

---

## Decisiones de Arquitectura

**¿Soporta múltiples canales de YouTube?**
Sí. El sistema gira en torno a la tabla `channels`. Puedes añadir tantos canales como desees desde la interfaz principal. El scraper recorrerá dinámicamente cada canal configurado procesando los videos de forma secuencial y en lotes pequeños (Max 10 por ciclo) para evitar penalizaciones de API o timeouts del proveedor Serverless.

**¿Por qué usar Funciones Serverless Nativas sobre Express.js?**
Para reducir tiempos de arranque (Cold Starts) a cero y mantener el proyecto ridículamente ligero. En lugar de empaquetar un monolito de Express dentro de Vercel, creamos endpoints independientes (`/api/analyze.js`, `/api/rpm.js`, `/api/scraper.js`). Esto asegura que si una función falla por exceso de uso de la IA, el resto de la aplicación y la interfaz sigan funcionando con un 100% de disponibilidad. 

**Seguridad (Cero Fugas de Tokens)**
A diferencia de aplicaciones React/Vite tradicionales donde la lógica a menudo se mezcla, en este proyecto el Frontend (`/public/app.js`) es completamente "tonto". Solo dibuja la UI y envía peticiones al Backend (`/api`). Los tokens de Supabase, Apify y OpenRouter viven de manera segura y exclusiva en el servidor, blindando el sistema contra inyecciones o robos de API Keys.
