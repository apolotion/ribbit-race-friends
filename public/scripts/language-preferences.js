(() => {
  "use strict";
  const KEY = "ribbitRaceLanguageModeV1";
  const SPOKEN_KEY = "ribbitRaceSpokenLanguageV1";
  const LEARNING_KEY = "ribbitRaceLearningLanguageV1";
  const DEFAULT_SPOKEN = "en";
  const DEFAULT_LEARNING = "es";

  function inferMode(spoken, learning) {
    return spoken === "es" && learning === "en" ? "es-en" : "en-es";
  }
  function normalizeLanguage(value, fallback = "en") {
    return value === "es" ? "es" : (value === "en" ? "en" : fallback);
  }
  function getMode() {
    try { return localStorage.getItem(KEY) === "es-en" ? "es-en" : "en-es"; }
    catch (_) { return "en-es"; }
  }
  function getSpoken() {
    try {
      const stored = localStorage.getItem(SPOKEN_KEY);
      if (stored === "en" || stored === "es") return stored;
      return getMode() === "es-en" ? "es" : "en";
    } catch (_) {
      return getMode() === "es-en" ? "es" : "en";
    }
  }
  function getLearning() {
    try {
      const stored = localStorage.getItem(LEARNING_KEY);
      if (stored === "en" || stored === "es") return stored;
      return getMode() === "es-en" ? "en" : "es";
    } catch (_) {
      return getMode() === "es-en" ? "en" : "es";
    }
  }
  function notify(detail) {
    window.dispatchEvent(new CustomEvent("rr-language-changed", { detail }));
    setTimeout(() => { try { scan(document); } catch (_) {} }, 0);
  }
  function persist(mode, spoken, learning) {
    try {
      localStorage.setItem(KEY, mode);
      localStorage.setItem(SPOKEN_KEY, spoken);
      localStorage.setItem(LEARNING_KEY, learning);
    } catch (_) {}
    try {
      const cloud = window.RibbitCloud;
      const patch = {
        languageMode: mode,
        ribbitRaceLanguageModeV1: mode,
        ribbitRaceSpokenLanguageV1: spoken,
        ribbitRaceLearningLanguageV1: learning
      };
      cloud?.queueSave?.(patch);
      cloud?.savePatch?.(patch);
    } catch (_) {}
  }
  function setMode(mode) {
    const normalized = mode === "es-en" ? "es-en" : "en-es";
    const spoken = normalized === "es-en" ? "es" : "en";
    const learning = normalized === "es-en" ? "en" : "es";
    persist(normalized, spoken, learning);
    notify({ mode: normalized, spoken, learning });
    return normalized;
  }
  function setLanguages(spoken, learning) {
    let normalizedSpoken = normalizeLanguage(spoken, DEFAULT_SPOKEN);
    let normalizedLearning = normalizeLanguage(learning, DEFAULT_LEARNING);
    if (normalizedSpoken === normalizedLearning) {
      normalizedLearning = normalizedSpoken === "en" ? "es" : "en";
    }
    const mode = inferMode(normalizedSpoken, normalizedLearning);
    persist(mode, normalizedSpoken, normalizedLearning);
    notify({ mode, spoken: normalizedSpoken, learning: normalizedLearning });
    return { mode, spoken: normalizedSpoken, learning: normalizedLearning };
  }
  function swapLanguages() {
    return setLanguages(getLearning(), getSpoken());
  }

  function makeSelect(labelText, key, value, options) {
    const label = document.createElement("label");
    label.className = "rr-language-field";
    const title = document.createElement("span");
    title.textContent = labelText;
    const select = document.createElement("select");
    select.dataset.languageKey = key;
    for (const [optionValue, optionLabel] of options) {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionLabel;
      select.appendChild(option);
    }
    select.value = value;
    label.append(title, select);
    return { label, select };
  }

  function installFields(container, context = "signup") {
    if (!(container instanceof HTMLElement) || container.querySelector("[data-rr-language-fields]")) return;
    const wrapper = document.createElement("div");
    wrapper.dataset.rrLanguageFields = context;
    const spoken = getSpoken();
    const learning = getLearning();
    const choices = [["en","English"],["es","Español"]];
    const spokenField = makeSelect(context === "profile" ? "Language you speak" : "What language do you speak?", "spoken", spoken, choices);
    const learningField = makeSelect(context === "profile" ? "Target language" : "What language are you learning?", "learning", learning, choices);
    const commit = () => {
      const result = setLanguages(spokenField.select.value, learningField.select.value);
      spokenField.select.value = result.spoken;
      learningField.select.value = result.learning;
    };
    spokenField.select.addEventListener("change", commit);
    learningField.select.addEventListener("change", commit);
    wrapper.append(spokenField.label, learningField.label);

    const buttons = [...container.querySelectorAll("button")];
    const anchor = buttons.find((button) => /CREATE|SIGN UP|REGISTER|SAVE|ACCOUNT/i.test(button.textContent || ""));
    if (anchor?.parentElement === container) container.insertBefore(wrapper, anchor);
    else container.appendChild(wrapper);

    container.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (button && /CREATE|SIGN UP|REGISTER|SAVE|PLAY/i.test(button.textContent || "")) commit();
    }, true);
  }

  const DOM_ES = Object.freeze({
    "SIGN IN":"INICIAR SESIÓN",
    "CREATE ACCOUNT":"CREAR CUENTA",
    "PLAY WITHOUT SAVING":"JUGAR SIN GUARDAR",
    "USERNAME":"USUARIO",
    "DISPLAY NAME":"NOMBRE VISIBLE",
    "4-DIGIT PIN":"PIN DE 4 DÍGITOS",
    "CONFIRM PIN":"CONFIRMAR PIN",
    "BACK":"VOLVER",
    "CONTINUE":"CONTINUAR",
    "SAVE":"GUARDAR",
    "SIGN OUT":"CERRAR SESIÓN",
    "LEADERBOARD":"CLASIFICACIÓN",
    "REFRESH WORDS":"ACTUALIZAR PALABRAS",
    "BACK UP / MANAGE SAVE":"COPIA / ADMINISTRAR PARTIDA",
    "Language you speak":"Idioma que hablas",
    "Target language":"Idioma que aprendes"
  });

  function translateDom(root = document) {
    if (getMode() !== "es-en") return;
    const nodes = root.querySelectorAll?.("button,h1,h2,h3,label,legend,option,[data-i18n],.title,.subtitle") || [];
    for (const node of nodes) {
      if (node.tagName === "OPTION") continue;
      const raw = String(node.textContent || "").trim();
      if (DOM_ES[raw]) node.textContent = DOM_ES[raw];
    }
    for (const input of root.querySelectorAll?.("input[placeholder]") || []) {
      const raw = String(input.placeholder || "").trim();
      if (DOM_ES[raw]) input.placeholder = DOM_ES[raw];
    }
  }

  function fixButtonContrast(root = document) {
    const buttons = root.querySelectorAll?.("[role='dialog'] button, [class*='account'] button, [class*='profile'] button") || [];
    for (const button of buttons) {
      try {
        const bg = getComputedStyle(button).backgroundColor.match(/\d+/g)?.map(Number) || [255,255,255];
        const light = (bg[0]*299 + bg[1]*587 + bg[2]*114) / 1000 > 178;
        button.style.setProperty("color", light ? "#26363d" : "#ffffff", "important");
        button.style.setProperty("text-shadow", light ? "none" : "0 1px #26363d", "important");
      } catch (_) {}
    }
  }

  function scan(root = document) {
    const insideGameFrame = (node) => node instanceof HTMLElement && node.closest?.("#game-frame");
    for (const stale of root.querySelectorAll?.("#game-frame [data-rr-language-fields]") || []) stale.remove();
    const elements = root.querySelectorAll?.("form, [role='dialog'], [class*='account'], [class*='profile'], [class*='signup'], [id*='signup'], [id*='register']") || [];
    for (const element of elements) {
      if (insideGameFrame(element)) continue;
      const text = String(element.textContent || "");
      if (/CREATE ACCOUNT|SIGN UP|REGISTER/i.test(text)) installFields(element, "signup");
      else if (/NAME:|SIGN OUT|MANAGE SAVE|ACCOUNT/i.test(text)) installFields(element, "profile");
    }
    fixButtonContrast(root);
    translateDom(root);
  }

  const observer = new MutationObserver((records) => {
    scan(document);
    for (const record of records) for (const node of record.addedNodes) if (node instanceof HTMLElement) scan(node);
  });

  window.RibbitLanguagePreferences = Object.freeze({ getMode, setMode, getSpoken, getLearning, setLanguages, swapLanguages, scan });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => scan(document), { once:true });
  else scan(document);
  observer.observe(document.documentElement, { childList:true, subtree:true });
})();

// Remove obsolete DOM palette-copy card if an older browser bundle still creates it.
(() => {
  function clean(root=document){
    for(const element of root.querySelectorAll?.("div,section,aside")||[]){
      const text=String(element.textContent||"").trim();
      if(/^BASE PALETTE(?:\s|$)/i.test(text)&&element.querySelector("input,textarea,button")){
        element.style.display="none";
        element.setAttribute("aria-hidden","true");
      }
    }
  }
  const observer=new MutationObserver(()=>clean(document));
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>clean(document),{once:true});else clean(document);
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
