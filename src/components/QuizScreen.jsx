import { useState, useEffect, useCallback, useMemo } from 'react';
import s from './QuizScreen.module.css';

const INDICES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const FEEDBACK_DELAY = 300; // ms after answer before next question

export default function QuizScreen({ album, score, onFinish }) {
    // フラットな質問リストを作成 ({ track, question, index } の配列)
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
    const [selected, setSelected] = useState(null); // { choiceIndex, isCorrect }
    const [localScore, setLocalScore] = useState(score);

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

    const handleChoice = useCallback((choiceIndex) => {
        if (selected !== null) return;
        const isCorrect = choiceIndex === question.correct;
        const newScore = isCorrect ? localScore + 1 : localScore;
        setSelected({ choiceIndex, isCorrect });
        setLocalScore(newScore);

        setTimeout(() => {
            setSelected(null);
            if (isLast) {
                onFinish(newScore);
            } else {
                setCurrentIdx((i) => i + 1);
            }
        }, FEEDBACK_DELAY);
    }, [selected, question, localScore, isLast, onFinish]);

    // Reset when album changes
    useEffect(() => {
        setCurrentIdx(0);
        setSelected(null);
        setLocalScore(score);
    }, [album]);

    const getButtonClass = (i) => {
        if (selected === null) return s.choiceBtn;
        if (i === question.correct) return `${s.choiceBtn} ${s.correct}`;
        if (i === selected.choiceIndex) return `${s.choiceBtn} ${s.wrong}`;
        return `${s.choiceBtn} ${s.disabledBtn}`;
    };

    const getFeedbackMessage = () => {
        if (!selected) return null;
        if (selected.isCorrect) {
            return `✓ 正解！ (${question.answer?.reading || question.choices[question.correct]})`;
        }
        return `✗ 不正解… 正解は「${question.answer?.text || question.choices[question.correct]}」 (${question.answer?.reading || ''})`;
    };

    return (
        <div className={s.container}>
            <div className={s.header}>
                <span className={s.scoreDisplay}>
                    スコア: <strong>{localScore}</strong> / {allQuestions.length}
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
                        key={i}
                        className={getButtonClass(i)}
                        onClick={() => handleChoice(i)}
                        disabled={selected !== null}
                    >
                        <span className={s.choiceIndex}>{INDICES[i] || i + 1}</span>
                        {choice}
                    </button>
                ))}
            </div>

            {selected !== null && (
                <p className={`${s.feedback} ${selected.isCorrect ? s.feedbackCorrect : s.feedbackWrong}`}>
                    {getFeedbackMessage()}
                </p>
            )}
        </div>
    );
}
