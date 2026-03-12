import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const INPUT_FILE = 'サイトの内容.txt';
const ALBUMS_DIR = 'public/data/albums';
const ALBUMS_INDEX = 'public/data/albums.yaml';
const EXISTING_ALBUMS = ['dyj-01', 'dyj-03']; // 保護する既存アルバムID

// 正しいアルバム順序
const CORRECT_ORDER = [
  '宴', '趣', '謡', '廻', '憩', '遙', '綴', '彩', '騙', '辿／誘',
  '徒', '改', '薦', '望', '屠', '奉', '求', '喩', '密', '掲',
  '夢', '伝', '随', '音', '祀', '逆', '娶', '奏', '眇', '彁',
  '蒐', '報', '△', '𠷡', '記', '軛', 'Ｑ', '慄', '■', '界',
  '縺', '眩', '縁', '牟', '瞠',
];

// テキストファイルを読み込む
const rawText = fs.readFileSync(INPUT_FILE, 'utf-8');

// アルバムブロックに分割（空行で区切る）
const blocks = rawText.split(/\n\s*\n+/);

// ヘッダー部分（最初の数ブロック）をスキップ
const startIdx = blocks.findIndex(b => /（\w+）/.test(b));

if (startIdx === -1) {
  console.error('❌ アルバムデータが見つかりません');
  process.exit(1);
}

const albumBlocks = blocks.slice(startIdx);

// 全問の answer.text を集計（プール用）
const allAnswers = { hiragana: [], katakana: [] };

// 当て字抽出用正規表現
const atejiRegex = /([^\s　（）「」『』【】、。！？…""\n]+?)（([^）]+)）/g;

/**
 * 文字種の判定
 */
function getCharType(text) {
  // ひらがな: U+3040～U+309F
  if (/^[\u3040-\u309F]+$/.test(text)) return 'hiragana';
  // カタカナ: U+30A0～U+30FF
  if (/^[\u30A0-\u30FF]+$/.test(text)) return 'katakana';
  // 英字
  if (/^[a-z]+$/i.test(text)) return 'english';
  return 'mixed';
}

/**
 * 各ブロックをパース
 */
function parseAlbumBlock(block) {
  const lines = block.split('\n').map(l => l.trim()).filter(l => l);

  if (lines.length < 2) return null;

  const albumTitle = lines[0];
  const tracks = [];
  let currentSongTitle = null;
  let currentTrackQuestions = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const hasAteji = atejiRegex.test(line);

    if (!hasAteji && currentSongTitle === null) {
      // 最初の曲名
      currentSongTitle = line;
      currentTrackQuestions = [];
    } else if (!hasAteji && currentSongTitle !== null) {
      // 次の曲に移動
      if (currentTrackQuestions.length > 0) {
        tracks.push({
          songTitle: currentSongTitle,
          questions: currentTrackQuestions,
        });
      }
      currentSongTitle = line;
      currentTrackQuestions = [];
    } else if (hasAteji) {
      // 当て字行を処理
      let match;
      const atejiRegex2 = /([^\s　（）「」『』【】、。！？…""\n]+?)（([^）]+)）/g;
      while ((match = atejiRegex2.exec(line)) !== null) {
        const target = match[1];
        const reading = match[2];

        // prompt: target の直前テキスト
        const beforeIdx = match.index;
        const promptText = line.substring(0, beforeIdx).trim();

        // display: 行全体から読み括弧を除去し、targetを『』で囲む
        const displayText = line
          .replace(/（[^）]+）/g, '') // 全ての読み括弧を削除
          .replace(target, `『${target}』`); // 最初の対象を『』で囲む

        currentTrackQuestions.push({
          target,
          reading,
          promptText,
          displayText,
        });
      }
    }
  }

  // 最後の曲を追加
  if (currentSongTitle && currentTrackQuestions.length > 0) {
    tracks.push({
      songTitle: currentSongTitle,
      questions: currentTrackQuestions,
    });
  }

  if (tracks.length === 0) return null;

  return { albumTitle, tracks };
}

/**
 * 選択肢を生成
 */
function generateChoices(correctAnswer, allAnswersPool) {
  const correctType = getCharType(correctAnswer);
  let pool = [];

  if (correctType === 'hiragana') {
    pool = allAnswersPool.hiragana;
  } else if (correctType === 'katakana') {
    pool = allAnswersPool.katakana;
  } else {
    pool = allAnswersPool.hiragana.concat(allAnswersPool.katakana);
  }

  // 正解と異なる選択肢を3つ取得
  const others = pool
    .filter(a => a !== correctAnswer)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const allChoices = [correctAnswer, ...others].sort(() => Math.random() - 0.5);
  const correctIndex = allChoices.indexOf(correctAnswer);

  return { choices: allChoices, correctIndex };
}

/**
 * メイン処理
 */
async function main() {
  console.log('📖 テキスト解析開始...');

  // Step 1: 全ブロックをパース
  const parsedAlbums = albumBlocks
    .map(parseAlbumBlock)
    .filter(a => a !== null);

  console.log(`✓ ${parsedAlbums.length} アルバムをテキストから抽出`);

  // Step 2: 全 answer.text を集計（選択肢生成用プール）
  parsedAlbums.forEach(album => {
    album.tracks.forEach(track => {
      track.questions.forEach(q => {
        const charType = getCharType(q.reading);
        if (charType === 'hiragana') {
          if (!allAnswers.hiragana.includes(q.reading)) {
            allAnswers.hiragana.push(q.reading);
          }
        } else if (charType === 'katakana') {
          if (!allAnswers.katakana.includes(q.reading)) {
            allAnswers.katakana.push(q.reading);
          }
        }
      });
    });
  });

  console.log(
    `✓ ひらがなプール: ${allAnswers.hiragana.length}個、カタカナプール: ${allAnswers.katakana.length}個`
  );

  // Step 3: 正しい順番でマッピング
  const albumMap = new Map();
  parsedAlbums.forEach(album => {
    albumMap.set(album.albumTitle, album);
  });

  // Step 4: 正しい順番でYAMLを生成
  const indexEntries = [];
  let generatedCount = 0;

  CORRECT_ORDER.forEach((albumTitle, index) => {
    const albumId = `dyj-${String(index + 1).padStart(2, '0')}`;

    // 既存アルバムは上書きしない
    if (EXISTING_ALBUMS.includes(albumId)) {
      console.log(
        `⊘ ${albumId}（${albumTitle}）は既存・スキップ`
      );
      indexEntries.push({
        id: albumId,
        title: albumTitle,
        series: '凋叶棕 ナンバリング作品',
        number: index + 1,
        file: `albums/${albumId}.yaml`,
      });
      return;
    }

    const album = albumMap.get(albumTitle);

    if (!album) {
      // 当て字データがないアルバム → スタブ生成
      console.log(`◇ ${albumId}（${albumTitle}）: スタブ生成（問題なし）`);

      const albumData = {
        id: albumId,
        title: albumTitle,
        series: '凋叶棕 ナンバリング作品',
        number: index + 1,
        url: null,
        arranger: 'RD-Sounds',
        tracks: [],
      };

      const outputPath = path.join(ALBUMS_DIR, `${albumId}.yaml`);
      fs.writeFileSync(outputPath, yaml.dump(albumData, { lineWidth: -1 }));

      indexEntries.push({
        id: albumId,
        title: albumTitle,
        series: '凋叶棕 ナンバリング作品',
        number: index + 1,
        file: `albums/${albumId}.yaml`,
      });
      generatedCount++;
      return;
    }

    // トラック処理
    let totalQuestionsCount = 0;
    const yamlTracks = album.tracks.map((track, trackIndex) => {
      const trackId = `${albumId}-${String(trackIndex + 1).padStart(2, '0')}`;

      // 質問処理
      const yamlQuestions = track.questions.map((q, qIndex) => {
        const { choices, correctIndex } = generateChoices(
          q.reading,
          allAnswers
        );

        return {
          id: `${trackId}-q${qIndex + 1}`,
          prompt: q.promptText,
          target: q.target,
          display: q.displayText,
          choices,
          correct: correctIndex,
          answer: {
            text: q.reading,
            reading: q.reading,
          },
          tags: ['ateji', '4択'],
        };
      });

      totalQuestionsCount += yamlQuestions.length;

      return {
        id: trackId,
        trackNumber: trackIndex + 1,
        songTitle: track.songTitle,
        questions: yamlQuestions,
      };
    });

    // アルバムメタデータ
    const albumData = {
      id: albumId,
      title: albumTitle,
      series: '凋叶棕 ナンバリング作品',
      number: index + 1,
      url: null,
      arranger: 'RD-Sounds',
      tracks: yamlTracks,
    };

    // YAMLファイルに出力
    const outputPath = path.join(ALBUMS_DIR, `${albumId}.yaml`);
    fs.writeFileSync(outputPath, yaml.dump(albumData, { lineWidth: -1 }));

    console.log(
      `✓ ${albumId}（${albumTitle}）: ${yamlTracks.length}曲、${totalQuestionsCount}問`
    );

    // インデックスエントリを記録
    indexEntries.push({
      id: albumId,
      title: albumTitle,
      series: '凋叶棕 ナンバリング作品',
      number: index + 1,
      file: `albums/${albumId}.yaml`,
    });
    generatedCount++;
  });

  // Step 5: albums.yaml を更新
  const indexData = { albums: indexEntries };
  fs.writeFileSync(ALBUMS_INDEX, yaml.dump(indexData, { lineWidth: -1 }));

  console.log(
    `\n✅ 完了！${generatedCount}個のアルバムを生成・${CORRECT_ORDER.length}個を登録しました`
  );
  console.log(`📝 ${ALBUMS_INDEX} を更新`);
}

main().catch(err => {
  console.error('❌ エラー:', err.message);
  process.exit(1);
});
