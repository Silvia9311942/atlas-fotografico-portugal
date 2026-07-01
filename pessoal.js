/* Área pessoal — progresso, visitados, favoritos e gestão do estado guardado. */
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

    renderAll();

    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        updateTabVisibility();
      });
    });

    document.getElementById("btn-export").addEventListener("click", A.exportProgress);
    document.getElementById("import-file").addEventListener("change", (e) => {
      const file = e.target.files[0];
      e.target.value = "";
      if (!file) return;
      A.importProgress(file, (ok) => {
        alert(ok ? "Progresso importado com sucesso." : "Não foi possível ler o ficheiro. Confirma que é um JSON exportado por esta aplicação.");
        if (ok) renderAll();
      });
    });
    document.getElementById("btn-clear").addEventListener("click", () => {
      if (!confirm("Isto vai apagar todos os locais visitados, favoritos, ratings e notas pessoais. Continuar?")) return;
      A.clearProgress();
      renderAll();
    });
  }

  function renderAll() {
    A.renderStatCards(
      {
        visited: document.getElementById("stat-visited"),
        favorites: document.getElementById("stat-favorites"),
        progress: document.getElementById("stat-progress"),
        progressFill: document.getElementById("progress-fill")
      },
      locations
    );

    const visited = locations.filter((l) => A.getPersonal(l.id).visited);
    const favoritos = locations.filter((l) => A.getPersonal(l.id).favorite);

    const gridVisitados = document.getElementById("grid-visitados");
    gridVisitados.innerHTML = "";
    visited.forEach((loc) => gridVisitados.appendChild(A.renderCard(loc)));

    const gridFavoritos = document.getElementById("grid-favoritos");
    gridFavoritos.innerHTML = "";
    favoritos.forEach((loc) => gridFavoritos.appendChild(A.renderCard(loc)));

    updateTabVisibility();
  }

  function updateTabVisibility() {
    const activeTab = document.querySelector(".tab-btn.is-active").dataset.tab;
    const gridVisitados = document.getElementById("grid-visitados");
    const gridFavoritos = document.getElementById("grid-favoritos");

    gridVisitados.hidden = activeTab !== "visitados";
    document.getElementById("empty-visitados").hidden = activeTab !== "visitados" || gridVisitados.childElementCount !== 0;

    gridFavoritos.hidden = activeTab !== "favoritos";
    document.getElementById("empty-favoritos").hidden = activeTab !== "favoritos" || gridFavoritos.childElementCount !== 0;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
