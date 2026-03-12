import yaml from 'js-yaml';

// Viteのbase設定を反映したパスプレフィックス
// 開発時は '/', 本番(/song_quiz/)でも正しいパスになる
const BASE = import.meta.env.BASE_URL;

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
 * 指定アルバムの全データ（tracks含む）を取得する
 * @param {string} filePath - albums.yaml に記載された file パス (例: 'albums/dyj-01.yaml')
 * @returns {Promise<Object>} album オブジェクト
 */
export const loadAlbumData = async (filePath) => {
    return fetchYaml(`data/${filePath}`);
};
