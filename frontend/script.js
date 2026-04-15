const THEME_KEY = "pincraft-theme";
const root = document.documentElement;
const navbar = document.querySelector(".navbar");
const themeToggle = document.querySelector(".theme-toggle");
const menuToggle = document.querySelector(".menu-toggle");
const navPanel = document.querySelector(".nav-actions");
const navMenu = document.querySelector(".nav-menu");
const navLinks = Array.from(document.querySelectorAll('.nav-menu a[href^="#"]'));
const previewCards = Array.from(document.querySelectorAll(".preview-card"));
const revealElements = Array.from(document.querySelectorAll("[data-reveal]"));
const downloadModal = document.querySelector("#download-modal");
const downloadModalClose = document.querySelector(".download-modal__close");
const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let activeDownloadTrigger = null;

// Persist the chosen theme and keep the dropdown nav state in sync.
const getStoredTheme = () => {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
};

const saveTheme = (theme) => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
};

const getPreferredTheme = () => {
  const storedTheme = getStoredTheme();

  if (storedTheme) {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const setTheme = (theme) => {
  const nextTheme = theme === "dark" ? "light" : "dark";

  root.dataset.theme = theme;

  if (themeToggle) {
    themeToggle.dataset.theme = theme;
    themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
    themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
    themeToggle.setAttribute("title", `Switch to ${nextTheme} mode`);
  }
};

const isMenuOpen = () => menuToggle?.getAttribute("aria-expanded") === "true";

const syncMenuState = () => {
  if (!menuToggle || !navPanel) {
    return;
  }

  const open = isMenuOpen();

  navbar?.classList.toggle("is-open", open);
  navPanel.setAttribute("aria-hidden", String(!open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
};

const closeMenu = () => {
  if (!menuToggle) {
    return;
  }

  menuToggle.setAttribute("aria-expanded", "false");
  syncMenuState();
};

const updateActiveLink = () => {
  if (!navLinks.length) {
    return;
  }

  const offset = 160;
  let activeId = navLinks[0].hash.slice(1);

  navLinks.forEach((link) => {
    const section = document.querySelector(link.hash);

    if (section && section.offsetTop <= window.scrollY + offset) {
      activeId = section.id;
    }
  });

  navLinks.forEach((link) => {
    const isActive = link.hash === `#${activeId}`;
    link.classList.toggle("is-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const pausePreview = (card) => {
  const video = card?.querySelector("video");

  if (!video) {
    return;
  }

  video.pause();
  video.currentTime = 0;
};

const playPreview = (card) => {
  const video = card?.querySelector("video");

  if (!video) {
    return;
  }

  const playPromise = video.play();

  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
};

const setPreviewState = (card, active) => {
  if (!card) {
    return;
  }

  const toggle = card.querySelector(".preview-toggle");

  card.classList.toggle("is-active", active);

  if (toggle) {
    toggle.setAttribute("aria-pressed", String(active));
  }

  if (active) {
    playPreview(card);
    return;
  }

  pausePreview(card);
};

const closeOtherPreviews = (currentCard) => {
  previewCards.forEach((card) => {
    if (card !== currentCard) {
      setPreviewState(card, false);
    }
  });
};

// Desktop hover and mobile tap share the same preview state toggles.
const bindPreviewInteractions = () => {
  previewCards.forEach((card) => {
    const toggle = card.querySelector(".preview-toggle");

    if (!toggle) {
      return;
    }

    card.addEventListener("mouseenter", () => {
      if (!hoverQuery.matches) {
        return;
      }

      setPreviewState(card, true);
    });

    card.addEventListener("mouseleave", () => {
      if (!hoverQuery.matches || card.matches(":focus-within")) {
        return;
      }

      setPreviewState(card, false);
    });

    card.addEventListener("focusin", () => {
      if (!hoverQuery.matches) {
        return;
      }

      setPreviewState(card, true);
    });

    card.addEventListener("focusout", () => {
      requestAnimationFrame(() => {
        if (!hoverQuery.matches) {
          return;
        }

        if (!card.matches(":focus-within") && !card.classList.contains("is-active")) {
          setPreviewState(card, false);
        }
      });
    });

    toggle.addEventListener("click", () => {
      if (hoverQuery.matches) {
        return;
      }

      const nextState = !card.classList.contains("is-active");
      closeOtherPreviews(card);
      setPreviewState(card, nextState);
    });
  });
};

const isDownloadModalOpen = () => downloadModal?.classList.contains("is-open");

const openDownloadModal = (trigger = null) => {
  if (!downloadModal) {
    return;
  }

  activeDownloadTrigger = trigger instanceof HTMLElement ? trigger : null;
  downloadModal.classList.add("is-open");
  downloadModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  downloadModalClose?.focus();
};

const closeDownloadModal = () => {
  if (!downloadModal || !isDownloadModalOpen()) {
    return;
  }

  const triggerToRestore = activeDownloadTrigger;

  downloadModal.classList.remove("is-open");
  downloadModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  activeDownloadTrigger = null;
  triggerToRestore?.focus();
};

const bindDownloadModalInteractions = () => {
  downloadModalClose?.addEventListener("click", () => {
    closeDownloadModal();
  });

  downloadModal?.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest("[data-close-download-modal='true']")) {
      closeDownloadModal();
    }
  });
};

const showRevealElement = (element) => {
  element.classList.add("is-visible");
};

const hideRevealElement = (element) => {
  element.classList.remove("is-visible");
};

// Reveal elements when they enter the viewport and reset them when they leave it.
const initRevealAnimations = () => {
  if (!revealElements.length) {
    return;
  }

  if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
    root.classList.remove("reveal-ready");
    revealElements.forEach((element) => {
      showRevealElement(element);
    });
    return;
  }

  root.classList.add("reveal-ready");

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          showRevealElement(entry.target);
          return;
        }

        hideRevealElement(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealElements.forEach((element) => {
    const rect = element.getBoundingClientRect();

    if (rect.top <= window.innerHeight * 0.9) {
      showRevealElement(element);
    } else {
      hideRevealElement(element);
    }

    revealObserver.observe(element);
  });
};

const DEMO_STORAGE_KEY = "pincraft-demo-layout";
const demoShell = document.querySelector(".demo-shell");
const demoToolbar = document.querySelector(".demo-toolbar");
const demoStage = document.querySelector("[data-demo-stage]");
const demoLayerArea = document.querySelector("[data-demo-layer-area]");
const demoLayerTabs = document.querySelector("[data-demo-layer-tabs]");
const demoStatus = document.querySelector("[data-demo-status]");
const demoUploadInput = document.querySelector("[data-demo-upload]");
const demoActiveName = document.querySelector("[data-demo-active-name]");
const demoInputs = {
  text: document.querySelector('[data-demo-input="text"]'),
  font: document.querySelector('[data-demo-input="font"]'),
  color: document.querySelector('[data-demo-input="color"]'),
  size: document.querySelector('[data-demo-input="size"]'),
  rotation: document.querySelector('[data-demo-input="rotation"]'),
  stretch: document.querySelector('[data-demo-input="stretch"]'),
  opacity: document.querySelector('[data-demo-input="opacity"]'),
  background: document.querySelector('[data-demo-input="background"]'),
};
const demoOutputs = {
  size: document.querySelector('[data-demo-output="size"]'),
  rotation: document.querySelector('[data-demo-output="rotation"]'),
  stretch: document.querySelector('[data-demo-output="stretch"]'),
  opacity: document.querySelector('[data-demo-output="opacity"]'),
};
const demoFields = {
  text: document.querySelector('[data-demo-field="text"]'),
  font: document.querySelector('[data-demo-field="font"]'),
  color: document.querySelector('[data-demo-field="color"]'),
};
let demoState = null;
let demoDrag = null;
let demoLayerReorder = null;

const createDemoPlaceholderImage = (label, tone = "#8eb9ff") => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${tone}" />
          <stop offset="100%" stop-color="#e8f1ff" />
        </linearGradient>
      </defs>
      <rect width="320" height="320" rx="42" fill="url(#bg)" />
      <circle cx="160" cy="118" r="58" fill="rgba(255,255,255,0.78)" />
      <path d="M48 278c30-58 77-88 112-88s82 30 112 88" fill="rgba(255,255,255,0.78)" />
      <text x="160" y="292" font-size="28" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" fill="#294068">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const createDemoState = () => ({
  background: "#f7f9fd",
  selectedId: "text-2",
  layers: [
    {
      id: "photo-1",
      type: "image",
      name: "Photo",
      src: createDemoPlaceholderImage("Photo", "#7ea8ff"),
      x: 28,
      y: 50,
      size: 22,
      ratio: 1,
      rotation: -8,
      stretch: 100,
      visible: true,
      opacity: 100,
    },
    {
      id: "text-1",
      type: "text",
      name: "Text 1",
      text: "Text 1",
      x: 50,
      y: 21,
      size: 22,
      rotation: 0,
      stretch: 100,
      visible: true,
      opacity: 100,
      color: "#2b3648",
      font: "Arial, sans-serif",
    },
    {
      id: "text-2",
      type: "text",
      name: "Text 2",
      text: "Text 2",
      x: 50,
      y: 76,
      size: 18,
      rotation: 0,
      stretch: 100,
      visible: true,
      opacity: 100,
      color: "#2b3648",
      font: "Arial, sans-serif",
    },
  ],
});

const setDemoStatus = (message) => {
  if (demoStatus) {
    demoStatus.textContent = message;
  }
};

const getDemoLayerById = (layerId) => demoState?.layers.find((layer) => layer.id === layerId) ?? null;

const getSelectedDemoLayer = () => getDemoLayerById(demoState?.selectedId);

const createDemoId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;

const normalizeDemoLayer = (layer, index) => {
  if (layer.type === "image") {
    return {
      id: layer.id ?? createDemoId("photo"),
      type: "image",
      name: layer.name ?? `Photo ${index + 1}`,
      src: layer.src ?? createDemoPlaceholderImage("Photo"),
      x: typeof layer.x === "number" ? layer.x : 50,
      y: typeof layer.y === "number" ? layer.y : 50,
      size: typeof layer.size === "number" ? layer.size : 24,
      ratio: typeof layer.ratio === "number" && layer.ratio > 0 ? layer.ratio : 1,
      rotation: typeof layer.rotation === "number" ? layer.rotation : 0,
      stretch: typeof layer.stretch === "number" ? layer.stretch : 100,
      visible: layer.visible !== false,
      opacity: typeof layer.opacity === "number" ? layer.opacity : 100,
    };
  }

  return {
    id: layer.id ?? createDemoId("text"),
    type: "text",
    name: layer.name ?? `Text ${index + 1}`,
    text: layer.text ?? `Text ${index + 1}`,
    x: typeof layer.x === "number" ? layer.x : 50,
    y: typeof layer.y === "number" ? layer.y : 50,
    size: typeof layer.size === "number" ? layer.size : 20,
    rotation: typeof layer.rotation === "number" ? layer.rotation : 0,
    stretch: typeof layer.stretch === "number" ? layer.stretch : 100,
    visible: layer.visible !== false,
    opacity: typeof layer.opacity === "number" ? layer.opacity : 100,
    color: layer.color ?? "#2b3648",
    font: layer.font ?? "Arial, sans-serif",
  };
};

const normalizeDemoState = (savedState) => {
  if (!savedState || !Array.isArray(savedState.layers)) {
    return createDemoState();
  }

  const layers = savedState.layers.map((layer, index) => normalizeDemoLayer(layer, index));
  const selectedId = layers.some((layer) => layer.id === savedState.selectedId)
    ? savedState.selectedId
    : layers[0]?.id ?? null;

  return {
    background: savedState.background ?? "#f7f9fd",
    selectedId,
    layers,
  };
};

const saveDemoState = () => {
  if (!demoState) {
    return;
  }

  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoState));
    setDemoStatus("Layout saved. You can load it again any time.");
  } catch {
    setDemoStatus("Saving is unavailable in this browser.");
  }
};

const loadDemoState = () => {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);

    if (!raw) {
      setDemoStatus("No saved layout found yet.");
      return;
    }

    demoState = normalizeDemoState(JSON.parse(raw));
    renderDemoEditor();
    setDemoStatus("Saved layout loaded.");
  } catch {
    setDemoStatus("Unable to load the saved layout.");
  }
};

const getNextDemoLabel = (type) => {
  const count = demoState.layers.filter((layer) => layer.type === type).length + 1;
  return type === "text" ? `Text ${count}` : `Photo ${count}`;
};

const addDemoTextLayer = () => {
  const name = getNextDemoLabel("text");
  const layer = {
    id: createDemoId("text"),
    type: "text",
    name,
    text: name,
    x: 50,
    y: 50,
    size: 20,
    rotation: 0,
    stretch: 100,
    visible: true,
    opacity: 100,
    color: "#2b3648",
    font: "Arial, sans-serif",
  };

  fitDemoLayerToCircle(layer);
  demoState.layers.push(layer);
  demoState.selectedId = layer.id;
  renderDemoEditor();
  setDemoStatus("New text layer added.");
};

const addDemoPhotoLayer = (src = createDemoPlaceholderImage("Photo"), ratio = 1, label = null) => {
  const name = label ?? getNextDemoLabel("image");
  const layer = {
    id: createDemoId("photo"),
    type: "image",
    name,
    src,
    x: 50,
    y: 50,
    size: 22,
    ratio,
    rotation: 0,
    stretch: 100,
    visible: true,
    opacity: 100,
  };

  fitDemoLayerToCircle(layer);
  demoState.layers.push(layer);
  demoState.selectedId = layer.id;
  renderDemoEditor();
  setDemoStatus("Photo layer added.");
};

const resetDemoEditor = () => {
  demoState = createDemoState();
  renderDemoEditor();
  setDemoStatus("Demo reset to the home layout.");
};

const removeDemoLayer = (layerId) => {
  demoState.layers = demoState.layers.filter((layer) => layer.id !== layerId);

  if (!demoState.layers.length) {
    demoState.selectedId = null;
  } else if (demoState.selectedId === layerId) {
    demoState.selectedId = demoState.layers.at(-1)?.id ?? null;
  }

  renderDemoEditor();
  setDemoStatus("Layer removed.");
};

const setSelectedDemoLayer = (layerId) => {
  if (!getDemoLayerById(layerId)) {
    return;
  }

  demoState.selectedId = layerId;
  renderDemoEditor();
};

const measureDemoLayer = (layer, stageSize) => {
  const stretchFactor = (layer.stretch ?? 100) / 100;

  if (layer.type === "image") {
    const baseWidth = stageSize * (layer.size / 100);
    const width = baseWidth * stretchFactor;
    const height = baseWidth / (layer.ratio || 1);
    return { width, height };
  }

  const width = Math.max(layer.size * 2.8, layer.text.length * layer.size * 0.55) * stretchFactor;
  const height = layer.size * 1.35;
  return { width, height };
};

const constrainDemoPosition = (layer, xPercent, yPercent) => {
  const layerAreaRect = getDemoLayerAreaRect();

  if (!layerAreaRect) {
    return { x: xPercent, y: yPercent };
  }

  const layerAreaSize = layerAreaRect.width;
  const center = layerAreaSize / 2;
  const buttonRadius = layerAreaSize / 2;
  const x = (xPercent / 100) * layerAreaSize;
  const y = (yPercent / 100) * layerAreaSize;
  const { width, height } = measureDemoLayer(layer, layerAreaSize);
  const maxDistance = Math.max(0, buttonRadius - Math.max(width, height) * 0.5);
  let dx = x - center;
  let dy = y - center;
  const distance = Math.hypot(dx, dy);

  if (distance > maxDistance && distance !== 0) {
    const scale = maxDistance / distance;
    dx *= scale;
    dy *= scale;
  }

  return {
    x: ((center + dx) / layerAreaSize) * 100,
    y: ((center + dy) / layerAreaSize) * 100,
  };
};

const fitDemoLayerToCircle = (layer) => {
  const nextPosition = constrainDemoPosition(layer, layer.x, layer.y);
  layer.x = nextPosition.x;
  layer.y = nextPosition.y;
};

const getDemoLayerAreaRect = () => demoLayerArea?.getBoundingClientRect() ?? demoStage?.getBoundingClientRect() ?? null;

const getDemoLayerAreaSize = () => getDemoLayerAreaRect()?.width || 436.8;

const getRootFontSize = () => {
  const size = Number.parseFloat(window.getComputedStyle(root).fontSize);
  return Number.isFinite(size) && size > 0 ? size : 16;
};

const getDemoImageBaseWidth = (layer, areaSize = getDemoLayerAreaSize()) => areaSize * (layer.size / 100);

const convertPixelsToRem = (pixels) => pixels / getRootFontSize();

const fitAllDemoLayersToCircle = () => {
  if (!demoState?.layers?.length) {
    return;
  }

  demoState.layers.forEach((layer) => {
    fitDemoLayerToCircle(layer);
  });
};

const applyDemoLayerStyles = (element, layer) => {
  const stretchFactor = (layer.stretch ?? 100) / 100;

  element.style.left = `${layer.x}%`;
  element.style.top = `${layer.y}%`;
  element.style.opacity = String(layer.opacity / 100);

  if (layer.type === "image") {
    const imageWidthRem = convertPixelsToRem(getDemoImageBaseWidth(layer));

    element.style.width = `${imageWidthRem}rem`;
    element.style.aspectRatio = String(layer.ratio || 1);
    element.style.transform = `translate(-50%, -50%) rotate(${layer.rotation}deg) scaleX(${stretchFactor})`;
    return;
  }

  element.style.transform = `translate(-50%, -50%) rotate(${layer.rotation}deg) scaleX(${stretchFactor})`;
  element.style.fontSize = `${layer.size}px`;
  element.style.color = layer.color;
  element.style.fontFamily = layer.font;
  element.style.maxWidth = "none";
};

const syncDemoInspector = () => {
  const layer = getSelectedDemoLayer();

  if (!layer) {
    if (demoActiveName) {
      demoActiveName.textContent = "None";
    }

    Object.values(demoFields).forEach((field) => {
      if (field) {
        field.hidden = true;
      }
    });

    Object.values(demoInputs).forEach((input) => {
      if (input) {
        input.disabled = input !== demoInputs.background;
      }
    });

    return;
  }

  if (demoActiveName) {
    demoActiveName.textContent = layer.name;
  }

  const isTextLayer = layer.type === "text";

  if (demoFields.text) {
    demoFields.text.hidden = !isTextLayer;
  }

  if (demoFields.font) {
    demoFields.font.hidden = !isTextLayer;
  }

  if (demoFields.color) {
    demoFields.color.hidden = !isTextLayer;
  }

  if (demoInputs.text) {
    demoInputs.text.disabled = !isTextLayer;
    demoInputs.text.value = isTextLayer ? layer.text : "";
  }

  if (demoInputs.font) {
    demoInputs.font.disabled = !isTextLayer;
    demoInputs.font.value = isTextLayer ? layer.font : "Arial, sans-serif";
  }

  if (demoInputs.color) {
    demoInputs.color.disabled = !isTextLayer;
    demoInputs.color.value = isTextLayer ? layer.color : "#2b3648";
  }

  if (demoInputs.size) {
    demoInputs.size.min = "1";
    demoInputs.size.max = "100";
    demoInputs.size.value = String(layer.size);
  }

  if (demoInputs.rotation) {
    demoInputs.rotation.value = String(layer.rotation);
  }

  if (demoInputs.stretch) {
    demoInputs.stretch.value = String(layer.stretch ?? 100);
  }

  if (demoInputs.opacity) {
    demoInputs.opacity.value = String(layer.opacity);
  }

  if (demoInputs.background) {
    demoInputs.background.value = demoState.background;
  }

  if (demoOutputs.size) {
    demoOutputs.size.textContent = isTextLayer ? `${layer.size}px` : `${layer.size}%`;
  }

  if (demoOutputs.rotation) {
    demoOutputs.rotation.textContent = `${layer.rotation}deg`;
  }

  if (demoOutputs.stretch) {
    demoOutputs.stretch.textContent = `${layer.stretch ?? 100}%`;
  }

  if (demoOutputs.opacity) {
    demoOutputs.opacity.textContent = `${layer.opacity}%`;
  }
};

const renderDemoLayerTabs = () => {
  if (!demoLayerTabs) {
    return;
  }

  demoLayerTabs.innerHTML = "";

  demoState.layers.forEach((layer) => {
    const tab = document.createElement("div");
    const label = document.createElement("span");
    const visibility = document.createElement("button");
    const remove = document.createElement("button");

    tab.className = `demo-layer-tab${layer.id === demoState.selectedId ? " is-active" : ""}${layer.visible === false ? " is-hidden" : ""}`;
    tab.dataset.layerId = layer.id;
    tab.tabIndex = 0;
    tab.draggable = true;
    tab.setAttribute("role", "button");
    tab.setAttribute("aria-label", `Select ${layer.name}`);

    label.textContent = layer.name;

    visibility.type = "button";
    visibility.className = "demo-layer-tab__visibility";
    visibility.dataset.toggleLayer = layer.id;
    visibility.draggable = false;
    visibility.setAttribute("aria-label", `${layer.visible === false ? "Show" : "Hide"} ${layer.name}`);
    visibility.textContent = layer.visible === false ? "Show" : "Hide";

    remove.type = "button";
    remove.className = "demo-layer-tab__remove";
    remove.dataset.removeLayer = layer.id;
    remove.draggable = false;
    remove.setAttribute("aria-label", `Remove ${layer.name}`);
    remove.textContent = "x";

    tab.append(label, visibility, remove);
    demoLayerTabs.append(tab);
  });
};

const renderDemoLayers = () => {
  if (!demoLayerArea) {
    return;
  }

  demoLayerArea.innerHTML = "";

  demoState.layers.forEach((layer, index) => {
    if (layer.visible === false) {
      return;
    }

    const element = document.createElement("div");

    element.className = `demo-layer demo-layer--${layer.type}${layer.id === demoState.selectedId ? " is-selected" : ""}`;
    element.dataset.layerId = layer.id;
    element.style.zIndex = String(index + 1);
    applyDemoLayerStyles(element, layer);

    if (layer.type === "image") {
      const image = document.createElement("img");

      image.src = layer.src;
      image.alt = layer.name;
      element.append(image);
    } else {
      element.textContent = layer.text;
    }

    demoLayerArea.append(element);
  });
};

const renderDemoEditor = () => {
  if (!demoShell || !demoState) {
    return;
  }

  demoShell.style.setProperty("--demo-button-bg", demoState.background);
  renderDemoLayers();
  renderDemoLayerTabs();
  syncDemoInspector();
};

const startDemoDrag = (event, layerElement) => {
  if (!demoStage || !(layerElement instanceof HTMLElement)) {
    return;
  }

  const layerId = layerElement.dataset.layerId;

  if (!layerId) {
    return;
  }

  event.preventDefault();
  demoState.selectedId = layerId;
  renderDemoEditor();

  const activeElement = demoLayerArea?.querySelector(`[data-layer-id="${layerId}"]`);

  if (!(activeElement instanceof HTMLElement)) {
    return;
  }

  activeElement.classList.add("is-dragging");
  demoDrag = {
    id: layerId,
    element: activeElement,
    pointerId: typeof event.pointerId === "number" ? event.pointerId : null,
  };

  if (typeof event.pointerId === "number" && typeof activeElement.setPointerCapture === "function") {
    activeElement.setPointerCapture(event.pointerId);
  }

  setDemoStatus("Drag the active layer anywhere inside the button circle.");
};

const updateDemoDrag = (event) => {
  const layerAreaRect = getDemoLayerAreaRect();

  if (!demoDrag || !layerAreaRect) {
    return;
  }

  const layer = getDemoLayerById(demoDrag.id);

  if (!layer) {
    return;
  }

  const nextPosition = constrainDemoPosition(
    layer,
    ((event.clientX - layerAreaRect.left) / layerAreaRect.width) * 100,
    ((event.clientY - layerAreaRect.top) / layerAreaRect.height) * 100
  );

  layer.x = nextPosition.x;
  layer.y = nextPosition.y;
  applyDemoLayerStyles(demoDrag.element, layer);
  syncDemoInspector();
};

const stopDemoDrag = () => {
  if (!(demoDrag?.element instanceof HTMLElement)) {
    demoDrag = null;
    return;
  }

  if (
    typeof demoDrag.pointerId === "number" &&
    typeof demoDrag.element.releasePointerCapture === "function" &&
    demoDrag.element.hasPointerCapture(demoDrag.pointerId)
  ) {
    demoDrag.element.releasePointerCapture(demoDrag.pointerId);
  }

  demoDrag.element.classList.remove("is-dragging");
  demoDrag = null;
  renderDemoEditor();
};

const printDemoEditor = (trigger = null) => {
  openDownloadModal(trigger);
  setDemoStatus("Download the full app to unlock the complete print workflow.");
};

const clearDemoLayerReorderState = () => {
  demoLayerReorder = null;

  demoLayerTabs?.querySelectorAll(".demo-layer-tab").forEach((tab) => {
    tab.classList.remove("is-dragging", "is-drop-before", "is-drop-after");
  });
};

const reorderDemoLayers = (draggedId, targetId, position) => {
  if (!draggedId || !targetId || draggedId === targetId) {
    return;
  }

  const fromIndex = demoState.layers.findIndex((layer) => layer.id === draggedId);
  const targetIndexBeforeRemoval = demoState.layers.findIndex((layer) => layer.id === targetId);

  if (fromIndex < 0 || targetIndexBeforeRemoval < 0) {
    return;
  }

  const [draggedLayer] = demoState.layers.splice(fromIndex, 1);
  const targetIndex = demoState.layers.findIndex((layer) => layer.id === targetId);
  const insertAt = position === "after" ? targetIndex + 1 : targetIndex;

  demoState.layers.splice(insertAt, 0, draggedLayer);
  renderDemoEditor();
  setDemoStatus("Layer order updated. Tabs farther to the right appear on top.");
};

const initDemoEditor = () => {
  if (!demoShell || !demoToolbar || !demoStage || !demoLayerArea || !demoLayerTabs) {
    return;
  }

  try {
    const savedState = localStorage.getItem(DEMO_STORAGE_KEY);
    demoState = savedState ? normalizeDemoState(JSON.parse(savedState)) : createDemoState();
  } catch {
    demoState = createDemoState();
  }

  renderDemoEditor();

  demoToolbar.addEventListener("click", (event) => {
    const trigger = event.target instanceof Element ? event.target.closest("[data-demo-action]") : null;
    const action = trigger?.getAttribute("data-demo-action");

    if (!action) {
      return;
    }

    if (action === "save") {
      saveDemoState();
      return;
    }

    if (action === "load") {
      loadDemoState();
      return;
    }

    if (action === "upload") {
      demoUploadInput?.click();
      return;
    }

    if (action === "photo") {
      addDemoPhotoLayer();
      return;
    }

    if (action === "text") {
      addDemoTextLayer();
      return;
    }

    if (action === "reset") {
      resetDemoEditor();
      return;
    }

    if (action === "print") {
      printDemoEditor(trigger);
    }
  });

  demoUploadInput?.addEventListener("change", (event) => {
    const input = event.currentTarget;

    if (!(input instanceof HTMLInputElement) || !input.files?.[0]) {
      return;
    }

    const reader = new FileReader();

    reader.addEventListener("load", () => {
      const source = typeof reader.result === "string" ? reader.result : "";
      const image = new Image();

      image.addEventListener("load", () => {
        const ratio = image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : 1;
        addDemoPhotoLayer(source, ratio, getNextDemoLabel("image"));
        setDemoStatus("Uploaded image added to the button circle.");
      });

      image.addEventListener("error", () => {
        setDemoStatus("The selected image could not be loaded.");
      });

      image.src = source;
    });

    reader.readAsDataURL(input.files[0]);
    input.value = "";
  });

  demoLayerArea.addEventListener("pointerdown", (event) => {
    const target = event.target instanceof Element ? event.target.closest(".demo-layer") : null;

    if (!target) {
      return;
    }

    startDemoDrag(event, target);
  });

  demoLayerArea.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest(".demo-layer") : null;
    const layerId = target?.getAttribute("data-layer-id");

    if (layerId) {
      setSelectedDemoLayer(layerId);
    }
  });

  window.addEventListener("pointermove", (event) => {
    updateDemoDrag(event);
  });

  window.addEventListener("pointerup", () => {
    stopDemoDrag();
  });

  window.addEventListener("pointercancel", () => {
    stopDemoDrag();
  });

  demoLayerTabs.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const removeTrigger = target.closest("[data-remove-layer]");

    if (removeTrigger) {
      removeDemoLayer(removeTrigger.getAttribute("data-remove-layer") ?? "");
      return;
    }

    const visibilityTrigger = target.closest("[data-toggle-layer]");

    if (visibilityTrigger) {
      const layerId = visibilityTrigger.getAttribute("data-toggle-layer") ?? "";
      const layer = getDemoLayerById(layerId);

      if (!layer) {
        return;
      }

      layer.visible = layer.visible === false;
      renderDemoEditor();
      setDemoStatus(`${layer.name} is now ${layer.visible === false ? "hidden" : "visible"}.`);
      return;
    }

    const tab = target.closest(".demo-layer-tab");
    const layerId = tab?.getAttribute("data-layer-id");

    if (layerId) {
      setSelectedDemoLayer(layerId);
    }
  });

  demoLayerTabs.addEventListener("keydown", (event) => {
    const target = event.target;

    if (!(target instanceof Element) || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }

    const tab = target.closest(".demo-layer-tab");
    const layerId = tab?.getAttribute("data-layer-id");

    if (!layerId) {
      return;
    }

    event.preventDefault();
    setSelectedDemoLayer(layerId);
  });

  demoLayerTabs.addEventListener("dragstart", (event) => {
    const target = event.target instanceof Element ? event.target.closest(".demo-layer-tab") : null;

    if (!(target instanceof HTMLElement)) {
      event.preventDefault();
      return;
    }

    demoLayerReorder = {
      draggedId: target.dataset.layerId ?? "",
      targetId: null,
      position: "after",
    };

    target.classList.add("is-dragging");

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", demoLayerReorder.draggedId);
    }
  });

  demoLayerTabs.addEventListener("dragover", (event) => {
    const target = event.target instanceof Element ? event.target.closest(".demo-layer-tab") : null;

    if (!(target instanceof HTMLElement) || !demoLayerReorder?.draggedId) {
      return;
    }

    const targetId = target.dataset.layerId ?? "";

    if (!targetId || targetId === demoLayerReorder.draggedId) {
      return;
    }

    event.preventDefault();

    const rect = target.getBoundingClientRect();
    const position = event.clientX < rect.left + rect.width / 2 ? "before" : "after";

    demoLayerTabs.querySelectorAll(".demo-layer-tab").forEach((tab) => {
      if (!(tab instanceof HTMLElement)) {
        return;
      }

      tab.classList.remove("is-drop-before", "is-drop-after");
    });

    target.classList.toggle("is-drop-before", position === "before");
    target.classList.toggle("is-drop-after", position === "after");
    demoLayerReorder.targetId = targetId;
    demoLayerReorder.position = position;
  });

  demoLayerTabs.addEventListener("drop", (event) => {
    if (!demoLayerReorder?.draggedId || !demoLayerReorder.targetId) {
      clearDemoLayerReorderState();
      return;
    }

    event.preventDefault();
    reorderDemoLayers(demoLayerReorder.draggedId, demoLayerReorder.targetId, demoLayerReorder.position);
    clearDemoLayerReorderState();
  });

  demoLayerTabs.addEventListener("dragend", () => {
    clearDemoLayerReorderState();
  });

  demoInputs.text?.addEventListener("input", (event) => {
    const layer = getSelectedDemoLayer();

    if (!layer || layer.type !== "text" || !(event.currentTarget instanceof HTMLInputElement)) {
      return;
    }

    layer.text = event.currentTarget.value || layer.name;
    fitDemoLayerToCircle(layer);
    renderDemoEditor();
  });

  demoInputs.font?.addEventListener("change", (event) => {
    const layer = getSelectedDemoLayer();

    if (!layer || layer.type !== "text" || !(event.currentTarget instanceof HTMLSelectElement)) {
      return;
    }

    layer.font = event.currentTarget.value;
    fitDemoLayerToCircle(layer);
    renderDemoEditor();
  });

  demoInputs.color?.addEventListener("input", (event) => {
    const layer = getSelectedDemoLayer();

    if (!layer || layer.type !== "text" || !(event.currentTarget instanceof HTMLInputElement)) {
      return;
    }

    layer.color = event.currentTarget.value;
    renderDemoEditor();
  });

  demoInputs.size?.addEventListener("input", (event) => {
    const layer = getSelectedDemoLayer();

    if (!layer || !(event.currentTarget instanceof HTMLInputElement)) {
      return;
    }

    layer.size = Number(event.currentTarget.value);
    fitDemoLayerToCircle(layer);
    renderDemoEditor();
  });

  demoInputs.rotation?.addEventListener("input", (event) => {
    const layer = getSelectedDemoLayer();

    if (!layer || !(event.currentTarget instanceof HTMLInputElement)) {
      return;
    }

    layer.rotation = Number(event.currentTarget.value);
    renderDemoEditor();
  });

  demoInputs.stretch?.addEventListener("input", (event) => {
    const layer = getSelectedDemoLayer();

    if (!layer || !(event.currentTarget instanceof HTMLInputElement)) {
      return;
    }

    layer.stretch = Number(event.currentTarget.value);
    fitDemoLayerToCircle(layer);
    renderDemoEditor();
  });

  demoInputs.opacity?.addEventListener("input", (event) => {
    const layer = getSelectedDemoLayer();

    if (!layer || !(event.currentTarget instanceof HTMLInputElement)) {
      return;
    }

    layer.opacity = Number(event.currentTarget.value);
    renderDemoEditor();
  });

  demoInputs.background?.addEventListener("input", (event) => {
    if (!(event.currentTarget instanceof HTMLInputElement)) {
      return;
    }

    demoState.background = event.currentTarget.value;
    renderDemoEditor();
  });
};

setTheme(getPreferredTheme());
syncMenuState();
updateActiveLink();
bindPreviewInteractions();
bindDownloadModalInteractions();
initRevealAnimations();
initDemoEditor();

themeToggle?.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
  saveTheme(nextTheme);
});

menuToggle?.addEventListener("click", () => {
  const expanded = isMenuOpen();
  menuToggle.setAttribute("aria-expanded", String(!expanded));
  syncMenuState();
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    updateActiveLink();
    closeMenu();
  });
});

window.addEventListener("click", (event) => {
  if (!isMenuOpen() || !navbar) {
    return;
  }

  const target = event.target;

  if (target instanceof Node && !navbar.contains(target)) {
    closeMenu();
  }
});

window.addEventListener(
  "scroll",
  () => {
    updateActiveLink();
  },
  { passive: true }
);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    closeDownloadModal();
  }
});

reducedMotionQuery.addEventListener?.("change", () => {
  if (!reducedMotionQuery.matches) {
    return;
  }

  root.classList.remove("reveal-ready");
  revealElements.forEach((element) => {
    showRevealElement(element);
  });
});

window.addEventListener("resize", () => {
  closeMenu();

  if (hoverQuery.matches) {
    previewCards.forEach((card) => {
      setPreviewState(card, false);
    });
  }

  fitAllDemoLayersToCircle();
  renderDemoEditor();
  syncMenuState();
  updateActiveLink();
});
