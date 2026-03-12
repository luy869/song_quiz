import { useState, useEffect } from 'react';
import './App.css';
import { loadAlbumIndex, loadAlbumData } from './utils/loadQuiz';
import StartScreen from './components/StartScreen';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';

const SCREEN = { START: 'start', QUIZ: 'quiz', RESULT: 'result' };

export default function App() {
  const [albumIndex, setAlbumIndex] = useState([]);  // 全アルバム一覧
  const [album, setAlbum] = useState(null);           // 選択中のアルバム（tracks含む）
  const [screen, setScreen] = useState(SCREEN.START);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // アルバム一覧を読み込む
  useEffect(() => {
    loadAlbumIndex()
      .then((albums) => setAlbumIndex(albums))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // アルバム選択 → 詳細データ取得 → クイズ開始
  const handleSelectAlbum = async (albumMeta) => {
    try {
      setLoading(true);
      const data = await loadAlbumData(albumMeta.file);
      setAlbum(data);
      setScore(0);
      setScreen(SCREEN.QUIZ);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getTotalQuestions = (album) => {
    if (!album || !album.tracks) return 0;
    return album.tracks.reduce((sum, track) => sum + (track.questions?.length || 0), 0);
  };

  const handleFinish = (finalScore) => {
    setScore(finalScore);
    setScreen(SCREEN.RESULT);
  };

  const handleRetry = () => {
    setScore(0);
    setScreen(SCREEN.QUIZ);
  };

  const handleHome = () => {
    setScore(0);
    setAlbum(null);
    setScreen(SCREEN.START);
  };

  if (loading) {
    return (
      <div className="app" style={{ textAlign: 'center', color: 'var(--text-secondary)', paddingTop: 40 }}>
        読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="app" style={{ textAlign: 'center', color: 'var(--wrong)', paddingTop: 40 }}>
        データの読み込みに失敗しました: {error}
      </div>
    );
  }

  return (
    <div className="app">
      {screen === SCREEN.START && (
        <StartScreen
          key="start"
          albums={albumIndex}
          onSelectAlbum={handleSelectAlbum}
        />
      )}
      {screen === SCREEN.QUIZ && album && (
        <QuizScreen
          key={`quiz-${album.id}`}
          album={album}
          score={score}
          onFinish={handleFinish}
        />
      )}
      {screen === SCREEN.RESULT && (
        <ResultScreen
          key="result"
          score={score}
          total={getTotalQuestions(album)}
          albumTitle={album?.title}
          onRetry={handleRetry}
          onHome={handleHome}
        />
      )}
    </div>
  );
}
