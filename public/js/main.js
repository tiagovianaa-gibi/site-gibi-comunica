// Arquivo: js/main.js
document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.getElementById("nav-menu");

  // Menu mobile
  if (navToggle && navMenu) {
    const closedLabel = "Abrir menu";
    const openLabel = "Fechar menu";

    navToggle.setAttribute("aria-label", closedLabel);

    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      navToggle.setAttribute("aria-label", isOpen ? openLabel : closedLabel);
    });

    // Fecha menu ao clicar em um link
    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (navMenu.classList.contains("is-open")) {
          navMenu.classList.remove("is-open");
          navToggle.setAttribute("aria-expanded", "false");
          navToggle.setAttribute("aria-label", closedLabel);
        }
      });
    });
  }

  // Ano automático no footer
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Rolagem suave para âncoras internas
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId && targetId.length > 1) {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });

  // Destaque do link ativo no menu conforme a seção visível
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll(".nav-menu a[href^='#']");

  if (sections.length && navLinks.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach((link) => {
              link.classList.toggle(
                "is-active",
                link.getAttribute("href") === `#${id}`
              );
            });
          }
        });
      },
      {
        rootMargin: "-55% 0px -40% 0px", // pega o "meio" da tela
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  // ----------------------------
  // Hero: vídeo + áudio + seleção
  // ----------------------------
  const heroVideo = document.getElementById("hero-video");
  const heroAudioBtn = document.querySelector("[data-hero-audio-toggle]");
  const heroThumbs = document.querySelectorAll(".hero-video-thumb");

  if (heroVideo && heroAudioBtn) {
    let isMuted = true;
    heroVideo.muted = true;

    // Estado inicial do botão
    heroAudioBtn.textContent = "Ativar som";
    heroAudioBtn.setAttribute("aria-pressed", "false");

    heroAudioBtn.addEventListener("click", () => {
      isMuted = !isMuted;
      heroVideo.muted = isMuted;
      heroAudioBtn.setAttribute("aria-pressed", isMuted ? "false" : "true");

      // Garante que o vídeo está tocando
      if (heroVideo.paused) {
        heroVideo.play().catch(() => {});
      }

      heroAudioBtn.textContent = isMuted ? "Ativar som" : "Desativar som";
    });

    heroThumbs.forEach((btn) => {
      btn.addEventListener("click", () => {
        const src = btn.getAttribute("data-video-src");
        const poster = btn.getAttribute("data-video-poster");

        if (!src) return;

        // Atualiza o vídeo
        heroVideo.pause();
        heroVideo.setAttribute("src", src);
        if (poster) heroVideo.setAttribute("poster", poster);
        heroVideo.load();
        heroVideo.play().catch(() => {});

        // Volta a mutar por padrão
        isMuted = true;
        heroVideo.muted = true;
        heroAudioBtn.textContent = "Ativar som";
        heroAudioBtn.setAttribute("aria-pressed", "false");

        // Estado visual do botão ativo
        heroThumbs.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
      });
    });
  }

  // Galeria / Modal de mídia (se você usar mais pra frente)
  const modal = document.getElementById("media-modal");
  const modalImg = document.getElementById("media-modal-img");
  const mediaThumbs = document.querySelectorAll(".media-thumb");
  let lastFocusedButton = null;

  function openModal(src) {
    if (!modal || !modalImg) return;
    modalImg.src = src;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    const closeBtn = modal.querySelector(".media-modal-close");
    if (closeBtn) {
      closeBtn.focus();
    }
  }

  function closeModal() {
    if (!modal || !modalImg) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modalImg.src = "";
    if (lastFocusedButton) {
      lastFocusedButton.focus();
      lastFocusedButton = null;
    }
  }

  mediaThumbs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const fullSrc = btn.getAttribute("data-full");
      if (fullSrc) {
        lastFocusedButton = btn;
        openModal(fullSrc);
      }
    });
  });

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target.hasAttribute("data-close-modal")) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeModal();
      }
    });
  }

  // Botão "voltar ao topo"
  const backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 600) {
        backToTop.classList.add("is-visible");
      } else {
        backToTop.classList.remove("is-visible");
      }
    });

    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});
