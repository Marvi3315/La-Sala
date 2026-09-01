# La Sala — catálogo legal de cine y series

## Qué es
- **Descubrir / Buscar**: catálogo mundial vía TMDB (pósters, sinopsis, tráilers, reparto, dónde verla legalmente en México). La API key ya viene precargada — nadie tiene que configurar nada.
- **Dominio Público**: películas y series reales, libres de derechos, reproducidas directo desde Internet Archive. No requiere ninguna key.
- **Mi Lista**: se guarda en el navegador de cada persona (localStorage) — no es una base de datos compartida.

## Cómo subir esto a Vercel
**Opción rápida (sin terminal):**
1. Ve a https://vercel.com/new
2. "Deploy" → arrastra esta carpeta completa (index.html + app.js)
3. Vercel te da una URL tipo `la-sala-tunombre.vercel.app`
4. Comparte esa URL con tu círculo de amigos — ya funciona sin que nadie configure nada

**Opción con Git:**
```bash
cd la-sala
git init
git add .
git commit -m "la sala v1"
# sube a un repo de GitHub y conéctalo en vercel.com/new
```

No hay backend, no hay build step — son solo 2 archivos estáticos.

## Notas
- La API key de TMDB ya está integrada en el código (`app.js`). Es gratuita y de uso personal, así que no hay costo ni límite práctico para un grupo de amigos.
- Si algún día quieres cambiarla, hay un botón "⚙ Configurar" en la app que permite pegar una key distinta (se guarda solo en el navegador de quien la use).
- El buscador global (arriba) busca en TMDB. El buscador dentro de "Dominio Público" busca en Internet Archive.
- Todo el contenido de "Dominio Público" es legal para ver y compartir: son obras cuyos derechos de autor ya expiraron o que sus creadores liberaron.
