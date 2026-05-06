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
                    <p style="font-size: 0.85rem; color: ${data.last_status === 'success' ? 'var(--success-color)' : 'var(--danger-color)'}; margin-top: 5px;">Estado: ${data.last_status || 'N/A'}</p>
                </div>
            `;
        }
    } catch (e) {}
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
                            const analyzeRes = await fetch('/api/analyze', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ video_id: id })
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
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 20px; margin-bottom: 30px; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <h2 style="color: var(--text-primary); font-size: 1.8rem;">Perfil RPM Procesado 🚀</h2>
                        <p style="color: var(--success-color); font-weight: 500; font-size: 0.9rem; margin-top: 5px;">IA: Análisis de restricciones y plan completado.</p>
                    </div>
                    <span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 6px 15px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; border: 1px solid rgba(16, 185, 129, 0.2);">IA ACTIVADA</span>
                </div>

                <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 30px;">
                    <div style="flex: 1; min-width: 250px; background: var(--bg-body); border-radius: 8px; padding: 20px; border-left: 4px solid var(--accent-color);">
                        <h4 style="color: var(--text-secondary); text-transform: uppercase; font-size: 0.8rem; margin-bottom: 10px;">Resultado Deseado (R)</h4>
                        <p id="active-result" style="font-size: 1.05rem; color: var(--text-primary); font-weight: 500;"></p>
                    </div>
                    <div style="flex: 1; min-width: 250px; background: var(--bg-body); border-radius: 8px; padding: 20px; border-left: 4px solid #f43f5e;">
                        <h4 style="color: var(--text-secondary); text-transform: uppercase; font-size: 0.8rem; margin-bottom: 10px;">Tu Propósito (P)</h4>
                        <p id="active-purpose" style="font-size: 1.05rem; color: var(--text-primary); line-height: 1.6;"></p>
                    </div>
                </div>

                <div id="active-map-content" style="border: 1px solid var(--border-color); background: var(--bg-base); border-radius: 8px; padding: 30px; margin-bottom: 40px;">
                    <!-- MAP Content dynamically injected here -->
                </div>

                <div style="text-align: center; padding-top: 20px; border-top: 1px dashed var(--border-color);">
                    <button id="wizard-delete-btn" class="btn" style="background: transparent; border: 1px solid var(--danger-color); color: var(--danger-color); font-size: 0.9rem; padding: 10px 20px; cursor: pointer; border-radius: 6px;">
                        ⚠️ Borrar perfil actual y volver a empezar
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
            const res = await fetch('/api/rpm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ result, purpose })
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
        
        let html = `<h3 style="font-size: 1.4rem; color: var(--accent-color); margin-bottom: 20px;"><span style="margin-right: 10px;">🗺️</span>${map.map_title || 'Massive Action Plan'}</h3>`;
        
        html += `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 30px; background: rgba(0,0,0,0.1); padding: 20px; border-radius: 8px;">
                <div>
                    <h5 style="color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 5px;">Ambición</h5>
                    <p style="color: var(--text-primary); font-weight: bold; font-size: 1rem;">${interpret.ambition_level || '-'}</p>
                </div>
                <div>
                    <h5 style="color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 5px;">Modelo Preferido</h5>
                    <p style="color: var(--text-primary); font-weight: bold; font-size: 1rem;">${interpret.preferred_business_type || '-'}</p>
                </div>
                <div>
                    <h5 style="color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 5px;">Categorías</h5>
                    <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-top: 5px;">
                        ${(interpret.categories_of_interest || []).map(c => `<span style="background: rgba(168, 85, 247, 0.2); color: #c084fc; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 500;">${c}</span>`).join('')}
                    </div>
                </div>
                <div>
                    <h5 style="color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 5px;">Restricciones</h5>
                    <ul style="margin: 5px 0 0 15px; padding: 0; color: #f87171; font-size: 0.85rem;">
                        ${(interpret.constraints || []).map(c => `<li style="margin-bottom: 3px;">${c}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;

        html += `<h4 style="font-size: 1.1rem; color: var(--text-primary); margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">Brainstorming: Acciones Masivas (M)</h4>`;
        if (map.massive_actions && Array.isArray(map.massive_actions)) {
            html += `<ul style="list-style: none; padding: 0; margin: 0;">`;
            map.massive_actions.forEach(action => {
                html += `
                    <li style="padding: 12px 15px; background: var(--bg-body); margin-bottom: 10px; border-radius: 6px; color: var(--text-primary); display: flex; align-items: start; border-left: 3px solid var(--accent-color);">
                        <span style="color: var(--accent-color); margin-right: 12px; font-size: 1.2rem;">⚡</span>
                        <span style="line-height: 1.4;">${action}</span>
                    </li>
                `;
            });
            html += `</ul>`;
        } else {
             html += `<p style="color: var(--text-secondary);">No se generaron acciones masivas.</p>`;
        }

        mapContent.innerHTML = html;
    }

    initWizard();
};
