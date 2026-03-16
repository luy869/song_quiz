export function normalizeReading(str) {
  return str
    .replace(/\s/g, '')
    // katakana to hiragana (ァ-ヶ → ぁ-ゖ)
    .replace(/[\u30A1-\u30F6]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60),
    )
    // fullwidth alphanumeric to halfwidth
    .replace(/[\uFF01-\uFF5E]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
    )
    .toLowerCase();
}

export function matchReading(input, correct) {
  return normalizeReading(input) === normalizeReading(correct);
}
