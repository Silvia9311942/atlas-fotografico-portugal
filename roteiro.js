/* Página Roteiro — monta uma lista ordenada de locais para uma saída. */
(function () {
  "use strict";
  const A = window.Atlas;

  let locations;

  async function init() {
    A.initTheme();
    A.initMobileNav();

    try {
      locations = await A.loadLocations();
    } catch (err) {
      A.showLoadError(document.getElementById("conteudo"));
      return;
    }

    document.getElementById("btn-roteiro-print").addEventListener("click", () => window.print());
    document.getElementById("btn-roteiro-clear").addEventListener("click", () => {
      if (!confirm("Isto vai remover todos os locais do roteiro atual. Continuar?")) return;
      A.clearRoteiro();
      render();
    });

    document.addEventListener("atlas:roteiro-changed", render);

    render();
  }

  function render() {
    const items = A.getRoteiroLocations(locations);

    document.getElementById("roteiro-total").textContent = items.length;
    document.getElementById("roteiro-actions").hidden = items.length === 0;
    document.getElementById("roteiro-empty").hidden = items.length !== 0;

    let totalMin = 0;
    let totalMax = 0;
    items.forEach((loc) => {
      const { min, max } = A.parseTempoVisita(loc.tempoMedioVisita);
      totalMin += min;
      totalMax += max;
    });
    document.getElementById("roteiro-tempo").textContent =
      items.length === 0 ? "—" : A.formatHours(totalMin) + (totalMax !== totalMin ? " – " + A.formatHours(totalMax) : "");

    const mapsLink = document.getElementById("roteiro-maps-link");
    if (items.length > 0) {
      const coords = items.map((loc) => loc.coordenadas.lat + "," + loc.coordenadas.lng).join("/");
      mapsLink.href = "https://www.google.com/maps/dir/" + coords;
    }

    renderList(items);
    renderPrintView(items, totalMin, totalMax);
  }

  function renderList(items) {
    const list = document.getElementById("roteiro-list");
    list.innerHTML = "";

    items.forEach((loc, index) => {
      const icon = A.CATEGORY_ICONS[loc.categoria] || "📍";
      const li = document.createElement("li");
      li.className = "roteiro-item";
      li.innerHTML =
        '<span class="roteiro-item__index">' + (index + 1) + "</span>" +
        '<span class="roteiro-item__icon">' + icon + "</span>" +
        '<div class="roteiro-item__body">' +
          '<a class="roteiro-item__title" href="local.html?id=' + encodeURIComponent(loc.id) + '">' + A.escapeHtml(loc.nome) + "</a>" +
          '<p class="roteiro-item__place">' + A.escapeHtml(loc.concelho) + ", " + A.escapeHtml(loc.distrito) + "</p>" +
          '<div class="badge-row">' +
            '<span class="badge">' + A.escapeHtml(loc.melhorHora) + "</span>" +
            '<span class="badge">' + A.escapeHtml(loc.tempoMedioVisita) + "</span>" +
          "</div>" +
        "</div>" +
        '<div class="roteiro-item__actions">' +
          '<button type="button" class="icon-btn" data-action="up" ' + (index === 0 ? "disabled" : "") + ' aria-label="Mover ' + A.escapeHtml(loc.nome) + ' para cima">↑</button>' +
          '<button type="button" class="icon-btn" data-action="down" ' + (index === items.length - 1 ? "disabled" : "") + ' aria-label="Mover ' + A.escapeHtml(loc.nome) + ' para baixo">↓</button>' +
          '<button type="button" class="icon-btn" data-action="remove" aria-label="Remover ' + A.escapeHtml(loc.nome) + ' do roteiro">✕</button>' +
        "</div>";

      li.querySelector('[data-action="up"]').addEventListener("click", () => moveItem(items, index, index - 1));
      li.querySelector('[data-action="down"]').addEventListener("click", () => moveItem(items, index, index + 1));
      li.querySelector('[data-action="remove"]').addEventListener("click", () => {
        A.removeFromRoteiro(loc.id);
        render();
      });

      list.appendChild(li);
    });
  }

  function moveItem(items, from, to) {
    const ids = items.map((loc) => loc.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    A.setRoteiroOrder(ids);
    render();
  }

  function renderPrintView(items, totalMin, totalMax) {
    document.getElementById("print-roteiro-tempo").textContent =
      items.length === 0 ? "" : "Tempo estimado de visita: " + A.formatHours(totalMin) + (totalMax !== totalMin ? " – " + A.formatHours(totalMax) : "");

    const tbody = document.getElementById("print-roteiro-body");
    tbody.innerHTML = "";
    items.forEach((loc, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + (index + 1) + "</td>" +
        "<td>" + A.escapeHtml(loc.nome) + "</td>" +
        "<td>" + A.escapeHtml(loc.concelho) + "</td>" +
        "<td>" + A.escapeHtml(loc.distrito) + "</td>" +
        "<td>" + A.escapeHtml(loc.melhorHora) + "</td>" +
        "<td>" + A.escapeHtml(loc.tempoMedioVisita) + "</td>";
      tbody.appendChild(tr);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
