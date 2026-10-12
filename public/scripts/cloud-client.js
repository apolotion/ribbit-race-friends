"use strict";

    // Friends Edition: accounts, matchmaking, and live human gameplay use the
    // same-origin Cloudflare Worker/Durable Object service. The historical
    // directOnlyVersion field is retained only as a protocol compatibility marker.
    const RIBBIT_DIRECT_BUILD = "2026.10.12-friends-polish-19";
    const RIBBIT_DIRECT_POLICY_VERSION = 2;
    const RIBBIT_ONLINE_PROTOCOL_VERSION = 3;
    const RIBBIT_QUICKPLAY_VERSION = 3;

    const RIBBIT_CLOUD_CLIENT_VERSION = "2026.10.12-friends-polish-19";
    const RIBBIT_CLOUD_SAVE_SCHEMA_VERSION = 2;
    // Preserve every current and future Ribbit Race key, including legacy one-button keys.
    const RIBBIT_GAME_KEY = /^(?:ribbitRace|oneButtonFrog)/;

    function normalizeVocabularyCellText(value, maximumLength = 80) {
      let text = String(value ?? "");
      try { text = text.normalize("NFC"); } catch (_) {}
      text = text
        .replace(/ /g, " ")
        .replace(/[​-‍⁠﻿]/g, "")
        .replace(/[\r\n\t]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return text.slice(0, Math.max(1, Number(maximumLength) || 80));
    }

    const RibbitCloud = (() => {
      const elements = {};
      let sessionToken = "";
      let studentId = "";
      let playerName = "";
      let classPeriod = "";
      let classPeriods = [];
      let guestMode = false;
      let onlineIdentityGeneration = 0;
      let revision = 0;
      let dirty = false;
      let saving = false;
      let hydrating = false;
      let gameStarted = false;
      let pendingAuth = null;
      let pendingCreatedAuth = null;
      let autosaveSeconds = 60;
      let onlineRealtimeActive = false;
      let saveTimer = null;
      let saveDueAt = 0;
      let retryTimer = null;
      let periodicTimer = null;
      let nativeSetItem = null;
      let nativeRemoveItem = null;
      let nativeClear = null;
      let playtestPaused = false;
      let dirtyBeforePlaytest = false;
      let cloudVocabulary = [];
      let cloudVocabularySource = "fallback";
      let savedToastTimer = null;
      let mutationVersion = 0;
      const deletedGameKeys = new Set();
      let leaderboardRows = [];
      let leaderboardPage = 0;
      const leaderboardPageSize = 12;
      const LEADERBOARD_FIRST_PLACE_NOTICE_KEY = "ribbitRaceLeaderboardFirstPlaceNoticesV1";
      let leaderboardBaselineReady = false;
      let leaderboardRelevantDirty = false;
      let lastLeaderboardRecordCheckAt = 0;
      let gameInputLocked = true;

      function setGameInputLocked(locked) {
        gameInputLocked = Boolean(locked);
        window.__RIBBIT_FRIENDS_GAME_INPUT_LOCKED__ = gameInputLocked;
        window.RibbitAuthScreen?.setLocked(gameInputLocked);
      }
      window.RibbitFriendsGameInputLocked = () => gameInputLocked;

      function cacheElements() {
        [
          "cloud-gate", "cloud-message", "cloud-login-view", "cloud-create-view", "cloud-profile-view", "cloud-created-view",
          "cloud-login-id", "cloud-login-pin", "cloud-login-button", "cloud-show-create", "cloud-play-guest",
          "cloud-create-id", "cloud-create-name", "cloud-create-period", "cloud-create-pin", "cloud-create-pin-confirm", "cloud-create-button",
          "cloud-back-login", "cloud-profile-name", "cloud-profile-period", "cloud-save-profile", "cloud-profile-sign-out",
          "cloud-created-name", "cloud-created-period", "cloud-created-continue",
          "cloud-status-pill", "cloud-account-button", "cloud-account-panel", "cloud-account-name", "cloud-account-period",
          "cloud-save-now", "cloud-refresh-vocab", "cloud-leaderboard", "cloud-sign-out",
          "leaderboard-overlay", "leaderboard-close", "leaderboard-scope", "leaderboard-metric", "leaderboard-level", "leaderboard-level-wrap",
          "leaderboard-refresh", "leaderboard-context", "leaderboard-body", "leaderboard-empty", "leaderboard-prev", "leaderboard-next", "leaderboard-page"
        ].forEach((id) => { elements[id] = document.getElementById(id); });
      }

      const apiClient = window.RibbitFriendsApi;
      if (!apiClient) throw new Error("Friends API client did not initialize.");

      async function serverCall(method, payload = {}) {
        return apiClient.call(method, payload);
      }


      let onlineGuestToken = "";
      let onlineGuestRequest = null;
      async function onlineCall(method, payload = {}) {
        payload={...payload,directOnlyVersion:RIBBIT_DIRECT_POLICY_VERSION};
        if(sessionToken && !guestMode) return serverCall(method,{...payload,sessionToken});
        if(!guestMode) throw new Error("Sign in or choose Play Without Saving first.");
        if(!onlineGuestToken){
          if(!onlineGuestRequest) onlineGuestRequest=serverCall("apiOnlineGuestSession",{}).then(result=>{
            if(!result?.ok||!result.guestToken) throw new Error(result?.message||"Guest online session could not start.");
            onlineGuestToken=result.guestToken;return onlineGuestToken;
          }).finally(()=>{onlineGuestRequest=null;});
          await onlineGuestRequest;
        }
        const result=await serverCall(method,{...payload,guestToken:onlineGuestToken});
        if(result?.code==='GUEST_SESSION_EXPIRED')onlineGuestToken="";
        return result;
      }

      function setMessage(message = "", isError = true) {
        elements["cloud-message"].textContent = message;
        elements["cloud-message"].style.color = isError ? "#a51f1c" : "#1d6d3a";
      }

      function setBusy(busy) {
        [
          "cloud-login-button", "cloud-show-create", "cloud-play-guest", "cloud-create-button", "cloud-back-login",
          "cloud-save-profile", "cloud-profile-sign-out", "cloud-created-continue"
        ].forEach((id) => { if (elements[id]) elements[id].disabled = Boolean(busy); });
      }

      function showView(name) {
        elements["cloud-login-view"].hidden = name !== "login";
        elements["cloud-create-view"].hidden = name !== "create";
        elements["cloud-profile-view"].hidden = name !== "profile";
        elements["cloud-created-view"].hidden = name !== "created";
        setMessage("");
      }

      function setStatus(text) {
        const pill = elements["cloud-status-pill"];
        if (!pill || text !== "CLOUD SAVED") return;
        clearTimeout(savedToastTimer);
        pill.classList.remove("show");
        void pill.offsetWidth;
        pill.textContent = "CLOUD SAVED";
        pill.classList.add("show");
        savedToastTimer = setTimeout(() => pill.classList.remove("show"), 3000);
      }

      function normalizeCloudVocabulary(entries) {
        if (!Array.isArray(entries)) return [];
        const cleaned = [];
        const seen = new Set();
        entries.forEach((entry) => {
          const english = normalizeVocabularyCellText(entry && entry.english, 80);
          const spanish = normalizeVocabularyCellText(entry && entry.spanish, 80);
          if (!english || !spanish) return;
          const key = `${english.toLocaleLowerCase()}\u0000${spanish.toLocaleLowerCase()}`;
          if (seen.has(key)) return;
          seen.add(key);
          cleaned.push({ english, spanish });
        });
        return cleaned.slice(0, 250);
      }

      function setCloudVocabulary(entries, source = "sheet") {
        const normalized = normalizeCloudVocabulary(entries);
        if (normalized.length >= 4) {
          cloudVocabulary = normalized;
          cloudVocabularySource = source || "sheet";
        }
        return cloudVocabulary.length;
      }

      function getVocabulary() {
        return cloudVocabulary.map((entry) => ({ english: entry.english, spanish: entry.spanish }));
      }

      function populatePeriodSelect(select, selectedValue = "") {
        if (!select) return;
        select.textContent = "";
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "CHOOSE PERIOD";
        select.appendChild(placeholder);
        classPeriods.forEach((period) => {
          const option = document.createElement("option");
          option.value = period;
          option.textContent = /^\d+$/.test(period) ? `PERIOD ${period}` : period.toUpperCase();
          option.selected = period === selectedValue;
          select.appendChild(option);
        });
      }

      function formatPeriod(period) {
        const value = String(period || "").trim();
        return /^\d+$/.test(value) ? `PERIOD ${value}` : value.toUpperCase();
      }

      function formatLeaderboardName(name){return String(name||'PLAYER');}

      function formatLeaderboardDate(value) {
        if (!value) return "—";
        if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(String(value).trim())) return String(value).trim();
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return "—";
        return `${parsed.getMonth() + 1}/${parsed.getDate()}/${String(parsed.getFullYear()).slice(-2)}`;
      }

      function populateLeaderboardScopeOptions() {
        elements['leaderboard-scope'].innerHTML='<option value="school">ALL PLAYERS · ALL TIME</option>';
      }

      async function refreshVocabulary() {
        const button = elements["cloud-refresh-vocab"];
        const original = button ? button.textContent : "";
        if (button) { button.disabled = true; button.textContent = "REFRESHING…"; }
        try {
          const result = await serverCall("apiGetVocabulary", {});
          if (!result || !result.ok) throw new Error(result && result.message ? result.message : "Vocabulary refresh failed.");
          const count = setCloudVocabulary(result.vocabulary, result.vocabularySource);
          const appliedNow = typeof window.RibbitRaceQueueVocabulary === "function"
            ? window.RibbitRaceQueueVocabulary(getVocabulary())
            : false;
          if (button) button.textContent = appliedNow ? `${count} WORDS LOADED` : `${count} WORDS NEXT ROUND`;
          setTimeout(() => { if (button) button.textContent = original || "REFRESH WORDS"; }, 1800);
          return true;
        } catch (error) {
          if (button) button.textContent = "TRY AGAIN";
          setTimeout(() => { if (button) button.textContent = original || "REFRESH WORDS"; }, 1800);
          return false;
        } finally {
          if (button) button.disabled = false;
        }
      }

      function isGameKey(key) {
        return RIBBIT_GAME_KEY.test(String(key || ""));
      }

      function patchStorage() {
        if (typeof Storage === "undefined" || nativeSetItem) return;
        nativeSetItem = Storage.prototype.setItem;
        nativeRemoveItem = Storage.prototype.removeItem;
        nativeClear = Storage.prototype.clear;
        Storage.prototype.setItem = function patchedRibbitSetItem(key, value) {
          nativeSetItem.call(this, key, value);
          if (this === localStorage && isGameKey(key) && !hydrating) {
            deletedGameKeys.delete(String(key));
            markDirty(String(key));
          }
        };
        Storage.prototype.removeItem = function patchedRibbitRemoveItem(key) {
          const normalizedKey = String(key || "");
          nativeRemoveItem.call(this, key);
          if (this === localStorage && isGameKey(normalizedKey) && !hydrating) {
            deletedGameKeys.add(normalizedKey);
            markDirty(normalizedKey);
          }
        };
        Storage.prototype.clear = function patchedRibbitClear() {
          const removedGameKeys = [];
          if (this === localStorage) {
            try {
              for (let index = 0; index < localStorage.length; index += 1) {
                const key = localStorage.key(index);
                if (key && isGameKey(key)) removedGameKeys.push(key);
              }
            } catch (_) {}
          }
          nativeClear.call(this);
          if (this === localStorage && removedGameKeys.length && !hydrating) {
            removedGameKeys.forEach((key) => deletedGameKeys.add(key));
            markDirty("ribbitRaceClear");
          }
        };
      }

      function collectSaveData() {
        const save = {};
        try {
          for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (!key || !isGameKey(key)) continue;
            const value = localStorage.getItem(key);
            if (value !== null) save[key] = value;
          }
        } catch (_) {}
        // A schema marker lets future builds migrate saves without discarding old keys.
        save.ribbitRaceCloudSaveSchema = String(RIBBIT_CLOUD_SAVE_SCHEMA_VERSION);
        return save;
      }

      function clearGameData() {
        hydrating = true;
        try {
          const keys = [];
          for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (key && isGameKey(key)) keys.push(key);
          }
          keys.forEach((key) => nativeRemoveItem.call(localStorage, key));
        } finally {
          hydrating = false;
        }
      }

      async function returnToCloudLogin(saveFirst = false) {
        // Lock and hide the runtime immediately so no game listener can consume
        // keystrokes while the server confirms the logout.
        setGameInputLocked(true);
        onlineIdentityGeneration++;
        try { window.RibbitRaceCancelOnlineActivities?.(); }
        catch (error) { console.warn("Online cleanup during sign out failed", error); }

        if (saveFirst && !guestMode && sessionToken) {
          try { await flushSave(true); }
          catch (_) { /* Signing out must remain available when a save retry fails. */ }
        }

        try {
          const result = await serverCall("apiLogout", { sessionToken: sessionToken || onlineGuestToken });
          if (!result?.ok) throw new Error(result?.message || "The server did not confirm sign out.");
        } catch (error) {
          elements["leaderboard-overlay"].hidden = true;
          elements["cloud-account-panel"].hidden = true;
          elements["cloud-account-button"].hidden = true;
          showView("login");
          setBusy(false);
          setMessage(`SIGN OUT WAS NOT CONFIRMED: ${error.message || error}`, true);
          elements["cloud-gate"].hidden = false;
          requestAnimationFrame(() => elements["cloud-login-id"]?.focus({ preventScroll: true }));
          return false;
        }

        clearTimeout(saveTimer);
        clearTimeout(retryTimer);
        clearInterval(periodicTimer);
        saveTimer = null;
        retryTimer = null;
        periodicTimer = null;
        saveDueAt = 0;

        pendingAuth = null;
        pendingCreatedAuth = null;
        sessionToken = "";
        onlineGuestToken = "";
        onlineGuestRequest = null;
        studentId = "";
        playerName = "";
        classPeriod = "";
        guestMode = false;
        revision = 0;
        dirty = false;
        saving = false;
        leaderboardRows = [];
        leaderboardPage = 0;
        leaderboardBaselineReady = false;
        leaderboardRelevantDirty = false;
        deletedGameKeys.clear();

        clearGameData();
        elements["leaderboard-overlay"].hidden = true;
        elements["cloud-account-panel"].hidden = true;
        elements["cloud-account-button"].hidden = true;
        elements["cloud-status-pill"]?.classList.remove("show");
        elements["cloud-login-pin"].value = "";
        elements["cloud-create-pin"].value = "";
        elements["cloud-create-pin-confirm"].value = "";
        showView("login");
        setBusy(false);
        setMessage("", false);
        elements["cloud-gate"].hidden = false;

        // A fresh document is the exact same state as opening the site for the
        // first time. It also discards every old game/menu event listener.
        window.RibbitAuthScreen?.reloadToInitialLogin();
        return true;
      }

      function parseCloudJson(value, fallback) {
        try { return JSON.parse(String(value ?? "")); }
        catch (_) { return fallback; }
      }

      function sanitizeSaveDataForStartup(saveData) {
        const source = saveData && typeof saveData === "object" && !Array.isArray(saveData) ? saveData : {};
        const clean = {};
        const arrayKeys = new Set([
          "ribbitRaceUnlockedFrogSkins", "ribbitRaceUnlockedLevelsV1",
          "ribbitRaceEarnedPvpAchievementsV1", "ribbitRaceEarnedAchievementsV1",
          "ribbitRaceCustomFrogHatsV1", "ribbitRaceCustomFrogSlotUnlocksV1"
        ]);
        const objectKeys = new Set([
          "ribbitRaceStatsV1", "ribbitRaceCustomFrogColors",
          "ribbitRaceLeaderboardFirstPlaceNoticesV1", "ribbitRaceFrogHatAssignmentsV1", "ribbitRaceLanguageModeV1", "ribbitRaceHatProgressV2"
        ]);
        const numericKeys = /^(?:ribbitRaceTotal|ribbitRacePvpMatchWins$|ribbitRaceFewestJumps:|ribbitRaceBestEndlessFlies:|ribbitRaceBest:|oneButtonFrogBest(?::|$))/;
        for (const [rawKey, rawValue] of Object.entries(source)) {
          const key = String(rawKey || "");
          if (!isGameKey(key)) continue;
          const stringValue = typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue);
          if (stringValue.length > 500000) continue;
          if (arrayKeys.has(key)) {
            const parsed = parseCloudJson(stringValue, []);
            clean[key] = JSON.stringify(Array.isArray(parsed) ? parsed : []);
          } else if (key === "ribbitRaceCustomFrogSlots") {
            const parsed = parseCloudJson(stringValue, []);
            clean[key] = JSON.stringify(Array.isArray(parsed) ? parsed.slice(0, 3) : []);
          } else if (objectKeys.has(key)) {
            const parsed = parseCloudJson(stringValue, {});
            clean[key] = JSON.stringify(parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {});
          } else if (numericKeys.test(key)) {
            const numeric = Number(stringValue);
            clean[key] = String(Number.isFinite(numeric) && numeric >= 0 ? numeric : 0);
          } else {
            clean[key] = String(rawValue ?? "");
          }
        }
        return clean;
      }

      function applySaveData(saveData) {
        hydrating = true;
        try {
          clearGameData();
          const safeData = sanitizeSaveDataForStartup(saveData);
          Object.entries(safeData).forEach(([key, value]) => {
            if (isGameKey(key)) nativeSetItem.call(localStorage, key, String(value));
          });
          deletedGameKeys.clear();
          mutationVersion = 0;
        } finally {
          hydrating = false;
        }
      }

      function parseArray(value) {
        try { const parsed = JSON.parse(String(value || "[]")); return Array.isArray(parsed) ? parsed : []; }
        catch (_) { return []; }
      }

      function minPositive(first, second) {
        const a = Number(first); const b = Number(second);
        const validA = Number.isFinite(a) && a > 0;
        const validB = Number.isFinite(b) && b > 0;
        if (validA && validB) return String(Math.min(a, b));
        if (validA) return String(a);
        if (validB) return String(b);
        return String(second ?? first ?? "");
      }

      function maxNumber(first, second) {
        const a = Number(first); const b = Number(second);
        return String(Math.max(Number.isFinite(a) ? a : 0, Number.isFinite(b) ? b : 0));
      }

      function mergeStats(remoteValue, localValue) {
        let remote = {}; let local = {};
        try { remote = JSON.parse(remoteValue || "{}"); } catch (_) {}
        try { local = JSON.parse(localValue || "{}"); } catch (_) {}
        const merged = { ...remote, ...local };
        const maxFields = ["distanceJumpedPx", "perfectJumps", "maxFliesOneJump", "totalWins", "longestAirTime", "wrongFlies", "wallBounces", "bonusFinishes", "maxFinalScore", "pvpBonksDealt", "pvpTimesBonked", "pvpBounces", "pvpMatchWins"];
        maxFields.forEach((key) => { merged[key] = Math.max(Number(remote[key]) || 0, Number(local[key]) || 0); });
        return JSON.stringify(merged);
      }

      function mergeSaveData(remoteSave, localSave, deletedKeys = []) {
        const remote = remoteSave && typeof remoteSave === "object" ? remoteSave : {};
        const local = localSave && typeof localSave === "object" ? localSave : {};
        const merged = { ...remote, ...local };
        const allKeys = new Set([...Object.keys(remote), ...Object.keys(local)]);

        allKeys.forEach((key) => {
          const remoteArray = parseArray(remote[key]);
          const localArray = parseArray(local[key]);
          if (/(Achievement|Unlocked)/i.test(key) && (remoteArray.length || localArray.length)) {
            merged[key] = JSON.stringify([...new Set(remoteArray.concat(localArray).map(String))]);
            return;
          }
          if (/^ribbitRaceTotal/i.test(key) || /(?:Unlocked|UnlockAll)$/.test(key)) {
            merged[key] = maxNumber(remote[key], local[key]);
            return;
          }
          // Endless scores are records where the larger value wins. Handle
          // them before the generic Best/Fewest minimum-record merge below.
          if (/^ribbitRaceBestEndlessFlies:/i.test(key)) {
            merged[key] = maxNumber(remote[key], local[key]);
            return;
          }
          if (/^ribbitRacePvpMatchWins$/i.test(key)) {
            merged[key] = maxNumber(remote[key], local[key]);
            return;
          }
          if (/Best|Fewest/i.test(key)) {
            const a = Number(remote[key]);
            const b = Number(local[key]);
            if ((Number.isFinite(a) && a > 0) || (Number.isFinite(b) && b > 0)) {
              merged[key] = minPositive(remote[key], local[key]);
            }
          }
        });

        if (remote.ribbitRaceStatsV1 || local.ribbitRaceStatsV1) {
          merged.ribbitRaceStatsV1 = mergeStats(remote.ribbitRaceStatsV1, local.ribbitRaceStatsV1);
        }
        deletedKeys.forEach((key) => delete merged[String(key)]);
        merged.ribbitRaceCloudSaveSchema = String(RIBBIT_CLOUD_SAVE_SCHEMA_VERSION);
        return merged;
      }

      function markDirty(key) {
        if (!sessionToken || guestMode || hydrating || playtestPaused) return;
        mutationVersion += 1;
        dirty = true;
        if (/Best|Fewest|TotalFliesEaten|PvpMatchWins/i.test(String(key || ""))) leaderboardRelevantDirty = true;
        const urgent = /Best|Fewest|Unlocked|Achievement|FrogSkin|Custom|TimeSelect|Cheat|PvpMatchWins/i.test(key);
        scheduleSave(urgent ? 1400 : 7000);
      }

      function scheduleSave(delayMs) {
        if (playtestPaused || guestMode || onlineRealtimeActive) return;
        const due = Date.now() + Math.max(1000, delayMs);
        if (saveTimer && saveDueAt <= due) return;
        clearTimeout(saveTimer);
        saveDueAt = due;
        saveTimer = setTimeout(() => flushSave(), Math.max(0, due - Date.now()));
      }

      async function flushSave(force = false, conflictRetry = false) {
        if (onlineRealtimeActive && !force) return false;
        if (playtestPaused || guestMode || !sessionToken || saving || (!dirty && !force)) return false;
        saving = true;
        clearTimeout(saveTimer);
        saveTimer = null;
        const snapshot = collectSaveData();
        const deletedSnapshot = [...deletedGameKeys];
        const mutationAtStart = mutationVersion;
        const finishSuccessfulSave = (result) => {
          revision = Number(result.revision) || revision + 1;
          deletedSnapshot.forEach((key) => deletedGameKeys.delete(key));
          dirty = mutationVersion !== mutationAtStart;
          leaderboardRows = [];
          setStatus("CLOUD SAVED");
          const shouldCheckLeaderboard = leaderboardRelevantDirty;
          leaderboardRelevantDirty = false;
          if (shouldCheckLeaderboard) setTimeout(() => syncLeaderboardFirstPlaceNotices(true), 350);
          if (dirty) scheduleSave(1200);
          return true;
        };
        try {
          const result = await serverCall("apiSave", {
            sessionToken,
            baseRevision: revision,
            saveData: snapshot,
            deletedKeys: deletedSnapshot,
            saveSchemaVersion: RIBBIT_CLOUD_SAVE_SCHEMA_VERSION,
            clientVersion: RIBBIT_CLOUD_CLIENT_VERSION
          });
          if (result && result.ok) return finishSuccessfulSave(result);
          if (result && result.code === "REVISION_CONFLICT" && !conflictRetry) {
            const merged = mergeSaveData(result.saveData || {}, snapshot, deletedSnapshot);
            revision = Number(result.revision) || 0;
            const retry = await serverCall("apiSave", {
              sessionToken,
              baseRevision: revision,
              saveData: merged,
              deletedKeys: deletedSnapshot,
              saveSchemaVersion: RIBBIT_CLOUD_SAVE_SCHEMA_VERSION,
              clientVersion: RIBBIT_CLOUD_CLIENT_VERSION
            });
            if (retry && retry.ok) return finishSuccessfulSave(retry);
          }
          if (result && result.code === "SESSION_EXPIRED") {
            elements["cloud-gate"].hidden = false;
            showView("login");
            setMessage("Your cloud session expired. Sign in again to continue saving.");
            return false;
          }
          throw new Error(result && result.message ? result.message : "Cloud save failed.");
        } catch (_) {
          dirty = true;
          clearTimeout(retryTimer);
          retryTimer = setTimeout(() => flushSave(), 15000 + Math.floor(Math.random() * 10000));
          return false;
        } finally {
          saving = false;
        }
      }

      function beginPlaytestSession() {
        try { window.RibbitPlaytestGuard?.begin?.(); } catch (_) {}
        if (!playtestPaused) {
          dirtyBeforePlaytest = dirty;
          playtestPaused = true;
          clearTimeout(saveTimer);
          clearTimeout(retryTimer);
          saveTimer = null;
          retryTimer = null;
          saveDueAt = 0;
        }
        return collectSaveData();
      }

      function restorePlaytestSnapshot(snapshot) {
        applySaveData(snapshot || {});
      }

      function endPlaytestSession() {
        try { window.RibbitPlaytestGuard?.finish?.(); } catch (_) {}
        playtestPaused = false;
        dirty = dirtyBeforePlaytest;
        dirtyBeforePlaytest = false;
        if (dirty) scheduleSave(1200);
      }

      function isPlaytestSessionActive() {
        return playtestPaused;
      }

      function updateAccountUi() {
        elements["cloud-account-name"].textContent = playerName || (guestMode ? "GUEST" : "—");
        elements["cloud-account-period"].textContent = classPeriod ? formatPeriod(classPeriod) : (guestMode ? "GUEST MODE" : "—");
        elements["cloud-account-button"].textContent = playerName || (guestMode ? "GUEST" : "CLOUD");
        elements["cloud-account-button"].hidden = false;
        elements["cloud-save-now"].hidden = guestMode;
        elements["cloud-leaderboard"].hidden = guestMode;
        elements["cloud-sign-out"].textContent = guestMode ? "RETURN TO SIGN IN" : "SIGN OUT";
      }

      function beginAuthenticatedGame(response) {
        onlineIdentityGeneration++; onlineGuestToken=""; onlineGuestRequest=null;
        pendingAuth = null;
        sessionToken = response.sessionToken;
        studentId = response.studentId || response.playerCode;
        playerName = response.name || response.displayName || "";
        classPeriod = response.classPeriod || "";
        guestMode = false;
        revision = Number(response.revision) || 0;
        autosaveSeconds = Math.max(30, Number(response.autosaveSeconds) || autosaveSeconds);
        if (Array.isArray(response.classPeriods) && response.classPeriods.length) {
          classPeriods = response.classPeriods.map(String);
          populatePeriodSelect(elements["cloud-create-period"]);
          populatePeriodSelect(elements["cloud-profile-period"], classPeriod);
          populateLeaderboardScopeOptions(elements["leaderboard-scope"]?.value || "myclass");
        }
        setCloudVocabulary(response.vocabulary, response.vocabularySource);

        // Important: initialize the game engine against a clean/default storage
        // surface BEFORE hydrating a student's cloud save. Older saves can contain
        // values from previous builds that are valid cloud data but unsafe to read
        // during module initialization. Hydrating after the runtime exists lets the
        // defensive readers and runtime refresh migrate those values safely instead
        // of aborting the entire login with a black screen.
        const cloudSaveData = sanitizeSaveDataForStartup(response.saveData || {});
        leaderboardBaselineReady = false;
        updateAccountUi();

        if (!gameStarted) {
          applySaveData({});
          try {
            startRibbitRaceGame();
            gameStarted = true;
          } catch (error) {
            gameStarted = false;
            console.error("Ribbit Race clean startup failed", error);
            elements["cloud-gate"].hidden = false;
            showView("login");
            const detail = error && error.message ? ` (${error.message})` : "";
            setMessage(`Ribbit Race could not start${detail}. Your cloud data has not been changed.`);
            return;
          }
        }

        // Apply the real cloud save only after all runtime objects/functions exist.
        // A bad legacy field can no longer prevent the canvas from starting.
        applySaveData(cloudSaveData);
        dirty = false;

        if (typeof window.RibbitRaceRefreshRuntimeFromStorage === "function") {
          try {
            window.RibbitRaceRefreshRuntimeFromStorage();
          } catch (error) {
            // Keep the game playable even when one legacy progress field cannot be
            // migrated. The cloud copy remains untouched and future saves merge the
            // successfully loaded values rather than wiping the account.
            console.warn("Ribbit Race cloud runtime hydration skipped a legacy value", error);
            try {
              game.state = "main";
              game.mainSelection = "solo";
              game.mainFocusVisible = false;
              drawScene();
              canvas.focus();
            } catch (fallbackError) {
              console.warn("Ribbit Race hydration fallback draw failed", fallbackError);
            }
          }
        }

        setGameInputLocked(false);
        elements["cloud-gate"].hidden = true;
        requestAnimationFrame(() => document.getElementById("game")?.focus({ preventScroll: true }));
        setMessage("", false);
        setTimeout(() => syncLeaderboardFirstPlaceNotices(false), 900);
        clearInterval(periodicTimer);
        periodicTimer = setInterval(() => { if (dirty) flushSave(); }, autosaveSeconds * 1000);
      
    setTimeout(() => {
      if (window.RibbitApplyPendingGuestSave?.()) {
        try { flushSave(true); } catch (_) {}
      }
      window.dispatchEvent(new Event("rr-authenticated"));
    }, 0);
}

      function handleAuthResponse(response) {
        if (Array.isArray(response.classPeriods) && response.classPeriods.length) classPeriods = response.classPeriods.map(String);
        if (!response.profileComplete) {
          pendingAuth = response;
          sessionToken = response.sessionToken;
          studentId = response.studentId || response.playerCode;
          elements["cloud-profile-name"].value = response.name || response.displayName || "";
          populatePeriodSelect(elements["cloud-profile-period"], response.classPeriod || "");
          populateLeaderboardScopeOptions(elements["leaderboard-scope"]?.value || "myclass");
          showView("profile");
          return;
        }
        beginAuthenticatedGame(response);
      }

      async function login() {
        const username=elements['cloud-login-id'].value.trim(),pin=elements['cloud-login-pin'].value.trim();
        if(!username||!/^\d{4}$/.test(pin)){setMessage('Enter your username and 4-digit PIN.');return;}
        setBusy(true);setMessage('LOADING YOUR SAVE...',false);
        try{const r=await serverCall('apiLogin',{username,pin});if(!r?.ok)throw new Error(r?.message||'Sign in failed.');
          elements['cloud-login-pin'].value='';handleAuthResponse(r);
        }catch(e){setMessage(e.message);}finally{setBusy(false);}
      }

      async function createPlayer() {
        const username=elements['cloud-create-name'].value.trim(),pin=elements['cloud-create-pin'].value.trim(),confirmPin=elements['cloud-create-pin-confirm'].value.trim();
        if(!/^[\p{L}\p{N}_-]{3,20}$/u.test(username)){setMessage('Use 3–20 letters, numbers, _ or - for your username.');return;}
        if(!/^\d{4}$/.test(pin)){setMessage('Choose exactly four numbers for your PIN.');return;}
        if(pin!==confirmPin){setMessage('The two PIN entries do not match.');return;}
        setBusy(true);setMessage('CREATING YOUR FRIENDS SAVE...',false);
        try{const r=await serverCall('apiCreatePlayer',{username,pin});if(!r?.ok)throw new Error(r?.message||'Could not create save.');
          // A new Friends account always receives the Solo tutorial, even when
          // this browser has already completed training on a different account.
          try {
            localStorage.removeItem('rrFriendsEngineTutorialSoloSeenV8');
            sessionStorage.setItem('rrForceSoloTutorialAfterSignup','1');
            document.body.classList.add('rr-tutorial-pending');
          } catch (_) {}
          pendingCreatedAuth=r;elements['cloud-created-name'].textContent=r.name;showView('created');
        }catch(e){setMessage(e.message);}finally{setBusy(false);}
      }

      async function saveProfile() {
        if (!pendingAuth || !pendingAuth.sessionToken) return;
        const name = elements["cloud-profile-name"].value.trim();
        const period = elements["cloud-profile-period"].value;
        if (name.length < 2) { setMessage("Enter your name."); return; }
        if (!period) { setMessage("Reopen your Friends account."); return; }
        setBusy(true); setMessage("SAVING PROFILE…", false);
        try {
          const result = await serverCall("apiUpdateProfile", { sessionToken: pendingAuth.sessionToken, name, classPeriod: period });
          if (!result || !result.ok) throw new Error(result && result.message ? result.message : "Profile update failed.");
          beginAuthenticatedGame(result);
        } catch (error) { setMessage(error.message || String(error)); }
        finally { setBusy(false); }
      }

      async function playAsGuest() {
        onlineIdentityGeneration++;
        onlineGuestToken = ""; onlineGuestRequest = null;
        try{const r=await serverCall('apiOnlineGuestSession',{});if(r?.ok)onlineGuestToken=r.guestToken||'';}catch(_){}
        guestMode = true;
        sessionToken = "";
        studentId = "";
        playerName = "GUEST";
        classPeriod = "";
        revision = 0;
        dirty = false;
        clearGameData();
        updateAccountUi();
        if (!gameStarted) {
          try {
            startRibbitRaceGame();
            gameStarted = true;
          } catch (error) {
            gameStarted = false;
            console.error("Ribbit Race guest startup failed", error);
            elements["cloud-gate"].hidden = false;
            showView("login");
            setMessage("Ribbit Race could not start. Refresh the page and try again.");
            return;
          }
        } else if (typeof window.RibbitRaceRefreshRuntimeFromStorage === "function") {
          try { window.RibbitRaceRefreshRuntimeFromStorage(); }
          catch (error) { console.warn("Guest runtime refresh failed", error); }
        }
        setGameInputLocked(false);
        elements["cloud-gate"].hidden = true;
        requestAnimationFrame(() => document.getElementById("game")?.focus({ preventScroll: true }));
        setTimeout(() => window.dispatchEvent(new Event("rr-authenticated")), 0);
      }

      function readLeaderboardRecordDate(levelId = "park") {
        try {
          return localStorage.getItem(`ribbitRaceRecordDate:${levelId}`) ||
            localStorage.getItem("ribbitRaceRecordDate:last") || "";
        } catch (_) {
          return "";
        }
      }

      function readLeaderboardEndlessRecordDate(levelId = "park") {
        try {
          return localStorage.getItem(`ribbitRaceEndlessRecordDate:${levelId}`) || "";
        } catch (_) {
          return "";
        }
      }

      function formatLeaderboardValue(value, metric) {
        if (value === null || value === undefined || value === "") return "—";
        if (metric === "time") {
          const seconds = Number(value);
          if (!Number.isFinite(seconds) || seconds <= 0) return "—";
          const minutes = Math.floor(seconds / 60);
          const remainder = (seconds - minutes * 60).toFixed(1).padStart(4, "0");
          return `${String(minutes).padStart(2, "0")}:${remainder}`;
        }
        if (metric === "jumps") return `${Math.floor(Number(value))} JUMPS`;
        if (metric === "pvpwins") { const wins = Math.floor(Number(value)); return `${wins} ${wins === 1 ? "WIN" : "WINS"}`; }
        return `${Math.floor(Number(value))} FLIES`;
      }

      function getLeaderboardRecordForEntry(entry, metric, requestedLevel) {
        if (metric === "flies") {
          return {
            score: Number(entry.totalFlies) || 0,
            level: "ALL",
            date: entry.lastUpdated || entry.resultDate || (entry.isCurrent ? readLeaderboardRecordDate("park") : "")
          };
        }
        if (metric === "pvpwins") {
          return {
            score: Number(entry.pvpMatchWins) || 0,
            level: "ALL",
            date: entry.lastUpdated || entry.resultDate || ""
          };
        }
        const records = entry && entry.records && typeof entry.records === "object" ? entry.records : {};
        const candidateLevels = requestedLevel === "any"
          ? ["park", "swamp", "jungle", "pond", "lake", "garden"]
          : [requestedLevel];
        const higherIsBetter = metric === "endless";
        let best = null;
        candidateLevels.forEach((levelId) => {
          const record = records[levelId] || {};
          const value = Number(record[metric]);
          if (!Number.isFinite(value) || value <= 0) return;
          const isBetter = !best || (higherIsBetter ? value > best.score : value < best.score);
          if (isBetter) {
            best = {
              score: value,
              level: levelId,
              date: metric === "endless"
                ? (record.endlessDate || entry.lastUpdated || entry.resultDate || (entry.isCurrent ? readLeaderboardEndlessRecordDate(levelId) : ""))
                : (record.date || entry.lastUpdated || entry.resultDate || (entry.isCurrent ? readLeaderboardRecordDate(levelId) : ""))
            };
          }
        });
        return best || { score: null, level: requestedLevel === "any" ? "—" : requestedLevel, date: "" };
      }

      function getSortedLeaderboardRows() {
        const scope = elements["leaderboard-scope"].value;
        const metric = elements["leaderboard-metric"].value;
        const level = elements["leaderboard-level"].value;
        const filtered = leaderboardRows.filter((entry) => {
          if (scope === "school") return true;
          if (scope === "myclass") return entry.classPeriod === classPeriod;
          return String(entry.classPeriod || "") === scope;
        });
        const rows = filtered.map((entry) => {
          const record = getLeaderboardRecordForEntry(entry, metric, level);
          return {
            ...entry,
            score: record.score,
            resultLevel: record.level,
            resultDate: record.date
          };
        });
        rows.sort((a, b) => {
          const aMissing = a.score === null;
          const bMissing = b.score === null;
          if (aMissing !== bMissing) return aMissing ? 1 : -1;
          if (!aMissing && a.score !== b.score) return (metric === "flies" || metric === "endless" || metric === "pvpwins") ? b.score - a.score : a.score - b.score;
          return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        });
        let lastScore = null;
        let lastRank = 0;
        rows.forEach((entry, index) => {
          if (entry.score === null) entry.rank = null;
          else if (lastScore !== null && entry.score === lastScore) entry.rank = lastRank;
          else { entry.rank = index + 1; lastRank = entry.rank; lastScore = entry.score; }
        });
        return rows;
      }

      function renderLeaderboard() {
        const metric = elements["leaderboard-metric"].value;
        const level = elements["leaderboard-level"].value;
        const scope = elements["leaderboard-scope"].value;
        const table = elements["leaderboard-table"];
        const theadRow = table?.querySelector("thead tr");
        const fliesMetric = metric === "flies";
        const endlessMetric = metric === "endless";
        const pvpWinsMetric = metric === "pvpwins";
        elements["leaderboard-level-wrap"].style.visibility = (fliesMetric || pvpWinsMetric) ? "hidden" : "visible";
        // Keep one fixed six-column layout for every metric. Total lifetime
        // flies are stage-agnostic, while Endless records retain stage sorting.
        if (table) table.className = "leaderboard-metric-default";
        if (theadRow) {
          theadRow.innerHTML = "<th>RANK</th><th>NAME</th><th>PERIOD</th><th>LEVEL</th><th>RESULT</th><th>DATE</th>";
        }
        const rows = getSortedLeaderboardRows();
        const pageCount = Math.max(1, Math.ceil(rows.length / leaderboardPageSize));
        leaderboardPage = Math.min(leaderboardPage, pageCount - 1);
        const start = leaderboardPage * leaderboardPageSize;
        const visible = rows.slice(start, start + leaderboardPageSize);
        elements["leaderboard-body"].textContent = "";
        visible.forEach((entry) => {
          const tr = document.createElement("tr");
          if (entry.isCurrent) tr.className = "current-player";
          const values = (fliesMetric || pvpWinsMetric)
            ? [
                entry.rank || "—",
                formatLeaderboardName(entry.name),
                formatPeriod(entry.classPeriod),
                "-",
                formatLeaderboardValue(entry.score, metric),
                fliesMetric ? "-" : formatLeaderboardDate(entry.resultDate)
              ]
            : [
                entry.rank || "—",
                formatLeaderboardName(entry.name),
                formatPeriod(entry.classPeriod),
                entry.resultLevel === "ALL" ? "ALL" : String(entry.resultLevel || "—").toUpperCase(),
                formatLeaderboardValue(entry.score, metric),
                formatLeaderboardDate(entry.resultDate)
              ];
          values.forEach((value) => {
            const td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(td);
          });
          elements["leaderboard-body"].appendChild(tr);
        });
        elements["leaderboard-empty"].hidden = rows.length !== 0;
        elements["leaderboard-page"].textContent = `${leaderboardPage + 1} / ${pageCount}`;
        elements["leaderboard-prev"].disabled = leaderboardPage <= 0;
        elements["leaderboard-next"].disabled = leaderboardPage >= pageCount - 1;
        const metricLabel = fliesMetric
          ? "MOST FLIES EATEN"
          : pvpWinsMetric
            ? "MOST PVP WINS"
            : endlessMetric
              ? `60 SECONDS ENDLESS • ${level === "any" ? "ANY LEVEL" : level.toUpperCase()}`
              : `${metric === "time" ? "FASTEST TIME" : "FEWEST JUMPS"} • ${level === "any" ? "ANY LEVEL" : level.toUpperCase()}`;
        const scopeLabel = scope === "school" ? "ALL PLAYERS" : scope === "myclass" ? "ALL PLAYERS" : formatPeriod(scope);
        elements["leaderboard-context"].textContent = `${scopeLabel} • ${metricLabel} • ${rows.length} PLAYERS`;
      }

      function readLeaderboardFirstPlaceNotices() {
        try {
          const parsed = JSON.parse(localStorage.getItem(LEADERBOARD_FIRST_PLACE_NOTICE_KEY) || "{}");
          return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
        } catch (_) {
          return {};
        }
      }

      function writeLeaderboardFirstPlaceNotices(value) {
        const previousHydrating = hydrating;
        hydrating = true;
        try {
          const payload = JSON.stringify(value || {});
          if (nativeSetItem) nativeSetItem.call(localStorage, LEADERBOARD_FIRST_PLACE_NOTICE_KEY, payload);
          else localStorage.setItem(LEADERBOARD_FIRST_PLACE_NOTICE_KEY, payload);
        } catch (_) {
          // A missed notice is preferable to disrupting gameplay or cloud saving.
        } finally {
          hydrating = previousHydrating;
        }
      }

      function collectCurrentFirstPlaceRecords(entries) {
        const allEntries = Array.isArray(entries) ? entries.filter(Boolean) : [];
        const current = allEntries.find((entry) => entry && entry.isCurrent);
        if (!current) return {};
        const records = {};
        const levels = ["park", "swamp", "jungle", "pond", "lake", "garden"];
        const scopes = [{id:'school',label:'ALL PLAYERS',entries:allEntries}];

        scopes.forEach((scope) => {
          if (!scope.entries.length) return;
          ["time", "jumps"].forEach((metric) => {
            levels.forEach((levelId) => {
              const values = scope.entries
                .map((entry) => Number(entry?.records?.[levelId]?.[metric]))
                .filter((value) => Number.isFinite(value) && value > 0);
              const currentValue = Number(current?.records?.[levelId]?.[metric]);
              if (!values.length || !Number.isFinite(currentValue) || currentValue <= 0) return;
              const best = Math.min(...values);
              if (Math.abs(currentValue - best) <= 0.0001) {
                const key = `${scope.id}:${metric}:${levelId}`;
                records[key] = {
                  signature: `${currentValue.toFixed(metric === "time" ? 3 : 0)}`,
                  scope: scope.id,
                  scopeLabel: scope.label,
                  metric,
                  level: levelId,
                  score: currentValue
                };
              }
            });
          });

          levels.forEach((levelId) => {
            const values = scope.entries
              .map((entry) => Number(entry?.records?.[levelId]?.endless))
              .filter((value) => Number.isFinite(value) && value > 0);
            const currentValue = Number(current?.records?.[levelId]?.endless);
            if (!values.length || !Number.isFinite(currentValue) || currentValue <= 0) return;
            const best = Math.max(...values);
            if (currentValue === best) {
              const key = `${scope.id}:endless:${levelId}`;
              records[key] = {
                signature: String(Math.floor(currentValue)),
                scope: scope.id,
                scopeLabel: scope.label,
                metric: "endless",
                level: levelId,
                score: currentValue
              };
            }
          });

          const flyValues = scope.entries.map((entry) => Number(entry?.totalFlies) || 0);
          const currentFlies = Number(current.totalFlies) || 0;
          if (currentFlies > 0 && flyValues.length && currentFlies === Math.max(...flyValues)) {
            const key = `${scope.id}:flies:all`;
            records[key] = {
              // Total-flies notifications track who holds first place, not the
              // leader's changing score. This prevents a new toast on every fly
              // while still allowing another notification after the player loses
              // first place and later takes it back.
              signature: "current-player-is-leader",
              scope: scope.id,
              scopeLabel: scope.label,
              metric: "flies",
              level: "all",
              score: currentFlies
            };
          }

          const pvpWinValues = scope.entries.map((entry) => Number(entry?.pvpMatchWins) || 0);
          const currentPvpWins = Number(current.pvpMatchWins) || 0;
          if (currentPvpWins > 0 && pvpWinValues.length && currentPvpWins === Math.max(...pvpWinValues)) {
            const key = `${scope.id}:pvpwins:all`;
            records[key] = {
              signature: String(Math.floor(currentPvpWins)),
              scope: scope.id,
              scopeLabel: scope.label,
              metric: "pvpwins",
              level: "all",
              score: currentPvpWins
            };
          }
        });
        return records;
      }

      async function syncLeaderboardFirstPlaceNotices(notify = false) {
        if (onlineRealtimeActive) return false;
        if (guestMode || !sessionToken) return false;
        if (notify && Date.now() - lastLeaderboardRecordCheckAt < 10000) return false;
        lastLeaderboardRecordCheckAt = Date.now();
        try {
          const result = await serverCall("apiGetLeaderboard", { sessionToken });
          if (!result || !result.ok) return false;
          const currentFirsts = collectCurrentFirstPlaceRecords(Array.isArray(result.entries) ? result.entries : []);
          const stored = readLeaderboardFirstPlaceNotices();
          const categoryKeys = ["school", "class"].flatMap((scope) => [
            `${scope}:flies:all`,
            `${scope}:pvpwins:all`,
            ...["time", "jumps", "endless"].flatMap((metric) => ["park", "swamp", "jungle", "pond", "lake", "garden"].map((level) => `${scope}:${metric}:${level}`))
          ]);
          if (!leaderboardBaselineReady) {
            categoryKeys.forEach((key) => {
              if (currentFirsts[key]) stored[key] = currentFirsts[key].signature;
              else delete stored[key];
            });
            writeLeaderboardFirstPlaceNotices(stored);
            leaderboardBaselineReady = true;
            return true;
          }
          categoryKeys.forEach((key) => {
            const record = currentFirsts[key];
            if (!record) {
              delete stored[key];
              return;
            }
            if (notify && stored[key] !== record.signature && typeof window.RibbitRaceQueueLeaderboardRecordNotification === "function") {
              window.RibbitRaceQueueLeaderboardRecordNotification(record);
            }
            stored[key] = record.signature;
          });
          writeLeaderboardFirstPlaceNotices(stored);
          return true;
        } catch (_) {
          return false;
        }
      }

      async function loadLeaderboard(force = false) {
        if (guestMode || !sessionToken) return false;
        elements["leaderboard-overlay"].hidden = false;
        elements["cloud-account-panel"].hidden = true;
        elements["leaderboard-context"].textContent = "LOADING…";
        if (leaderboardRows.length && !force) { renderLeaderboard(); return true; }
        try {
          const result = await serverCall("apiGetLeaderboard", { sessionToken });
          if (!result || !result.ok) throw new Error(result && result.message ? result.message : "Leaderboard failed to load.");
          leaderboardRows = Array.isArray(result.entries) ? result.entries : [];
          if (result.currentClassPeriod) classPeriod = String(result.currentClassPeriod);
          leaderboardPage = 0;
          renderLeaderboard();
          return true;
        } catch (error) {
          elements["leaderboard-context"].textContent = error.message || "LEADERBOARD UNAVAILABLE";
          return false;
        }
      }

      function closeLeaderboard() {
        elements["leaderboard-overlay"].hidden = true;
      }

      function bindUi() {
        elements["cloud-login-button"].addEventListener("click", login);
        [elements["cloud-login-id"], elements["cloud-login-pin"]].forEach((input) => {
          input.addEventListener("keydown", (event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            if (!elements["cloud-login-button"].disabled) login();
          });
        });
        elements["cloud-show-create"].addEventListener("click", () => {
          elements["cloud-create-name"].value = elements["cloud-login-id"].value;
          showView("create");
          elements["cloud-create-name"].focus();
        });
        elements["cloud-play-guest"].addEventListener("click", playAsGuest);
        elements["cloud-back-login"].addEventListener("click", () => showView("login"));
        elements["cloud-create-button"].addEventListener("click", createPlayer);
        elements["cloud-save-profile"].addEventListener("click", saveProfile);
        elements["cloud-profile-sign-out"].addEventListener("click", () => returnToCloudLogin(false));
        elements["cloud-created-continue"].addEventListener("click", () => {
          if (pendingCreatedAuth) {
            try {
              localStorage.removeItem('rrFriendsEngineTutorialSoloSeenV8');
              sessionStorage.setItem('rrForceSoloTutorialAfterSignup','1');
              document.body.classList.add('rr-tutorial-pending');
            } catch (_) {}
            beginAuthenticatedGame(pendingCreatedAuth);
          }
          pendingCreatedAuth = null;
        });
        elements["cloud-account-button"].addEventListener("click", () => {
          elements["cloud-account-panel"].hidden = !elements["cloud-account-panel"].hidden;
        });
        elements["cloud-save-now"].addEventListener("click", () => flushSave(true));
        elements["cloud-refresh-vocab"].addEventListener("click", refreshVocabulary);
        elements["cloud-leaderboard"].addEventListener("click", () => loadLeaderboard(false));
        elements["cloud-sign-out"].addEventListener("click", () => returnToCloudLogin(!guestMode));
        elements["leaderboard-close"].addEventListener("click", closeLeaderboard);
        elements["leaderboard-refresh"].addEventListener("click", () => loadLeaderboard(true));
        ["leaderboard-scope", "leaderboard-metric", "leaderboard-level"].forEach((id) => {
          elements[id].addEventListener("change", () => { leaderboardPage = 0; renderLeaderboard(); });
        });
        elements["leaderboard-prev"].addEventListener("click", () => { leaderboardPage = Math.max(0, leaderboardPage - 1); renderLeaderboard(); });
        elements["leaderboard-next"].addEventListener("click", () => { leaderboardPage += 1; renderLeaderboard(); });
        elements["leaderboard-overlay"].addEventListener("click", (event) => { if (event.target === elements["leaderboard-overlay"]) closeLeaderboard(); });
        document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !elements["leaderboard-overlay"].hidden) closeLeaderboard(); });
        document.addEventListener("visibilitychange", () => { if (document.hidden && dirty && !playtestPaused && !guestMode) flushSave(); });
        window.addEventListener("pagehide", () => { if (dirty && !playtestPaused && !guestMode) flushSave(true); });
      }

      async function bootstrap() {
        cacheElements();
        setGameInputLocked(true);
        document.getElementById('friends-manage').onclick=async()=>{if(!guestMode)await flushSave(true);window.open('/account.html','_blank','noopener');};
        patchStorage();
        bindUi();
        showView("login");
        setBusy(true);
        try {
          const result = await serverCall("apiBootstrap", {});
          if (!result || !result.ok) throw new Error(result && result.message ? result.message : "Server setup failed.");
          autosaveSeconds = Math.max(30, Number(result.autosaveSeconds) || 60);
          classPeriods = Array.isArray(result.classPeriods) && result.classPeriods.length ? result.classPeriods.map(String) : ["1", "2", "3", "4", "5", "6", "7"];
          populatePeriodSelect(elements["cloud-create-period"]);
          populatePeriodSelect(elements["cloud-profile-period"]);
          populateLeaderboardScopeOptions();
          setCloudVocabulary(result.vocabulary, result.vocabularySource);
          if(result.resume?.ok){handleAuthResponse(result.resume);return;}
          setMessage(result.message || "", false);
          setTimeout(() => { if (!sessionToken && !guestMode) setMessage(""); }, 3000);
        } catch (error) {
          setMessage((error.message || String(error)) + " You may still play without saving.");
        } finally {
          setBusy(false);
          elements["cloud-login-id"].focus();
        }
      }

      return {
        bootstrap,
        flushSave,
        beginPlaytestSession,
        restorePlaytestSnapshot,
        endPlaytestSession,
        isPlaytestSessionActive,
        isGameInputLocked: () => gameInputLocked,
        getVocabulary,
        refreshVocabulary,
        returnToCloudLogin,
        getLeaderboardData: async () => {
          if (guestMode || !sessionToken) return { ok:false, entries:[], message:"SIGN IN TO VIEW LEADERBOARD" };
          return serverCall("apiGetLeaderboard", { sessionToken });
        },
        createOnlineRoom: (payload = {}) => onlineCall("apiOnlineCreateRoom", payload),
        joinOnlineRoom: (payload = {}) => onlineCall("apiOnlineJoinRoom", payload),
        onlineExchange: (payload = {}) => onlineCall("apiOnlineExchange", payload),
        abortDirectRoom: (payload = {}) => onlineCall("apiOnlineDirectAbort", payload),
        leaveOnlineRoom: (payload = {}) => onlineCall("apiOnlineLeaveRoom", payload),
        finishOnlineMatch: (payload = {}) => onlineCall("apiOnlineFinishMatch", payload),
        onlineDiagnostic: () => serverCall("apiOnlineDiagnostic", {}),
        onlineProfile: (payload = {}) => onlineCall("apiOnlineProfile", payload),
        battleTags: () => onlineCall("apiOnlineBattleTags", {}),
        quickplayStatus: () => onlineCall("apiQuickplayStatus", {}),
        quickplayEnter: (payload = {}) => onlineCall("apiQuickplayEnter", payload),
        quickplayPoll: (payload = {}) => onlineCall("apiQuickplayPoll", payload),
        quickplayCancel: (payload = {}) => onlineCall("apiQuickplayCancel", payload),
        watchRooms: () => onlineCall("apiOnlineWatchList", {}),
        spectateRoom: (payload = {}) => onlineCall("apiOnlineSpectate", payload),
        setOnlineRealtimeActive: (active) => {
          onlineRealtimeActive = Boolean(active);
          if (onlineRealtimeActive) {
            clearTimeout(saveTimer); clearTimeout(retryTimer); saveTimer = null; retryTimer = null; saveDueAt = 0;
          } else if (dirty) scheduleSave(350);
        },
        getProfile: () => ({
          sessionGeneration: onlineIdentityGeneration,
          name: playerName || (guestMode ? "GUEST" : "PLAYER"),
          classPeriod: classPeriod || "",
          guestMode: Boolean(guestMode),
          signedIn: Boolean(sessionToken && !guestMode)
        })
      };
    })();
