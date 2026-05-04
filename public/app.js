// A.N.T. Frontend Router & Controller

const routes = {
    '/': { title: 'Dashboard', render: renderDashboard },
    '/scraper': { title: 'Scraper & Logs', render: renderScraperLogs },
    '/videos': { title: 'Videos', render: renderVideos },
    '/pain-points': { title: 'Pain Points LATAM', render: renderPlaceholder },
    '/wizard': { title: 'Wizard RPM', render: renderPlaceholder },
    '/solutions': { title: 'Motor de Soluciones', render: renderPlaceholder },
    '/mvt': { title: 'MVT (Minimum Viable Testing)', render: renderPlaceholder },
    '/settings': { title: 'Ajustes del Sistema', render: renderPlaceholder }
};

const appContent = document.getElementById('app-content');
const pageTitle = document.getElementById('page-title');
const navItems = document.querySelectorAll('.nav-item');

function router() {
    let hash = window.location.hash.slice(1) || '/';
    const route = routes[hash];
    
    if (route) {
        pageTitle.textContent = route.title;
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${hash}`) {
                item.classList.add('active');
            }
        });
        
        appContent.innerHTML = route.render(route.title);
        
        if (route.postRender) {
            route.postRender();
        }
    } else {
        appContent.innerHTML = `<h2>404 - Ruta no encontrada</h2>`;
    }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);

// --- VIEWS ---

function renderDashboard() {
    return `
        <div class="card">
            <h2>Métricas Globales</h2>
            <div id="dashboard-stats" style="margin-top: 20px; display: flex; gap: 20px; flex-wrap: wrap;">
                <p style="color: var(--text-secondary);">Cargando métricas desde Supabase...</p>
            </div>
        </div>
    `;
}

routes['/'].postRender = async function() {
    const statsContainer = document.getElementById('dashboard-stats');
    if (!statsContainer) return;
    
    try {
        const response = await fetch('/api/stats');
        const { status, data } = await response.json();
        
        if (status === 'success') {
            const dateStr = data.last_scrape ? new Date(data.last_scrape).toLocaleString() : 'Nunca';
            statsContainer.innerHTML = `
                <div style="background: var(--bg-base); padding: 20px; border-radius: 8px; flex: 1; min-width: 200px; border: 1px solid var(--border-color);">
                    <h3 style="color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase;">Total Videos Extraídos</h3>
                    <p style="font-size: 2rem; font-weight: 700; color: var(--accent-color); margin-top: 10px;">${data.total_videos}</p>
                </div>
                <div style="background: var(--bg-base); padding: 20px; border-radius: 8px; flex: 1; min-width: 200px; border: 1px solid var(--border-color);">
                    <h3 style="color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase;">Última Ejecución Scraper</h3>
                    <p style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-top: 10px;">${dateStr}</p>
                    <p style="font-size: 0.85rem; color: ${data.last_status === 'Success' ? 'var(--success-color)' : 'var(--danger-color)'}; margin-top: 5px;">Estado: ${data.last_status || 'N/A'}</p>
                </div>
            `;
        } else {
            statsContainer.innerHTML = `<p style="color: var(--danger-color);">Error cargando métricas.</p>`;
        }
    } catch (error) {
        statsContainer.innerHTML = `<p style="color: var(--danger-color);">Fallo de conexión con el backend.</p>`;
    }
};

function renderScraperLogs() {
    return `
        <div class="card">
            <h2>Configuración de Scheduling</h2>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">Controla la frecuencia con la que Vercel Cron ejecutará el Two-Step Scrape automático (Límite: 30 videos por ciclo).</p>
            
            <div class="form-group" style="max-width: 300px;">
                <label for="cron-freq">Frecuencia de Extracción</label>
                <select id="cron-freq" class="form-control">
                    <option value="disabled">Desactivado (Solo Manual)</option>
                    <option value="hourly">Cada Hora (Recomendado)</option>
                    <option value="daily">Una vez al Día</option>
                </select>
            </div>
            
            <button class="btn" style="margin-top: 10px;">Guardar Configuración</button>
            <button id="force-scrape-btn" class="btn" style="margin-top: 10px; background-color: var(--bg-surface-hover); margin-left: 10px;">Forzar Ejecución Manual Ahora</button>
            <div id="scrape-status" style="margin-top: 15px; font-weight: 500;"></div>
        </div>
        
        <div class="card">
            <h2>Últimos Logs del Scraper</h2>
            <pre id="scrape-logs" style="background: var(--bg-base); padding: 15px; border-radius: 6px; color: var(--text-secondary); font-size: 0.85rem; border: 1px solid var(--border-color); min-height: 100px; white-space: pre-wrap;">[Sistema] Listo para ejecutar...</pre>
        </div>
    `;
}

routes['/scraper'].postRender = function() {
    const btn = document.getElementById('force-scrape-btn');
    const statusDiv = document.getElementById('scrape-status');
    const logsDiv = document.getElementById('scrape-logs');

    if (btn) {
        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.textContent = "Extrayendo... (Esto puede tomar tiempo)";
            statusDiv.style.color = "var(--accent-color)";
            statusDiv.textContent = "⚙️ Iniciando Fase 1: Descubriendo videos y extrayendo transcripciones...";
            logsDiv.textContent = "[Ejecución Iniciada] Cruzando datos con Supabase...\n";

            try {
                const response = await fetch('/api/scraper', { method: 'POST' });
                const data = await response.json();
                
                if (response.ok) {
                    statusDiv.style.color = "var(--success-color)";
                    statusDiv.textContent = "✅ Ejecución completada con éxito.";
                    logsDiv.textContent += JSON.stringify(data, null, 2);
                } else {
                    statusDiv.style.color = "var(--danger-color)";
                    statusDiv.textContent = "❌ Error en la ejecución.";
                    logsDiv.textContent += "\nError: " + data.error;
                }
            } catch (error) {
                statusDiv.style.color = "var(--danger-color)";
                statusDiv.textContent = "❌ Fallo de conexión.";
                logsDiv.textContent += "\nException: " + error.message;
            } finally {
                btn.disabled = false;
                btn.textContent = "Forzar Ejecución Manual Ahora";
            }
        });
    }
};

function renderVideos() {
    return `
        <div class="card">
            <h2>Base de Datos: Videos</h2>
            <p style="color: var(--text-secondary); margin-top: 10px;">Tabla de datos sincronizada con Supabase. Los últimos 50 videos extraídos aparecerán aquí.</p>
            <div id="videos-grid" style="margin-top: 20px; display: grid; gap: 15px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
                <p style="color: var(--text-secondary);">Cargando videos...</p>
            </div>
        </div>
    `;
}

routes['/videos'].postRender = async function() {
    const grid = document.getElementById('videos-grid');
    if (!grid) return;
    
    try {
        const response = await fetch('/api/videos');
        const { status, data } = await response.json();
        
        if (status === 'success') {
            if (data.length === 0) {
                grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1;">No hay videos extraídos aún.</p>';
                return;
            }
            
            grid.innerHTML = data.map(v => `
                <div style="background: var(--bg-base); padding: 15px; border-radius: 6px; border: 1px solid var(--border-color); display: flex; flex-direction: column;">
                    <h4 style="font-size: 1rem; margin-bottom: 10px; color: var(--text-primary);">${v.title}</h4>
                    <a href="${v.url}" target="_blank" style="color: var(--accent-color); text-decoration: none; font-size: 0.85rem; margin-bottom: 10px;">Ver en YouTube</a>
                    <div style="margin-top: auto; display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary);">
                        <span>Extraído: ${new Date(v.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            `).join('');
        } else {
            grid.innerHTML = '<p style="color: var(--danger-color);">Error cargando videos.</p>';
        }
    } catch (error) {
        grid.innerHTML = '<p style="color: var(--danger-color);">Fallo de conexión con el backend.</p>';
    }
};

function renderPlaceholder(title) {
    return `
        <div class="placeholder-view">
            <h2>${title}</h2>
            <p>Módulo en construcción - Etapa futura.</p>
        </div>
    `;
}
