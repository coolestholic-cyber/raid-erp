// ============================================
// 금칙어 로더
// config/forbidden-words/*.txt 를 읽어 검증
// ============================================

(function() {
  let _cachedWords = null;

  const CATEGORIES = ['system', 'scam', 'inappropriate', 'custom'];

  function parseWordFile(text) {
    return text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => !line.startsWith('#'))
      .filter(line => !line.startsWith('──'));
  }

  async function loadForbiddenWords() {
    if (_cachedWords) return _cachedWords;

    const allWords = new Set();

    for (const category of CATEGORIES) {
      try {
        const response = await fetch(`./config/forbidden-words/${category}.txt`);
        if (!response.ok) {
          console.warn(`[금칙어] ${category}.txt 로드 실패 (${response.status})`);
          continue;
        }
        const text = await response.text();
        const words = parseWordFile(text);
        words.forEach(word => {
          const normalized = word.toLowerCase().trim();
          if (normalized.length > 0) allWords.add(normalized);
        });
        console.log(`[금칙어] ${category}.txt: ${words.length}개 로드`);
      } catch (err) {
        console.warn(`[금칙어] ${category} 로드 실패:`, err);
      }
    }

    _cachedWords = Array.from(allWords);
    console.log(`[금칙어] 총 ${_cachedWords.length}개 활성화`);
    return _cachedWords;
  }

  // 금칙어 검증 — 전역으로 노출
  window.validateForbiddenWords = async function(name) {
    if (!name) return { valid: true };

    const words = await loadForbiddenWords();
    const normalized = name.toLowerCase().replace(/\s/g, '');

    for (const word of words) {
      if (normalized.includes(word)) {
        return { valid: false, error: '사용할 수 없는 단어가 포함되어 있습니다.' };
      }
    }

    return { valid: true };
  };

  // ── 디버깅용 전역 함수 ──────────────────────────

  window.testForbiddenWord = async function(word) {
    const result = await window.validateForbiddenWords(word);
    const status = result.valid ? '✅ 사용 가능' : '❌ 차단됨';
    console.log(`${status}: "${word}"`);
    return result.valid;
  };

  window.reloadForbiddenWords = function() {
    _cachedWords = null;
    console.log('[금칙어] 캐시 초기화 완료. 다음 검증부터 새 파일 로드.');
  };

  window.countForbiddenWords = async function() {
    const words = await loadForbiddenWords();
    console.log(`[금칙어] 현재 ${words.length}개 활성화`);
    return words.length;
  };
})();
