export function flattenAlbumQuestions(albumData) {
  const list = [];
  albumData.tracks.forEach((track) => {
    if (!track.questions) return;
    track.questions.forEach((q) => {
      list.push({
        track,
        question: q,
        albumTitle: albumData.title,
        albumId: albumData.id,
        vocal: track.vocal || albumData.vocal,
        url: track.url || albumData.url,
      });
    });
  });
  return list;
}

export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildQuizQuestions({ mode, albumData, allAlbumsData, config }) {
  if (mode === 'random') {
    let allQuestions = [];
    allAlbumsData.forEach((album) => {
      allQuestions = allQuestions.concat(flattenAlbumQuestions(album));
    });
    allQuestions = shuffleArray(allQuestions);
    if (config?.limit && config.limit < allQuestions.length) {
      allQuestions = allQuestions.slice(0, config.limit);
    }
    return allQuestions;
  }
  // album mode — always shuffle
  return shuffleArray(flattenAlbumQuestions(albumData));
}
