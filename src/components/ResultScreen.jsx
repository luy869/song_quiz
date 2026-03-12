import { useEffect, useState } from 'react';
import s from './ResultScreen.module.css';

function getResultMessage(pct) {
    if (pct === 100) return { emoji: '🏆', msg: '全問正解！完璧です！' };
    if (pct >= 80) return { emoji: '🌟', msg: '素晴らしい！ほぼ完璧です！' };
    if (pct >= 60) return { emoji: '👏', msg: 'よくできました！' };
    if (pct >= 40) return { emoji: '💪', msg: 'もう少し！もう一度挑戦してみましょう！' };
    return { emoji: '🎵', msg: '歌詞を聴いて、また挑戦してみよう！' };
}

export default function ResultScreen({ score, total, onRetry, onHome }) {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const { emoji, msg } = getResultMessage(pct);
    const [barWidth, setBarWidth] = useState(0);

    // Animated bar on mount
    useEffect(() => {
        const t = setTimeout(() => setBarWidth(pct), 100);
        return () => clearTimeout(t);
    }, [pct]);

    return (
        <div className={s.container}>
            <p className={s.emojiDisplay}>{emoji}</p>
            <h2 className={s.title}>クイズ終了！</h2>

            <div className={s.scoreCard}>
                <p>
                    <span className={s.scoreNum}>{score}</span>
                    <span className={s.scoreDenom}> / {total}</span>
                </p>
                <p className={s.scoreLabel}>正解数</p>
                <div className={s.barWrap}>
                    <div className={s.bar} style={{ width: `${barWidth}%` }} />
                </div>
                <p className={s.scoreLabel} style={{ marginTop: 8 }}>{pct}%</p>
            </div>

            <p className={s.message}>{msg}</p>

            <div className={s.actions}>
                <button className={s.retryBtn} onClick={onRetry}>
                    🔄 もう一度挑戦する
                </button>
                <button className={s.homeBtn} onClick={onHome}>
                    ← タイトルに戻る
                </button>
            </div>
        </div>
    );
}
