/* Página inicial — dashboard de progresso e sugestões. */
(function () {
  "use strict";
  const A = window.Atlas;

  async function init() {
    A.initTheme();
    A.initMobileNav();

    let locations;
    try {
      locations = await A.loadLocations();
    } catch (err) {
      A.showLoadError(document.getElementById("conteudo"));
      return;
    }

    renderDashboard(locations);
    renderFavorites(locations);

    document.getElementById("btn-random").addEventListener("click", () => showRandom(locations));
    document.getElementById("btn-today").addEventListener("click", () => toggleToday(locations));

    document.addEventListener("atlas:personal-changed", () => {
      renderDashboard(locations);
      renderFavorites(locations);
    });
  }

  function renderDashboard(locations) {
    A.renderStatCards(
      {
        total: document.getElementById("stat-total"),
        visited: document.getElementById("stat-visited"),
        favorites: document.getElementById("stat-favorites"),
        progress: document.getElementById("stat-progress"),
        progressFill: document.getElementById("progress-fill")
      },
      locations
    );
    A.renderBreakdownList(document.getElementById("breakdown-distrito"), A.countBy(locations, "distrito"), "distrito");
    A.renderBreakdownList(document.getElementById("breakdown-categoria"), A.countBy(locations, "categoria"), "categoria");
  }

  function showRandom(locations) {
    const pick = locations[Math.floor(Math.random() * locations.length)];
    const block = document.getElementById("random-block");
    const container = document.getElementById("random-card");
    container.innerHTML = "";
    container.appendChild(A.renderCard(pick));
    block.hidden = false;
  }

  let todayOpen = false;
  function toggleToday(locations) {
    todayOpen = !todayOpen;
    const block = document.getElementById("today-block");
    block.hidden = !todayOpen;
    document.getElementById("btn-today").classList.toggle("is-active", todayOpen);
    if (!todayOpen) return;

    const season = A.seasonNow();
    const hour = A.hourBucketNow();
    document.getElementById("today-meta").textContent = "(" + season + " · " + hour + ")";

    const matches = A.filterLocations(locations, {
      distrito: "", concelho: "", categoria: "", hora: "", estacao: "", objetiva: "",
      entrada: "", dificuldade: "", interesseMin: 0, visitado: "", favoritos: false
    }, { todayMode: true });

    const grid = document.getElementById("today-grid");
    grid.innerHTML = "";
    matches.forEach((loc) => grid.appendChild(A.renderCard(loc)));
    document.getElementById("today-empty").hidden = matches.length !== 0;
  }

  function renderFavorites(locations) {
    const favorites = locations.filter((l) => A.getPersonal(l.id).favorite);
    const grid = document.getElementById("favorites-grid");
    grid.innerHTML = "";
    favorites.slice(0, 8).forEach((loc) => grid.appendChild(A.renderCard(loc)));
    document.getElementById("favorites-empty").hidden = favorites.length !== 0;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
