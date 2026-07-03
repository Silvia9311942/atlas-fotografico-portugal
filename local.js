/* Página-modelo de um local — lida com ?id=... e mostra toda a informação. */
(function () {
  "use strict";
  const A = window.Atlas;

  async function init() {
    A.initTheme();
    A.initMobileNav();

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const container = document.getElementById("local-content");

    let locations;
    try {
      locations = await A.loadLocations();
    } catch (err) {
      A.showLoadError(container);
      return;
    }

    const loc = locations.find((l) => l.id === id);
    if (!loc) {
      container.innerHTML =
        '<p class="empty-state">Local não encontrado. <a href="explorar.html">Voltar a Explorar</a>.</p>';
      return;
    }

    document.title = loc.nome + " — Atlas Fotográfico de Portugal";
    render(loc, container);
  }

  function render(loc, container) {
    const personal = A.getPersonal(loc.id);
    const icon = A.CATEGORY_ICONS[loc.categoria] || "📍";

    container.innerHTML =
      '<div class="detail-header__banner">' + icon + "</div>" +
      '<h2 class="detail-title">' + A.escapeHtml(loc.nome) + "</h2>" +
      '<p class="detail-subtitle">' + A.escapeHtml(loc.concelho) + ", " + A.escapeHtml(loc.distrito) +
        (loc.freguesia ? " · " + A.escapeHtml(loc.freguesia) : "") + " — " + A.escapeHtml(loc.categoria) +
        " / " + A.escapeHtml(loc.subcategoria) + "</p>" +

      '<div class="detail-actions">' +
        '<button class="btn" id="btn-visited">' + (personal.visited ? "✅ Visitado" : "☐ Marcar como visitado") + "</button>" +
        '<button class="btn btn--ghost" id="btn-favorite">' + (personal.favorite ? "★ Favorito" : "☆ Adicionar aos favoritos") + "</button>" +
        '<a class="maps-link" href="' + loc.googleMapsUrl + '" target="_blank" rel="noopener">📍 Abrir no Google Maps</a>' +
      "</div>" +

      '<div class="detail-section"><h3>O que fotografar / sugestões de composição</h3><p>' + A.escapeHtml(loc.oQueFotografar) + "</p></div>" +
      '<div class="detail-section"><h3>Notas fotográficas</h3><p>' + A.escapeHtml(loc.notasFotograficas) + "</p></div>" +
      '<div class="detail-section"><h3>Melhor momento</h3><p>' + A.escapeHtml(loc.melhorEstacao) + " · " + A.escapeHtml(loc.melhorHora) + "</p></div>" +

      '<div class="detail-section"><h3>Objetivas recomendadas (Canon EOS R50)</h3>' +
        "<p><strong>Principal:</strong> " + A.escapeHtml(loc.objetivaPrincipal) + "<br>" +
        "<strong>Secundária:</strong> " + A.escapeHtml(loc.objetivaSecundaria) + "</p></div>" +

      '<div class="detail-section"><h3>Informação prática</h3>' +
      '<div class="detail-grid">' +
        '<div class="detail-item"><span>Interesse fotográfico</span>' + A.starString(loc.interesseFotografico) + "</div>" +
        '<div class="detail-item"><span>Dificuldade</span>' + A.escapeHtml(loc.dificuldade) + "</div>" +
        '<div class="detail-item"><span>Entrada</span>' + A.escapeHtml(loc.entrada) + "</div>" +
        '<div class="detail-item"><span>Estacionamento</span>' + A.escapeHtml(loc.estacionamento) + "</div>" +
        '<div class="detail-item"><span>Tempo médio de visita</span>' + A.escapeHtml(loc.tempoMedioVisita) + "</div>" +
        '<div class="detail-item"><span>Coordenadas GPS</span>' + loc.coordenadas.lat + ", " + loc.coordenadas.lng + "</div>" +
      "</div></div>" +

      '<div class="detail-section"><h3>Localização</h3><div id="mini-map"></div></div>' +

      '<div class="detail-section"><h3>O meu rating</h3><div class="rating-picker" id="detail-rating"></div></div>' +

      '<div class="detail-section"><h3>Notas pessoais</h3>' +
      '<textarea class="personal-notes" id="detail-notes" placeholder="Escreve aqui as tuas notas sobre esta visita…"></textarea></div>';

    const map = L.map("mini-map", { scrollWheelZoom: false }).setView([loc.coordenadas.lat, loc.coordenadas.lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    L.marker([loc.coordenadas.lat, loc.coordenadas.lng]).addTo(map);

    const ratingEl = document.getElementById("detail-rating");
    function renderStars(current) {
      ratingEl.innerHTML = "";
      for (let i = 1; i <= 5; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "rating-picker__star" + (i <= current ? " is-filled" : "");
        btn.textContent = i <= current ? "★" : "☆";
        btn.setAttribute("aria-pressed", String(i <= current));
        btn.setAttribute("aria-label", i + " de 5 estrelas");
        btn.addEventListener("click", () => {
          const newRating = A.getPersonal(loc.id).rating === i ? 0 : i;
          A.setPersonal(loc.id, { rating: newRating });
          renderStars(newRating);
        });
        ratingEl.appendChild(btn);
      }
    }
    renderStars(personal.rating);

    const notesEl = document.getElementById("detail-notes");
    notesEl.value = personal.notes;
    notesEl.addEventListener("input", () => A.setPersonal(loc.id, { notes: notesEl.value }));

    const btnVisited = document.getElementById("btn-visited");
    const btnFavorite = document.getElementById("btn-favorite");

    btnVisited.addEventListener("click", () => {
      const visited = !A.getPersonal(loc.id).visited;
      A.setPersonal(loc.id, { visited });
      btnVisited.textContent = visited ? "✅ Visitado" : "☐ Marcar como visitado";
    });
    btnFavorite.addEventListener("click", () => {
      const favorite = !A.getPersonal(loc.id).favorite;
      A.setPersonal(loc.id, { favorite });
      btnFavorite.textContent = favorite ? "★ Favorito" : "☆ Adicionar aos favoritos";
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
