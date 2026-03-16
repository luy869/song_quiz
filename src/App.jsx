import { useState, useEffect } from 'react';
import './App.css';
import { loadAlbumIndex, loadAlbumData, loadAllAlbumData } from './utils/loadQuiz';
import { buildQuizQuestions, shuffleArray } from './utils/quizBuilder';
import { loadHistory, saveResult, saveRandomResult } from './utils/scoreHistory';
import StartScreen from './components/StartScreen';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';

const SCREEN = { START: 'start', QUIZ: 'quiz', RESULT: 'result' };

export default function App() {
  const [albumIndex, setAlbumIndex] = useState([]);
  const [album, setAlbum] = useState(null);
  const [screen, setScreen] = useState(SCREEN.START);
  const [score, setScore] = useState(0);
  const [quizKey, setQuizKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState(null);

  // Phase 1: スコア履歴
  const [history, setHistory] = useState(() => loadHistory());
  const [bestPct, setBestPct] = useState(null);
  const [prevBestPct, setPrevBestPct] = useState(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Phase 2: クイズモード & 質問配列
  const [quizMode, setQuizMode] = useState('album');
  const [questions, setQuestions] = useState([]);

  // Phase 3: 入力モード（LocalStorage 永続化）
  const [inputMode, setInputMode] = useState(
    () => localStorage.getItem('songQuizInputMode') || 'choice',
  );

  // アルバム一覧を読み込む
  const loadIndex = () => {
    setLoading(true);
    setError(null);
    loadAlbumIndex()
      .then((albums) => setAlbumIndex(albums))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadIndex(); }, []);

  // アルバム選択 → 詳細データ取得 → シャッフルして出題
  const handleSelectAlbum = async (albumMeta) => {
    try {
      setLoading(true);
      const data = await loadAlbumData(albumMeta.file);
      setAlbum(data);
      setQuestions(buildQuizQuestions({ mode: 'album', albumData: data }));
      setQuizMode('album');
      setScore(0);
      setQuizKey((k) => k + 1);
      setScreen(SCREEN.QUIZ);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 全アルバム横断クイズ
  const handleSelectRandom = async (config) => {
    try {
      setLoading(true);
      setLoadingMsg('アルバムを読み込み中...');
      const allData = await loadAllAlbumData(albumIndex, (loaded, total) => {
        setLoadingMsg(`${loaded}/${total} アルバム読み込み中...`);
      });
      setQuestions(buildQuizQuestions({ mode: 'random', allAlbumsData: allData, config }));
      setQuizMode('random');
      setAlbum(null);
      setScore(0);
      setQuizKey((k) => k + 1);
      setScreen(SCREEN.QUIZ);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const handleFinish = (finalScore) => {
    const total = questions.length;
    let result;
    if (quizMode === 'random') {
      result = saveRandomResult(finalScore, total);
    } else {
      result = saveResult(album.id, finalScore, total);
    }
    setScore(finalScore);
    setBestPct(result.bestPct);
    setPrevBestPct(result.prevBestPct);
    setIsNewRecord(result.isNewRecord);
    setHistory(loadHistory());
    setScreen(SCREEN.RESULT);
  };

  const handleRetry = () => {
    if (quizMode === 'album' && album) {
      setQuestions(buildQuizQuestions({ mode: 'album', albumData: album }));
    } else {
      setQuestions(shuffleArray(questions));
    }
    setScore(0);
    setQuizKey((k) => k + 1);
    setScreen(SCREEN.QUIZ);
  };

  const handleHome = () => {
    setScore(0);
    setAlbum(null);
    setScreen(SCREEN.START);
  };

  const handleInputModeChange = (mode) => {
    setInputMode(mode);
    localStorage.setItem('songQuizInputMode', mode);
  };

  if (loading) {
    return (
      <div className="app app--center">
        {loadingMsg || '読み込み中...'}
      </div>
    );
  }

  if (error) {
    return (
      <div className="app app--center">
        <p className="app__error">データの読み込みに失敗しました: {error}</p>
        <button className="app__reload-btn" onClick={loadIndex}>再読み込み</button>
      </div>
    );
  }

  return (
    <div className="app">
      {screen === SCREEN.START && (
        <StartScreen
          key="start"
          albums={albumIndex}
          history={history}
          inputMode={inputMode}
          onSelectAlbum={handleSelectAlbum}
          onSelectRandom={handleSelectRandom}
          onInputModeChange={handleInputModeChange}
        />
      )}
      {screen === SCREEN.QUIZ && questions.length > 0 && (
        <QuizScreen
          key={quizKey}
          questions={questions}
          quizMode={quizMode}
          inputMode={inputMode}
          onFinish={handleFinish}
        />
      )}
      {screen === SCREEN.RESULT && (
        <ResultScreen
          key="result"
          score={score}
          total={questions.length}
          bestPct={bestPct}
          prevBestPct={prevBestPct}
          isNewRecord={isNewRecord}
          onRetry={handleRetry}
          onHome={handleHome}
        />
      )}
    </div>
  );
}
