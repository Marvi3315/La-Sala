// ==========================================
// CONFIGURACIÓN DE TMDB
// ==========================================
// ¡REEMPLAZA ESTO CON TU NUEVA API KEY SI LA REGENERAS!
const API_KEY = '8dafbff8f0dfc88b756c1df0570d3c80'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

// ==========================================
// FUNCIONES DE OBTENCIÓN DE DATOS
// ==========================================
async function obtenerPeliculasPopulares() {
    const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-MX&page=1`);
    const data = await res.json();
    return data.results.map(p => ({ ...p, media_type: 'movie' }));
}

async function obtenerSeriesPopulares() {
    const res = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-MX&page=1`);
    const data = await res.json();
    return data.results.map(s => ({ ...s, media_type: 'tv' }));
}

// ==========================================
// FUNCIONES DE RENDERIZADO
// ==========================================
async function mostrarCatalogo() {
    const gridPeliculas = document.getElementById('peliculasGrid');
    const gridSeries = document.getElementById('seriesGrid');
    
    // Mostrar estado de carga
    gridPeliculas.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #aaa;">Cargando películas...</p>';
    gridSeries.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #aaa;">Cargando series...</p>';

    // Restaurar títulos originales si veníamos de una búsqueda
    document.querySelectorAll('.categoria-titulo')[0].textContent = '🔥 Películas Destacadas';
    document.querySelectorAll('.categoria-titulo')[1].parentElement.style.display = 'block';
    gridPeliculas.style.gridColumn = 'auto';

    try {
        // Cargar ambos en paralelo para mayor velocidad
        const [peliculas, series] = await Promise.all([
            obtenerPeliculasPopulares(),
            obtenerSeriesPopulares()
        ]);

        gridPeliculas.innerHTML = '';
        gridSeries.innerHTML = '';

        peliculas.forEach(item => gridPeliculas.appendChild(crearCard(item)));
        series.forEach(item => gridSeries.appendChild(crearCard(item)));
    } catch (error) {
        console.error("Error cargando el catálogo:", error);
        gridPeliculas.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #e50914;">Error al cargar el catálogo. Verifica tu API Key.</p>';
    }
}

function crearCard(data) {
    const card = document.createElement('div');
    card.className = 'pelicula-card';
    card.onclick = () => abrirReproductor(data);
    
    const posterPath = data.poster_path 
        ? `${IMG_URL}${data.poster_path}` 
        : 'https://via.placeholder.com/300x450/333/666?text=Sin+Portada';
    
    const titulo = data.title || data.name;
    const año = (data.release_date || data.first_air_date || '').substring(0, 4);
    const calificacion = data.vote_average ? data.vote_average.toFixed(1) : 'N/A';
    
    card.innerHTML = `
        <img src="${posterPath}" alt="${titulo}" loading="lazy">
        <div class="info">
            <div class="titulo">${titulo}</div>
            <div class="meta">
                <span class="año">${año}</span>
                <span class="calidad">⭐ ${calificacion}</span>
            </div>
        </div>
    `;
    
    return card;
}

// ==========================================
// REPRODUCTOR Y MODAL
// ==========================================
async function abrirReproductor(data) {
    const modal = document.getElementById('playerModal');
    modal.classList.add('active');
    
    // Llenar información básica
    document.getElementById('info-titulo').textContent = data.title || data.name;
    document.getElementById('info-año').textContent = (data.release_date || data.first_air_date || '').substring(0, 4);
    document.getElementById('info-sinopsis').textContent = data.overview || 'Sin sinopsis disponible.';
    
    const playerContainer = document.getElementById('player-container');
    playerContainer.innerHTML = '<p style="color: #fff; text-align: center;">Cargando fuentes de video...</p>';

    try {
        // 1. Intentar obtener el tráiler oficial de TMDB (funcionalidad legal y garantizada)
        const res = await fetch(`${BASE_URL}/${data.media_type}/${data.id}/videos?api_key=${API_KEY}&language=es-MX`);
        const videoData = await res.json();
        const trailer = videoData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videoData.results[0];

        if (trailer && trailer.key) {
            playerContainer.innerHTML = `
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>`;
        } else {
            // 2. AQUÍ ES DONDE INTEGRARÍAS TU LÓGICA DE "DOMINIO PÚBLICO" O MULTI-FUENTE
            // Ejemplo: playerContainer.innerHTML = `<video src="URL_DE_INTERNET_ARCHIVE" controls></video>`;
            playerContainer.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#fff; text-align:center; padding: 20px;">
                    <h3>🎬 No hay tráiler disponible</h3>
                    <p>Aquí se integraría tu reproductor multi-fuente (ej. Internet Archive para dominio público).</p>
                    <p><strong>ID TMDB:</strong> ${data.id} (Úsalo para buscar en tu base de datos de fuentes legales)</p>
                </div>`;
        }
    } catch (error) {
        console.error("Error al cargar el video:", error);
        playerContainer.innerHTML = '<p style="color: #e50914; text-align: center;">Error al cargar el reproductor.</p>';
    }
}

function cerrarReproductor() {
    const modal = document.getElementById('playerModal');
    modal.classList.remove('active');
    // Limpiar el iframe para detener la reproducción de audio/video en segundo plano
    document.getElementById('player-container').innerHTML = '';
}

// ==========================================
// BÚSQUEDA
// ==========================================
async function buscarContenido() {
    const query = document.getElementById('searchInput').value.trim();
    const gridPeliculas = document.getElementById('peliculasGrid');
    const gridSeries = document.getElementById('seriesGrid');
    const titulosCategoria = document.querySelectorAll('.categoria-titulo');

    if (!query) {
        mostrarCatalogo();
        return;
    }

    gridPeliculas.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #aaa;">Buscando...</p>';
    gridSeries.innerHTML = '';
    titulosCategoria[1].parentElement.style.display = 'none'; // Ocultar sección de series para mostrar resultados unificados
    titulosCategoria[0].textContent = `🔍 Resultados para: "${query}"`;
    gridPeliculas.style.gridColumn = '1 / -1'; // Ocupar todo el ancho

    try {
        const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&language=es-MX&query=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        // Filtrar solo películas y series (ignorar personas)
        const resultados = data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');

        gridPeliculas.innerHTML = '';

        if (resultados.length === 0) {
            gridPeliculas.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #999;">No se encontraron resultados para "${query}"</p>`;
            return;
        }

        resultados.forEach(item => {
            gridPeliculas.appendChild(crearCard(item));
        });
    } catch (error) {
        console.error("Error en la búsqueda:", error);
        gridPeliculas.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #e50914;">Error al realizar la búsqueda.</p>';
    }
}

// ==========================================
// UTILIDADES Y EVENTOS
// ==========================================
function cambiarTema() {
    const body = document.body;
    const btn = document.querySelector('.header button:last-child');
    
    if (body.style.background === 'rgb(10, 10, 10)' || body.style.background === '') {
        body.style.background = '#f5f5f5';
        body.style.color = '#333';
        btn.textContent = '☀️';
        // Ajuste para tarjetas en modo claro (opcional, dependiendo de tu CSS)
        document.querySelectorAll('.pelicula-card').forEach(card => card.style.background = '#fff');
    } else {
        body.style.background = '#0a0a0a';
        body.style.color = '#fff';
        btn.textContent = '🌙';
        document.querySelectorAll('.pelicula-card').forEach(card => card.style.background = '#1a1a1a');
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    mostrarCatalogo();
    
    // Búsqueda al presionar Enter
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarContenido();
    });
    
    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarReproductor();
    });

    // Cerrar modal al hacer clic fuera del contenido
    document.getElementById('playerModal').addEventListener('click', (e) => {
        if (e.target.id === 'playerModal') cerrarReproductor();
    });
});