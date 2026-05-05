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
