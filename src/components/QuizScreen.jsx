import { useState, useEffect, useRef } from 'react';
import { matchReading } from '../utils/readingMatcher';
import s from './QuizScreen.module.css';

const INDICES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const AUTO_ADVANCE_MS = 1800;

/** display テキスト内の target 語（『target』）だけをハイライト用に分割 */
function parseDisplay(display, target) {
    if (!target) return [{ text: display, highlight: false }];
    const marker = `『${target}』`;
    const idx = display.indexOf(marker);
    if (idx === -1) return [{ text: display, highlight: false }];
    const parts = [];
    if (idx > 0) parts.push({ text: display.slice(0, idx), highlight: false });
    parts.push({ text: target, highlight: true });
    const after = idx + marker.length;
    if (after < display.length) parts.push({ text: display.slice(after), highlight: false });
    return parts;
}

export default function QuizScreen({ questions, quizMode, inputMode, onFinish }) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answerFeedback, setAnswerFeedback] = useState(null);
    const [score, setScore] = useState(0);
    const [userInput, setUserInput] = useState('');
    const inputRef = useRef(null);
    const timerRef = useRef(null);
    const advanceFnRef = useRef(null);

    // 入力モード: 問題切替時にフォーカス
    useEffect(() => {
        if (inputMode === 'input' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [currentIdx, inputMode]);

    useEffect(() => {
        return () => clearTimeout(timerRef.current);
    }, []);

    // 解答後: 自動送り + クリック/キーでスキップ
    useEffect(() => {
        if (answerFeedback === null) return;

        const advance = () => {
            clearTimeout(timerRef.current);
            window.removeEventListener('keydown', onKey);
            advanceFnRef.current?.();
        };
        const onKey = (e) => {
            // 入力中のEnterはhandleSubmitが処理するので除外
            if (e.target === inputRef.current) return;
            advance();
        };

        timerRef.current = setTimeout(advance, AUTO_ADVANCE_MS);
        window.addEventListener('keydown', onKey);

        return () => {
            clearTimeout(timerRef.current);
            window.removeEventListener('keydown', onKey);
        };
    }, [answerFeedback]);

    if (questions.length === 0) {
        return <div className={s.container}>問題がありません</div>;
    }

    const { track, question, albumTitle, vocal, url } = questions[currentIdx];
    const progress = (currentIdx / questions.length) * 100;
    const isLast = currentIdx === questions.length - 1;

    const songTitle = track.songTitle;
    const originalSong = track.originalSong;

    const doAdvance = (newScore) => {
        setAnswerFeedback(null);
        setUserInput('');
        if (isLast) {
            onFinish(newScore ?? score);
        } else {
            setCurrentIdx((i) => i + 1);
        }
    };

    // 4択モード
    const handleChoice = (choiceIndex) => {
        if (answerFeedback !== null) return;
        const isCorrect = question.choices[choiceIndex] === question.answer.text;
        const newScore = isCorrect ? score + 1 : score;
        setScore(newScore);
        advanceFnRef.current = () => doAdvance(newScore);
        setAnswerFeedback({ choiceIndex, isCorrect, newScore });
    };

    // 入力モード: 解答
    const handleSubmit = () => {
        if (answerFeedback !== null || !userInput.trim()) return;
        const correctText = question.answer.reading || question.answer.text;
        const isCorrect = matchReading(userInput, correctText);
        const newScore = isCorrect ? score + 1 : score;
        setScore(newScore);
        advanceFnRef.current = () => doAdvance(newScore);
        setAnswerFeedback({ isCorrect, userAnswer: userInput.trim(), newScore });
    };

    // 入力モード: 降参
    const handleGiveUp = () => {
        if (answerFeedback !== null) return;
        advanceFnRef.current = () => doAdvance(score);
        setAnswerFeedback({ isCorrect: false, gaveUp: true, newScore: score });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit();
    };

    const getButtonClass = (i) => {
        if (answerFeedback === null) return s.choiceBtn;
        if (question.choices[i] === question.answer.text) return `${s.choiceBtn} ${s.correct}`;
        if (i === answerFeedback.choiceIndex) return `${s.choiceBtn} ${s.wrong}`;
        return `${s.choiceBtn} ${s.disabledBtn}`;
    };

    const getFeedbackMessage = () => {
        if (!answerFeedback) return null;
        const reading = question.answer?.reading || '';
        const text = question.answer?.text || '';
        if (answerFeedback.isCorrect) {
            return { label: '正解！', detail: reading || text };
        }
        if (answerFeedback.gaveUp) {
            return { label: '降参', detail: `正解: 「${text}」${reading ? ` (${reading})` : ''}` };
        }
        if (answerFeedback.userAnswer) {
            return { label: '不正解', detail: `「${answerFeedback.userAnswer}」→ 正解: 「${text}」${reading ? ` (${reading})` : ''}` };
        }
        return { label: '不正解', detail: `正解: 「${text}」${reading ? ` (${reading})` : ''}` };
    };

    const feedbackMsg = getFeedbackMessage();

    return (
        <div className={s.container}>
            <div className={s.header}>
                <span className={s.scoreDisplay}>
                    スコア: <strong>{score}</strong> / {questions.length}
                </span>
                <span className={s.scoreDisplay}>
                    {currentIdx + 1} / {questions.length}
                </span>
            </div>

            <div className={s.progressBar}>
                <div
                    className={s.progressFill}
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className={s.card} key={currentIdx}>
                <div className={s.cardHeader}>
                    {quizMode === 'random' && albumTitle && (
                        <span className={s.albumBadge}>「{albumTitle}」より</span>
                    )}
                    {songTitle && (
                        <span className={s.songBadge}>{songTitle}</span>
                    )}
                </div>

                {(originalSong || vocal) && (
                    <div className={s.songMeta}>
                        {originalSong && <span>原曲: {originalSong}</span>}
                        {vocal && <span>{vocal}</span>}
                        {url && (
                            <a href={url} target="_blank" rel="noreferrer">
                                特設サイト
                            </a>
                        )}
                    </div>
                )}

                <div className={s.questionBody}>
                    <p className={s.display}>
                        {parseDisplay(question.display, question.target).map((part, i) =>
                            part.highlight ? (
                                <span key={i} className={s.target}>{part.text}</span>
                            ) : (
                                <span key={i}>{part.text}</span>
                            )
                        )}
                    </p>
                </div>
            </div>

            {inputMode === 'choice' ? (
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
            ) : (
                <div className={s.inputArea}>
                    <input
                        ref={inputRef}
                        type="text"
                        className={s.inputField}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="読みをひらがなで入力..."
                        disabled={answerFeedback !== null}
                        autoComplete="off"
                        autoCapitalize="off"
                    />
                    <div className={s.inputActions}>
                        <button
                            className={s.submitBtn}
                            onClick={handleSubmit}
                            disabled={answerFeedback !== null || !userInput.trim()}
                        >
                            解答する
                        </button>
                        <button
                            className={s.giveUpBtn}
                            onClick={handleGiveUp}
                            disabled={answerFeedback !== null}
                        >
                            降参
                        </button>
                    </div>
                </div>
            )}

            {answerFeedback !== null && (
                <div
                    className={`${s.feedbackBar} ${answerFeedback.isCorrect ? s.feedbackCorrect : s.feedbackWrong}`}
                    onClick={() => advanceFnRef.current?.()}
                >
                    <div className={s.feedbackContent}>
                        <span className={s.feedbackLabel}>{feedbackMsg.label}</span>
                        <span className={s.feedbackDetail}>{feedbackMsg.detail}</span>
                    </div>
                    <span className={s.feedbackHint}>{isLast ? '結果へ →' : '次へ →'}</span>
                </div>
            )}
        </div>
    );
}
