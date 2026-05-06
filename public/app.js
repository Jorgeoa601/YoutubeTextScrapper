// A.N.T. Frontend Router & Controller

const routes = {
    '/': { title: 'Dashboard', render: renderDashboard },
    '/scraper': { title: 'Scraper & Logs', render: renderScraperLogs },
    '/videos': { title: 'Videos', render: renderVideos },
    '/pain-points': { title: 'Pain Points LATAM', render: renderPlaceholder },
    '/wizard': { title: 'Wizard RPM', render: renderPlaceholder }, // The real functions are injected at the bottom of the file usually, but we keep the structure
    '/solutions': { title: 'Motor de Soluciones', render: renderSolutions },
    '/mvt': { title: 'MVT (Minimum Viable Testing)', render: renderMvt },
    '/settings': { title: 'Ajustes del Sistema', render: renderSettings }
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
        <div class="card" style="margin-bottom: 20px;">
            <h2 style="margin-bottom: 5px;">Misión de Emprendimiento 🚀</h2>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">Resumen del progreso desde la extracción hasta la validación de mercado.</p>
            <div id="dashboard-mission" style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success-color); padding: 20px; border-radius: 8px; display: none;">
                <!-- MVT Status injected here -->
            </div>
            <div id="dashboard-mission-empty" style="text-align: center; padding: 20px; color: var(--text-secondary); display: none;">
                <p>No tienes una Solución MVT activa.</p>
                <button class="btn" style="margin-top: 10px;" onclick="window.location.hash='#/solutions'">Explorar Soluciones</button>
            </div>
        </div>

        <div class="card">
            <h2>Métricas Globales del Sistema</h2>
            <div id="dashboard-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
                <p style="color: var(--text-secondary); grid-column: 1/-1;">Cargando métricas desde Supabase...</p>
            </div>
        </div>
    `;
}

routes['/'].postRender = async function() {
    const statsContainer = document.getElementById('dashboard-stats');
    const missionContainer = document.getElementById('dashboard-mission');
    const missionEmpty = document.getElementById('dashboard-mission-empty');
    if (!statsContainer) return;

    try {
        const response = await fetch('/api/stats');
        const { status, data } = await response.json();
        
        if (status === 'success') {
            const dateStr = data.last_scrape ? new Date(data.last_scrape).toLocaleString() : 'Nunca';
            
            // Render Stats Grid
            statsContainer.innerHTML = `
                <div style="background: var(--bg-base); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <h3 style="color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase;">Videos (Scraper)</h3>
                    <p style="font-size: 2rem; font-weight: 700; color: #60a5fa; margin-top: 10px;">${data.total_videos}</p>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 5px;">Último Scrape: ${dateStr}</p>
                </div>
                <div style="background: var(--bg-base); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <h3 style="color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase;">Videos Analizados (IA)</h3>
                    <p style="font-size: 2rem; font-weight: 700; color: #a855f7; margin-top: 10px;">${data.total_analyzed}</p>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 5px;">Pain Points Extraídos</p>
                </div>
                <div style="background: var(--bg-base); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <h3 style="color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase;">Soluciones Creadas</h3>
                    <p style="font-size: 2rem; font-weight: 700; color: #f43f5e; margin-top: 10px;">${data.total_solutions}</p>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 5px;">Algoritmo de Cruce</p>
                </div>
                <div style="background: var(--bg-base); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <h3 style="color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase;">Validaciones MVT</h3>
                    <p style="font-size: 2rem; font-weight: 700; color: var(--success-color); margin-top: 10px;">${data.total_mvt} <span style="font-size: 1rem; color: var(--text-secondary);">/ 5</span></p>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 5px;">Conversaciones de mercado</p>
                </div>
            `;

            // Render Mission Status
            if (data.active_solution) {
                missionContainer.style.display = 'block';
                missionContainer.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 15px;">
                        <div>
                            <h3 style="color: var(--success-color); font-size: 0.85rem; text-transform: uppercase; margin-bottom: 5px;">🌟 Solución Activa</h3>
                            <h2 style="font-size: 1.5rem; margin-bottom: 5px;">${data.active_solution.title}</h2>
                            <p style="color: var(--text-secondary); font-size: 0.9rem;">Fit Score: <strong style="color: var(--accent-color);">${data.active_solution.fit_score}</strong></p>
                        </div>
                        <button class="btn" style="background: var(--success-color);" onclick="window.location.hash='#/mvt'">Ir al Panel MVT ➔</button>
                    </div>
                    <div style="margin-top: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.85rem;">
                            <span style="font-weight: bold; color: var(--text-primary);">Progreso MVT:</span>
                            <span style="color: var(--accent-color); font-weight: bold;">${data.total_mvt} de 5 entrevistas</span>
                        </div>
                        <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.2); border-radius: 3px; overflow: hidden;">
                            <div style="height: 100%; background: var(--success-color); width: ${Math.min((data.total_mvt / 5) * 100, 100)}%;"></div>
                        </div>
                    </div>
                `;
            } else {
                missionEmpty.style.display = 'block';
            }
        } else {
            statsContainer.innerHTML = `<p style="color: var(--danger-color); grid-column: 1/-1;">Error al cargar: ${data.error}</p>`;
        }
    } catch (e) {
        statsContainer.innerHTML = `<p style="color: var(--danger-color); grid-column: 1/-1;">Error de conexión.</p>`;
    }
};

function renderScraperLogs() {
    return `
        <div class="scraper-layout">
            <p style="color: var(--text-secondary); margin-bottom: 20px;">Configura el schedule, gestiona canales y revisa el historial</p>

            <div class="card module-card">
                <h2>Canales</h2>
                <p style="color: var(--text-secondary); margin-top: 5px; margin-bottom: 15px; font-size: 0.9rem;">El esquema soporta múltiples canales. Añade otro si quieres comparar Starter Story con un segundo canal.</p>
                
                <div class="table-container" style="overflow-x: auto;">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase;">
                                <th style="padding: 12px 15px;">HANDLE</th>
                                <th style="padding: 12px 15px;">NOMBRE</th>
                                <th style="padding: 12px 15px;">VIDEOS</th>
                                <th style="padding: 12px 15px;">URL</th>
                            </tr>
                        </thead>
                        <tbody id="channels-list">
                            <tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-secondary);">Cargando canales...</td></tr>
                        </tbody>
                    </table>
                </div>

                <div class="add-channel-form" style="margin-top: 20px; display: flex; gap: 15px; flex-wrap: wrap; align-items: end;">
                    <div class="form-group" style="flex: 1; min-width: 200px;">
                        <label>Handle (@nombre)</label>
                        <input type="text" id="new-channel-handle" class="form-control" placeholder="@otrocanal">
                    </div>
                    <div class="form-group" style="flex: 1; min-width: 200px;">
                        <label>Nombre (opcional)</label>
                        <input type="text" id="new-channel-name" class="form-control" placeholder="Nombre">
                    </div>
                    <button id="add-channel-btn" class="btn" style="height: 42px;">Añadir canal</button>
                </div>
            </div>

            <div class="card module-card" style="margin-top: 20px;">
                <h2>Configuración por canal</h2>
                
                <div id="channel-config-container" style="margin-top: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 id="config-channel-title" style="font-size: 1rem; color: var(--text-secondary);">Selecciona un canal de la tabla arriba</h3>
                        <button id="execute-now-btn" class="btn" style="background-color: var(--bg-surface-hover); display: none;">Ejecutar ahora</button>
                    </div>

                    <div style="display: flex; gap: 20px; flex-wrap: wrap; opacity: 0.5; pointer-events: none;" id="config-form-wrapper">
                        <div class="form-group" style="flex: 2; min-width: 300px;">
                            <label>Expresión cron</label>
                            <input type="text" id="config-cron" class="form-control" placeholder="0 3 * * *">
                            <div class="cron-presets" style="margin-top: 8px; display: flex; gap: 15px; font-size: 0.8rem; color: var(--text-secondary);">
                                <span>Presets:</span>
                                <a href="#" class="preset-link" data-cron="0 * * * *">Cada hora</a>
                                <a href="#" class="preset-link" data-cron="0 */6 * * *">Cada 6 horas</a>
                                <a href="#" class="preset-link" data-cron="0 */12 * * *">Cada 12 horas</a>
                                <a href="#" class="preset-link" data-cron="0 3 * * *">Diario (3 AM)</a>
                            </div>
                        </div>
                        <div class="form-group" style="flex: 1; min-width: 150px;">
                            <label>Máx. videos por corrida</label>
                            <input type="number" id="config-max" class="form-control" placeholder="30">
                        </div>
                        <div class="form-group" style="display: flex; align-items: center; justify-content: center; min-width: 100px; padding-top: 25px;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" id="config-enabled" style="accent-color: var(--accent-color); transform: scale(1.2);">
                                <span>Habilitado</span>
                            </label>
                        </div>
                    </div>
                    
                    <button id="save-config-btn" class="btn" style="margin-top: 20px; display: none;">Guardar</button>
                    <div id="config-status" style="margin-top: 10px; font-size: 0.85rem;"></div>
                </div>
            </div>

            <div class="card module-card" style="margin-top: 20px; padding: 0; overflow: hidden;">
                <h2 style="padding: 20px;">Historial de ejecuciones</h2>
                <div class="table-container" style="border-top: 1px solid var(--border-color); overflow-x: auto;">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase;">
                                <th style="padding: 15px;">INICIO</th>
                                <th style="padding: 15px;">CANAL</th>
                                <th style="padding: 15px;">TRIGGER</th>
                                <th style="padding: 15px;">ESTADO</th>
                                <th style="padding: 15px; text-align: center;">ENCONTRADOS</th>
                                <th style="padding: 15px; text-align: center;">NUEVOS</th>
                                <th style="padding: 15px; text-align: center;">ACTUALIZADOS</th>
                                <th style="padding: 15px;"></th>
                            </tr>
                        </thead>
                        <tbody id="logs-list">
                            <tr><td colspan="8" style="text-align: center; padding: 20px; color: var(--text-secondary);">Cargando historial...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

routes['/scraper'].postRender = async function() {
    let currentChannel = null;
    let allChannels = [];

    // Elements
    const channelsList = document.getElementById('channels-list');
    const logsList = document.getElementById('logs-list');
    const addBtn = document.getElementById('add-channel-btn');
    
    // Config Elements
    const configFormWrapper = document.getElementById('config-form-wrapper');
    const configTitle = document.getElementById('config-channel-title');
    const configCron = document.getElementById('config-cron');
    const configMax = document.getElementById('config-max');
    const configEnabled = document.getElementById('config-enabled');
    const executeBtn = document.getElementById('execute-now-btn');
    const saveBtn = document.getElementById('save-config-btn');
    const configStatus = document.getElementById('config-status');

    // Fetch Channels
    async function loadChannels() {
        try {
            const res = await fetch('/api/channels');
            const json = await res.json();
            if (json.status === 'success') {
                allChannels = json.data;
                renderChannelsTable();
            }
        } catch (e) {
            channelsList.innerHTML = '<tr><td colspan="4" style="color: var(--danger-color); padding: 15px;">Error cargando canales</td></tr>';
        }
    }

    function renderChannelsTable() {
        if (allChannels.length === 0) {
            channelsList.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 15px;">No hay canales.</td></tr>';
            return;
        }
        
        channelsList.innerHTML = allChannels.map(ch => `
            <tr class="channel-row" data-id="${ch.id}" style="border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background 0.2s;">
                <td style="padding: 12px 15px; font-weight: 500; color: var(--text-primary);">${ch.youtube_handle}</td>
                <td style="padding: 12px 15px;">${ch.name || '-'}</td>
                <td style="padding: 12px 15px;">${ch.videos_count || 0}</td>
                <td style="padding: 12px 15px;"><a href="${ch.url}" target="_blank" style="color: var(--accent-color); text-decoration: none;">abrir ↗</a></td>
            </tr>
        `).join('');

        // Attach click events
        document.querySelectorAll('.channel-row').forEach(row => {
            row.addEventListener('click', () => selectChannel(row.dataset.id));
            row.addEventListener('mouseover', () => row.style.backgroundColor = 'var(--bg-surface-hover)');
            row.addEventListener('mouseout', () => row.style.backgroundColor = 'transparent');
        });
    }

    function selectChannel(id) {
        currentChannel = allChannels.find(c => c.id === id);
        if (!currentChannel) return;

        configTitle.textContent = `${currentChannel.name || 'Canal'} (${currentChannel.youtube_handle})`;
        configTitle.style.color = 'var(--text-primary)';
        
        configCron.value = currentChannel.cron_expression || '';
        configMax.value = currentChannel.max_videos_per_run || 30;
        configEnabled.checked = currentChannel.is_enabled;

        configFormWrapper.style.opacity = '1';
        configFormWrapper.style.pointerEvents = 'auto';
        executeBtn.style.display = 'block';
        saveBtn.style.display = 'block';
        configStatus.textContent = '';
    }

    // Add Channel
    addBtn.addEventListener('click', async () => {
        const handle = document.getElementById('new-channel-handle').value.trim();
        const name = document.getElementById('new-channel-name').value.trim();
        if (!handle) return alert('El Handle es obligatorio');
        
        const url = `https://www.youtube.com/${handle}`;
        addBtn.disabled = true;
        addBtn.textContent = 'Añadiendo...';
        
        try {
            const res = await fetch('/api/channels', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ youtube_handle: handle, name, url })
            });
            if (res.ok) {
                document.getElementById('new-channel-handle').value = '';
                document.getElementById('new-channel-name').value = '';
                await loadChannels();
            } else {
                alert('Error al añadir canal');
            }
        } catch(e) {
            alert('Fallo de conexión');
        } finally {
            addBtn.disabled = false;
            addBtn.textContent = 'Añadir canal';
        }
    });

    // Save Config
    saveBtn.addEventListener('click', async () => {
        if (!currentChannel) return;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando...';
        
        try {
            const res = await fetch('/api/channels', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    id: currentChannel.id,
                    cron_expression: configCron.value,
                    max_videos_per_run: parseInt(configMax.value),
                    is_enabled: configEnabled.checked
                })
            });
            if (res.ok) {
                configStatus.style.color = 'var(--success-color)';
                configStatus.textContent = '✅ Configuración guardada.';
                await loadChannels();
            } else {
                configStatus.style.color = 'var(--danger-color)';
                configStatus.textContent = '❌ Error al guardar.';
            }
        } catch(e) {
            configStatus.style.color = 'var(--danger-color)';
            configStatus.textContent = '❌ Fallo de conexión.';
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Guardar';
            setTimeout(() => configStatus.textContent = '', 3000);
        }
    });

    // Cron Presets
    document.querySelectorAll('.preset-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            configCron.value = e.target.dataset.cron;
        });
    });

    // Execute Now
    executeBtn.addEventListener('click', async () => {
        if (!currentChannel) return;
        executeBtn.disabled = true;
        executeBtn.textContent = 'Extrayendo...';
        configStatus.style.color = 'var(--accent-color)';
        configStatus.textContent = '⚙️ Ejecutando scraper. Esto puede tardar varios segundos...';
        
        try {
            const res = await fetch('/api/scraper', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ channel_id: currentChannel.id, trigger_type: 'manual' })
            });
            const data = await res.json();
            
            if (res.ok) {
                configStatus.style.color = 'var(--success-color)';
                configStatus.textContent = `✅ Éxito: ${data.data?.processed_count || 0} videos procesados.`;
                await loadLogs();
                await loadChannels();
            } else {
                configStatus.style.color = 'var(--danger-color)';
                configStatus.textContent = `❌ Error: ${data.error}`;
            }
        } catch(e) {
            configStatus.style.color = 'var(--danger-color)';
            configStatus.textContent = '❌ Fallo de conexión.';
        } finally {
            executeBtn.disabled = false;
            executeBtn.textContent = 'Ejecutar ahora';
        }
    });

    // Fetch Logs
    async function loadLogs() {
        try {
            const res = await fetch('/api/logs');
            const json = await res.json();
            if (json.status === 'success') {
                const logs = json.data;
                if (logs.length === 0) {
                    logsList.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No hay historial.</td></tr>';
                    return;
                }
                
                logsList.innerHTML = logs.map(l => {
                    const statusColor = l.status === 'success' ? '#10b981' : '#ef4444';
                    const statusBg = l.status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                    return `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 15px;">${new Date(l.run_datetime).toLocaleString()}</td>
                            <td style="padding: 15px; font-weight: 500;">${l.handle}</td>
                            <td style="padding: 15px; color: var(--text-secondary);"><span style="border: 1px solid var(--border-color); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">${l.trigger_type}</span></td>
                            <td style="padding: 15px;">
                                <span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">
                                    ${l.status}
                                </span>
                            </td>
                            <td style="padding: 15px; text-align: center;">${l.videos_found || 0}</td>
                            <td style="padding: 15px; text-align: center;">${l.videos_new || 0}</td>
                            <td style="padding: 15px; text-align: center;">${l.videos_updated || 0}</td>
                            <td style="padding: 15px;"><a href="#" style="color: var(--text-secondary); text-decoration: none;">ver &rarr;</a></td>
                        </tr>
                    `;
                }).join('');
            }
        } catch (e) {
            logsList.innerHTML = '<tr><td colspan="8" style="color: var(--danger-color); padding: 20px;">Error cargando logs</td></tr>';
        }
    }

    // Init
    loadChannels();
    loadLogs();
};

function renderVideos() {
    return `
        <div class="card module-card">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">
                <div>
                    <h2>Base de Datos: Videos</h2>
                    <p style="color: var(--text-secondary); margin-top: 5px; font-size: 0.9rem;">Los últimos 50 videos extraídos globalmente.</p>
                </div>
                <div style="flex: 1; max-width: 350px; min-width: 200px;">
                    <input type="text" id="video-search-input" class="form-control" placeholder="🔍 Buscar por título..." style="width: 100%; border-radius: 20px; padding: 10px 15px; border: 1px solid var(--border-color); background: var(--bg-base); color: var(--text-primary);">
                </div>
            </div>
            
            <div id="videos-grid" style="display: grid; gap: 15px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); border-top: 1px solid var(--border-color); padding-top: 20px;">
                <p style="color: var(--text-secondary);">Cargando videos...</p>
            </div>
        </div>
    `;
}

routes['/videos'].postRender = async function() {
    const grid = document.getElementById('videos-grid');
    const searchInput = document.getElementById('video-search-input');
    if (!grid) return;
    
    let allVideos = [];
    
    function renderGrid(videosToRender) {
        if (videosToRender.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 40px; background: var(--bg-base); border-radius: 8px;">No se encontraron videos que coincidan con la búsqueda.</p>';
            return;
        }
        grid.innerHTML = videosToRender.map(v => `
            <div class="video-card" style="background: var(--bg-base); padding: 18px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; transition: transform 0.2s, border-color 0.2s;">
                <h4 style="font-size: 1.05rem; margin-bottom: 12px; color: var(--text-primary); line-height: 1.4;">${v.title}</h4>
                <a href="${v.url}" target="_blank" style="color: var(--accent-color); text-decoration: none; font-size: 0.85rem; margin-bottom: 15px; display: inline-block;">Ver en YouTube ↗</a>
                <div style="margin-top: auto; display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); border-top: 1px solid var(--border-color); padding-top: 12px;">
                    <span>Extraído: ${new Date(v.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
    }

    try {
        const response = await fetch('/api/videos');
        const { status, data } = await response.json();
        
        if (status === 'success') {
            allVideos = data;
            
            if (allVideos.length === 0) {
                grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1;">No hay videos extraídos aún.</p>';
                return;
            }
            
            // Initial Render
            renderGrid(allVideos);
            
            // Search Real-time Filtering
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const searchTerm = e.target.value.toLowerCase().trim();
                    if (!searchTerm) {
                        renderGrid(allVideos);
                        return;
                    }
                    
                    const filtered = allVideos.filter(v => 
                        v.title && v.title.toLowerCase().includes(searchTerm)
                    );
                    renderGrid(filtered);
                });
            }
        } else {
            grid.innerHTML = '<p style="color: var(--danger-color);">Error cargando videos.</p>';
        }
    } catch (e) {
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

function renderPainPoints() {
    return `
        <div class="card module-card" style="display: flex; gap: 20px; position: relative; flex-wrap: wrap;">
            <div style="flex: 2; min-width: 300px;">
                <h2>Análisis de Pain Points LATAM</h2>
                <p style="color: var(--text-secondary); margin-top: 5px; margin-bottom: 20px;">Utiliza Gemini Flash para extraer problemas centrales desde las transcripciones.</p>
                <div class="table-container" style="overflow-x: auto;">
                    <table class="data-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase;">
                                <th style="padding: 12px 15px;">VIDEO TITLE</th>
                                <th style="padding: 12px 15px;">ESTADO IA</th>
                                <th style="padding: 12px 15px;">ACCIÓN</th>
                            </tr>
                        </thead>
                        <tbody id="pain-points-list">
                            <tr><td colspan="3" style="text-align: center; padding: 20px; color: var(--text-secondary);">Cargando videos...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div id="ai-side-panel" style="flex: 1; min-width: 300px; background: var(--bg-base); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; display: none; flex-direction: column; gap: 15px;">
                <h3 style="font-size: 1.1rem; color: var(--accent-color); margin-bottom: 10px;">Resultados de IA ✨</h3>
                <div id="ai-panel-content"></div>
            </div>
        </div>
    `;
}

routes['/pain-points'].render = renderPainPoints;
routes['/pain-points'].postRender = async function() {
    const list = document.getElementById('pain-points-list');
    const sidePanel = document.getElementById('ai-side-panel');
    const panelContent = document.getElementById('ai-panel-content');
    if (!list) return;

    async function loadAIVideos() {
        try {
            const res = await fetch('/api/ai-videos');
            const { status, data } = await res.json();
            if (status === 'success') {
                if(data.length === 0) {
                    list.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">No hay videos.</td></tr>';
                    return;
                }
                list.innerHTML = data.map(v => {
                    const isAnalyzed = v.ai_video_analysis && v.ai_video_analysis.length > 0;
                    const statusHtml = isAnalyzed 
                        ? '<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">ANALIZADO</span>' 
                        : '<span style="background: rgba(107, 114, 128, 0.1); color: #9ca3af; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">PENDIENTE</span>';
                    
                    const actionHtml = isAnalyzed
                        ? `<button class="btn btn-outline btn-sm view-ai-btn" data-json='${JSON.stringify(v.ai_video_analysis[0].analysis_json).replace(/'/g, "&#39;")}' style="padding: 5px 10px; font-size: 0.8rem;">Ver Análisis</button>`
                        : `<button class="btn btn-sm analyze-btn" data-id="${v.id}" style="padding: 5px 10px; font-size: 0.8rem; background: var(--accent-color);">✨ Analizar</button>`;

                    return `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 15px; font-weight: 500; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${v.title}">${v.title}</td>
                            <td style="padding: 15px;">${statusHtml}</td>
                            <td style="padding: 15px;">${actionHtml}</td>
                        </tr>
                    `;
                }).join('');

                // Attach Events
                document.querySelectorAll('.view-ai-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const json = JSON.parse(e.target.getAttribute('data-json'));
                        showSidePanel(json);
                    });
                });

                document.querySelectorAll('.analyze-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const id = e.target.dataset.id;
                        e.target.disabled = true;
                        e.target.textContent = 'Analizando...';
                        try {
                            const aiModel = localStorage.getItem('aiModel') || 'google/gemini-2.5-flash';
                            const aiTemp = localStorage.getItem('aiTemp') || 0.7;
                            const analyzeRes = await fetch('/api/analyze', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ video_id: id, aiModel, aiTemp })
                            });
                            if(analyzeRes.ok) await loadAIVideos();
                            else alert("Error analizando con IA");
                        } catch(err) { alert("Error de conexión"); }
                    });
                });
            }
        } catch(e) {
            list.innerHTML = '<tr><td colspan="3" style="color: var(--danger-color); padding: 20px;">Error cargando data.</td></tr>';
        }
    }

    function showSidePanel(json) {
        sidePanel.style.display = 'flex';
        panelContent.innerHTML = `
            <div style="margin-bottom: 15px;">
                <h4 style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase;">Categoría</h4>
                <p style="font-weight: 500;">${json.pain_point_category || '-'}</p>
            </div>
            <div style="margin-bottom: 15px;">
                <h4 style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase;">Problema Central</h4>
                <p style="font-size: 0.95rem; line-height: 1.5;">${json.core_problem || '-'}</p>
            </div>
            <div style="margin-bottom: 15px;">
                <h4 style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase;">Contexto LATAM</h4>
                <p style="font-size: 0.95rem; line-height: 1.5; color: #a78bfa;">${json.latam_context || '-'}</p>
            </div>
            <div>
                <h4 style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase;">Público Objetivo</h4>
                <p style="font-size: 0.95rem; line-height: 1.5;">${json.target_audience || '-'}</p>
            </div>
        `;
    }

    loadAIVideos();
};

function renderWizard() {
    return `
        <div class="card module-card" style="max-width: 800px; margin: 0 auto; min-height: 400px; position: relative;">
            
            <div id="wizard-loading" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px;">
                <div class="spinner" style="width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
                <h3 style="color: var(--text-secondary);">Cargando perfil RPM...</h3>
            </div>

            <!-- MODO CREACIÓN -->
            <div id="wizard-creation-mode" style="display: none;">
                <h2 style="text-align: center; margin-bottom: 10px;">Generador RPM (Massive Action Plan)</h2>
                <p style="text-align: center; color: var(--text-secondary); margin-bottom: 40px;">Construye la base inamovible de tu negocio usando el poder de Gemini.</p>
                
                <div id="wizard-step-1" style="animation: fadeIn 0.5s;">
                    <div class="form-group" style="margin-bottom: 30px;">
                        <label style="font-size: 1.2rem; color: var(--text-primary); margin-bottom: 10px; display: block;">1. Resultado (Result) 🎯</label>
                        <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 15px; line-height: 1.5;">
                            <strong>¿Qué quieres realmente?</strong> Resultados específicos y medibles. No "ganar dinero" — algo concreto.<br>
                            <em>Ejemplo: ¿Cuánto? ¿En cuánto tiempo? ¿Desde dónde? ¿Con qué tipo de negocio? ¿Full-time o side project?</em>
                        </p>
                        <textarea id="wizard-result" class="form-control" rows="3" placeholder="Quiero crear una agencia B2B que facture $5,000 USD/mes trabajando 4h al día desde casa..." style="font-size: 1.1rem; padding: 15px;"></textarea>
                    </div>
                    <button id="wizard-next-btn" class="btn" style="width: 100%; font-size: 1.1rem; padding: 15px; background: var(--accent-color);">Siguiente Paso ➔</button>
                </div>

                <div id="wizard-step-2" style="display: none; animation: fadeIn 0.5s;">
                    <div class="form-group" style="margin-bottom: 30px;">
                        <label style="font-size: 1.2rem; color: var(--text-primary); margin-bottom: 10px; display: block;">2. Propósito (Purpose) ❤️</label>
                        <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 15px; line-height: 1.5;">
                            <strong>¿Por qué lo quieres?</strong> Las razones emocionales profundas. Sin un "por qué" fuerte, las acciones no se sostienen.<br>
                            <em>Profundiza: ¿Qué pasa si NO lo logras? ¿A quién más beneficia además de ti?</em>
                        </p>
                        <textarea id="wizard-purpose" class="form-control" rows="4" placeholder="Para nunca más depender de un jefe, para que mi familia no pase apuros y para demostrarme de lo que soy capaz. Si no lo logro, estaré atrapado." style="font-size: 1.1rem; padding: 15px;"></textarea>
                    </div>
                    <div style="display: flex; gap: 15px;">
                        <button id="wizard-back-s1-btn" class="btn btn-outline" style="flex: 1; padding: 15px;">⬅ Volver</button>
                        <button id="wizard-generate-btn" class="btn" style="flex: 2; font-size: 1.1rem; padding: 15px; background: linear-gradient(135deg, var(--accent-color), #a855f7);">✨ Analizar y Generar MAP</button>
                    </div>
                </div>

                <div id="wizard-step-3" style="display: none; text-align: center; padding: 60px 0; animation: fadeIn 0.5s;">
                    <div class="spinner" style="width: 50px; height: 50px; border: 4px solid var(--border-color); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 25px;"></div>
                    <h2 style="color: var(--accent-color); margin-bottom: 10px;">Gemini está decodificando tu Perfil...</h2>
                    <p style="color: var(--text-secondary);">Extrayendo restricciones, categorías y armando un Brainstorm de acciones masivas.</p>
                </div>
            </div>

            <!-- MODO PERFIL ACTIVO -->
            <div id="wizard-active-mode" style="display: none; animation: fadeIn 0.5s;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border-color); padding-bottom: 24px; margin-bottom: 30px; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <h2 style="color: var(--text-primary); font-size: 1.8rem; margin: 0; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Misión Estratégica</h2>
                            <span class="badge badge-success">SISTEMA INICIALIZADO</span>
                        </div>
                        <p style="color: var(--text-secondary); font-size: 0.95rem; margin: 0;">Perfil Arquitectónico RPM generado por Inteligencia Artificial.</p>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 30px;">
                    <div style="background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 24px; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--gradient-primary);"></div>
                        <h4 style="color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.75rem; margin-bottom: 12px; font-weight: 700;">[R] Resultado Central</h4>
                        <p id="active-result" style="font-size: 1.1rem; color: var(--text-primary); font-weight: 500; line-height: 1.6; margin: 0;"></p>
                    </div>
                    <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 24px; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--gradient-secondary);"></div>
                        <h4 style="color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.75rem; margin-bottom: 12px; font-weight: 700;">[P] Propósito Motor</h4>
                        <p id="active-purpose" style="font-size: 1.05rem; color: var(--text-primary); line-height: 1.6; margin: 0;"></p>
                    </div>
                </div>

                <div id="active-map-content">
                    <!-- MAP Content dynamically injected here -->
                </div>

                <div style="text-align: right; padding-top: 30px; border-top: 1px solid var(--border-color); margin-top: 20px;">
                    <button id="wizard-delete-btn" class="btn btn-outline" style="border-color: var(--danger-color); color: var(--danger-color); font-size: 0.85rem; padding: 10px 20px;">
                        Purgar Sistema (Factory Reset RPM)
                    </button>
                </div>
            </div>

            <style>
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        </div>
    `;
}

routes['/wizard'].render = renderWizard;
routes['/wizard'].postRender = function() {
    const loadingView = document.getElementById('wizard-loading');
    const creationMode = document.getElementById('wizard-creation-mode');
    const activeMode = document.getElementById('wizard-active-mode');

    const s1 = document.getElementById('wizard-step-1');
    const s2 = document.getElementById('wizard-step-2');
    const s3 = document.getElementById('wizard-step-3');
    const inputResult = document.getElementById('wizard-result');
    const inputPurpose = document.getElementById('wizard-purpose');
    const btnNext = document.getElementById('wizard-next-btn');
    const btnBackS1 = document.getElementById('wizard-back-s1-btn');
    const btnGenerate = document.getElementById('wizard-generate-btn');

    const txtResult = document.getElementById('active-result');
    const txtPurpose = document.getElementById('active-purpose');
    const mapContent = document.getElementById('active-map-content');
    const btnDelete = document.getElementById('wizard-delete-btn');

    async function initWizard() {
        loadingView.style.display = 'flex';
        creationMode.style.display = 'none';
        activeMode.style.display = 'none';

        try {
            const res = await fetch('/api/rpm');
            const { status, data } = await res.json();
            
            if (status === 'success' && data) {
                renderActiveProfile(data);
                loadingView.style.display = 'none';
                activeMode.style.display = 'block';
            } else {
                loadingView.style.display = 'none';
                creationMode.style.display = 'block';
                s1.style.display = 'block';
                s2.style.display = 'none';
                s3.style.display = 'none';
            }
        } catch (e) {
            alert("Error conectando con el servidor RPM.");
        }
    }

    btnNext.addEventListener('click', () => {
        if (!inputResult.value.trim()) return alert("Por favor, ingresa tu resultado.");
        s1.style.display = 'none';
        s2.style.display = 'block';
    });

    btnBackS1.addEventListener('click', () => {
        s2.style.display = 'none';
        s1.style.display = 'block';
    });

    btnGenerate.addEventListener('click', async () => {
        const result = inputResult.value.trim();
        const purpose = inputPurpose.value.trim();
        if (!purpose) return alert("Por favor, ingresa tu propósito.");

        s2.style.display = 'none';
        s3.style.display = 'block';

        try {
            const aiModel = localStorage.getItem('aiModel') || 'google/gemini-2.5-flash';
            const aiTemp = localStorage.getItem('aiTemp') || 0.7;
            const res = await fetch('/api/rpm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ result, purpose, aiModel, aiTemp })
            });
            const resData = await res.json();
            
            if (res.ok && resData.status === 'success') {
                inputResult.value = '';
                inputPurpose.value = '';
                initWizard(); 
            } else if (res.status === 400 && resData.status === 'validation_error') {
                alert("🤖 Feedback del Estratega IA:\n\n" + resData.error + "\n\nPor favor, sé más específico.");
                s3.style.display = 'none';
                s1.style.display = 'block'; // Regresar al paso 1 para corregir
            } else {
                throw new Error(resData.error || "Error desconocido");
            }
        } catch (e) {
            alert("Error en la IA: " + e.message);
            s3.style.display = 'none';
            s2.style.display = 'block';
        }
    });

    btnDelete.addEventListener('click', async () => {
        if (!confirm("⚠️ ¿Estás seguro de que deseas borrar este perfil estratégico?")) return;
        
        btnDelete.disabled = true;
        btnDelete.textContent = "Borrando...";

        try {
            const res = await fetch('/api/rpm', { method: 'DELETE' });
            if (res.ok) {
                initWizard();
            } else {
                throw new Error("Fallo al borrar perfil de la base de datos.");
            }
        } catch (e) {
            alert(e.message);
        } finally {
            btnDelete.disabled = false;
            btnDelete.textContent = "⚠️ Borrar perfil actual y volver a empezar";
        }
    });

    function renderActiveProfile(profile) {
        txtResult.textContent = profile.results_json?.target || '-';
        txtPurpose.textContent = profile.purpose_json?.logic || '-';
        
        const map = profile.map_json || {};
        const interpret = map.interpretation || {};
        
        let html = `
            <div style="margin-bottom: 40px;">
                <h3 style="font-size: 1.2rem; color: var(--text-primary); margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
                    <span style="display: inline-block; width: 8px; height: 8px; background: var(--accent-color); border-radius: 50%; box-shadow: 0 0 10px var(--accent-color);"></span>
                    Vectores Operativos
                </h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div class="stat-box">
                        <h5 style="color: var(--text-secondary); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Nivel de Ambición</h5>
                        <p style="color: var(--text-primary); font-weight: 600; font-size: 1.1rem;">${interpret.ambition_level || '-'}</p>
                    </div>
                    <div class="stat-box">
                        <h5 style="color: var(--text-secondary); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Modelo Táctico</h5>
                        <p style="color: var(--text-primary); font-weight: 600; font-size: 1.1rem;">${interpret.preferred_business_type || '-'}</p>
                    </div>
                    <div class="stat-box" style="grid-column: 1 / -1;">
                        <h5 style="color: var(--text-secondary); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Verticales de Mercado</h5>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            ${(interpret.categories_of_interest || []).map(c => `<span class="badge badge-accent">${c}</span>`).join('')}
                        </div>
                    </div>
                    ${interpret.constraints && interpret.constraints.length > 0 ? `
                    <div class="stat-box" style="grid-column: 1 / -1; border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.02);">
                        <h5 style="color: var(--danger-color); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Restricciones Críticas</h5>
                        <ul style="margin: 0; padding-left: 20px; color: var(--text-primary); font-size: 0.95rem; line-height: 1.6;">
                            ${interpret.constraints.map(c => `<li>${c}</li>`).join('')}
                        </ul>
                    </div>` : ''}
                </div>
            </div>
        `;

        html += `
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 1.2rem; color: var(--text-primary); margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
                    <span style="display: inline-block; width: 8px; height: 8px; background: var(--success-color); border-radius: 50%; box-shadow: 0 0 10px var(--success-color);"></span>
                    Protocolo de Acción Masiva (MAP)
                </h3>
        `;
        if (map.massive_actions && Array.isArray(map.massive_actions)) {
            html += `<div style="display: flex; flex-direction: column; gap: 16px;">`;
            map.massive_actions.forEach((action, index) => {
                html += `
                    <div style="padding: 20px 24px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 12px; display: flex; align-items: flex-start; gap: 16px; transition: all 0.2s ease;">
                        <div style="min-width: 30px; height: 30px; border-radius: 50%; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); color: var(--accent-color); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.85rem;">
                            ${String(index + 1).padStart(2, '0')}
                        </div>
                        <span style="color: var(--text-primary); line-height: 1.6; padding-top: 3px;">${action}</span>
                    </div>
                `;
            });
            html += `</div></div>`;
        } else {
             html += `<p style="color: var(--text-secondary); padding: 20px; background: rgba(0,0,0,0.2); border-radius: 8px;">Esperando sincronización de directivas...</p></div>`;
        }

        mapContent.innerHTML = html;
    }

    initWizard();
};

function renderSolutions() {
    return `
        <div class="card module-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h2>Motor de Recomendaciones IA 🧠</h2>
                    <p style="color: var(--text-secondary); margin-top: 5px;">Soluciones adaptadas a tu RPM y al mercado LATAM.</p>
                </div>
                <button id="sol-generate-btn" class="btn" style="background: linear-gradient(135deg, var(--accent-color), #a855f7);">✨ Generar Algoritmo de Soluciones</button>
            </div>
            
            <div id="sol-loading" style="display: none; flex-direction: column; align-items: center; justify-content: center; padding: 40px 0;">
                <div class="spinner" style="width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
                <h3 style="color: var(--accent-color);">Generando modelos de negocio cruzados...</h3>
                <p style="color: var(--text-secondary);">Esto puede tomar hasta 30 segundos.</p>
            </div>

            <div id="sol-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">
                <!-- Cards injected here -->
            </div>
            
            <!-- Modal Justificación -->
            <div id="sol-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center;">
                <div class="card" style="width: 90%; max-width: 500px; background: var(--bg-base); border: 1px solid var(--border-color);">
                    <h3 style="margin-bottom: 15px;">Elegir para MVT 🎯</h3>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 15px;">Estás a punto de bloquear esta solución para validarla en el mercado real.</p>
                    <div class="form-group">
                        <label>Justificación Estratégica: ¿Por qué eliges esta ruta?</label>
                        <textarea id="sol-justification" class="form-control" rows="4" placeholder="Porque aprovecha mi red de contactos actual y encaja con mi restricción de tiempo..."></textarea>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                        <button id="sol-modal-cancel" class="btn btn-outline">Cancelar</button>
                        <button id="sol-modal-confirm" class="btn">Confirmar Elección</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

routes['/solutions'].postRender = function() {
    const btnGenerate = document.getElementById('sol-generate-btn');
    const loading = document.getElementById('sol-loading');
    const grid = document.getElementById('sol-grid');
    
    const modal = document.getElementById('sol-modal');
    const btnCancel = document.getElementById('sol-modal-cancel');
    const btnConfirm = document.getElementById('sol-modal-confirm');
    const inputJustification = document.getElementById('sol-justification');
    
    let activeSolutionId = null;

    async function loadSolutions() {
        grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center;">Cargando catálogo...</p>';
        try {
            const res = await fetch('/api/solutions');
            const { status, data } = await res.json();
            if (status === 'success') renderGrid(data);
        } catch (e) {
            grid.innerHTML = '<p style="color: var(--danger-color); grid-column: 1/-1;">Error de red.</p>';
        }
    }

    function renderGrid(solutions) {
        if (!solutions || solutions.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; background: rgba(255,255,255,0.05); border-radius: 8px;"><p style="color: var(--text-secondary);">No hay soluciones generadas. Haz clic en "Generar Algoritmo".</p></div>';
            return;
        }

        const hasChosen = solutions.some(s => s.is_chosen_for_mvt);

        grid.innerHTML = solutions.map(s => {
            const badgeColor = s.fit_score >= 85 ? 'var(--success-color)' : (s.fit_score >= 70 ? '#eab308' : 'var(--danger-color)');
            const isChosen = s.is_chosen_for_mvt;
            return `
                <div class="card" style="border: 1px solid ${isChosen ? 'var(--success-color)' : 'var(--border-color)'}; position: relative; background: var(--bg-body); box-shadow: ${isChosen ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none'};">
                    ${isChosen ? '<div style="position: absolute; top: -12px; right: -12px; background: var(--success-color); color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.7rem; font-weight: bold;">ELEGIDA MVT</div>' : ''}
                    <div style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.2); padding: 4px 10px; border-radius: 12px; border: 1px solid ${badgeColor}; color: ${badgeColor}; font-weight: bold; font-size: 0.8rem;">
                        Fit: ${s.fit_score}
                    </div>
                    <h3 style="margin-bottom: 10px; margin-top: 5px; font-size: 1.2rem; padding-right: 60px;">${s.title}</h3>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 15px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${s.description}</p>
                    
                    <div style="background: var(--bg-base); padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 0.8rem;">
                        <p style="margin-bottom: 5px;"><strong style="color: var(--accent-color);">Pain Point:</strong> ${s.target_pain_point}</p>
                        <p style="margin-bottom: 5px;"><strong style="color: #f43f5e;">Dificultad:</strong> ${s.difficulty_level}</p>
                        <details style="margin-top: 10px; cursor: pointer;">
                            <summary style="color: #60a5fa; font-weight: bold;">Ver Adaptación & RPM</summary>
                            <p style="margin-top: 10px; color: var(--text-secondary);"><strong>LATAM:</strong> ${s.latam_adaptation}</p>
                            <p style="margin-top: 5px; color: var(--text-secondary);"><strong>RPM:</strong> ${s.rpm_alignment}</p>
                        </details>
                    </div>

                    ${!hasChosen ? `
                        <button class="btn choose-mvt-btn" data-id="${s.id}" style="width: 100%; background: transparent; border: 1px solid var(--accent-color); color: var(--accent-color);">Elegir para MVT</button>
                    ` : (isChosen ? `<button class="btn" style="width: 100%; background: var(--success-color);" onclick="window.location.hash='#/mvt'">Ir al Panel MVT ➔</button>` : `<button class="btn" style="width: 100%; background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary);" disabled>Bloqueado</button>`)}
                </div>
            `;
        }).join('');

        document.querySelectorAll('.choose-mvt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                activeSolutionId = e.target.dataset.id;
                modal.style.display = 'flex';
                inputJustification.value = '';
            });
        });
    }

    btnGenerate.addEventListener('click', async () => {
        if (!confirm("Generar nuevas soluciones borrará las anteriores. ¿Continuar?")) return;
        
        btnGenerate.disabled = true;
        grid.style.display = 'none';
        loading.style.display = 'flex';

        try {
            const aiModel = localStorage.getItem('aiModel') || 'google/gemini-2.5-flash';
            const aiTemp = localStorage.getItem('aiTemp') || 0.7;
            const res = await fetch('/api/solutions', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aiModel, aiTemp })
            });
            const resData = await res.json();
            if (res.ok && resData.status === 'success') {
                renderGrid(resData.data);
            } else {
                alert("Error: " + resData.error);
                loadSolutions();
            }
        } catch (e) {
            alert("Error de red");
            loadSolutions();
        } finally {
            btnGenerate.disabled = false;
            grid.style.display = 'grid';
            loading.style.display = 'none';
        }
    });

    btnCancel.addEventListener('click', () => modal.style.display = 'none');

    btnConfirm.addEventListener('click', async () => {
        const justification = inputJustification.value.trim();
        if (!justification) return alert("La justificación es obligatoria.");

        btnConfirm.disabled = true;
        btnConfirm.textContent = 'Guardando...';

        try {
            const res = await fetch('/api/solutions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ solution_id: activeSolutionId, justification })
            });
            if (res.ok) {
                modal.style.display = 'none';
                loadSolutions();
                setTimeout(() => window.location.hash = '#/mvt', 500);
            } else {
                alert("Error al guardar elección.");
            }
        } catch(e) {
            alert("Fallo de red");
        } finally {
            btnConfirm.disabled = false;
            btnConfirm.textContent = 'Confirmar Elección';
        }
    });

    loadSolutions();
};

function renderMvt() {
    return `
        <div class="card module-card">
            <h2 style="margin-bottom: 20px;">Panel de Inmersión MVT 🚀</h2>
            
            <div id="mvt-solution-header" style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success-color); padding: 20px; border-radius: 8px; margin-bottom: 30px; display: none;">
                <h3 style="color: var(--success-color); margin-bottom: 5px; font-size: 0.9rem; text-transform: uppercase;">Estrella Polar (Solución Elegida)</h3>
                <h2 id="mvt-title" style="margin-bottom: 10px; font-size: 1.5rem;"></h2>
                <p id="mvt-desc" style="color: var(--text-secondary); margin-bottom: 15px;"></p>
                <div style="background: var(--bg-base); padding: 15px; border-radius: 6px; border-left: 3px solid var(--accent-color);">
                    <h4 style="font-size: 0.8rem; text-transform: uppercase; margin-bottom: 5px; color: var(--text-secondary);">Justificación Estratégica</h4>
                    <p id="mvt-justification" style="font-style: italic; color: var(--text-primary);"></p>
                </div>
            </div>

            <div id="mvt-missing-warning" style="text-align: center; padding: 40px; display: none;">
                <h3 style="color: var(--text-secondary);">No has elegido una solución todavía.</h3>
                <button class="btn" style="margin-top: 15px;" onclick="window.location.hash='#/solutions'">Ir al Motor de Soluciones</button>
            </div>

            <div id="mvt-conversations-panel" style="display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="font-size: 1.2rem;">Registro de Conversaciones de Validación</h3>
                    <button id="mvt-add-btn" class="btn" style="background: var(--accent-color);">+ Registrar Conversación</button>
                </div>

                <div style="margin-bottom: 20px; background: var(--bg-body); border-radius: 8px; padding: 15px; border: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="font-weight: bold; color: var(--text-primary);">Meta Mínima: 5 entrevistas</span>
                        <span id="mvt-progress-text" style="color: var(--accent-color); font-weight: bold;">0 / 5</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                        <div id="mvt-progress-bar" style="height: 100%; background: var(--success-color); width: 0%; transition: width 0.3s;"></div>
                    </div>
                </div>

                <div id="mvt-grid" style="display: grid; gap: 15px;">
                    <!-- Conversations here -->
                </div>
            </div>

            <!-- Modal Conversación -->
            <div id="mvt-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center;">
                <div class="card" style="width: 90%; max-width: 500px; background: var(--bg-base); border: 1px solid var(--border-color);">
                    <h3 style="margin-bottom: 20px;">Registrar Feedback de Mercado 🎤</h3>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label>Nombre del Prospecto / Entrevistado</label>
                        <input type="text" id="mvt-name" class="form-control" placeholder="Ej. Juan Pérez (Dueño de Agencia)">
                    </div>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label>Fecha de Inmersión</label>
                        <input type="date" id="mvt-date" class="form-control">
                    </div>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label>Insights Crudos / Feedback Obtenido</label>
                        <textarea id="mvt-insights" class="form-control" rows="5" placeholder="Le pareció buena idea, pero dice que el precio es un obstáculo. Estaría dispuesto a probar si..."></textarea>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                        <button id="mvt-modal-cancel" class="btn btn-outline">Cancelar</button>
                        <button id="mvt-modal-save" class="btn">Guardar Registro</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

routes['/mvt'].postRender = function() {
    const header = document.getElementById('mvt-solution-header');
    const warning = document.getElementById('mvt-missing-warning');
    const panel = document.getElementById('mvt-conversations-panel');
    const grid = document.getElementById('mvt-grid');
    
    const txtTitle = document.getElementById('mvt-title');
    const txtDesc = document.getElementById('mvt-desc');
    const txtJustification = document.getElementById('mvt-justification');
    
    const progText = document.getElementById('mvt-progress-text');
    const progBar = document.getElementById('mvt-progress-bar');

    const modal = document.getElementById('mvt-modal');
    const btnAdd = document.getElementById('mvt-add-btn');
    const btnCancel = document.getElementById('mvt-modal-cancel');
    const btnSave = document.getElementById('mvt-modal-save');
    
    const inputName = document.getElementById('mvt-name');
    const inputDate = document.getElementById('mvt-date');
    const inputInsights = document.getElementById('mvt-insights');

    let activeSolutionId = null;

    async function loadMvt() {
        try {
            const res = await fetch('/api/mvt');
            const { status, solution, conversations } = await res.json();
            
            if (status === 'success' && solution) {
                activeSolutionId = solution.id;
                header.style.display = 'block';
                panel.style.display = 'block';
                warning.style.display = 'none';

                txtTitle.textContent = solution.title;
                txtDesc.textContent = solution.description;
                txtJustification.textContent = solution.justification;

                renderConversations(conversations);
            } else {
                header.style.display = 'none';
                panel.style.display = 'none';
                warning.style.display = 'block';
            }
        } catch (e) {
            console.error(e);
        }
    }

    function renderConversations(convs) {
        // Update Progress
        const count = convs.length;
        progText.textContent = `${count} / 5`;
        progBar.style.width = `${Math.min((count / 5) * 100, 100)}%`;

        if (count === 0) {
            grid.innerHTML = '<div style="text-align: center; padding: 30px; background: rgba(255,255,255,0.05); border-radius: 8px; color: var(--text-secondary);">No hay conversaciones registradas aún. ¡Sal al mercado!</div>';
            return;
        }

        grid.innerHTML = convs.map(c => `
            <div style="background: var(--bg-body); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                    <strong style="color: var(--text-primary); font-size: 1.1rem;">👤 ${c.interviewee_name}</strong>
                    <span style="color: var(--text-secondary); font-size: 0.85rem;">📅 ${new Date(c.interview_date).toLocaleDateString()}</span>
                </div>
                <p style="color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap;">${c.insights}</p>
            </div>
        `).join('');
    }

    btnAdd.addEventListener('click', () => {
        inputName.value = '';
        inputDate.value = new Date().toISOString().split('T')[0];
        inputInsights.value = '';
        modal.style.display = 'flex';
    });

    btnCancel.addEventListener('click', () => modal.style.display = 'none');

    btnSave.addEventListener('click', async () => {
        const name = inputName.value.trim();
        const date = inputDate.value;
        const insights = inputInsights.value.trim();

        if (!name || !date || !insights) return alert("Llena todos los campos");

        btnSave.disabled = true;
        btnSave.textContent = 'Guardando...';

        try {
            const res = await fetch('/api/mvt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ solution_id: activeSolutionId, interviewee_name: name, interview_date: date, insights })
            });
            if (res.ok) {
                modal.style.display = 'none';
                loadMvt();
            } else {
                alert("Error al guardar");
            }
        } catch(e) {
            alert("Error de red");
        } finally {
            btnSave.disabled = false;
            btnSave.textContent = 'Guardar Registro';
        }
    });

    loadMvt();
};

function renderSettings() {
    return `
        <div class="card module-card">
            <h2>Ajustes del Sistema ⚙️</h2>
            <p style="color: var(--text-secondary); margin-bottom: 30px;">Configura tu inteligencia artificial y gestiona los datos de tu aplicación.</p>

            <div style="display: flex; gap: 30px; flex-wrap: wrap;">
                
                <!-- AI Config -->
                <div style="flex: 1; min-width: 300px; background: var(--bg-body); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <h3 style="margin-bottom: 15px; color: var(--text-primary);">🤖 Configuración de IA (OpenRouter)</h3>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label>Modelo LLM Preferido</label>
                        <select id="settings-model" class="form-control">
                            <option value="google/gemini-2.5-flash">Google Gemini 2.5 Flash (Recomendado)</option>
                            <option value="google/gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                            <option value="anthropic/claude-3-haiku">Anthropic Claude 3 Haiku</option>
                            <option value="anthropic/claude-3.5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                            <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label>Temperatura (Creatividad vs. Precisión)</label>
                        <input type="range" id="settings-temp" min="0" max="1" step="0.1" value="0.7" style="width: 100%; margin-bottom: 5px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary);">
                            <span>Preciso (0.0)</span>
                            <span id="settings-temp-val" style="color: var(--accent-color); font-weight: bold;">0.7</span>
                            <span>Creativo (1.0)</span>
                        </div>
                    </div>
                    <button id="settings-save-ai" class="btn" style="width: 100%;">Guardar Preferencias de IA</button>
                    <p id="settings-ai-status" style="color: var(--success-color); font-size: 0.85rem; margin-top: 10px; text-align: center; display: none;">Guardado localmente!</p>
                </div>

                <!-- Danger Zone -->
                <div style="flex: 1; min-width: 300px; background: rgba(239, 68, 68, 0.05); padding: 20px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3);">
                    <h3 style="margin-bottom: 15px; color: var(--danger-color);">⚠️ Danger Zone</h3>
                    
                    <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(239, 68, 68, 0.1); padding-bottom: 10px;">
                        <div>
                            <strong style="display: block;">Reiniciar Wizard RPM</strong>
                            <span style="font-size: 0.8rem; color: var(--text-secondary);">Borra tus perfiles RPM y Soluciones actuales.</span>
                        </div>
                        <button class="btn btn-outline danger-action" data-action="reset_rpm" style="border-color: var(--danger-color); color: var(--danger-color);">Reset RPM</button>
                    </div>

                    <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(239, 68, 68, 0.1); padding-bottom: 10px;">
                        <div>
                            <strong style="display: block;">Limpiar Caché de IA</strong>
                            <span style="font-size: 0.8rem; color: var(--text-secondary);">Borra los análisis de videos (Pain Points).</span>
                        </div>
                        <button class="btn btn-outline danger-action" data-action="clear_ai" style="border-color: var(--danger-color); color: var(--danger-color);">Limpiar IA</button>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="display: block; color: var(--danger-color);">Factory Reset Absoluto</strong>
                            <span style="font-size: 0.8rem; color: var(--text-secondary);">Borra toda la base de datos (Videos, Logs, RPM, etc). Irreversible.</span>
                        </div>
                        <button class="btn danger-action" data-action="factory_reset" style="background: var(--danger-color);">Nukear DB</button>
                    </div>
                </div>

            </div>
        </div>
    `;
}

routes['/settings'].postRender = function() {
    const selModel = document.getElementById('settings-model');
    const rangeTemp = document.getElementById('settings-temp');
    const valTemp = document.getElementById('settings-temp-val');
    const btnSaveAi = document.getElementById('settings-save-ai');
    const aiStatus = document.getElementById('settings-ai-status');

    // Load current
    selModel.value = localStorage.getItem('aiModel') || 'google/gemini-2.5-flash';
    rangeTemp.value = localStorage.getItem('aiTemp') || 0.7;
    valTemp.textContent = rangeTemp.value;

    rangeTemp.addEventListener('input', (e) => {
        valTemp.textContent = e.target.value;
    });

    btnSaveAi.addEventListener('click', () => {
        localStorage.setItem('aiModel', selModel.value);
        localStorage.setItem('aiTemp', rangeTemp.value);
        
        aiStatus.style.display = 'block';
        setTimeout(() => aiStatus.style.display = 'none', 3000);
    });

    // Danger Zone logic
    document.querySelectorAll('.danger-action').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const action = e.target.dataset.action;
            const message = action === 'factory_reset' ? "ESTÁS A PUNTO DE BORRAR TODA LA BASE DE DATOS. ¿Estás absolutamente seguro?" : "¿Confirmas borrar estos datos?";
            
            if (confirm(message)) {
                try {
                    const res = await fetch('/api/settings', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action })
                    });
                    if (res.ok) {
                        alert("Acción completada con éxito. Limpiando el sistema...");
                        window.location.hash = '#/';
                        window.location.reload();
                    } else {
                        const err = await res.json();
                        alert("Error: " + err.error);
                    }
                } catch(err) {
                    alert("Fallo de red");
                }
            }
        });
    });
};
