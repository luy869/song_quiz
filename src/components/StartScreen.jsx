import { useState } from 'react';
import s from './StartScreen.module.css';

export default function StartScreen({
    albums,
    history,
    inputMode,
    onSelectAlbum,
    onSelectRandom,
    onInputModeChange,
}) {
    const [showRandomConfig, setShowRandomConfig] = useState(false);

    const getAlbumBestPct = (albumId) => history?.albums?.[albumId]?.bestPct;

    return (
        <div className={s.container}>
            <span className={s.badge}>
                {inputMode === 'input' ? '入力' : '4択'} 歌詞あてクイズ
            </span>

            <div className={s.titleBlock}>
                <p className={s.album}>凋叶棕 ファンサイト</p>
                <h1 className={s.title}>歌詞クイズ</h1>
                <p className={s.subtitle}>当て字・特殊な読みを当てよう</p>
            </div>

            <div className={s.modeToggle}>
                <span className={s.toggleLabel}>入力モード</span>
                <button
                    className={`${s.toggleSwitch} ${inputMode === 'input' ? s.toggleOn : ''}`}
                    onClick={() =>
                        onInputModeChange(inputMode === 'input' ? 'choice' : 'input')
                    }
                    aria-label="入力モード切替"
                >
                    <span className={s.toggleKnob} />
                </button>
            </div>

            {albums.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>アルバムが見つかりません</p>
            ) : (
                <>
                    <div className={s.randomSection}>
                        <button
                            className={s.randomCard}
                            onClick={() => setShowRandomConfig((v) => !v)}
                        >
                            <div className={s.randomCardHeader}>
                                <span className={s.randomTitle}>全アルバム横断クイズ</span>
                            </div>
                            <span className={s.randomDesc}>
                                全アルバムからランダムに出題
                            </span>
                        </button>

                        {showRandomConfig && (
                            <div className={s.countSelector}>
                                <span className={s.countLabel}>問題数を選択:</span>
                                <div className={s.countPills}>
                                    {[10, 20, 50].map((n) => (
                                        <button
                                            key={n}
                                            className={s.countPill}
                                            onClick={() => onSelectRandom({ limit: n })}
                                        >
                                            {n}問
                                        </button>
                                    ))}
                                    <button
                                        className={s.countPill}
                                        onClick={() => onSelectRandom({})}
                                    >
                                        全問
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={s.albumList}>
                        {albums.map((album) => {
                            const bestPct = getAlbumBestPct(album.id);
                            const isGold = bestPct === 100;
                            return (
                                <button
                                    key={album.id}
                                    className={`${s.albumCard} ${isGold ? s.goldBorder : ''}`}
                                    onClick={() => onSelectAlbum(album)}
                                >
                                    <div className={s.albumCardHeader}>
                                        <span className={s.albumNumber}>#{album.number}</span>
                                        <span className={s.albumTitle}>{album.title}</span>
                                        {bestPct != null && (
                                            <span className={s.bestBadge}>{bestPct}%</span>
                                        )}
                                    </div>
                                    <span className={s.albumSeries}>{album.series}</span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
