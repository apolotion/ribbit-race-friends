// Save-schema-2 compatibility, ported from the current Direct Connect 2 build.
// This module has no school account, spreadsheet, or network access.
const RR={MAX_SAVE_ENTRIES:1000,SAVE_SCHEMA_VERSION:2,LEADERBOARD_LEVELS:['park','swamp','jungle','pond','lake','garden']};
const getRuntimeConfig_=()=>({maxSaveBytes:350000});
const Utilities={newBlob:v=>({getBytes:()=>new TextEncoder().encode(String(v))})};
function isRibbitSaveKey_(key) {
  return /^(?:ribbitRace|oneButtonFrog)/.test(String(key || ''));
}

function sanitizeSaveData_(saveData) {
  const config = getRuntimeConfig_();
  const source = saveData && typeof saveData === 'object' && !Array.isArray(saveData) ? saveData : {};
  const clean = {};
  let totalBytes = 2;
  const entries = Object.entries(source);
  if (entries.length > RR.MAX_SAVE_ENTRIES) throw new Error('Save contains too many entries.');

  entries.forEach(([rawKey, rawValue]) => {
    const key = String(rawKey || '');
    if (!isRibbitSaveKey_(key)) return;
    const value = typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue);
    if (key.length > 120 || value.length > 180000) throw new Error('A save entry is too large.');
    totalBytes += Utilities.newBlob(key + value).getBytes().length;
    if (totalBytes > config.maxSaveBytes) throw new Error('Save data exceeds the configured size limit.');
    clean[key] = value;
  });
  clean.ribbitRaceCloudSaveSchema = String(RR.SAVE_SCHEMA_VERSION);
  return clean;
}

function sanitizeDeletedKeys_(deletedKeys) {
  if (!Array.isArray(deletedKeys)) return [];
  return [...new Set(deletedKeys.map(String).filter(key => isRibbitSaveKey_(key) && key.length <= 120))].slice(0, RR.MAX_SAVE_ENTRIES);
}

function parseJsonArray_(value) {
  try {
    const parsed = JSON.parse(String(value || '[]'));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (_) {
    return [];
  }
}

function minPositiveString_(first, second) {
  const a = Number(first);
  const b = Number(second);
  const validA = Number.isFinite(a) && a > 0;
  const validB = Number.isFinite(b) && b > 0;
  if (validA && validB) return String(Math.min(a, b));
  if (validA) return String(a);
  if (validB) return String(b);
  return String(second == null ? (first == null ? '' : first) : second);
}

function maxNumberString_(first, second) {
  const a = Number(first);
  const b = Number(second);
  return String(Math.max(Number.isFinite(a) ? a : 0, Number.isFinite(b) ? b : 0));
}

function mergeStatsJson_(remoteValue, incomingValue) {
  let remote = {};
  let incoming = {};
  try { remote = JSON.parse(String(remoteValue || '{}')) || {}; } catch (_) {}
  try { incoming = JSON.parse(String(incomingValue || '{}')) || {}; } catch (_) {}
  const merged = Object.assign({}, remote, incoming);
  const cumulative = ['distanceJumpedPx', 'perfectJumps', 'maxFliesOneJump', 'totalWins', 'longestAirTime', 'wrongFlies', 'wallBounces', 'bonusFinishes', 'maxFinalScore', 'pvpBonksDealt', 'pvpTimesBonked', 'pvpBounces', 'pvpMatchWins'];
  cumulative.forEach(key => { merged[key] = Math.max(Number(remote[key]) || 0, Number(incoming[key]) || 0); });
  return JSON.stringify(merged);
}

function isDurableProgressKey_(key) {
  return /Achievement|Unlocked|CustomFrog|CustomColor|Best|Fewest|Total|Stats|FrogSkin|TimeSelect|PvpMatchWins|OnlineMatchIds/i.test(String(key || ''));
}

function mergePersistentSaveData_(existingSave, incomingSave, deletedKeys) {
  const existing = existingSave && typeof existingSave === 'object' ? existingSave : {};
  const incoming = incomingSave && typeof incomingSave === 'object' ? incomingSave : {};
  const merged = Object.assign({}, existing, incoming);
  const allKeys = [...new Set(Object.keys(existing).concat(Object.keys(incoming)))];

  allKeys.forEach(key => {
    const remoteArray = parseJsonArray_(existing[key]);
    const incomingArray = parseJsonArray_(incoming[key]);
    if (/(Achievement|Unlocked)/i.test(key) && (remoteArray.length || incomingArray.length)) {
      merged[key] = JSON.stringify([...new Set(remoteArray.concat(incomingArray))]);
      return;
    }
    if (/^ribbitRaceTotal/i.test(key) || /(?:Unlocked|UnlockAll)$/.test(key)) {
      merged[key] = maxNumberString_(existing[key], incoming[key]);
      return;
    }
    // Higher is better for Endless/PvP, unlike timed speed-run records.
    if (/^ribbitRaceBestEndlessFlies:|^ribbitRacePvpMatchWins$/i.test(key)) {
      merged[key] = maxNumberString_(existing[key], incoming[key]);
      return;
    }
    if (/Best|Fewest/i.test(key)) {
      const a = Number(existing[key]);
      const b = Number(incoming[key]);
      if ((Number.isFinite(a) && a > 0) || (Number.isFinite(b) && b > 0)) {
        merged[key] = minPositiveString_(existing[key], incoming[key]);
      }
    }
  });

  if (existing.ribbitRaceStatsV1 || incoming.ribbitRaceStatsV1) {
    merged.ribbitRaceStatsV1 = mergeStatsJson_(existing.ribbitRaceStatsV1, incoming.ribbitRaceStatsV1);
  }

  // The server owns this journal; delayed saves must not permit a second award.
  if (existing.ribbitRaceOnlineMatchIdsV1 || incoming.ribbitRaceOnlineMatchIdsV1) {
    merged.ribbitRaceOnlineMatchIdsV1 = existing.ribbitRaceOnlineMatchIdsV1 || '[]';
  }
  RR.LEADERBOARD_LEVELS.forEach(level => {
    const k = 'ribbitRaceBestEndlessFlies:' + level, d = 'ribbitRaceEndlessRecordDate:' + level;
    if (Number(existing[k]) >= Number(incoming[k] || 0) && existing[d]) merged[d] = existing[d];
  });
  (deletedKeys || []).forEach(key => {
    // A future patch may stop emitting an old progress key. Keep durable
    // achievements/unlocks/records unless a teacher deliberately resets the row.
    if (!isDurableProgressKey_(key)) delete merged[key];
  });
  merged.ribbitRaceCloudSaveSchema = String(RR.SAVE_SCHEMA_VERSION);
  return sanitizeSaveData_(merged);
}

function parseSaveJson_(value) {
  try {
    const parsed = JSON.parse(String(value || '{}'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

function summarizeSave_(save) {
  const stats = parseSaveJson_(save.ribbitRaceStatsV1);
  const pvpMatchWins = Math.max(positiveInteger_(save.ribbitRacePvpMatchWins), positiveInteger_(stats.pvpMatchWins));
  const totalFlies = positiveInteger_(save.ribbitRaceTotalFliesEaten);
  const totalJumps = positiveInteger_(save.ribbitRaceTotalJumps);
  const frogsUnlocked = Math.max(1, parseStringArray_(save.ribbitRaceUnlockedFrogSkins).length);
  const soloAchievements = parseStringArray_(save.ribbitRaceEarnedAchievementsV1);
  const pvpAchievements = parseStringArray_(save.ribbitRaceEarnedPvpAchievementsV1);
  const achievements = new Set(soloAchievements.concat(pvpAchievements)).size;
  const levelRecords = {};
  let fastest = Infinity;
  RR.LEADERBOARD_LEVELS.forEach((levelId) => {
    let time = positiveNumber_(save['oneButtonFrogBest:' + levelId]);
    if (!time && levelId === 'park') time = positiveNumber_(save.oneButtonFrogBest);
    if (!time) time = positiveNumber_(save['ribbitRaceBest:' + levelId]);
    const jumps = positiveIntegerOrBlank_(save['ribbitRaceFewestJumps:' + levelId]);
    levelRecords[levelId] = { time: time || null, jumps: jumps || null,
      endless: positiveInteger_(save['ribbitRaceBestEndlessFlies:' + levelId]) || null,
      date: String(save['ribbitRaceRecordDate:' + levelId] || ''),
      endlessDate: String(save['ribbitRaceEndlessRecordDate:' + levelId] || '') };
    if (time) fastest = Math.min(fastest, time);
  });
  return {
    totalFlies,
    pvpMatchWins,
    totalJumps,
    frogsUnlocked,
    achievements,
    fastestTime: Number.isFinite(fastest) ? fastest : '',
    levelRecords
  };
}

function positiveInteger_(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function positiveNumber_(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function positiveIntegerOrBlank_(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function parseStringArray_(value) {
  try {
    const parsed = JSON.parse(String(value || '[]'));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (error) {
    return [];
  }
}
export {sanitizeSaveData_,sanitizeDeletedKeys_,mergePersistentSaveData_,parseSaveJson_,summarizeSave_};
