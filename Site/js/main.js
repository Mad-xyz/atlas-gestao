(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js-anim");

  function clamp(x, a, b) {
    return Math.min(b, Math.max(a, x));
  }

  function easeOut(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  /* ===== Scroll reveal ===== */
  var revealEls = document.querySelectorAll(".reveal, .reveal-late");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ===== Feature scroll section (preservado) ===== */
  var featureSection = document.getElementById("funcionalidades");
  if (featureSection && !reduceMotion) {
    var fViewport = featureSection.querySelector(".feature-viewport");
    var fRow = featureSection.querySelector(".feature-row");
    var prints = featureSection.querySelectorAll(".feature-print");
    var labels = featureSection.querySelectorAll(".feature-label");
    if (fViewport && fRow) {
      var svh = window.innerHeight;
      var isMobile = window.matchMedia("(max-width: 1023px)").matches;
      var offset = fRow.scrollWidth - fViewport.clientWidth;
      var raf = false;

      function update() {
        var rect = featureSection.getBoundingClientRect();
        var top = rect.top;
        var height = featureSection.offsetHeight;

        if (isMobile) {
          if (offset <= 0) return;
          var p = clamp(-top / (height - svh), 0, 1);
          fRow.style.transform = "translate3d(" + -offset * p + "px, 0, 0)";
          return;
        }

        var progress = clamp((0.58 * svh - top) / (height - svh + 0.58 * svh), 0, 1);
        var baseY = 0.78 * svh;

        prints.forEach(function (print, i) {
          var from = parseFloat(print.dataset.riseFrom);
          var to = parseFloat(print.dataset.riseTo);
          var op = easeOut(clamp((progress - from - 0.04) / 0.09, 0, 1));
          var y = baseY + (0 - baseY) * easeOut(clamp((progress - from) / (to - from), 0, 1));
          print.style.opacity = String(op);
          print.style.transform = "translate3d(0, " + y + "px, 0)";
          if (labels[i]) {
            labels[i].style.opacity = String(easeOut(clamp((progress - (to - 0.1)) / 0.1, 0, 1)));
          }
        });
      }

      function onScroll() {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = false;
          update();
        });
      }

      function onResize() {
        svh = window.innerHeight;
        isMobile = window.matchMedia("(max-width: 1023px)").matches;
        offset = fRow.scrollWidth - fViewport.clientWidth;
        if (isMobile) {
          featureSection.style.height = svh + 1.2 * Math.max(offset, 280) + "px";
        } else {
          featureSection.style.height = "";
        }
        update();
      }

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
      onResize();
    }
  }

  /* ===== Barra de progresso de scroll ===== */
  var progressBar = document.getElementById("scrollProgress");

  function updateProgress() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    progressBar.style.transform = "scaleX(" + p + ")";
  }

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  /* ===== Contadores animados ===== */
  function formatNumber(el, value) {
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    var prefix = el.dataset.prefix || "";
    var suffix = el.dataset.suffix || "";
    var fixed = value.toFixed(decimals);
    var parts = fixed.split(".");
    var int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    var dec = parts[1] ? "," + parts[1] : "";
    return prefix + int + dec + suffix;
  }

  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    var dur = 1400;
    var start = null;

    function step(ts) {
      if (!start) start = ts;
      var prog = clamp((ts - start) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - prog, 3);
      el.textContent = formatNumber(el, target * eased);
      if (prog < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = formatNumber(el, target);
      }
    }

    requestAnimationFrame(step);
  }

  var counters = document.querySelectorAll("[data-count]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    counters.forEach(animateCount);
  } else {
    var countObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.45 }
    );
    counters.forEach(function (el) {
      countObserver.observe(el);
    });
  }

  /* ===== Tilt 3D + brilho — INP fix: rect cacheado, RAF throttle ===== */
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  function enableTilt(selector) {
    var els = document.querySelectorAll(selector);
    if (reduceMotion || !finePointer) return;
    els.forEach(function (el) {
      el.classList.add("tilt-ready");
      /* Cache rect fora do mousemove — evita forced reflow por evento */
      var rect = el.getBoundingClientRect();
      var tiltRaf = false;
      var tiltPx = 0.5, tiltPy = 0.5;

      el.addEventListener("mouseenter", function () {
        rect = el.getBoundingClientRect(); /* atualiza só ao entrar */
      }, { passive: true });

      el.addEventListener("mousemove", function (e) {
        tiltPx = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        tiltPy = clamp((e.clientY - rect.top) / rect.height, 0, 1);
        if (!tiltRaf) {
          tiltRaf = true;
          requestAnimationFrame(function () {
            var rx = (0.5 - tiltPy) * 9;
            var ry = (tiltPx - 0.5) * 9;
            el.style.transform = "perspective(900px) rotateX(" + rx.toFixed(1) + "deg) rotateY(" + ry.toFixed(1) + "deg) translateY(-3px)";
            el.style.setProperty("--mx", (tiltPx * 100).toFixed(0) + "%");
            el.style.setProperty("--my", (tiltPy * 100).toFixed(0) + "%");
            tiltRaf = false;
          });
        }
      }, { passive: true });

      el.addEventListener("mouseleave", function () {
        tiltRaf = false;
        el.style.transform = "";
      }, { passive: true });
    });
  }

  enableTilt(".feature-card-screen");
  enableTilt(".phone-card");

  /* ===== Botões magnéticos — INP fix: rect cacheado, RAF throttle ===== */
  function enableMagnetic(selector) {
    var els = document.querySelectorAll(selector);
    if (reduceMotion || !finePointer) return;
    els.forEach(function (el) {
      var mRect = el.getBoundingClientRect();
      var mRaf = false;
      var mX = 0, mY = 0;

      el.addEventListener("mouseenter", function () {
        mRect = el.getBoundingClientRect();
      }, { passive: true });

      el.addEventListener("mousemove", function (e) {
        mX = (e.clientX - mRect.left - mRect.width / 2) * 0.16;
        mY = (e.clientY - mRect.top - mRect.height / 2) * 0.22;
        if (!mRaf) {
          mRaf = true;
          requestAnimationFrame(function () {
            el.style.transform = "translate(" + mX.toFixed(1) + "px, " + mY.toFixed(1) + "px)";
            mRaf = false;
          });
        }
      }, { passive: true });

      el.addEventListener("mouseleave", function () {
        mRaf = false;
        el.style.transform = "";
      }, { passive: true });
    });
  }

  enableMagnetic(".nav-actions .btn, .hero .btn-primary, .btn-lg");

  /* ===== Parallax hero — INP fix: rect cacheado no mouseenter, RAF throttle ===== */
  var heroVisual = document.querySelector(".hero-visual");
  if (heroVisual && !reduceMotion && finePointer) {
    var heroRaf = false;
    var heroRect = heroVisual.getBoundingClientRect();
    var heroMouseX = 0, heroMouseY = 0;

    heroVisual.addEventListener("mouseenter", function () {
      heroRect = heroVisual.getBoundingClientRect();
    }, { passive: true });

    heroVisual.addEventListener("mousemove", function (e) {
      heroMouseX = (e.clientX - heroRect.left) / heroRect.width - 0.5;
      heroMouseY = (e.clientY - heroRect.top) / heroRect.height - 0.5;
      if (!heroRaf) {
        heroRaf = true;
        requestAnimationFrame(function () {
          heroVisual.style.transform = "translate3d(" + (heroMouseX * 6).toFixed(1) + "px, " + (heroMouseY * 6).toFixed(1) + "px, 0)";
          heroRaf = false;
        });
      }
    }, { passive: true });

    heroVisual.addEventListener("mouseleave", function () {
      heroRaf = false;
      heroVisual.style.transform = "";
    }, { passive: true });
  }

  /* ===== Destaque do link ativo no menu ===== */
  var navAnchors = document.querySelectorAll(".nav-links a");
  var tracked = [];
  navAnchors.forEach(function (a) {
    var id = a.getAttribute("href").replace(/^#/, "");
    var sec = document.getElementById(id);
    if (sec) tracked.push({ el: sec, link: a });
  });

  function setActiveLink() {
    var pos = window.scrollY + 140;
    var current = null;
    tracked.forEach(function (t) {
      if (t.el.offsetTop <= pos) current = t;
    });
    navAnchors.forEach(function (a) {
      a.classList.remove("active");
    });
    if (current) current.link.classList.add("active");
  }

  window.addEventListener("scroll", setActiveLink, { passive: true });
  setActiveLink();

  /* ===== Mobile nav ===== */
  var header = document.querySelector(".header");
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  var navActions = document.querySelector(".nav-actions");

  navToggle.addEventListener("click", function () {
    var open = navLinks.classList.toggle("open");
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navActions.classList.toggle("open", open);
  });

  var navAnchorLinks = document.querySelectorAll(".nav-links a");
  navAnchorLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      navLinks.classList.remove("open");
      navToggle.classList.remove("open");
      navActions.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  window.addEventListener("scroll", function () {
    if (window.scrollY > 8) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  /* ===== Modality tabs ===== */
  var modalityTabs = document.querySelectorAll(".modality");
  modalityTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      modalityTabs.forEach(function (t) {
        t.classList.remove("active");
      });
      tab.classList.add("active");
      document.querySelectorAll(".modality-panel").forEach(function (panel) {
        panel.classList.remove("active");
      });
      var panel = document.querySelector('[data-modality-panel="' + tab.dataset.modality + '"]');
      if (panel) {
        panel.classList.add("active");
      }
    });
  });

  /* ===== Billing toggle ===== */
  var switchInput = document.getElementById("billingSwitch");
  var billingLabels = document.querySelectorAll(".billing-label");
  var planCards = document.querySelectorAll(".plan-card");

  function applyCycle() {
    var annual = switchInput.checked;
    billingLabels.forEach(function (label) {
      var cycle = label.dataset.cycle;
      var active = (annual && cycle === "annual") || (!annual && cycle === "monthly");
      label.classList.toggle("active", active);
    });
    planCards.forEach(function (card) {
      var amount = card.querySelector(".amount");
      var note = card.querySelector(".plan-note");
      if (annual) {
        amount.textContent = card.dataset.annual;
        note.textContent = "R$ " + Math.round(parseInt(card.dataset.annual, 10) * 12).toLocaleString("pt-BR") + " cobrados por ano";
      } else {
        amount.textContent = card.dataset.monthly;
        note.textContent = "R$ " + Math.round(parseInt(card.dataset.monthly, 10) * 12).toLocaleString("pt-BR") + " cobrados por ano";
      }
    });
  }

  switchInput.addEventListener("change", applyCycle);
  applyCycle();

  /* ===== Demo form ===== */
  var form = document.getElementById("demoForm");
  var success = document.getElementById("formSuccess");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var valid = true;
    var fields = form.querySelectorAll("input[required], select[required], input[type=email]");

    fields.forEach(function (field) {
      field.classList.remove("invalid");
      if (!field.value.trim()) {
        valid = false;
        field.classList.add("invalid");
      }
      if (field.type === "email" && field.value.trim() && !/^\S+@\S+\.\S+$/.test(field.value)) {
        valid = false;
        field.classList.add("invalid");
      }
    });

    if (valid) {
      success.hidden = false;
      form.reset();
      setTimeout(function () {
        success.hidden = true;
      }, 6000);
    } else {
      var firstInvalid = form.querySelector(".invalid");
      if (firstInvalid) {
        firstInvalid.focus();
      }
    }
  });

  /* ===== Cookie bar ===== */
  var cookieBar = document.getElementById("cookieBar");
  var cookieOk = document.getElementById("cookieOk");
  cookieOk.addEventListener("click", function () {
    cookieBar.classList.add("hidden");
  });

  /* ===== Plan links ===== */
  var planLinks = document.querySelectorAll('a[href^="#cadastro?plan="]');
  planLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var href = link.getAttribute("href");
      var params = new URLSearchParams(href.split("?")[1]);
      var plan = params.get("plan");
      var target = document.getElementById("cadastro");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
      try {
        history.replaceState(null, "", "/#cadastro" + (plan ? "?plan=" + plan : ""));
      } catch (err) {}
    });
  });
})();

// ── Demo Interativa: navegação entre views ──────────────────
(function () {
  const navItems = document.querySelectorAll('.sys-nav-item[data-view]');
  const views    = document.querySelectorAll('.sys-view');
  const pageLabel = document.getElementById('sys-page-label');
  const pageSub   = document.getElementById('sys-page-sub');
  const urlBar    = document.querySelector('.sys-url');

  const meta = {
    dashboard: { title: 'DASHBOARD ACADÊMICO', sub: 'GESTÃO DE PERFORMANCE E PRESENÇA', url: 'app.atralas.com.br/dashboard' },
    students:  { title: 'ALUNOS',              sub: 'CONTROLE DE MATRÍCULAS E PRESENÇA', url: 'app.atralas.com.br/alunos' },
  };

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      // atualiza nav
      navItems.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // atualiza view
      views.forEach(v => v.classList.remove('active'));
      const target = document.getElementById('view-' + view);
      if (target) target.classList.add('active');
      // atualiza topbar
      if (meta[view] && pageLabel && pageSub) {
        pageLabel.textContent = meta[view].title;
        pageSub.textContent   = meta[view].sub;
        if (urlBar) urlBar.textContent = meta[view].url;
      }
    });
  });

  // Itens sem tela na demo → desfoca a janela e abre popup de recursos
  const sysWindow = document.querySelector('.sys-window');
  const sysLock   = document.getElementById('sysLock');
  const fechaLock = () => {
    if (sysWindow) sysWindow.classList.remove('sys-blurred');
    if (sysLock) sysLock.hidden = true;
  };
  const abreLock = () => {
    if (sysWindow) sysWindow.classList.add('sys-blurred');
    if (sysLock) sysLock.hidden = false;
  };
  document.querySelectorAll('.sys-nav-item:not([data-view])').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      abreLock();
    });
  });
  if (sysLock) {
    const cta = document.getElementById('sysLockCta');
    const fechar = document.getElementById('sysLockClose');
    if (cta) cta.addEventListener('click', () => {
      fechaLock();
      const cadastro = document.getElementById('cadastro');
      if (cadastro) cadastro.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    if (fechar) fechar.addEventListener('click', fechaLock);
    // clique fora do card fecha o popup
    sysLock.addEventListener('click', e => { if (e.target === sysLock) fechaLock(); });
  }
})();
