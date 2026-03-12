import s from './StartScreen.module.css';

export default function StartScreen({ albums, onSelectAlbum }) {
    return (
        <div className={s.container}>
            <span className={s.badge}>4択 歌詞あてクイズ</span>

            <div className={s.titleBlock}>
                <p className={s.album}>凋叶棕 ファンサイト</p>
                <h1 className={s.title}>歌詞クイズ</h1>
                <p className={s.subtitle}>当て字・特殊な読みを当てよう</p>
            </div>

            {albums.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>アルバムが見つかりません</p>
            ) : (
                <div className={s.albumList}>
                    {albums.map((album) => (
                        <button
                            key={album.id}
                            className={s.albumCard}
                            onClick={() => onSelectAlbum(album)}
                        >
                            <div className={s.albumCardHeader}>
                                <span className={s.albumNumber}>#{album.number}</span>
                                <span className={s.albumTitle}>{album.title}</span>
                            </div>
                            <span className={s.albumSeries}>{album.series}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
