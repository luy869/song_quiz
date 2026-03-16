import yaml from 'js-yaml';

// Viteのbase設定を反映したパスプレフィックス
// 開発時は '/', 本番(/song_quiz/)でも正しいパスになる
const BASE = import.meta.env.BASE_URL;

const albumDataCache = new Map();

/**
 * YAML ファイルを fetch してパースする
 * @param {string} path - BASE_URL からの相対パス (例: 'data/albums.yaml')
 * @returns {Promise<any>}
 */
export const fetchYaml = async (path) => {
    const url = `${BASE}${path}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const text = await res.text();
    return yaml.load(text);
};

/**
 * アルバム一覧を取得する
 * @returns {Promise<Array>} albums 配列
 */
export const loadAlbumIndex = async () => {
    const data = await fetchYaml('data/albums.yaml');
    return data?.albums ?? [];
};

/**
 * 指定アルバムの全データ（tracks含む）を取得する（キャッシュ付き）
 * @param {string} filePath - albums.yaml に記載された file パス (例: 'albums/dyj-01.yaml')
 * @returns {Promise<Object>} album オブジェクト
 */
export const loadAlbumData = async (filePath) => {
    if (albumDataCache.has(filePath)) {
        return albumDataCache.get(filePath);
    }
    const data = await fetchYaml(`data/${filePath}`);
    albumDataCache.set(filePath, data);
    return data;
};

/**
 * 全アルバムのデータを並列取得する
 * @param {Array} albumIndex - loadAlbumIndex() の結果
 * @param {(loaded: number, total: number) => void} onProgress - 進捗コールバック
 * @returns {Promise<Array>} 全アルバムデータ配列
 */
export const loadAllAlbumData = async (albumIndex, onProgress) => {
    let loaded = 0;
    const promises = albumIndex.map(async (album) => {
        const data = await loadAlbumData(album.file);
        loaded++;
        onProgress?.(loaded, albumIndex.length);
        return data;
    });
    return Promise.all(promises);
};
