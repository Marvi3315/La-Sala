/* ==========================================================
   LA SALA — catálogo legal de cine y series
   - TMDB: metadata, pósters, tráilers, dónde ver (requiere API key gratuita del usuario)
   - Internet Archive: contenido real de dominio público, reproducible sin key
   - Mi Lista: guardada en localStorage del navegador (solo local, nadie más la ve)
   ========================================================== */

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_IMG_SM = "https://image.tmdb.org/t/p/w185";
const REGION = "MX";

// API key de TMDB precargada — gratuita, para uso personal/privado del grupo.
const TMDB_DEFAULT_KEY = "8dafbff8f0dfc88b756c1df0570d3c80";

let state = {
  tmdbKey: localStorage.getItem("lasala_tmdb_key") || TMDB_DEFAULT_KEY,
  activeTab: "discover",
  myList: JSON.parse(localStorage.getItem("lasala_mylist") || "[]"),
};

// ---------- helpers ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function skeletonCards(n) {
  return Array.from({ length: n }, () =>
    `<div class="card"><div class="poster-wrap skeleton"></div><div class="meta"><div class="skeleton" style="height:14px;width:80%;margin-bottom:6px;"></div><div class="skeleton" style="height:11px;width:50%;"></div></div></div>`
  ).join("");
}

function emptyState(title, body) {
  return `<div class="state-msg" style="grid-column:1/-1;"><span class="display">${title}</span>${body}</div>`;
}

// ---------- TMDB ----------
async function tmdb(path, params = {}) {
  if (!state.tmdbKey) throw new Error("NO_KEY");
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set("api_key", state.tmdbKey);
  url.searchParams.set("language", "es-MX");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 401) throw new Error("BAD_KEY");
    throw new Error("TMDB_ERROR");
  }
  return res.json();
}

function tmdbCardHTML(item) {
  const isMovie = item.media_type === "movie" || item.title;
  const title = item.title || item.name || "Sin título";
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const poster = item.poster_path ? TMDB_IMG_SM + item.poster_path : null;
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "—";
  return `
    <div class="card" data-tmdb-id="${item.id}" data-media-type="${isMovie ? "movie" : "tv"}">
      <div class="poster-wrap">
        ${poster ? `<img src="${poster}" alt="${title}" loading="lazy">` : `<div class="skeleton" style="height:100%"></div>`}
        <div class="sprockets top">${"<span></span>".repeat(10)}</div>
        <div class="sprockets bottom">${"<span></span>".repeat(10)}</div>
      </div>
      <div class="meta">
        <div class="title">${title}</div>
        <div class="sub"><span>${year || "—"}</span><span class="rating-pill">★ ${rating}</span></div>
      </div>
    </div>`;
}

async function loadDiscover() {
  const grid = $("#discoverGrid");
  if (!state.tmdbKey) {
    grid.innerHTML = emptyState("Configura tu API key", "Necesitas una API key gratuita de TMDB para ver el catálogo mundial. Da clic en «Configurar API key» arriba.");
    $("#discoverCount").textContent = "";
    return;
  }
  grid.innerHTML = skeletonCards(12);
  try {
    const data = await tmdb("/trending/all/week");
    const items = (data.results || []).filter((i) => i.poster_path);
    grid.innerHTML = items.map(tmdbCardHTML).join("") || emptyState("Sin resultados", "Intenta de nuevo más tarde.");
    $("#discoverCount").textContent = `${items.length} títulos`;
  } catch (e) {
    grid.innerHTML = emptyState("No se pudo cargar", e.message === "BAD_KEY" ? "Tu API key no es válida. Revísala en Configurar." : "Ocurrió un error consultando TMDB.");
  }
}

async function runSearch(query) {
  const grid = $("#searchGrid");
  if (!query) {
    grid.innerHTML = emptyState("Escribe algo", "Usa la barra de búsqueda de arriba para encontrar películas, series, actores o directores.");
    $("#searchCount").textContent = "";
    return;
  }
  if (!state.tmdbKey) {
    grid.innerHTML = emptyState("Configura tu API key", "Necesitas una API key gratuita de TMDB para buscar en el catálogo mundial.");
    return;
  }
  grid.innerHTML = skeletonCards(12);
  try {
    const data = await tmdb("/search/multi", { query, include_adult: "false" });
    const items = (data.results || []).filter((i) => i.poster_path && (i.media_type === "movie" || i.media_type === "tv"));
    grid.innerHTML = items.map(tmdbCardHTML).join("") || emptyState("Sin resultados", `No encontramos nada para "${query}".`);
    $("#searchCount").textContent = `${items.length} resultados`;
  } catch (e) {
    grid.innerHTML = emptyState("Error de búsqueda", "Revisa tu conexión o tu API key.");
  }
}

async function openTmdbModal(id, mediaType) {
  showModalLoading();
  try {
    const detail = await tmdb(`/${mediaType}/${id}`, { append_to_response: "credits,videos,watch/providers" });
    const title = detail.title || detail.name;
    const year = (detail.release_date || detail.first_air_date || "").slice(0, 4);
    const runtime = detail.runtime ? `${detail.runtime} min` : (detail.episode_run_time?.[0] ? `${detail.episode_run_time[0]} min/ep` : "");
    const genres = (detail.genres || []).map((g) => g.name).join(" · ");
    const poster = detail.poster_path ? TMDB_IMG + detail.poster_path : "";
    const providers = detail["watch/providers"]?.results?.[REGION];
    const trailer = (detail.videos?.results || []).find((v) => v.site === "YouTube" && v.type === "Trailer");
    const cast = (detail.credits?.cast || []).slice(0, 10);

    let watchHTML = `<p style="color:var(--muted);font-size:13px;">No encontramos dónde verla legalmente en México por ahora.</p>`;
    if (providers) {
      const groups = [
        { label: "Streaming", list: providers.flatrate },
        { label: "Renta", list: providers.rent },
        { label: "Compra", list: providers.buy },
      ].filter((g) => g.list && g.list.length);
      if (groups.length) {
        watchHTML = groups.map((g) => `
          <div style="margin-bottom:10px;">
            <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">${g.label}</div>
            <div class="watch-list">
              ${g.list.map((p) => `<div class="watch-chip"><img src="${TMDB_IMG_SM}${p.logo_path}" alt="${p.provider_name}">${p.provider_name}</div>`).join("")}
            </div>
          </div>`).join("");
        if (providers.link) {
          watchHTML += `<a href="${providers.link}" target="_blank" rel="noopener" class="btn" style="display:inline-block;margin-top:6px;text-decoration:none;">Ver todas las opciones →</a>`;
        }
      }
    }

    const inList = state.myList.some((x) => x.id === id && x.mediaType === mediaType);

    $("#modalContent").innerHTML = `
      <button class="modal-close" onclick="closeModal()">✕</button>
      <div class="modal-hero">
        <img src="${poster}" alt="${title}">
        <div>
          <div class="mh-title display">${title}</div>
          <div class="mh-facts">
            <span>${year || "—"}</span>
            ${runtime ? `<span>${runtime}</span>` : ""}
            <span class="rating-pill">★ ${detail.vote_average?.toFixed(1) || "—"}</span>
          </div>
          <div class="mh-facts" style="margin-top:-8px;"><span>${genres}</span></div>
          <p class="mh-overview">${detail.overview || "Sin sinopsis disponible."}</p>
          <div class="modal-actions">
            <button class="btn" onclick="toggleMyList(${id}, '${mediaType}', '${(title || "").replace(/'/g, "\\'")}', '${detail.poster_path || ""}')" id="mylistToggleBtn">
              ${inList ? "✓ En tu lista" : "+ Agregar a mi lista"}
            </button>
          </div>
        </div>
      </div>
      ${trailer ? `
      <div class="modal-section">
        <h3>Tráiler</h3>
        <div class="video-embed"><iframe src="https://www.youtube.com/embed/${trailer.key}" allowfullscreen title="Tráiler"></iframe></div>
      </div>` : ""}
      <div class="modal-section">
        <h3>Dónde verla legalmente (México)</h3>
        ${watchHTML}
      </div>
      ${cast.length ? `
      <div class="modal-section">
        <h3>Reparto</h3>
        <div class="cast-row">
          ${cast.map((c) => `
            <div class="cast-card">
              <img src="${c.profile_path ? TMDB_IMG_SM + c.profile_path : ""}" onerror="this.style.opacity=0">
              <div class="cn">${c.name}</div>
              <div class="cc">${c.character || ""}</div>
            </div>`).join("")}
        </div>
      </div>` : ""}
    `;
  } catch (e) {
    $("#modalContent").innerHTML = `<button class="modal-close" onclick="closeModal()">✕</button><div class="modal-section" style="padding-top:60px;">${emptyState("No se pudo cargar", "Intenta de nuevo.")}</div>`;
  }
}

// ---------- JSONP helper (evita bloqueo CORS del navegador con archive.org) ----------
let jsonpCounter = 0;
function jsonpRequest(baseUrl, params) {
  return new Promise((resolve, reject) => {
    const cbName = "iaCallback_" + Date.now() + "_" + (jsonpCounter++);
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((val) => url.searchParams.append(k, val));
      else url.searchParams.set(k, v);
    });
    url.searchParams.set("callback", cbName);
    const script = document.createElement("script");
    const cleanup = () => {
      delete window[cbName];
      script.remove();
    };
    window[cbName] = (data) => {
      cleanup();
      resolve(data);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("JSONP_ERROR"));
    };
    script.src = url.toString();
    document.body.appendChild(script);
  });
}

// ---------- Internet Archive ----------
async function searchArchive(query) {
  const grid = $("#pdGrid");
  grid.innerHTML = skeletonCards(12);
  const q = query && query.trim()
    ? `(${query}) AND mediatype:(movies) AND collection:(publicdomainmovies OR moviesandfilms OR feature_films OR classic_tv OR prelinger OR silentfilms)`
    : `mediatype:(movies) AND collection:(publicdomainmovies OR moviesandfilms OR feature_films OR classic_tv OR prelinger OR silentfilms)`;
  try {
    const data = await jsonpRequest("https://archive.org/advancedsearch.php", {
      q,
      "fl[]": ["identifier", "title", "year", "description"],
      rows: "48",
      output: "json",
      "sort[]": "downloads desc",
    });
    const docs = data.response?.docs || [];
    if (!docs.length) {
      grid.innerHTML = emptyState("Sin resultados", "Prueba con otro título, por ejemplo: Nosferatu, Metropolis, Night of the Living Dead.");
      $("#pdCount").textContent = "";
      return;
    }
    grid.innerHTML = docs.map((d) => `
      <div class="card" data-archive-id="${d.identifier}" data-archive-title="${(d.title || d.identifier).replace(/"/g, '&quot;')}">
        <div class="poster-wrap">
          <img src="https://archive.org/services/img/${d.identifier}" alt="${d.title || d.identifier}" loading="lazy" onerror="this.src='';this.style.background='var(--surface-2)'">
          <span class="badge-free">LIBRE</span>
          <div class="sprockets top">${"<span></span>".repeat(10)}</div>
          <div class="sprockets bottom">${"<span></span>".repeat(10)}</div>
        </div>
        <div class="meta">
          <div class="title">${d.title || d.identifier}</div>
          <div class="sub"><span>${d.year || "Dominio público"}</span></div>
        </div>
      </div>`).join("");
    $("#pdCount").textContent = `${docs.length} títulos reproducibles`;
  } catch (e) {
    grid.innerHTML = emptyState("Error de conexión", "No se pudo consultar Internet Archive.");
  }
}

function openArchiveModal(identifier, title) {
  showModalLoading();
  $("#modalContent").innerHTML = `
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-hero" style="grid-template-columns:1fr;">
      <div>
        <div class="mh-title display">${title}</div>
        <div class="mh-facts"><span class="tag" style="border-color:var(--red);color:var(--red);">Dominio público — Internet Archive</span></div>
      </div>
    </div>
    <div class="modal-section" style="border-top:none; padding-top:0;">
      <div class="archive-player">
        <iframe src="https://archive.org/embed/${identifier}" allowfullscreen title="${title}"></iframe>
      </div>
      <p style="color:var(--muted); font-size:12.5px; margin-top:12px;">
        Reproducido directo desde el archivo público de Internet Archive.
        <a href="https://archive.org/details/${identifier}" target="_blank" rel="noopener" style="color:var(--amber);">Ver en archive.org →</a>
      </p>
    </div>
  `;
}

// ---------- Mi Lista ----------
function toggleMyList(id, mediaType, title, poster) {
  const idx = state.myList.findIndex((x) => x.id === id && x.mediaType === mediaType);
  if (idx >= 0) {
    state.myList.splice(idx, 1);
  } else {
    state.myList.push({ id, mediaType, title, poster });
  }
  localStorage.setItem("lasala_mylist", JSON.stringify(state.myList));
  const btn = $("#mylistToggleBtn");
  if (btn) btn.textContent = idx >= 0 ? "+ Agregar a mi lista" : "✓ En tu lista";
  if (state.activeTab === "mylist") renderMyList();
}

function renderMyList() {
  const grid = $("#mylistGrid");
  if (!state.myList.length) {
    grid.innerHTML = emptyState("Tu lista está vacía", "Agrega títulos desde Descubrir o Buscar dando clic en «Agregar a mi lista».");
    $("#mylistCount").textContent = "";
    return;
  }
  grid.innerHTML = state.myList.map((item) => `
    <div class="card" data-tmdb-id="${item.id}" data-media-type="${item.mediaType}">
      <div class="poster-wrap">
        ${item.poster ? `<img src="${TMDB_IMG_SM}${item.poster}" alt="${item.title}">` : `<div class="skeleton" style="height:100%"></div>`}
        <div class="sprockets top">${"<span></span>".repeat(10)}</div>
        <div class="sprockets bottom">${"<span></span>".repeat(10)}</div>
      </div>
      <div class="meta"><div class="title">${item.title}</div></div>
    </div>`).join("");
  $("#mylistCount").textContent = `${state.myList.length} títulos`;
}

// ---------- Modal plumbing ----------
function showModalLoading() {
  $("#modalContent").innerHTML = `<button class="modal-close" onclick="closeModal()">✕</button><div style="padding:60px 28px;">${emptyState("Cargando…", "")}</div>`;
  $("#modalBackdrop").classList.add("open");
}
function closeModal() {
  $("#modalBackdrop").classList.remove("open");
  $("#modalContent").innerHTML = "";
}
window.closeModal = closeModal;
window.toggleMyList = toggleMyList;

// ---------- Tabs ----------
function switchTab(tab) {
  state.activeTab = tab;
  $$(".navbtn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  ["discover", "search", "publicdomain", "mylist"].forEach((t) => {
    $(`#tab-${t}`).style.display = t === tab ? "block" : "none";
  });
  if (tab === "discover") loadDiscover();
  if (tab === "publicdomain" && !$("#pdGrid").children.length) searchArchive("");
  if (tab === "mylist") renderMyList();
}

// ---------- Settings modal ----------
function openSettings() {
  showModalLoading();
  $("#modalContent").innerHTML = `
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-section" style="border-top:none; padding-top:32px;">
      <h3>Configurar API key de TMDB</h3>
      <p style="color:var(--muted); font-size:13.5px; line-height:1.6; margin-bottom:14px;">
        Es gratis. Crea una cuenta en themoviedb.org → Configuración → API → solicita una "API key (v3 auth)". Se guarda solo en este navegador (localStorage), nadie más la ve.
      </p>
      <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener" style="color:var(--amber); font-size:13px;">Obtener API key gratis en TMDB →</a>
      <div class="search-wrap" style="max-width:100%; margin-top:16px;">
        <input id="tmdbKeyInput" type="text" placeholder="Pega tu API key aquí" value="${state.tmdbKey}">
      </div>
      <div class="modal-actions">
        <button class="btn" id="saveKeyBtn">Guardar</button>
        ${state.tmdbKey ? `<button class="btn btn-outline" id="clearKeyBtn">Quitar key</button>` : ""}
      </div>
    </div>
  `;
  $("#saveKeyBtn").addEventListener("click", () => {
    const val = $("#tmdbKeyInput").value.trim();
    state.tmdbKey = val;
    localStorage.setItem("lasala_tmdb_key", val);
    closeModal();
    $("#setupBanner").style.display = val ? "none" : "flex";
    if (state.activeTab === "discover") loadDiscover();
  });
  const clearBtn = $("#clearKeyBtn");
  if (clearBtn) clearBtn.addEventListener("click", () => {
    state.tmdbKey = TMDB_DEFAULT_KEY;
    localStorage.removeItem("lasala_tmdb_key");
    closeModal();
    loadDiscover();
  });
}

// ---------- Event wiring ----------
document.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  if (card.dataset.tmdbId) openTmdbModal(Number(card.dataset.tmdbId), card.dataset.mediaType);
  if (card.dataset.archiveId) openArchiveModal(card.dataset.archiveId, card.dataset.archiveTitle);
});

$("#modalBackdrop").addEventListener("click", (e) => {
  if (e.target.id === "modalBackdrop") closeModal();
});

$$(".navbtn").forEach((btn) => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));

$("#settingsBtn").addEventListener("click", openSettings);
$("#setupBtn").addEventListener("click", openSettings);

$("#globalSearch").addEventListener("input", debounce((e) => {
  const q = e.target.value.trim();
  if (!q) return;
  switchTab("search");
  runSearch(q);
}, 500));

$("#pdSearch").addEventListener("input", debounce((e) => {
  searchArchive(e.target.value.trim());
}, 500));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ---------- Init ----------
if (!state.tmdbKey) $("#setupBanner").style.display = "flex";
loadDiscover();
