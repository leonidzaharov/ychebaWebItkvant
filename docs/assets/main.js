let vanta = null;

const THEME_KEY = "kids_theme";
const ANIM_KEY  = "kids_anim";

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  const btn = document.getElementById("toggleTheme");
  if (btn) btn.textContent = `Тема: ${theme === "dark" ? "тёмная" : "светлая"}`;
}

function getTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) return saved;
  const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return systemDark ? "dark" : "light";
}

function setAnimEnabled(enabled) {
  localStorage.setItem(ANIM_KEY, enabled ? "1" : "0");
  const btn = document.getElementById("toggleAnim");
  if (btn) btn.textContent = `Анимация: ${enabled ? "вкл" : "выкл"}`;

  if (!enabled) destroyVanta();
  else initVanta();
}

function getAnimEnabled() {
  const saved = localStorage.getItem(ANIM_KEY);
  if (saved !== null) return saved === "1";
  // по умолчанию: если пользователь просит меньше движения — выключаем
  return !prefersReducedMotion();
}

function initVanta() {
  const el = document.getElementById("heroBg");
  if (!el) return;

  // уже запущено
  if (vanta) return;

  // если нет WebGL — не запускаем (останется CSS-фон)
  if (!supportsWebGL()) return;

  // уважать системную настройку
  if (prefersReducedMotion()) return;

  // ✅ цвета можно переопределять с любой страницы
  const cfg = window.__vantaColors || {};

  const color = Number.isFinite(cfg.color) ? cfg.color : 0x7c5cff;
  const color2 = Number.isFinite(cfg.color2) ? cfg.color2 : 0x00e0ff;

  const isLight = document.documentElement.dataset.theme === "light";
  const backgroundColor = Number.isFinite(cfg.backgroundColor)
    ? cfg.backgroundColor
    : (isLight ? 0xe9eeff : 0x070913);

  vanta = VANTA.GLOBE({
    el,
    mouseControls: true,
    touchControls: true,
    gyroControls: false,

    minHeight: 260,
    minWidth: 260,

    scale: 1.0,
    scaleMobile: 0.75,

    color,
    color2,
    backgroundColor
  });
}

function destroyVanta() {
  if (vanta && typeof vanta.destroy === "function") {
    vanta.destroy();
  }
  vanta = null;
}

function wireUI() {
  document.getElementById("toggleTheme")?.addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme;
    const next = cur === "dark" ? "light" : "dark";
    setTheme(next);

    // если анимация включена — пересоздадим с новым backgroundColor
    const animOn = getAnimEnabled();
    if (animOn) { destroyVanta(); initVanta(); }
  });

  document.getElementById("toggleAnim")?.addEventListener("click", () => {
    setAnimEnabled(!getAnimEnabled());
  });

  // Когда вкладка не активна — можно гасить, чтобы не тратить ресурсы
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) destroyVanta();
    else if (getAnimEnabled()) initVanta();
  });
  const howBtn = document.getElementById("howBtn");
  const howCard = document.getElementById("howCard");
  const howClose = document.getElementById("howClose");

  const openHow = () => {
    if (!howCard) return;
    howCard.hidden = false;
    howCard.classList.add("open");
    howBtn?.setAttribute("aria-expanded", "true");
    setTimeout(() => howClose?.focus(), 0);
  };

  const closeHow = () => {
    if (!howCard) return;
    howCard.classList.remove("open");
    howBtn?.setAttribute("aria-expanded", "false");
    // небольшая задержка чтобы анимация успела сыграть
    setTimeout(() => { if (howCard) howCard.hidden = true; }, 160);
    howBtn?.focus();
  };

  const toggleHow = () => {
    if (!howCard) return;
    if (howCard.hidden) openHow();
    else closeHow();
  };

  howBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    toggleHow();
  });

  howClose?.addEventListener("click", closeHow);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeHow();
  });

  document.addEventListener("click", (e) => {
    if (!howCard || howCard.hidden) return;
    const t = e.target;
    if (howCard.contains(t) || howBtn?.contains(t)) return;
    closeHow();
  });
}

// старт
setTheme(getTheme());
wireUI();
setAnimEnabled(getAnimEnabled());
// --- PROJECTS SECTION (password) ---
(function initProjects(){
  const lock = document.getElementById("projectsLock");
  const content = document.getElementById("projectsContent");
  const passInput = document.getElementById("projectsPass");
  const unlockBtn = document.getElementById("projectsUnlock");
  const lockBtn = document.getElementById("projectsLockBtn");
  const errorEl = document.getElementById("projectsError");

  if (!lock || !content) return;

  const SECRET = atob("TmF2aWE=");

  function unlock(){
    lock.hidden = true;
    content.hidden = false;
    localStorage.setItem("projects_unlocked", "1");
  }

  function lockSection(){
    lock.hidden = false;
    content.hidden = true;
    localStorage.removeItem("projects_unlocked");
    if (passInput) passInput.value = "";
    if (errorEl) errorEl.hidden = true;
  }

  function tryUnlock(){
    if (!passInput) return;
    if (passInput.value === SECRET){
      unlock();
    } else {
      if (errorEl) errorEl.hidden = false;
      passInput.classList.add("shake");
      setTimeout(() => passInput.classList.remove("shake"), 400);
    }
  }

  if (localStorage.getItem("projects_unlocked") === "1") unlock();

  unlockBtn?.addEventListener("click", tryUnlock);
  passInput?.addEventListener("keydown", e => { if (e.key === "Enter") tryUnlock(); });
  lockBtn?.addEventListener("click", lockSection);
})();

// --- TRACK PAGE (HTML/CSS/JS) ---
(function initTrackPage(){
  const titleEl = document.getElementById("trackTitle");
  const topicsEl = document.getElementById("topics");
  const cheatsEl = document.getElementById("cheats");
  const lessonsEl = document.getElementById("lessons");
  if (!titleEl || !topicsEl || !cheatsEl) return; // мы не на track.html

  const params = new URLSearchParams(location.search);
  const t = (params.get("t") || "html").toLowerCase();

  fetch("./data/tracks.json", { cache: "no-store" })
    .then(r => r.json())
    .then(data => {
      const track = data.tracks?.[t] || data.tracks?.html;
      if (!track) return;

      // тексты
      titleEl.textContent = track.title;
      document.getElementById("trackDesc").textContent = track.desc;
      document.getElementById("heroH1").textContent = track.title;
      document.getElementById("heroP").textContent = track.desc;
      document.title = `${track.title} — Kids Code`;

      // цвета глобуса
      const c1 = track.globe?.color ? Number(track.globe.color) : 0x7c5cff;
      const c2 = track.globe?.color2 ? Number(track.globe.color2) : 0x00e0ff;
      window.__vantaColors = { color: c1, color2: c2 };

      // пересоздать Vanta под новые цвета (если анимация включена)
      if (getAnimEnabled()) {
        destroyVanta();
        initVanta();
      }
      // --- Уроки (по датам) ---
if (lessonsEl) {
  lessonsEl.innerHTML = "";

  const lessons = track.lessons || [];
  if (lessons.length === 0) {
    // если уроков нет — скрываем секцию целиком
    lessonsEl.parentElement.style.display = "none";
  } else {
    lessonsEl.parentElement.style.display = "";
    lessons.forEach(item => {
      const a = document.createElement("a");
      a.className = "card small";
      a.href = item.href;

      // чтобы не плодить вкладки у детей:
      a.target = "_self";

      a.innerHTML = `<div class="cardTitle">${item.date} — ${item.title}</div>
                     <div class="cardMeta">${item.meta || ""}</div>`;
      lessonsEl.appendChild(a);
    });
  }
}

      // рендер карточек
      topicsEl.innerHTML = "";
      (track.topics || []).forEach(item => {
        const a = document.createElement("a");
        a.className = "card small";
        a.href = item.href;
        a.target = "_blank";
        a.rel = "noopener";
        a.innerHTML = `<div class="cardTitle">${item.title}</div>
                       <div class="cardMeta">${item.meta || ""}</div>`;
        topicsEl.appendChild(a);
      });

      cheatsEl.innerHTML = "";
      (track.cheats || []).forEach(item => {
        const a = document.createElement("a");
        a.className = "card small";
        a.href = item.href;
        a.target = "_blank";
        a.rel = "noopener";
        a.innerHTML = `<div class="cardTitle">${item.title}</div>
                       <div class="cardMeta">${item.meta || ""}</div>`;
        cheatsEl.appendChild(a);
      });
    });
})();
