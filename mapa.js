/* Página do Mapa — Leaflet + OpenStreetMap, com os mesmos filtros do Explorar. */
(function () {
  "use strict";
  const A = window.Atlas;

  const REGIONS = {
    continente: { center: [39.6, -8.0], zoom: 7 },
    acores: { center: [37.8, -25.5], zoom: 8 },
    madeira: { center: [32.7, -16.9], zoom: 9 }
  };

  let map, markerLayer, locations, getFilters;

  async function init() {
    A.initTheme();
    A.initMobileNav();

    try {
      locations = await A.loadLocations();
    } catch (err) {
      A.showLoadError(document.getElementById("conteudo"));
      return;
    }

    map = L.map("map", { scrollWheelZoom: true }).setView(REGIONS.continente.center, REGIONS.continente.zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    markerLayer = L.layerGroup().addTo(map);

    const filtersPanel = document.getElementById("filters-panel");
    const panelApi = A.createFilterPanel(filtersPanel, locations, renderMarkers);
    getFilters = panelApi.getFilters;

    document.getElementById("btn-toggle-filters").addEventListener("click", (e) => {
      filtersPanel.hidden = !filtersPanel.hidden;
      e.target.setAttribute("aria-expanded", String(!filtersPanel.hidden));
      e.target.textContent = filtersPanel.hidden ? "Filtros ▾" : "Filtros ▴";
      map.invalidateSize();
    });

    document.querySelectorAll(".map-jump [data-region]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const r = REGIONS[btn.dataset.region];
        map.setView(r.center, r.zoom);
      });
    });

    document.addEventListener("atlas:personal-changed", () => renderMarkers());

    renderMarkers();
  }

  function markerIconFor(loc) {
    const personal = A.getPersonal(loc.id);
    let cls = "map-marker map-marker--default";
    if (personal.favorite) cls = "map-marker map-marker--favorite";
    else if (personal.visited) cls = "map-marker map-marker--visited";
    const icon = A.CATEGORY_ICONS[loc.categoria] || "📍";
    return L.divIcon({
      className: cls,
      html: '<span>' + icon + "</span>",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  }

  function toggleLabel(field, value) {
    if (field === "visited") return value ? "✅ Visitado" : "☐ Marcar visitado";
    return value ? "★ Favorito" : "☆ Favorito";
  }

  function buildPopupContent(loc, marker) {
    const personal = A.getPersonal(loc.id);
    const wrapper = document.createElement("div");
    wrapper.className = "map-popup";
    wrapper.innerHTML =
      "<strong>" + A.escapeHtml(loc.nome) + "</strong>" +
      '<p>' + A.escapeHtml(loc.concelho) + ", " + A.escapeHtml(loc.distrito) + "</p>" +
      '<p class="map-popup__meta">' + A.escapeHtml(loc.categoria) + " · " + A.escapeHtml(loc.melhorHora) + "</p>" +
      '<div class="stars">' + A.starString(loc.interesseFotografico) + "</div>" +
      '<div class="map-popup__actions">' +
        '<button type="button" class="btn btn--ghost map-popup__toggle" data-field="visited" aria-pressed="' + personal.visited + '">' +
          toggleLabel("visited", personal.visited) + "</button>" +
        '<button type="button" class="btn btn--ghost map-popup__toggle" data-field="favorite" aria-pressed="' + personal.favorite + '">' +
          toggleLabel("favorite", personal.favorite) + "</button>" +
      "</div>" +
      '<a class="btn map-popup__link" href="local.html?id=' + encodeURIComponent(loc.id) + '">Ver ficha completa →</a>';

    // Atualiza só este marcador e o próprio popup (sem reconstruir o mapa
    // todo), para o popup não se fechar ao clicar num dos botões.
    wrapper.querySelectorAll(".map-popup__toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const field = btn.dataset.field;
        const value = !A.getPersonal(loc.id)[field];
        A.setPersonal(loc.id, { [field]: value });
        btn.setAttribute("aria-pressed", String(value));
        btn.textContent = toggleLabel(field, value);
        marker.setIcon(markerIconFor(loc));
      });
    });

    return wrapper;
  }

  function renderMarkers() {
    markerLayer.clearLayers();
    const filtered = A.filterLocations(locations, getFilters());
    filtered.forEach((loc) => {
      const marker = L.marker([loc.coordenadas.lat, loc.coordenadas.lng], { icon: markerIconFor(loc) });
      marker.bindPopup(buildPopupContent(loc, marker));
      marker.addTo(markerLayer);
    });
    document.getElementById("results-count").textContent = filtered.length + " de " + locations.length + " locais no mapa";
  }

  document.addEventListener("DOMContentLoaded", init);
})();
