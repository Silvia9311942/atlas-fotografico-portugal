/* Página Explorar — lista filtrável, pesquisa, ordenação e impressão. */
(function () {
  "use strict";
  const A = window.Atlas;

  let locations, getFilters;

  async function init() {
    A.initTheme();
    A.initMobileNav();

    try {
      locations = await A.loadLocations();
    } catch (err) {
      A.showLoadError(document.getElementById("conteudo"));
      return;
    }

    const filtersPanel = document.getElementById("filters-panel");
    const panelApi = A.createFilterPanel(filtersPanel, locations, render);
    getFilters = panelApi.getFilters;

    document.getElementById("search-input").addEventListener("input", render);
    document.getElementById("sort-select").addEventListener("change", render);
    document.getElementById("btn-print").addEventListener("click", () => window.print());
    document.getElementById("btn-toggle-filters").addEventListener("click", (e) => {
      filtersPanel.hidden = !filtersPanel.hidden;
      e.target.setAttribute("aria-expanded", String(!filtersPanel.hidden));
      e.target.textContent = filtersPanel.hidden ? "Filtros ▾" : "Filtros ▴";
    });

    document.addEventListener("atlas:personal-changed", render);

    render();
  }

  function render() {
    const search = document.getElementById("search-input").value.trim().toLowerCase();
    const filtered = A.sortLocations(
      A.filterLocations(locations, getFilters(), { search }),
      document.getElementById("sort-select").value
    );

    const grid = document.getElementById("locations-grid");
    grid.innerHTML = "";
    filtered.forEach((loc) => grid.appendChild(A.renderCard(loc)));

    document.getElementById("empty-state").hidden = filtered.length !== 0;
    document.getElementById("results-count").textContent = filtered.length + " de " + locations.length + " locais";

    renderPrintView(filtered);
  }

  function renderPrintView(list) {
    const tbody = document.getElementById("print-view-body");
    tbody.innerHTML = "";
    list.forEach((loc) => {
      const personal = A.getPersonal(loc.id);
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + A.escapeHtml(loc.nome) + "</td>" +
        "<td>" + A.escapeHtml(loc.distrito) + "</td>" +
        "<td>" + A.escapeHtml(loc.concelho) + "</td>" +
        "<td>" + A.escapeHtml(loc.categoria) + "</td>" +
        "<td>" + A.escapeHtml(loc.melhorHora) + "</td>" +
        "<td>" + loc.interesseFotografico + "/5</td>" +
        "<td>" + (personal.visited ? "Sim" : "Não") + "</td>";
      tbody.appendChild(tr);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
