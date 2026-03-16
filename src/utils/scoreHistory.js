const STORAGE_KEY = 'songQuizHistory';

function getDefaultHistory() {
  return { version: 1, albums: {}, random: null };
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultHistory();
    const data = JSON.parse(raw);
    if (data.version !== 1) return getDefaultHistory();
    return data;
  } catch {
    return getDefaultHistory();
  }
}

function save(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function saveResult(albumId, score, total) {
  const history = loadHistory();
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const prev = history.albums[albumId];
  const isNewRecord = !prev || pct > prev.bestPct;
  const prevBestPct = prev?.bestPct ?? null;

  if (isNewRecord) {
    history.albums[albumId] = {
      bestScore: score,
      bestTotal: total,
      bestPct: pct,
      attempts: (prev?.attempts || 0) + 1,
    };
  } else {
    prev.attempts += 1;
  }
  save(history);
  return { bestPct: history.albums[albumId].bestPct, prevBestPct, isNewRecord };
}

export function saveRandomResult(score, total) {
  const history = loadHistory();
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const prev = history.random;
  const isNewRecord = !prev || pct > prev.bestPct;
  const prevBestPct = prev?.bestPct ?? null;

  if (isNewRecord) {
    history.random = {
      bestScore: score,
      bestTotal: total,
      bestPct: pct,
      attempts: (prev?.attempts || 0) + 1,
    };
  } else {
    prev.attempts += 1;
  }
  save(history);
  return { bestPct: history.random.bestPct, prevBestPct, isNewRecord };
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
