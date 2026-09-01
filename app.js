// app.js - Lógica de la aplicación

// Función para mostrar el catálogo
function mostrarCatalogo() {
    const gridPeliculas = document.getElementById('peliculasGrid');
    const gridSeries = document.getElementById('seriesGrid');
    
    // Limpiar grids
    gridPeliculas.innerHTML = '';
    gridSeries.innerHTML = '';
    
    // Mostrar películas
    CATALOGO.peliculas.forEach(pelicula => {
        const card = crearCard(pelicula, 'pelicula');
        gridPeliculas.appendChild(card);
    });
    
    // Mostrar series
    CATALOGO.series.forEach(serie => {
        const card = crearCard(serie, 'serie');
        gridSeries.appendChild(card);
    });
}

// Función para crear una tarjeta de contenido
function crearCard(data, tipo) {
    const card = document.createElement('div');
    card.className = 'pelicula-card';
    card.onclick = () => abrirReproductor(data, tipo);
    
    const portada = data.portada || 'https://via.placeholder.com/300x450/333/666?text=Sin+Portada';
    const titulo = data.titulo;
    const año = data.año || data.año_inicio;
    const calidad = data.calidad || 'HD';
    
    card.innerHTML = `
        <img src="${portada}" alt="${titulo}" loading="lazy">
        <div class="info">
            <div class="titulo">${titulo}</div>
            <div class="año">${año}</div>
            <span class="calidad">${calidad}</span>
        </div>
    `;
    
    return card;
}

// Función para abrir el reproductor
function abrirReproductor(data, tipo) {
    const modal = document.getElementById('playerModal');
    modal.classList.add('active');
    
    // Si es una serie, mostrar selector de episodios
    if (tipo === 'serie') {
        mostrarSelectorEpisodios(data);
    } else {
        cargarVideo(data);
    }
}

// Función para mostrar selector de episodios (para series)
function mostrarSelectorEpisodios(serie) {
    // Cargar el primer episodio de la primera temporada por defecto
    const primerEpisodio = serie.temporadas[0].episodios[0];
    const videoData = {
        ...serie,
        url_video: primerEpisodio.url_video,
        fuente: 'youtube', // Asumimos YouTube, pero podría ser dinámico
        titulo: `${serie.titulo} - S01E${primerEpisodio.numero}: ${primerEpisodio.titulo}`
    };
    cargarVideo(videoData);
}

// Función para cerrar el reproductor
function cerrarReproductor() {
    const modal = document.getElementById('playerModal');
    modal.classList.remove('active');
    document.getElementById('player-container').innerHTML = '';
}

// Función de búsqueda
function buscarContenido() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!query) {
        mostrarCatalogo();
        return;
    }
    
    const resultadosPeliculas = CATALOGO.peliculas.filter(p => 
        p.titulo.toLowerCase().includes(query) || 
        p.generos.some(g => g.toLowerCase().includes(query))
    );
    
    const resultadosSeries = CATALOGO.series.filter(s => 
        s.titulo.toLowerCase().includes(query) ||
        s.generos.some(g => g.toLowerCase().includes(query))
    );
    
    // Mostrar resultados
    const gridPeliculas = document.getElementById('peliculasGrid');
    const gridSeries = document.getElementById('seriesGrid');
    
    gridPeliculas.innerHTML = '';
    gridSeries.innerHTML = '';
    
    // Si no hay resultados, mostrar mensaje
    if (resultadosPeliculas.length === 0 && resultadosSeries.length === 0) {
        gridPeliculas.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #999;">No se encontraron resultados para "${query}"</p>`;
        return;
    }
    
    resultadosPeliculas.forEach(pelicula => {
        const card = crearCard(pelicula, 'pelicula');
        gridPeliculas.appendChild(card);
    });
    
    resultadosSeries.forEach(serie => {
        const card = crearCard(serie, 'serie');
        gridSeries.appendChild(card);
    });
}

// Función para cambiar tema (oscuro/claro)
function cambiarTema() {
    const body = document.body;
    const btn = document.querySelector('.header button:last-child');
    
    if (body.style.background === 'rgb(10, 10, 10)') {
        body.style.background = '#f5f5f5';
        body.style.color = '#333';
        btn.textContent = '☀️';
    } else {
        body.style.background = '#0a0a0a';
        body.style.color = '#fff';
        btn.textContent = '🌙';
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    mostrarCatalogo();
    
    // Permitir búsqueda con Enter
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarContenido();
    });
    
    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarReproductor();
    });
});