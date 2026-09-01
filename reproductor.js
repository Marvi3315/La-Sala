// reproductor.js
function cargarVideo(videoData) {
    const playerContainer = document.getElementById('player-container');
    let iframeHTML = '';
    
    // Limpiar contenedor
    playerContainer.innerHTML = '';
    
    // Según la fuente, construir el iframe
    switch(videoData.fuente) {
        case 'youtube':
            iframeHTML = `
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="${videoData.url_video}?autoplay=1&rel=0&modestbranding=1" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            `;
            break;
            
        case 'archive':
            iframeHTML = `
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="${videoData.url_video}" 
                    frameborder="0" 
                    allowfullscreen>
                </iframe>
            `;
            break;
            
        case 'vimeo':
            iframeHTML = `
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="${videoData.url_video}?autoplay=1&dnt=1" 
                    frameborder="0" 
                    allow="autoplay; fullscreen; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            `;
            break;
            
        case 'dailymotion':
            iframeHTML = `
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="${videoData.url_video}?autoplay=1" 
                    frameborder="0" 
                    allowfullscreen>
                </iframe>
            `;
            break;
            
        default:
            // Si es una URL directa de video (MP4, etc.)
            iframeHTML = `
                <video width="100%" height="100%" controls autoplay>
                    <source src="${videoData.url_video}" type="video/mp4">
                    Tu navegador no soporta el reproductor de video.
                </video>
            `;
    }
    
    // Insertar el reproductor
    playerContainer.innerHTML = `
        <div class="player-wrapper">
            ${iframeHTML}
            <div class="player-overlay">
                <button onclick="toggleFullscreen()" class="fullscreen-btn">
                    ⛶ Pantalla Completa
                </button>
            </div>
        </div>
    `;
    
    // Mostrar información de la película
    mostrarInfoPelicula(videoData);
}

// Función para pantalla completa
function toggleFullscreen() {
    const player = document.querySelector('.player-wrapper iframe');
    if (player) {
        if (player.requestFullscreen) {
            player.requestFullscreen();
        }
    }
}

// Mostrar información detallada
function mostrarInfoPelicula(data) {
    document.getElementById('info-titulo').textContent = data.titulo;
    document.getElementById('info-año').textContent = data.año || data.año_inicio;
    document.getElementById('info-sinopsis').textContent = data.sinopsis;
    document.getElementById('info-generos').textContent = data.generos.join(' • ');
    document.getElementById('info-calidad').textContent = data.calidad || 'HD';
}