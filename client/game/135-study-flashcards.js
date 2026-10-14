// Ribbit Race — Polish 67: responsive pixel-art study cards and vocabulary browser.
// This DOM layer sits inside the existing game frame so keyboard, touch, swipes,
// bookmarks, sorting and editable notes work without changing the game simulation.
window.RibbitStudyUI = (() => {
  const NOTE_PREFIX = "ribbitRaceFlashcardNotesV1:";
  const STAR_KEY = "ribbitRaceFlashcardStarsV1";
  const SWIPE_TIME = 270;
  const state = {
    root: null,
    active: false,
    view: "cards",
    getVocabulary: () => [],
    onExit: null,
    account: "guest",
    notes: {},
    stars: new Set(),
    words: [],
    queue: [],
    index: 0,
    round: 0,
    missed: new Set(),
    ratings: new Map(),
    complete: false,
    flipped: false,
    sorting: false,
    animating: false,
    drag: null,
    dragMoved: false,
    search: "",
    shuffle: false,
    lastFocus: null
  };

  const keyOf = item => `${String(item?.english || "").trim()}|${String(item?.spanish || "").trim()}`;
  const current = () => state.words[state.queue[state.index]];
  const noteKey = () => NOTE_PREFIX + state.account.toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 60);
  const safeRead = (key, fallback) => {
    try {
      const result = JSON.parse(localStorage.getItem(key) || "null");
      return result ?? fallback;
    } catch (_) {
      return fallback;
    }
  };
  const saveNotes = () => {
    try { localStorage.setItem(noteKey(), JSON.stringify(state.notes)); } catch (_) {}
  };
  const syncData = () => {
    const list = state.getVocabulary?.() || [];
    state.words = (Array.isArray(list) ? list : [])
      .filter(value => value && value.english && value.spanish)
      .map(value => ({ english: String(value.english), spanish: String(value.spanish) }));
  };

  const template = `
  <section class="rr-study-panel" role="dialog" aria-modal="true" aria-labelledby="rr-study-title">
    <header class="rr-study-header"><h2 id="rr-study-title">FLASH CARDS</h2></header>
    <div class="rr-study-cards-view">
      <button type="button" class="rr-study-exit" data-study="exit" aria-label="Back to the previous menu" title="Back">
        <span class="rr-icon-exit" aria-hidden="true"><span class="rr-icon-exit-arrow"></span><span class="rr-icon-exit-door"></span></span>
      </button>
      <div class="rr-study-progress-wrap">
        <strong class="rr-study-counter">1 / 15</strong>
        <div class="rr-study-progress" role="progressbar" aria-label="Cards reviewed" aria-valuemin="0" aria-valuemax="100"><span></span></div>
      </div>
      <div class="rr-study-card-stage">
        <div class="rr-study-card-shadow rr-study-card-shadow-2" aria-hidden="true"></div>
        <div class="rr-study-card-shadow rr-study-card-shadow-1" aria-hidden="true"></div>
        <div class="rr-study-card" id="rr-study-card" role="button" tabindex="0" aria-label="Tap to flip flashcard">
          <div class="rr-study-card-inner">
            <div class="rr-study-face rr-study-front">
              <button type="button" class="rr-study-star" data-study="star" aria-label="Bookmark this term" title="Bookmark this term"></button>
              <strong class="rr-study-word" id="rr-study-front-word"></strong>
              <span class="rr-study-language">ENGLISH</span>
              <span class="rr-study-note-indicator" aria-label="Note saved">✎</span>
            </div>
            <div class="rr-study-face rr-study-back">
              <button type="button" class="rr-study-star" data-study="star" aria-label="Bookmark this term" title="Bookmark this term"></button>
              <strong class="rr-study-word" id="rr-study-back-word"></strong>
              <span class="rr-study-language">ESPAÑOL</span>
              <span class="rr-study-note-indicator" aria-label="Note saved">✎</span>
            </div>
          </div>
        </div>
        <div class="rr-study-note-tooltip" role="note" hidden></div>
        <div class="rr-study-end" hidden>
          <strong>END OF DECK!</strong>
          <p>All cards reviewed.</p>
          <button data-study="restart" type="button">RESTART ALL CARDS</button>
        </div>
      </div>
      <div class="rr-study-toolbar">
        <div class="rr-study-cluster rr-study-left-tools">
          <button type="button" class="rr-study-sort" data-study="sort" aria-label="Turn on sort mode" aria-pressed="false" title="Sort mode: mark cards wrong or right">
            <span class="rr-icon-sort" aria-hidden="true"><span class="rr-icon-sort-card rr-icon-sort-good">✓</span><span class="rr-icon-sort-card rr-icon-sort-bad">✕</span></span>
          </button>
          <button type="button" class="rr-study-note-button" data-study="note" aria-label="Write a note for this term" title="Write a note">
            <span class="rr-icon-pencil" aria-hidden="true"></span>
          </button>
        </div>
        <div class="rr-study-cluster rr-study-nav">
          <button type="button" class="rr-study-previous rr-study-nav-action" data-study="previous" aria-label="Previous flashcard">
            <span class="rr-icon-arrow rr-icon-arrow-left" aria-hidden="true"></span><span class="rr-grade-glyph rr-grade-wrong" aria-hidden="true">✕</span>
          </button>
          <button type="button" class="rr-study-flip" data-study="flip">FLIP CARD</button>
          <button type="button" class="rr-study-next rr-study-nav-action" data-study="next" aria-label="Next flashcard">
            <span class="rr-icon-arrow rr-icon-arrow-right" aria-hidden="true"></span><span class="rr-grade-glyph rr-grade-correct" aria-hidden="true">✓</span>
          </button>
        </div>
        <div class="rr-study-cluster rr-study-tools">
          <button type="button" data-study="shuffle" aria-label="Shuffle and restart" title="Shuffle and restart"><span class="rr-icon-shuffle" aria-hidden="true">⤨</span></button>
          <button type="button" data-study="help" aria-label="Flashcard help" title="Hotkeys and help"><span class="rr-icon-help" aria-hidden="true">?</span></button>
        </div>
      </div>
    </div>
    <div class="rr-study-list-view" hidden>
      <div class="rr-study-list-tools"><label>FIND WORD <input type="search" class="rr-study-search" maxlength="80" placeholder="Search English or Español" autocomplete="off"></label><span class="rr-study-list-count"></span></div>
      <div class="rr-study-vocab-table" role="list" aria-label="Your vocabulary list"></div>
      <div class="rr-study-list-actions"><button type="button" data-study="refresh">↻ REFRESH WORDS</button><button type="button" data-study="study-all">STUDY FLASH CARDS</button><button type="button" data-study="exit">BACK</button></div>
      <p>Words come from your active Friends vocabulary list. Notes are saved locally for this account on this device.</p>
    </div>
    <div class="rr-study-modal" hidden><div class="rr-study-modal-card"><h3>✎ FLASHCARD NOTES</h3><p>Write a memory trick, definition, or example for this term. Notes stay on this device.</p><textarea class="rr-study-notes-input" maxlength="1200" rows="5" placeholder="Write a memory trick or example…"></textarea><div><button type="button" data-study="save-note">SAVE NOTE</button><button type="button" data-study="cancel-note">CANCEL</button></div></div></div>
    <div class="rr-study-help" hidden><div class="rr-study-help-card"><h3>HOW TO STUDY</h3><p>Tap the card, Space, or Enter to flip it. Use the arrow buttons to browse. The pencil saves a note for the current term. Hover over a card to read its note.</p><p>Turn on <b>Sort Mode</b> with the check/X cards button. The left button then marks a card wrong and the right button marks it correct. Wrong cards return until mastered. In Sort Mode, swiping left marks wrong and swiping right marks correct.</p><p>Keyboard: ← / → browse or grade, 1 wrong, 2 right, N notes, T sort mode, S shuffle, H help, Esc back.</p><button type="button" data-study="close-help">GOT IT</button></div></div>
  </section>`;

  function ensureRoot() {
    if (state.root) return state.root;
    const frame = document.getElementById("game-frame");
    if (!frame) return null;
    const root = document.createElement("div");
    root.id = "rr-study-overlay";
    root.hidden = true;
    root.innerHTML = template;
    frame.append(root);
    root.addEventListener("click", onClick);
    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerup", onPointerUp);
    root.addEventListener("pointercancel", onPointerCancel);
    root.querySelector(".rr-study-search").addEventListener("input", event => {
      state.search = event.target.value;
      renderList();
    });
    root.querySelector(".rr-study-card").addEventListener("mouseenter", () => showNoteTooltip(true));
    root.querySelector(".rr-study-card").addEventListener("mouseleave", () => showNoteTooltip(false));
    state.root = root;
    return root;
  }

  function open({ view = "cards", vocabularyProvider, account = "guest", onExit } = {}) {
    const root = ensureRoot();
    if (!root) return false;
    state.lastFocus = document.activeElement;
    state.getVocabulary = typeof vocabularyProvider === "function" ? vocabularyProvider : state.getVocabulary;
    state.account = String(account || "guest");
    state.notes = safeRead(noteKey(), {});
    const bookmarks = safeRead(STAR_KEY, []);
    state.stars = new Set(Array.isArray(bookmarks) ? bookmarks : []);
    state.onExit = typeof onExit === "function" ? onExit : null;
    state.sorting = false;
    syncData();
    state.active = true;
    state.view = view;
    state.search = "";
    root.hidden = false;
    document.body.classList.add("rr-study-active");
    root.querySelector(".rr-study-modal").hidden = true;
    root.querySelector(".rr-study-help").hidden = true;
    root.querySelector(".rr-study-search").value = "";
    if (view === "cards") resetDeck(false); else renderList();
    updateView();
    root.querySelector(".rr-study-exit")?.focus({ preventScroll: true });
    return true;
  }

  function close() {
    if (!state.active) return;
    state.active = false;
    state.animating = false;
    state.drag = null;
    state.root.hidden = true;
    document.body.classList.remove("rr-study-active");
    const done = state.onExit;
    state.onExit = null;
    done?.();
    if (state.lastFocus?.isConnected && state.lastFocus !== document.body) state.lastFocus.focus({ preventScroll: true });
  }

  function resetDeck(shuffle = false) {
    syncData();
    state.queue = state.words.map((_, index) => index);
    if (shuffle) {
      for (let index = state.queue.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [state.queue[index], state.queue[randomIndex]] = [state.queue[randomIndex], state.queue[index]];
      }
    }
    state.index = 0;
    state.round = 0;
    state.missed.clear();
    state.ratings.clear();
    state.complete = !state.queue.length;
    state.flipped = false;
    state.animating = false;
    state.shuffle = shuffle;
    const card = state.root.querySelector(".rr-study-card");
    card.style.transform = "";
    card.classList.remove("is-flipped", "rr-study-swiping", "rr-study-graded-right", "rr-study-graded-wrong");
    renderCard();
  }

  function renderCard() {
    if (!state.active || state.view !== "cards") return;
    const root = state.root;
    const panel = root.querySelector(".rr-study-panel");
    const word = current();
    const complete = state.complete;
    const total = state.queue.length;
    const position = complete ? total : Math.min(total, state.index + 1);
    const percent = total ? (complete ? 100 : Math.round((position / total) * 100)) : 0;

    panel.classList.toggle("rr-study-sort-active", state.sorting);
    const sortButton = root.querySelector(".rr-study-sort");
    sortButton.classList.toggle("is-active", state.sorting);
    sortButton.setAttribute("aria-pressed", String(state.sorting));
    sortButton.setAttribute("aria-label", state.sorting ? "Turn off sort mode" : "Turn on sort mode");
    sortButton.title = state.sorting ? "Sort mode is on" : "Sort mode: mark cards wrong or right";

    root.querySelector(".rr-study-counter").textContent = `${position} / ${total}`;
    root.querySelector(".rr-study-progress span").style.width = `${percent}%`;
    root.querySelector(".rr-study-progress").setAttribute("aria-valuenow", String(percent));

    const card = root.querySelector(".rr-study-card");
    card.hidden = complete;
    root.querySelector(".rr-study-card-shadow-1").hidden = complete;
    root.querySelector(".rr-study-card-shadow-2").hidden = complete;
    root.querySelector(".rr-study-end").hidden = !complete;

    if (!complete && word) {
      root.querySelector("#rr-study-front-word").textContent = word.english.toUpperCase();
      root.querySelector("#rr-study-back-word").textContent = word.spanish.toUpperCase();
      const marked = state.stars.has(keyOf(word));
      root.querySelectorAll(".rr-study-star").forEach(node => {
        node.classList.toggle("is-bookmarked", marked);
        node.setAttribute("aria-pressed", String(marked));
      });
      const note = String(state.notes[keyOf(word)] || "");
      root.querySelectorAll(".rr-study-note-indicator").forEach(node => { node.hidden = !note; });
      card.classList.toggle("is-flipped", state.flipped);
      card.setAttribute(
        "aria-label",
        `${state.flipped ? word.spanish : word.english}; tap to flip${state.sorting ? ", swipe left wrong, swipe right correct" : ", swipe to browse"}`
      );
      root.querySelector(".rr-study-note-tooltip").textContent = note;
      showNoteTooltip(Boolean(root.querySelector(".rr-study-card:hover")));
    } else {
      root.querySelector(".rr-study-end strong").textContent = state.words.length
        ? (state.sorting ? "ALL MASTERED!" : "END OF DECK!")
        : "NO VOCAB WORDS YET";
      root.querySelector(".rr-study-end p").textContent = state.words.length
        ? (state.sorting ? `${state.words.length} cards sorted. Great work!` : `${state.words.length} cards reviewed.`)
        : "Load vocabulary in your account to study.";
      showNoteTooltip(false);
    }

    const previousButton = root.querySelector('[data-study="previous"]');
    const nextButton = root.querySelector('[data-study="next"]');
    previousButton.setAttribute("aria-label", state.sorting ? "Mark this card wrong" : "Previous flashcard");
    nextButton.setAttribute("aria-label", state.sorting ? "Mark this card correct" : "Next flashcard");
    previousButton.title = state.sorting ? "Wrong" : "Previous";
    nextButton.title = state.sorting ? "Correct" : "Next";

    root.querySelector('[data-study="flip"]').disabled = complete;
    root.querySelector('[data-study="note"]').disabled = complete;
    root.querySelectorAll('[data-study="star"]').forEach(button => { button.disabled = complete; });
    previousButton.disabled = complete || (!state.sorting && state.index <= 0);
    nextButton.disabled = complete;
  }

  function showNoteTooltip(show) {
    const popup = state.root?.querySelector(".rr-study-note-tooltip");
    if (!popup) return;
    popup.hidden = !show || !state.active || state.view !== "cards" || state.animating || !current() || !state.notes[keyOf(current())];
  }

  function updateView() {
    state.root.querySelector("#rr-study-title").textContent = state.view === "cards" ? "FLASH CARDS" : "VOCAB LIST";
    state.root.querySelector(".rr-study-cards-view").hidden = state.view !== "cards";
    state.root.querySelector(".rr-study-list-view").hidden = state.view !== "list";
    if (state.view === "cards") renderCard(); else renderList();
  }

  function renderList() {
    if (!state.active || state.view !== "list") return;
    syncData();
    const filter = state.search.trim().toLocaleLowerCase();
    const matches = state.words
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => !filter || entry.english.toLocaleLowerCase().includes(filter) || entry.spanish.toLocaleLowerCase().includes(filter));
    state.root.querySelector(".rr-study-list-count").textContent = `${matches.length} / ${state.words.length} TERMS`;
    const table = state.root.querySelector(".rr-study-vocab-table");
    table.replaceChildren();
    for (const { entry, index } of matches) {
      const row = document.createElement("div");
      row.className = "rr-study-vocab-row";
      row.setAttribute("role", "listitem");
      const number = document.createElement("span");
      number.className = "rr-study-vocab-n";
      number.textContent = String(index + 1);
      const english = document.createElement("strong");
      english.textContent = entry.english;
      const spanish = document.createElement("span");
      spanish.textContent = entry.spanish;
      const note = document.createElement("span");
      note.className = "rr-study-vocab-note";
      note.textContent = state.notes[keyOf(entry)] ? "✎" : "";
      row.append(number, english, spanish, note);
      table.append(row);
    }
    if (!matches.length) {
      const paragraph = document.createElement("p");
      paragraph.textContent = "No matching terms.";
      paragraph.className = "rr-study-no-results";
      table.append(paragraph);
    }
  }

  function flip() {
    if (!state.complete && !state.animating) {
      state.flipped = !state.flipped;
      renderCard();
    }
  }

  function advanceAfterGrade() {
    state.index++;
    if (state.index >= state.queue.length) {
      if (state.sorting && state.missed.size) {
        state.round++;
        state.queue = state.words
          .map((entry, index) => ({ entry, index }))
          .filter(({ entry }) => state.missed.has(keyOf(entry)))
          .map(({ index }) => index);
        state.index = 0;
      } else {
        state.complete = true;
      }
    }
    state.flipped = false;
    renderCard();
  }

  function nextCard() {
    if (state.animating || state.complete) return;
    state.index++;
    if (state.index >= state.queue.length) state.complete = true;
    state.flipped = false;
    const card = state.root.querySelector(".rr-study-card");
    card.classList.add("rr-study-in-from-left");
    window.setTimeout(() => card.classList.remove("rr-study-in-from-left"), 270);
    renderCard();
  }

  function grade(correct) {
    if (!state.sorting || state.complete || state.animating || !current()) return;
    const key = keyOf(current());
    if (correct) state.missed.delete(key); else state.missed.add(key);
    state.ratings.set(key, correct ? "right" : "wrong");
    const card = state.root.querySelector(".rr-study-card");
    state.animating = true;
    showNoteTooltip(false);
    card.classList.add(correct ? "rr-study-graded-right" : "rr-study-graded-wrong");
    window.setTimeout(() => {
      card.classList.remove("rr-study-graded-right", "rr-study-graded-wrong", "rr-study-swiping", "is-flipped");
      card.style.transform = "";
      state.animating = false;
      if (state.active && state.view === "cards") advanceAfterGrade();
    }, SWIPE_TIME);
  }

  function previous() {
    if (state.animating || state.complete || state.index <= 0) return;
    state.index--;
    state.flipped = false;
    const card = state.root.querySelector(".rr-study-card");
    card.classList.add("rr-study-in-from-left");
    window.setTimeout(() => card.classList.remove("rr-study-in-from-left"), 270);
    renderCard();
  }

  function toggleSortMode() {
    if (state.animating) return;
    state.sorting = !state.sorting;
    resetDeck(state.shuffle);
  }

  function openNote() {
    if (!current() || state.complete) return;
    showNoteTooltip(false);
    const modal = state.root.querySelector(".rr-study-modal");
    modal.hidden = false;
    modal.querySelector("textarea").value = state.notes[keyOf(current())] || "";
    modal.querySelector("textarea").focus();
  }

  function saveNote() {
    const word = current();
    if (!word) return;
    const value = state.root.querySelector(".rr-study-notes-input").value.trim().slice(0, 1200);
    if (value) state.notes[keyOf(word)] = value; else delete state.notes[keyOf(word)];
    saveNotes();
    state.root.querySelector(".rr-study-modal").hidden = true;
    renderCard();
  }

  function toggleStar() {
    const item = current();
    if (!item) return;
    const key = keyOf(item);
    if (state.stars.has(key)) state.stars.delete(key); else state.stars.add(key);
    try { localStorage.setItem(STAR_KEY, JSON.stringify([...state.stars])); } catch (_) {}
    renderCard();
  }

  function action(name) {
    switch (name) {
      case "exit": close(); break;
      case "flip": flip(); break;
      case "wrong": grade(false); break;
      case "correct": grade(true); break;
      case "previous": state.sorting ? grade(false) : previous(); break;
      case "next": state.sorting ? grade(true) : nextCard(); break;
      case "sort": toggleSortMode(); break;
      case "note": openNote(); break;
      case "star": toggleStar(); break;
      case "shuffle": resetDeck(true); break;
      case "restart": resetDeck(false); break;
      case "help": state.root.querySelector(".rr-study-help").hidden = false; break;
      case "close-help": state.root.querySelector(".rr-study-help").hidden = true; break;
      case "cancel-note": state.root.querySelector(".rr-study-modal").hidden = true; break;
      case "save-note": saveNote(); break;
      case "study-all": state.view = "cards"; state.sorting = false; resetDeck(false); updateView(); break;
      case "refresh":
        document.getElementById("cloud-refresh-vocab")?.click();
        window.setTimeout(() => { if (state.active && state.view === "list") renderList(); }, 900);
        break;
    }
  }

  function onClick(event) {
    const button = event.target.closest("[data-study]");
    if (button) {
      event.stopPropagation();
      action(button.dataset.study);
      return;
    }
    if (event.target.closest(".rr-study-card") && event.detail === 0) flip();
  }

  function onPointerDown(event) {
    const card = event.target.closest(".rr-study-card");
    if (!card || event.target.closest("button") || state.complete || state.animating || event.button > 0) return;
    state.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, moved: false };
    state.dragMoved = false;
    try { card.setPointerCapture(event.pointerId); } catch (_) {}
  }

  function onPointerMove(event) {
    const drag = state.drag;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.lastX = event.clientX;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 10) drag.moved = true;
    state.dragMoved = drag.moved;
    if (!drag.moved) return;
    const card = state.root.querySelector(".rr-study-card");
    card.classList.add("rr-study-swiping");
    card.style.transform = `translateX(${dx}px) rotate(${dx * .045}deg)`;
    showNoteTooltip(false);
    event.preventDefault();
  }

  function onPointerUp(event) {
    const drag = state.drag;
    if (!drag || drag.id !== event.pointerId) return;
    state.drag = null;
    const card = state.root.querySelector(".rr-study-card");
    const dx = event.clientX - drag.x;
    const threshold = Math.min(95, Math.max(42, card.getBoundingClientRect().width * .20));
    if (Math.abs(dx) >= threshold) {
      card.style.transform = "";
      if (state.sorting) grade(dx > 0); else if (dx > 0) previous(); else nextCard();
    } else {
      card.style.transform = "";
      card.classList.remove("rr-study-swiping");
      if (!drag.moved) flip();
    }
  }

  function onPointerCancel() {
    if (!state.drag) return;
    state.drag = null;
    const card = state.root.querySelector(".rr-study-card");
    card.style.transform = "";
    card.classList.remove("rr-study-swiping");
  }

  document.addEventListener("keydown", event => {
    if (!state.active) return;
    if (event.target.closest?.("textarea,input")) {
      if (event.code === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        state.root.querySelector(".rr-study-modal").hidden = true;
        state.root.querySelector(".rr-study-search").blur();
      }
      return;
    }
    const names = {
      Digit1: "wrong", Numpad1: "wrong", Digit2: "correct", Numpad2: "correct",
      ArrowLeft: "previous", ArrowRight: "next", Space: "flip", Enter: "flip", NumpadEnter: "flip",
      Escape: "exit", Backspace: "exit", KeyN: "note", KeyH: "help", KeyS: "shuffle", KeyT: "sort"
    };
    const modeOpen = !state.root.querySelector(".rr-study-modal").hidden || !state.root.querySelector(".rr-study-help").hidden;
    if (modeOpen) {
      if (event.code === "Escape" || event.code === "Backspace") {
        event.preventDefault();
        event.stopImmediatePropagation();
        state.root.querySelector(".rr-study-modal").hidden = true;
        state.root.querySelector(".rr-study-help").hidden = true;
      }
      return;
    }
    if (event.repeat || !names[event.code]) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (state.view === "list") {
      if (["Escape", "Backspace"].includes(event.code)) close();
    } else {
      action(names[event.code]);
    }
  }, true);

  return Object.freeze({
    openCards: args => open({ ...args, view: "cards" }),
    openList: args => open({ ...args, view: "list" }),
    close,
    isOpen: () => state.active,
    getSnapshot: () => ({
      round: state.round,
      index: state.index,
      queue: [...state.queue],
      missed: [...state.missed],
      complete: state.complete,
      sorting: state.sorting,
      view: state.view
    })
  });
})();
