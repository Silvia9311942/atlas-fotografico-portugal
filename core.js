/* ==========================================================================
   Atlas Fotográfico de Portugal — núcleo partilhado por todas as páginas.
   Sem frameworks, sem dependências (à parte do Leaflet, vendorizado em
   vendor/leaflet/, usado só na página do mapa e nos mini-mapas de local).
   Dados em data/locations.json; estado pessoal em localStorage.
   ========================================================================== */

window.Atlas = (function () {
  "use strict";

  const STORAGE_KEY = "atlasFotografico.state.v1";
  const THEME_KEY = "atlasFotografico.theme";

  const CATEGORY_ICONS = {
    "Jardim": "🌿", "Miradouro": "🔭", "Paisagem": "🏞️", "Costa": "🌊",
    "Praia": "🏖️", "Floresta": "🌲", "Cascata": "💧", "Rio": "🛶",
    "Lagoa": "💠", "Arquitetura histórica": "🏛️", "Arquitetura moderna": "🏢",
    "Street photography": "📷", "Fauna": "🦎", "Observação de aves": "🦩",
    "Fotografia noturna": "🌌", "Aldeia": "🏘️", "Palácio": "👑",
    "Castelo": "🏰", "Ruínas": "🏺"
  };

  // Ordem meteorológica para o hemisfério norte (usada em "ideais para hoje")
  const SEASON_BY_MONTH = [
    "Inverno", "Inverno", "Primavera", "Primavera", "Primavera", "Verão",
    "Verão", "Verão", "Outono", "Outono", "Outono", "Inverno"
  ];

  function seasonNow() {
    return SEASON_BY_MONTH[new Date().getMonth()];
  }

  function hourBucketNow(hour) {
    if (hour === undefined) hour = new Date().getHours();
    if (hour >= 5 && hour < 7) return "Amanhecer";
    if (hour >= 7 && hour < 11) return "Manhã";
    if (hour >= 11 && hour < 14) return "Meio do dia";
    if (hour >= 14 && hour < 17) return "Tarde";
    if (hour >= 17 && hour < 19) return "Golden hour";
    if (hour >= 19 && hour < 20) return "Hora azul";
    return "Noite";
  }

  // ---------------------------------------------------------------------
  // Persistência (localStorage)
  // ---------------------------------------------------------------------

  function loadPersonalState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.warn("Não foi possível ler o progresso guardado:", err);
      return {};
    }
  }

  let personalState = loadPersonalState();

  function savePersonalState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(personalState));
  }

  function getPersonal(id) {
    return personalState[id] || { visited: false, favorite: false, rating: 0, notes: "" };
  }

  function setPersonal(id, patch) {
    personalState[id] = Object.assign({}, getPersonal(id), patch);
    savePersonalState();
  }

  function exportProgress() {
    const blob = new Blob([JSON.stringify(personalState, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "atlas-fotografico-progresso.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importProgress(file, onDone) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        personalState = Object.assign({}, personalState, imported);
        savePersonalState();
        onDone(true);
      } catch (err) {
        onDone(false);
      }
    };
    reader.readAsText(file);
  }

  function clearProgress() {
    personalState = {};
    savePersonalState();
  }

  // ---------------------------------------------------------------------
  // Tema e navegação (comuns a todas as páginas)
  // ---------------------------------------------------------------------

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || "light";
    document.documentElement.setAttribute("data-theme", saved);
    const btn = document.getElementById("btn-theme");
    if (!btn) return;
    btn.textContent = saved === "dark" ? "☀️" : "🌙";
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(THEME_KEY, next);
      btn.textContent = next === "dark" ? "☀️" : "🌙";
      document.dispatchEvent(new CustomEvent("atlas:theme-changed", { detail: { theme: next } }));
    });
  }

  function initMobileNav() {
    const btn = document.getElementById("btn-menu");
    const nav = document.getElementById("main-nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(isOpen));
    });
  }

  // ---------------------------------------------------------------------
  // Dados
  // ---------------------------------------------------------------------

  async function loadLocations() {
    const res = await fetch("data/locations.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  function showLoadError(container) {
    container.innerHTML =
      '<div class="empty-state">' +
      "<strong>Não foi possível carregar data/locations.json.</strong><br>" +
      "Se abriste o ficheiro diretamente a partir do disco, o Chrome/Safari bloqueiam " +
      "este carregamento por segurança (CORS em file://). Duas soluções simples:<br>" +
      "1) Abre o site com o Firefox, ou<br>" +
      "2) Corre um mini servidor local na pasta do projeto: " +
      "<code>python3 -m http.server 8000</code> e visita " +
      "<code>http://localhost:8000</code>.<br>" +
      "Consulta o README.md para mais detalhes.</div>";
  }

  // ---------------------------------------------------------------------
  // Formatação
  // ---------------------------------------------------------------------

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function starString(n) {
    return "★".repeat(n) + "☆".repeat(5 - n);
  }

  // ---------------------------------------------------------------------
  // Filtros (painel reutilizável entre Explorar e Mapa)
  // ---------------------------------------------------------------------

  function uniqueSorted(locations, field) {
    return Array.from(new Set(locations.map((l) => l[field]))).sort((a, b) => a.localeCompare(b, "pt"));
  }

  function fillSelect(selectEl, values, keepFirst) {
    const first = keepFirst ? selectEl.querySelector("option") : null;
    selectEl.innerHTML = "";
    if (first) selectEl.appendChild(first);
    values.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      selectEl.appendChild(opt);
    });
  }

  const FILTER_FIELDS = [
    { id: "distrito", label: "Distrito / Região", field: "distrito", allLabel: "Todos" },
    { id: "concelho", label: "Concelho", field: "concelho", allLabel: "Todos" },
    { id: "categoria", label: "Categoria", field: "categoria", allLabel: "Todas" },
    { id: "hora", label: "Melhor hora", field: "melhorHora", allLabel: "Todas" },
    { id: "estacao", label: "Melhor estação", field: "melhorEstacao", allLabel: "Todas" },
    { id: "objetiva", label: "Objetiva principal", field: "objetivaPrincipal", allLabel: "Todas" },
    { id: "entrada", label: "Entrada", field: "entrada", allLabel: "Todas" },
    { id: "dificuldade", label: "Dificuldade", field: "dificuldade", allLabel: "Todas" }
  ];

  /**
   * Constrói o painel de filtros dentro de `container` e liga os eventos.
   * Devolve { getFilters, reset } para quem o chamou.
   */
  function createFilterPanel(container, locations, onChange) {
    const idFor = (key) => "filter-" + key + "-" + container.id;

    container.innerHTML =
      FILTER_FIELDS.map(
        (f) =>
          '<div class="filter-field"><label for="' + idFor(f.id) + '">' + f.label + '</label>' +
          '<select id="' + idFor(f.id) + '"><option value="">' + f.allLabel + '</option></select></div>'
      ).join("") +
      '<div class="filter-field">' +
        '<label for="' + idFor("interesse") + '">Interesse fotográfico mínimo</label>' +
        '<select id="' + idFor("interesse") + '">' +
          '<option value="">Qualquer</option>' +
          '<option value="5">★★★★★</option><option value="4">★★★★ ou mais</option>' +
          '<option value="3">★★★ ou mais</option><option value="2">★★ ou mais</option>' +
          '<option value="1">★ ou mais</option>' +
        "</select></div>" +
      '<div class="filter-field">' +
        '<label for="' + idFor("visitado") + '">Estado</label>' +
        '<select id="' + idFor("visitado") + '">' +
          '<option value="">Todos</option><option value="visitado">Visitados</option>' +
          '<option value="naoVisitado">Não visitados</option>' +
        "</select></div>" +
      '<div class="filter-field filter-field--checkbox"><label>' +
        '<input type="checkbox" id="' + idFor("favoritos") + '"> Só favoritos</label></div>' +
      '<div class="filter-field filter-field--action">' +
        '<button type="button" class="btn btn--ghost" id="' + idFor("reset") + '">Limpar filtros</button></div>';

    FILTER_FIELDS.forEach((f) => {
      if (f.id === "concelho") return; // depende do distrito, populado abaixo
      fillSelect(document.getElementById(idFor(f.id)), uniqueSorted(locations, f.field), true);
    });

    function refreshConcelhos() {
      const distrito = document.getElementById(idFor("distrito")).value;
      const pool = distrito ? locations.filter((l) => l.distrito === distrito) : locations;
      const select = document.getElementById(idFor("concelho"));
      const previous = select.value;
      const concelhos = Array.from(new Set(pool.map((l) => l.concelho))).sort((a, b) => a.localeCompare(b, "pt"));
      fillSelect(select, concelhos, true);
      if (concelhos.includes(previous)) select.value = previous;
    }
    refreshConcelhos();

    document.getElementById(idFor("distrito")).addEventListener("change", () => {
      refreshConcelhos();
      onChange();
    });
    ["concelho", "categoria", "hora", "estacao", "objetiva", "entrada", "dificuldade", "interesse", "visitado"].forEach(
      (id) => document.getElementById(idFor(id)).addEventListener("change", onChange)
    );
    document.getElementById(idFor("favoritos")).addEventListener("change", onChange);
    document.getElementById(idFor("reset")).addEventListener("click", () => {
      container.querySelectorAll("select").forEach((s) => (s.value = ""));
      document.getElementById(idFor("favoritos")).checked = false;
      refreshConcelhos();
      onChange();
    });

    function getFilters() {
      return {
        distrito: document.getElementById(idFor("distrito")).value,
        concelho: document.getElementById(idFor("concelho")).value,
        categoria: document.getElementById(idFor("categoria")).value,
        hora: document.getElementById(idFor("hora")).value,
        estacao: document.getElementById(idFor("estacao")).value,
        objetiva: document.getElementById(idFor("objetiva")).value,
        entrada: document.getElementById(idFor("entrada")).value,
        dificuldade: document.getElementById(idFor("dificuldade")).value,
        interesseMin: Number(document.getElementById(idFor("interesse")).value) || 0,
        visitado: document.getElementById(idFor("visitado")).value,
        favoritos: document.getElementById(idFor("favoritos")).checked
      };
    }

    function setFilters(partial) {
      Object.keys(partial).forEach((key) => {
        const el = document.getElementById(idFor(key));
        if (el) el.value = partial[key];
      });
      if ("distrito" in partial) refreshConcelhos();
    }

    return { getFilters, refreshConcelhos, setFilters };
  }

  function locationMatchesSearch(loc, term) {
    if (!term) return true;
    const personal = getPersonal(loc.id);
    const haystack = [loc.nome, loc.distrito, loc.concelho, loc.categoria, loc.notasFotograficas, personal.notes]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  }

  function filterLocations(locations, filters, options) {
    options = options || {};
    let list = locations.filter((loc) => {
      const personal = getPersonal(loc.id);
      if (!locationMatchesSearch(loc, options.search || "")) return false;
      if (filters.distrito && loc.distrito !== filters.distrito) return false;
      if (filters.concelho && loc.concelho !== filters.concelho) return false;
      if (filters.categoria && loc.categoria !== filters.categoria) return false;
      if (filters.hora && loc.melhorHora !== filters.hora) return false;
      if (filters.estacao && loc.melhorEstacao !== filters.estacao) return false;
      if (filters.objetiva && loc.objetivaPrincipal !== filters.objetiva) return false;
      if (filters.entrada && loc.entrada !== filters.entrada) return false;
      if (filters.dificuldade && loc.dificuldade !== filters.dificuldade) return false;
      if (loc.interesseFotografico < filters.interesseMin) return false;
      if (filters.visitado === "visitado" && !personal.visited) return false;
      if (filters.visitado === "naoVisitado" && personal.visited) return false;
      if (filters.favoritos && !personal.favorite) return false;
      return true;
    });

    if (options.todayMode) {
      const season = seasonNow();
      const hour = hourBucketNow();
      list = list.filter(
        (loc) => (loc.melhorEstacao === "Todo o ano" || loc.melhorEstacao === season) && loc.melhorHora === hour
      );
    }

    return list;
  }

  function sortLocations(locations, sortBy) {
    const sorted = locations.slice();
    switch (sortBy) {
      case "rating":
        sorted.sort((a, b) => getPersonal(b.id).rating - getPersonal(a.id).rating);
        break;
      case "distrito":
        sorted.sort((a, b) => a.distrito.localeCompare(b.distrito, "pt") || a.nome.localeCompare(b.nome, "pt"));
        break;
      case "categoria":
        sorted.sort((a, b) => a.categoria.localeCompare(b.categoria, "pt") || a.nome.localeCompare(b.nome, "pt"));
        break;
      case "interesse":
        sorted.sort((a, b) => b.interesseFotografico - a.interesseFotografico);
        break;
      case "naoVisitados":
        sorted.sort((a, b) => Number(getPersonal(a.id).visited) - Number(getPersonal(b.id).visited));
        break;
      default:
        sorted.sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
    }
    return sorted;
  }

  // ---------------------------------------------------------------------
  // Cartão de local (usado em Explorar, Dashboard e Área pessoal)
  // ---------------------------------------------------------------------

  function renderCard(loc) {
    const personal = getPersonal(loc.id);
    const icon = CATEGORY_ICONS[loc.categoria] || "📍";
    const card = document.createElement("article");
    card.className = "location-card";
    card.dataset.id = loc.id;

    // Os botões de estado ficam fora do <a> — HTML não permite controlos
    // interativos aninhados dentro de outro (ex: <button> dentro de <a>).
    card.innerHTML =
      '<div class="location-card__banner">' +
        "<span>" + icon + "</span>" +
        '<div class="location-card__toggles">' +
          '<button type="button" class="location-card__toggle location-card__toggle--visited' + (personal.visited ? " is-active" : "") + '" ' +
            'aria-pressed="' + personal.visited + '" aria-label="Marcar ' + escapeHtml(loc.nome) + ' como visitado">' +
            (personal.visited ? "✅" : "☐") + "</button>" +
          '<button type="button" class="location-card__toggle location-card__toggle--fav' + (personal.favorite ? " is-active" : "") + '" ' +
            'aria-pressed="' + personal.favorite + '" aria-label="Marcar ' + escapeHtml(loc.nome) + ' como favorito">' +
            (personal.favorite ? "★" : "☆") + "</button>" +
        "</div>" +
      "</div>" +
      '<a class="location-card__link" href="local.html?id=' + encodeURIComponent(loc.id) + '">' +
        '<div class="location-card__body">' +
          '<h3 class="location-card__title">' + escapeHtml(loc.nome) + "</h3>" +
          '<p class="location-card__place">' + escapeHtml(loc.concelho) + ", " + escapeHtml(loc.distrito) +
            (loc.freguesia ? " · " + escapeHtml(loc.freguesia) : "") + "</p>" +
          '<div class="badge-row">' +
            '<span class="badge">' + escapeHtml(loc.categoria) + "</span>" +
            '<span class="badge">' + escapeHtml(loc.melhorHora) + "</span>" +
            '<span class="badge">' + escapeHtml(loc.entrada) + "</span>" +
            (personal.visited ? '<span class="badge badge--visited">Visitado</span>' : "") +
          "</div>" +
          '<div class="stars" title="Interesse fotográfico">' + starString(loc.interesseFotografico) + "</div>" +
        "</div>" +
      "</a>";

    function wireToggle(selector, field, iconOn, iconOff) {
      const btn = card.querySelector(selector);
      btn.addEventListener("click", () => {
        const value = !getPersonal(loc.id)[field];
        setPersonal(loc.id, { [field]: value });
        btn.classList.toggle("is-active", value);
        btn.setAttribute("aria-pressed", String(value));
        btn.textContent = value ? iconOn : iconOff;
        document.dispatchEvent(new CustomEvent("atlas:personal-changed"));
      });
    }
    wireToggle(".location-card__toggle--visited", "visited", "✅", "☐");
    wireToggle(".location-card__toggle--fav", "favorite", "★", "☆");

    return card;
  }

  // ---------------------------------------------------------------------
  // Estatísticas (Dashboard e Área pessoal)
  // ---------------------------------------------------------------------

  function countBy(list, field) {
    const counts = {};
    list.forEach((item) => {
      counts[item[field]] = (counts[item[field]] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }

  function renderStatCards(refs, locations) {
    const total = locations.length;
    const visited = locations.filter((l) => getPersonal(l.id).visited).length;
    const favorites = locations.filter((l) => getPersonal(l.id).favorite).length;
    const progress = total ? Math.round((visited / total) * 100) : 0;

    if (refs.total) refs.total.textContent = total;
    if (refs.visited) refs.visited.textContent = visited;
    if (refs.favorites) refs.favorites.textContent = favorites;
    if (refs.progress) refs.progress.textContent = progress + "%";
    if (refs.progressFill) refs.progressFill.style.width = progress + "%";
    return { total, visited, favorites, progress };
  }

  function renderBreakdownList(ulEl, entries, linkParam) {
    ulEl.innerHTML = "";
    entries.forEach(([label, count]) => {
      const li = document.createElement("li");
      const content = "<strong>" + count + "</strong> " + escapeHtml(label);
      if (linkParam) {
        li.innerHTML =
          '<a href="explorar.html?' + linkParam + "=" + encodeURIComponent(label) + '">' + content + "</a>";
      } else {
        li.innerHTML = content;
      }
      ulEl.appendChild(li);
    });
  }

  return {
    CATEGORY_ICONS, seasonNow, hourBucketNow,
    getPersonal, setPersonal, exportProgress, importProgress, clearProgress,
    initTheme, initMobileNav,
    loadLocations, showLoadError,
    escapeHtml, starString,
    uniqueSorted, fillSelect, createFilterPanel,
    filterLocations, sortLocations,
    renderCard, countBy, renderStatCards, renderBreakdownList
  };
})();
