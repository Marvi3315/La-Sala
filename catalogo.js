// catalogo.js - Archivo principal de datos
const CATALOGO = {
  peliculas: [
    {
      id: 1,
      titulo: "El Padrino",
      año: 1972,
      director: "Francis Ford Coppola",
      sinopsis: "El patriarca de una familia mafiosa transfiere el control de su imperio a su hijo.",
      generos: ["Drama", "Crimen"],
      portada: "https://image.tmdb.org/t/p/w500/...", // URL de imagen
      fuente: "youtube", // youtube, archive, vimeo, dailymotion, propio
      url_video: "https://www.youtube.com/embed/...",
      clasificacion: "R",
      calidad: "HD"
    },
    // Más películas...
  ],
  series: [
    {
      id: 101,
      titulo: "Los Soprano",
      año_inicio: 1999,
      año_fin: 2007,
      sinopsis: "Un mafioso de Nueva Jersey equilibra su vida familiar con su rol criminal.",
      generos: ["Drama", "Crimen"],
      portada: "https://image.tmdb.org/t/p/w500/...",
      temporadas: [
        {
          numero: 1,
          episodios: [
            { 
              numero: 1, 
              titulo: "Pilot", 
              url_video: "https://www.youtube.com/embed/..." 
            },
            // Más episodios...
          ]
        }
      ]
    }
  ]
};