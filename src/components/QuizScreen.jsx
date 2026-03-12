import { useState, useEffect, useRef, useMemo } from 'react';
import s from './QuizScreen.module.css';

const INDICES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const FEEDBACK_DELAY = 300; // ms after answer before next question

export default function QuizScreen({ album, onFinish }) {
    // フラットな質問リストを作成 ({ track, question } の配列)
    const allQuestions = useMemo(() => {
        const list = [];
        album.tracks.forEach((track) => {
            if (!track.questions) return;
            track.questions.forEach((q) => {
                list.push({ track, question: q });
            });
        });
        return list;
    }, [album]);

    const [currentIdx, setCurrentIdx] = useState(0);
    const [answerFeedback, setAnswerFeedback] = useState(null); // { choiceIndex, isCorrect }
    const [score, setScore] = useState(0);
    const timeoutRef = useRef(null);

    // タイムアウトのクリーンアップ
    useEffect(() => {
        return () => clearTimeout(timeoutRef.current);
    }, []);

    if (allQuestions.length === 0) {
        return <div className={s.container}>問題がありません</div>;
    }

    const { track, question } = allQuestions[currentIdx];
    const progress = (currentIdx / allQuestions.length) * 100;
    const isLast = currentIdx === allQuestions.length - 1;

    // メタデータの継承 (トラック固有がなければアルバム共通)
    const songTitle = track.songTitle;
    const originalSong = track.originalSong;
    const vocal = track.vocal || album.vocal;
    const url = track.url || album.url;

    const handleChoice = (choiceIndex) => {
        if (answerFeedback !== null) return;
        const isCorrect = question.choices[choiceIndex] === question.answer.text;
        const newScore = isCorrect ? score + 1 : score;
        setAnswerFeedback({ choiceIndex, isCorrect });
        setScore(newScore);

        timeoutRef.current = setTimeout(() => {
            setAnswerFeedback(null);
            if (isLast) {
                onFinish(newScore);
            } else {
                setCurrentIdx((i) => i + 1);
            }
        }, FEEDBACK_DELAY);
    };

    const getButtonClass = (i) => {
        if (answerFeedback === null) return s.choiceBtn;
        if (question.choices[i] === question.answer.text) return `${s.choiceBtn} ${s.correct}`;
        if (i === answerFeedback.choiceIndex) return `${s.choiceBtn} ${s.wrong}`;
        return `${s.choiceBtn} ${s.disabledBtn}`;
    };

    const getFeedbackMessage = () => {
        if (!answerFeedback) return null;
        if (answerFeedback.isCorrect) {
            return `✓ 正解！ (${question.answer?.reading || question.answer?.text})`;
        }
        return `✗ 不正解… 正解は「${question.answer?.text}」 (${question.answer?.reading || ''})`;
    };

    return (
        <div className={s.container}>
            <div className={s.header}>
                <span className={s.scoreDisplay}>
                    スコア: <strong>{score}</strong> / {allQuestions.length}
                </span>
                <span className={s.scoreDisplay}>
                    {currentIdx + 1} / {allQuestions.length}
                </span>
            </div>

            <div className={s.progressBar}>
                <div
                    className={s.progressFill}
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className={s.card} key={currentIdx}>
                {songTitle && (
                    <div className={s.songInfo}>
                        <div className={s.songTitle}>🎵 {songTitle}</div>
                        <div className={s.songMeta}>
                            {originalSong && <span>原曲: {originalSong}</span>}
                            {vocal && <span>🎤 {vocal}</span>}
                            {url && (
                                <a href={url} target="_blank" rel="noreferrer">
                                    🔗 特設サイト
                                </a>
                            )}
                        </div>
                    </div>
                )}
                <p className={s.questionNum}>Q{currentIdx + 1}</p>
                <div className={s.questionText}>
                    {question.prompt && <span className={s.prompt}>{question.prompt}</span>}
                    <span className={s.display}>{question.display}</span>
                </div>
            </div>

            <div className={s.choices}>
                {question.choices.map((choice, i) => (
                    <button
                        key={choice}
                        className={getButtonClass(i)}
                        onClick={() => handleChoice(i)}
                        disabled={answerFeedback !== null}
                    >
                        <span className={s.choiceIndex}>{INDICES[i] || i + 1}</span>
                        {choice}
                    </button>
                ))}
            </div>

            {answerFeedback !== null && (
                <p className={`${s.feedback} ${answerFeedback.isCorrect ? s.feedbackCorrect : s.feedbackWrong}`}>
                    {getFeedbackMessage()}
                </p>
            )}
        </div>
    );
}
