// ==========================================
// CONFIGURACIÓN
// ==========================================
const CONFIG = {
    API_KEY: '8dafbff8f0dfc88b756c1df0570d3c80', // ← CAMBIA POR TU NUEVA KEY
    BASE_URL: 'https://api.themoviedb.org/3',
    IMG_URL: 'https://image.tmdb.org/t/p/w500',
    IMG_URL_ORIGINAL: 'https://image.tmdb.org/t/p/original',
    LANG: 'es-MX'
};

// Estado global
let estadoActual = {
    categoria: 'populares',
    contenido: [],
    currentPage: 1,
    peliculaActual: null,
    miLista: JSON.parse(localStorage.getItem('miLista')) || [],
    tema: localStorage.getItem('tema') || 'oscuro'
};

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    inicializarTema();
    cargarGeneros();
    cargarAnios();
    mostrarCatalogo();
    setupEventListeners();
});

function setupEventListeners() {
    // Búsqueda con Enter
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarContenido();
    });
    
    // Búsqueda en tiempo real (debounce)
    let timeout;
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (e.target.value.length > 2) buscarContenido();
        }, 500);
    });
    
    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarReproductor();
    });
    
    // Cerrar modal al hacer clic fuera
    document.getElementById('playerModal').addEventListener('click', (e) => {
        if (e.target.id === 'playerModal') cerrarReproductor();
    });
}

// ==========================================
// TMDB API FUNCTIONS
// ==========================================
async function fetchTMDB(endpoint, params = {}) {
    const url = new URL(`${CONFIG.BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', CONFIG.API_KEY);
    url.searchParams.append('language', CONFIG.LANG);
    
    Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
    });
    
    const res = await fetch(url);
    return res.json();
}

async function obtenerPeliculasPopulares(page = 1) {
    const data = await fetchTMDB('/movie/popular', { page });
    return data.results.map(p => ({ ...p, media_type: 'movie' }));
}

async function obtenerSeriesPopulares(page = 1) {
    const data = await fetchTMDB('/tv/popular', { page });
    return data.results.map(s => ({ ...s, media_type: 'tv' }));
}

async function obtenerMejorVotadas(page = 1) {
    const data = await fetchTMDB('/movie/top_rated', { page });
    return data.results.map(p => ({ ...p, media_type: 'movie' }));
}

async function obtenerEstrenos(page = 1) {
    const data = await fetchTMDB('/movie/now_playing', { page });
    return data.results.map(p => ({ ...p, media_type: 'movie' }));
}

async function buscarEnTMDB(query, page = 1) {
    const data = await fetchTMDB('/search/multi', { query, page });
    return data.results.filter(item => 
        item.media_type === 'movie' || item.media_type === 'tv'
    );
}

async function obtenerDetalles(id, type) {
    return await fetchTMDB(`/${type}/${id}`, {
        append_to_response: 'videos,credits,similar'
    });
}

async function obtenerTrailer(id, type) {
    const data = await fetchTMDB(`/${type}/${id}/videos`);
    return data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || 
           data.results[0];
}

// ==========================================
// INTERNET ARCHIVE (DOMINIO PÚBLICO)
// ==========================================
const DOMINIO_PUBLICO = [
    {
        id: 'ia_nosferatu',
        title: 'Nosferatu (1922)',
        year: 1922,
        poster: 'https://archive.org/download/Nosferatu1922/nosferatu.jpg',
        overview: 'El Conde Orlok, un vampiro transilvano, se traslada a Alemania llevando consigo la peste.',
        rating: 8.0,
        genres: ['Horror', 'Fantasía'],
        ia_identifier: 'Nosferatu1922',
        type: 'movie'
    },
    {
        id: 'ia_metropolis',
        title: 'Metrópolis (1927)',
        year: 1927,
        poster: 'https://archive.org/download/metropolis_201909/metro.jpg',
        overview: 'En una ciudad futurista, un científico crea un robot con la apariencia de una mujer.',
        rating: 8.3,
        genres: ['Sci-Fi', 'Drama'],
        ia_identifier: 'metropolis_201909',
        type: 'movie'
    },
    {
        id: 'ia_night_living_dead',
        title: 'La Noche de los Muertos Vivientes (1968)',
        year: 1968,
        poster: 'https://archive.org/download/night_of_the_living_dead_201807/night.jpg',
        overview: 'Un grupo de personas se refugia en una granja mientras los muertos vuelven a la vida.',
        rating: 7.8,
        genres: ['Horror', 'Thriller'],
        ia_identifier: 'night_of_the_living_dead_201807',
        type: 'movie'
    },
    {
        id: 'ia_charlie_chaplin',
        title: 'El Chico (1921) - Charlie Chaplin',
        year: 1921,
        poster: 'https://archive.org/download/TheKid1921/kid.jpg',
        overview: 'Un vagabundo cuida a un niño abandonado en las calles de Londres.',
        rating: 8.2,
        genres: ['Comedia', 'Drama'],
        ia_identifier: 'TheKid1921',
        type: 'movie'
    },
    {
        id: 'ia_plan9',
        title: 'Plan 9 del Espacio Exterior (1959)',
        year: 1959,
        poster: 'https://archive.org/download/Plan9FromOuterSpace/plan9.jpg',
        overview: 'Alienígenas resucitan a los muertos para conquistar la Tierra.',
        rating: 4.0,
        genres: ['Sci-Fi', 'Horror', 'Culto'],
        ia_identifier: 'Plan9FromOuterSpace',
        type: 'movie'
    }
];

async function obtenerDominioPublico() {
    return DOMINIO_PUBLICO;
}

function obtenerVideoInternetArchive(identifier) {
    // Retorna la URL del video de Internet Archive
    return `https://archive.org/embed/${identifier}`;
}

// ==========================================
// RENDERIZADO
// ==========================================
async function mostrarCatalogo(categoria = 'populares', page = 1) {
    const grid = document.getElementById('contentGrid');
    const title = document.getElementById('mainTitle');
    
    grid.innerHTML = '<div class="loading"></div>';
    
    try {
        let contenido = [];
        let titulo = '';
        
        switch(categoria) {
            case 'populares':
                contenido = await obtenerPeliculasPopulares(page);
                titulo = '🔥 Películas Populares';
                break;
            case 'dominio-publico':
                contenido = await obtenerDominioPublico();
                titulo = '📚 Dominio Público - Cine Clásico Legal';
                break;
            case 'mejor-votadas':
                contenido = await obtenerMejorVotadas(page);
                titulo = '⭐ Mejor Valoradas';
                break;
            case 'estrenos':
                contenido = await obtenerEstrenos(page);
                titulo = '🎬 Estrenos';
                break;
        }
        
        estadoActual.contenido = contenido;
        estadoActual.categoria = categoria;
        
        title.textContent = titulo;
        grid.innerHTML = '';
        
        contenido.forEach(item => {
            grid.appendChild(crearCard(item));
        });
        
    } catch (error) {
        console.error('Error cargando catálogo:', error);
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #e50914;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
                <p>Error al cargar el contenido. Verifica tu conexión o API Key.</p>
            </div>
        `;
    }
}

function crearCard(item) {
    const card = document.createElement('div');
    card.className = 'pelicula-card';
    
    const poster = item.poster_path 
        ? `${CONFIG.IMG_URL}${item.poster_path}`
        : (item.poster || 'https://via.placeholder.com/300x450/333/666?text=Sin+Portada');
    
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || item.year || '').substring(0, 4);
    const rating = item.vote_average ? item.vote_average.toFixed(1) : (item.rating || 'N/A');
    
    const esFavorito = estadoActual.miLista.some(m => m.id === item.id);
    
    card.innerHTML = `
    <img src="${poster}" alt="${title}" loading="lazy">
    <button class="favorite-btn ${esFavorito ? 'active' : ''}" onclick="toggleFavoriteFromCard(event, ${item.id}, '${item.media_type || 'movie'}')">
        <i class="fas fa-heart"></i>
    </button>
    <div class="info">
        <div class="titulo">${title}</div>
        <div class="meta">
            <span>${year}</span>
            <span class="calidad">⭐ ${rating}</span>
        </div>
    </div>
`;
    
    card.onclick = (e) => {
        if (!e.target.closest('.favorite-btn')) {
            abrirReproductor(item);
        }
    };
    
    return card;
}

// ==========================================
// REPRODUCTOR
// ==========================================
let playerInstance = null;
let fuentesDisponibles = [];

async function abrirReproductor(item) {
    const modal = document.getElementById('playerModal');
    const container = document.getElementById('playerContainer');
    
    modal.classList.add('active');
    estadoActual.peliculaActual = item;
    
    // Obtener detalles completos
    const detalles = item.ia_identifier 
        ? item 
        : await obtenerDetalles(item.id, item.media_type || 'movie');
    
    // Llenar información
    document.getElementById('infoTitulo').textContent = detalles.title || detalles.name;
    document.getElementById('infoAño').textContent = (detalles.release_date || detalles.first_air_date || detalles.year || '').substring(0, 4);
    document.getElementById('infoSinopsis').textContent = detalles.overview || 'Sin sinopsis disponible.';
    document.getElementById('infoRating').textContent = `⭐ ${detalles.vote_average ? detalles.vote_average.toFixed(1) : detalles.rating || 'N/A'}`;
    document.getElementById('infoGeneros').textContent = (detalles.genres || []).map(g => g.name || g).join(', ');
    
    // Actualizar botón de favoritos
    actualizarBotonFavorito();
    
    // Preparar fuentes
    fuentesDisponibles = [];
    
    if (item.ia_identifier) {
        // Dominio Público - Internet Archive
        fuentesDisponibles.push({
            nombre: '📚 Internet Archive (Dominio Público)',
            url: obtenerVideoInternetArchive(item.ia_identifier),
            type: 'iframe'
        });
    } else {
        // Contenido de TMDB - Tráiler oficial
        const trailer = await obtenerTrailer(item.id, item.media_type || 'movie');
        if (trailer && trailer.key) {
            fuentesDisponibles.push({
                nombre: ' Tráiler Oficial (YouTube)',
                url: `https://www.youtube.com/embed/${trailer.key}`,
                type: 'iframe'
            });
        }
    }
    
    // Mostrar selector si hay múltiples fuentes
    const selector = document.getElementById('sourceSelector');
    if (fuentesDisponibles.length > 1) {
        selector.style.display = 'block';
        const select = document.getElementById('serverSelect');
        select.innerHTML = fuentesDisponibles.map((f, i) => 
            `<option value="${i}">${f.nombre}</option>`
        ).join('');
    } else {
        selector.style.display = 'none';
    }
    
    // Cargar primera fuente
    if (fuentesDisponibles.length > 0) {
        cargarFuente(0);
    } else {
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #fff; text-align: center; padding: 40px;">
                <i class="fas fa-film" style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;"></i>
                <h3>No hay video disponible</h3>
                <p>Esta película no tiene fuentes disponibles en este momento.</p>
            </div>
        `;
    }
    
    // Scroll al top del modal
    modal.scrollTop = 0;
}

function cargarFuente(index) {
    const container = document.getElementById('playerContainer');
    const fuente = fuentesDisponibles[index];
    
    if (!fuente) return;
    
    if (fuente.type === 'iframe') {
        container.innerHTML = `
            <iframe 
                src="${fuente.url}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
    } else if (fuente.type === 'video') {
        container.innerHTML = `
            <video 
                src="${fuente.url}" 
                controls 
                poster="${estadoActual.peliculaActual.backdrop_path ? CONFIG.IMG_URL_ORIGINAL + estadoActual.peliculaActual.backdrop_path : ''}"
                data-plyr-provider="video">
            </video>
        `;
        
        // Inicializar Plyr
        if (playerInstance) {
            playerInstance.destroy();
        }
        playerInstance = new Plyr(container.querySelector('video'), {
            controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
            settings: ['quality', 'speed'],
            speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] }
        });
    }
}

function cambiarServidor(index) {
    cargarFuente(parseInt(index));
}

function cerrarReproductor() {
    const modal = document.getElementById('playerModal');
    modal.classList.remove('active');
    
    // Limpiar reproductor
    const container = document.getElementById('playerContainer');
    container.innerHTML = '';
    
    if (playerInstance) {
        playerInstance.destroy();
        playerInstance = null;
    }
    
    estadoActual.peliculaActual = null;
}

// ==========================================
// MI LISTA (FAVORITOS)
// ==========================================
function toggleFavorite() {
    if (!estadoActual.peliculaActual) return;
    
    const item = estadoActual.peliculaActual;
    const index = estadoActual.miLista.findIndex(m => m.id === item.id);
    
    if (index > -1) {
        // Remover
        estadoActual.miLista.splice(index, 1);
    } else {
        // Agregar
        estadoActual.miLista.push({
            id: item.id,
            title: item.title || item.name,
            poster_path: item.poster_path,
            media_type: item.media_type || 'movie',
            year: item.release_date || item.first_air_date || item.year,
            vote_average: item.vote_average || item.rating
        });
    }
    
    localStorage.setItem('miLista', JSON.stringify(estadoActual.miLista));
    actualizarBotonFavorito();
    
    // Actualizar cards si están visibles
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const cardId = parseInt(btn.getAttribute('onclick').match(/\d+/)[0]);
        if (cardId === item.id) {
            btn.classList.toggle('active');
        }
    });
}

function toggleFavoriteFromCard(event, id, type) {
    event.stopPropagation();
    
    const item = estadoActual.contenido.find(c => c.id === id);
    if (!item) return;
    
    estadoActual.peliculaActual = item;
    toggleFavorite();
}

function actualizarBotonFavorito() {
    const btn = document.querySelector('.actions button i.fa-heart');
    const item = estadoActual.peliculaActual;
    
    if (!item) return;
    
    const esFavorito = estadoActual.miLista.some(m => m.id === item.id);
    
    if (esFavorito) {
        btn.parentElement.innerHTML = '<i class="fas fa-heart"></i> Quitar de Mi Lista';
        btn.parentElement.classList.add('btn-primary');
    } else {
        btn.parentElement.innerHTML = '<i class="fas fa-heart"></i> Agregar a Mi Lista';
        btn.parentElement.classList.remove('btn-primary');
    }
}

function mostrarMiLista() {
    const grid = document.getElementById('contentGrid');
    const title = document.getElementById('mainTitle');
    
    title.textContent = '❤️ Mi Lista';
    grid.innerHTML = '';
    
    if (estadoActual.miLista.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #666;">
                <i class="fas fa-heart" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
                <p>Tu lista está vacía. Agrega películas y series haciendo clic en el corazón.</p>
            </div>
        `;
        return;
    }
    
    estadoActual.miLista.forEach(item => {
        grid.appendChild(crearCard(item));
    });
    
    // Actualizar tabs
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
}

// ==========================================
// BÚSQUEDA Y FILTROS
// ==========================================
async function buscarContenido() {
    const query = document.getElementById('searchInput').value.trim();
    const grid = document.getElementById('contentGrid');
    const title = document.getElementById('mainTitle');
    
    if (!query) {
        mostrarCatalogo(estadoActual.categoria);
        return;
    }
    
    grid.innerHTML = '<div class="loading"></div>';
    title.textContent = `🔍 Resultados para: "${query}"`;
    
    try {
        const resultados = await buscarEnTMDB(query);
        
        grid.innerHTML = '';
        
        if (resultados.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #666;">
                    <i class="fas fa-search" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
                    <p>No se encontraron resultados para "${query}"</p>
                </div>
            `;
            return;
        }
        
        resultados.forEach(item => {
            grid.appendChild(crearCard(item));
        });
        
    } catch (error) {
        console.error('Error en búsqueda:', error);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #e50914;">Error al buscar</p>';
    }
}

async function cargarGeneros() {
    try {
        const data = await fetchTMDB('/genre/movie/list');
        const select = document.getElementById('genreFilter');
        
        data.genres.forEach(genero => {
            const option = document.createElement('option');
            option.value = genero.id;
            option.textContent = genero.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando géneros:', error);
    }
}

function cargarAnios() {
    const select = document.getElementById('yearFilter');
    const anioActual = new Date().getFullYear();
    
    for (let anio = anioActual; anio >= 1920; anio--) {
        const option = document.createElement('option');
        option.value = anio;
        option.textContent = anio;
        select.appendChild(option);
    }
}

function aplicarFiltros() {
    // Implementación básica de filtros
    // Se puede expandir para filtrar el contenido cargado
    const genero = document.getElementById('genreFilter').value;
    const anio = document.getElementById('yearFilter').value;
    const rating = document.getElementById('ratingFilter').value;
    
    console.log('Filtros:', { genero, anio, rating });
    // Aquí puedes implementar la lógica de filtrado
}

function cambiarCategoria(categoria, btn) {
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    btn.classList.add('active');
    
    const filtersContainer = document.getElementById('filtersContainer');
    filtersContainer.style.display = categoria === 'dominio-publico' ? 'none' : 'flex';
    
    mostrarCatalogo(categoria);
}

// ==========================================
// UTILIDADES
// ==========================================
function toggleTema() {
    const body = document.body;
    const icon = document.getElementById('themeIcon');
    
    if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('tema', 'oscuro');
    } else {
        body.classList.add('light-theme');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('tema', 'claro');
    }
}

function inicializarTema() {
    if (estadoActual.tema === 'claro') {
        document.body.classList.add('light-theme');
        document.getElementById('themeIcon').classList.remove('fa-moon');
        document.getElementById('themeIcon').classList.add('fa-sun');
    }
}

function compartirPelicula() {
    const item = estadoActual.peliculaActual;
    if (!item) return;
    
    const url = window.location.href;
    const text = `Mira "${item.title || item.name}" en La Sala`;
    
    if (navigator.share) {
        navigator.share({
            title: 'La Sala',
            text: text,
            url: url
        }).catch(err => console.log('Error compartiendo:', err));
    } else {
        // Copiar al portapapeles
        navigator.clipboard.writeText(`${text}\n${url}`);
        alert('Enlace copiado al portapapeles');
    }
}

// Exportar funciones globales (para los onclick del HTML)
window.mostrarCatalogo = mostrarCatalogo;
window.buscarContenido = buscarContenido;
window.abrirReproductor = abrirReproductor;
window.cerrarReproductor = cerrarReproductor;
window.toggleFavorite = toggleFavorite;
window.toggleFavoriteFromCard = toggleFavoriteFromCard;
window.mostrarMiLista = mostrarMiLista;
window.toggleTema = toggleTema;
window.cambiarCategoria = cambiarCategoria;
window.aplicarFiltros = aplicarFiltros;
window.cambiarServidor = cambiarServidor;
window.compartirPelicula = compartirPelicula;