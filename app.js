document.addEventListener('DOMContentLoaded', () => {
    // ==================== STORAGE HELPERS ====================
    const LS = {
        get(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
        set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
    };

    // ==================== STATE ====================
    let profile = LS.get('jlpt_profile', null);
    let currentDeckName = 'N2';
    let currentDeck = [];
    let currentIndex = 0;
    let isFlipped = false;
    let isFuriganaEnabled = true;
    let isAutoplayEnabled = false;
    let starredWords = LS.get('jlpt_starred', {});
    // Quiz state
    let quizQuestions = [];
    let quizIdx = 0;
    let quizScore = 0;
    let quizStartTime = null;
    let quizAnswers = [];
    let quizDeck = 'N2';

    // ==================== DATA CHECK ====================
    if (typeof jlptData === 'undefined') { alert('data.js not loaded'); return; }

    // ==================== DOM REFS ====================
    const $ = id => document.getElementById(id);

    // Onboarding
    const onboardScreen = $('onboarding-screen');
    const appContainer = $('app-container');

    // Study
    const card = $('flashcard');
    const wordDisplay = $('word-display');
    const readingFront = $('reading-front');
    const meaningDisplay = $('meaning-display');
    const exampleDisplay = $('example-display');
    const exampleMeaningDisplay = $('example-meaning-display');
    const progressText = $('progress-text');
    const progressFill = $('progress-fill');
    const prevBtn = $('prev-btn');
    const knowBtn = $('know-btn');
    const audioBtn = $('audio-btn');
    const exampleAudioBtn = $('example-audio-btn');
    const furiganaToggle = $('furigana-toggle');
    const autoplayToggle = $('autoplay-toggle');
    const deckSelector = $('deck-selector');
    const cardSlider = $('card-slider');
    const cardNumberInput = $('card-number-input');
    const totalCardsDisplay = $('total-cards-display');
    const starBtn = $('star-btn');
    const starBtnBack = $('star-btn-back');
    const countdownBadge = $('countdown-badge');

    // ==================== INIT ====================
    if (!profile) {
        showOnboarding();
    } else {
        startApp();
    }

    // ==================== ONBOARDING ====================
    function showOnboarding() {
        onboardScreen.style.display = 'flex';
        appContainer.style.display = 'none';
        const today = new Date();
        today.setMonth(today.getMonth() + 2);
        $('onboard-date').value = today.toISOString().split('T')[0];
    }

    $('onboard-submit').addEventListener('click', () => {
        const nick = $('onboard-nickname').value.trim();
        if (!nick) { $('onboard-nickname').focus(); return; }
        profile = {
            nickname: nick,
            level: $('onboard-level').value,
            examDate: $('onboard-date').value
        };
        LS.set('jlpt_profile', profile);
        startApp();
    });

    // ==================== START APP ====================
    function startApp() {
        onboardScreen.style.display = 'none';
        appContainer.style.display = 'flex';
        updateCountdown();
        // Restore last deck
        const lastDeck = LS.get('jlpt_last_deck', 'N2');
        deckSelector.value = lastDeck;
        loadDeck(lastDeck);
        renderHistory();
        renderStarred();
    }

    // ==================== COUNTDOWN ====================
    function updateCountdown() {
        if (!profile || !profile.examDate) { countdownBadge.textContent = ''; return; }
        const diff = Math.ceil((new Date(profile.examDate) - new Date()) / 86400000);
        if (diff > 0) {
            countdownBadge.textContent = `${profile.level} 剩 ${diff} 天`;
        } else if (diff === 0) {
            countdownBadge.textContent = `${profile.level} 今天考試！`;
        } else {
            countdownBadge.textContent = `${profile.level} 已過`;
        }
    }

    // ==================== TABS ====================
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const target = $('tab-' + tab.dataset.tab);
            if (target) target.classList.add('active');
            if (tab.dataset.tab === 'history') renderHistory();
            if (tab.dataset.tab === 'starred') renderStarred();
        });
    });

    // ==================== PROFILE MODAL ====================
    $('btn-profile').addEventListener('click', () => {
        $('profile-nickname').value = profile.nickname || '';
        $('profile-level').value = profile.level || 'N2';
        $('profile-date').value = profile.examDate || '';
        $('profile-modal').style.display = 'flex';
    });
    $('profile-cancel').addEventListener('click', () => { $('profile-modal').style.display = 'none'; });
    $('profile-save').addEventListener('click', () => {
        const nick = $('profile-nickname').value.trim();
        if (!nick) { $('profile-nickname').focus(); return; }
        profile.nickname = nick;
        profile.level = $('profile-level').value;
        profile.examDate = $('profile-date').value;
        LS.set('jlpt_profile', profile);
        updateCountdown();
        $('profile-modal').style.display = 'none';
    });
    $('profile-modal').addEventListener('click', e => { if (e.target === $('profile-modal')) $('profile-modal').style.display = 'none'; });

    // ==================== FLASHCARD STUDY ====================
    function loadDeck(deckName) {
        const key = deckName === 'N4' || deckName === 'N5' ? 'N4_N5' : deckName;
        if (!jlptData[key]) { console.error('Deck not found:', key); return; }
        currentDeckName = key;
        currentDeck = jlptData[key];
        const total = currentDeck.length;
        cardSlider.max = total;
        cardNumberInput.max = total;
        totalCardsDisplay.textContent = '/ ' + total;
        // Restore position
        const positions = LS.get('jlpt_positions', {});
        currentIndex = Math.min(positions[key] || 0, total - 1);
        updateCard();
        LS.set('jlpt_last_deck', deckName);
    }

    function savePosition() {
        const positions = LS.get('jlpt_positions', {});
        positions[currentDeckName] = currentIndex;
        LS.set('jlpt_positions', positions);
    }

    function updateCard() {
        if (!currentDeck.length) return;
        const item = currentDeck[currentIndex];
        isFlipped = false;
        card.classList.remove('flipped');
        wordDisplay.textContent = item.word;
        readingFront.textContent = item.reading;
        meaningDisplay.textContent = item.meaning;
        exampleDisplay.innerHTML = parseFurigana(item.example_raw || item.example);
        if (item.example_meaning) {
            exampleMeaningDisplay.textContent = item.example_meaning;
            exampleMeaningDisplay.style.display = 'block';
        } else {
            exampleMeaningDisplay.textContent = '';
            exampleMeaningDisplay.style.display = 'none';
        }
        updateProgress();
        updateNavControls();
        updateStarUI();
        savePosition();
        if (isAutoplayEnabled) speak();
    }

    function parseFurigana(text) {
        if (!text) return '';
        return text.replace(/([\u4e00-\u9faf]+)\[(.*?)\]/g, (m, k, r) => `<ruby>${k}<rt>${r}</rt></ruby>`);
    }
    function updateProgress() {
        const pct = ((currentIndex + 1) / currentDeck.length) * 100;
        progressFill.style.width = pct + '%';
        progressText.textContent = (currentIndex + 1) + ' / ' + currentDeck.length;
    }
    function updateNavControls() {
        const n = currentIndex + 1;
        cardSlider.value = n;
        cardNumberInput.value = n;
    }
    function flipCard() {
        isFlipped = !isFlipped;
        card.classList.toggle('flipped');
    }
    function nextCard() {
        if (currentIndex < currentDeck.length - 1) { currentIndex++; updateCard(); }
        else { currentIndex = 0; updateCard(); }
    }
    function prevCard() { if (currentIndex > 0) { currentIndex--; updateCard(); } }
    function jumpToCard(i) { if (i >= 0 && i < currentDeck.length) { currentIndex = i; updateCard(); } }
    function speak() {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(currentDeck[currentIndex].word);
        u.lang = 'ja-JP'; u.rate = 0.9; speechSynthesis.speak(u);
    }
    function speakExample() {
        speechSynthesis.cancel();
        const item = currentDeck[currentIndex];
        let text = item.example;
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ja-JP'; u.rate = 0.85; speechSynthesis.speak(u);
    }

    // Study event listeners
    card.addEventListener('click', e => { if (!e.target.closest('.star-btn') && !e.target.closest('.audio-btn')) flipCard(); });
    knowBtn.addEventListener('click', e => { e.stopPropagation(); nextCard(); });
    prevBtn.addEventListener('click', e => { e.stopPropagation(); prevCard(); });
    audioBtn.addEventListener('click', e => { e.stopPropagation(); speak(); });
    exampleAudioBtn.addEventListener('click', e => { e.stopPropagation(); speakExample(); });
    furiganaToggle.addEventListener('change', e => { isFuriganaEnabled = e.target.checked; document.body.classList.toggle('no-furigana', !isFuriganaEnabled); });
    autoplayToggle.addEventListener('change', e => { isAutoplayEnabled = e.target.checked; });
    deckSelector.addEventListener('change', e => { loadDeck(e.target.value); });
    cardSlider.addEventListener('input', e => { jumpToCard(parseInt(e.target.value, 10) - 1); });
    cardNumberInput.addEventListener('change', e => {
        let v = parseInt(e.target.value, 10);
        if (isNaN(v)) v = 1;
        v = Math.max(1, Math.min(v, currentDeck.length));
        jumpToCard(v - 1);
    });
    document.addEventListener('keydown', e => {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.tagName === 'TEXTAREA')) return;
        if (!$('tab-study').classList.contains('active')) return;
        if (e.code === 'Space') { e.preventDefault(); flipCard(); }
        else if (e.code === 'ArrowRight') nextCard();
        else if (e.code === 'ArrowLeft') prevCard();
    });

    // ==================== STAR / DIFFICULT WORDS ====================
    function starKey(deck, word) { return deck + '::' + word; }
    function isStarred() { return !!starredWords[starKey(currentDeckName, currentDeck[currentIndex]?.word)]; }
    function toggleStar() {
        const item = currentDeck[currentIndex];
        const key = starKey(currentDeckName, item.word);
        if (starredWords[key]) { delete starredWords[key]; }
        else { starredWords[key] = { deck: currentDeckName, word: item.word, reading: item.reading, meaning: item.meaning }; }
        LS.set('jlpt_starred', starredWords);
        updateStarUI();
    }
    function updateStarUI() {
        const on = isStarred();
        [starBtn, starBtnBack].forEach(btn => { btn.classList.toggle('starred', on); });
    }
    starBtn.addEventListener('click', e => { e.stopPropagation(); toggleStar(); });
    starBtnBack.addEventListener('click', e => { e.stopPropagation(); toggleStar(); });

    function renderStarred() {
        const filter = $('starred-deck-filter').value;
        const list = $('starred-list');
        const entries = Object.entries(starredWords).filter(([, v]) => filter === 'ALL' || v.deck === filter);
        if (!entries.length) { list.innerHTML = '<div class="starred-empty">還沒有收藏的難字</div>'; return; }
        list.innerHTML = entries.map(([key, v]) => `
            <div class="starred-item">
                <div>
                    <div class="starred-word">${v.word}</div>
                    <div class="starred-reading">${v.reading}</div>
                    <div class="starred-meaning">${v.meaning}</div>
                </div>
                <button class="starred-remove" data-key="${key}" aria-label="Remove">★</button>
            </div>`).join('');
        list.querySelectorAll('.starred-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                delete starredWords[btn.dataset.key];
                LS.set('jlpt_starred', starredWords);
                renderStarred();
                updateStarUI();
            });
        });
    }
    $('starred-deck-filter').addEventListener('change', renderStarred);

    // ==================== QUIZ ====================
    $('quiz-begin-btn').addEventListener('click', startQuiz);
    $('quiz-next-btn').addEventListener('click', nextQuizQ);
    $('result-retry-btn').addEventListener('click', startQuiz);
    $('result-review-btn').addEventListener('click', showReview);

    function startQuiz() {
        quizDeck = $('quiz-deck-select').value;
        const dk = quizDeck === 'N4' || quizDeck === 'N5' ? 'N4_N5' : quizDeck;
        const pool = jlptData[dk];
        if (!pool || pool.length < 10) { alert('Deck needs ≥10 words'); return; }

        quizQuestions = generateQuiz(pool, dk);
        quizIdx = 0; quizScore = 0; quizAnswers = [];
        quizStartTime = Date.now();

        $('quiz-start').style.display = 'none';
        $('quiz-result').style.display = 'none';
        $('quiz-review-list').style.display = 'none';
        $('quiz-active').style.display = 'flex';
        $('quiz-score-live').textContent = '0';
        renderQuizQ();
    }

    function generateQuiz(pool, deckKey) {
        const indices = shuffle([...Array(pool.length).keys()]).slice(0, 10);
        return indices.map(i => {
            const item = pool[i];
            const type = pickType(item);
            return { item, type, deckKey, options: buildOptions(pool, i, type) };
        });
    }

    function pickType(item) {
        // 3 types: kanji_to_reading, reading_to_kanji, fill_blank
        const types = ['kanji_to_reading', 'reading_to_kanji'];
        if (item.example_raw && item.word && item.example_raw.includes(item.word)) types.push('fill_blank');
        return types[Math.floor(Math.random() * types.length)];
    }

    function buildOptions(pool, correctIdx, type) {
        const correct = pool[correctIdx];
        const others = shuffle(pool.filter((_, i) => i !== correctIdx)).slice(0, 3);
        const all = shuffle([correct, ...others]);
        return all.map(o => {
            if (type === 'kanji_to_reading') return { label: o.reading, isCorrect: o === correct };
            if (type === 'reading_to_kanji') return { label: o.word, isCorrect: o === correct };
            // fill_blank
            return { label: o.word, isCorrect: o === correct };
        });
    }

    function renderQuizQ() {
        const q = quizQuestions[quizIdx];
        $('quiz-q-num').textContent = (quizIdx + 1) + ' / 10';
        $('quiz-progress-fill').style.width = ((quizIdx + 1) / 10 * 100) + '%';
        $('quiz-next-btn').disabled = true;

        if (q.type === 'kanji_to_reading') {
            $('quiz-type-label').textContent = '漢字 → 讀音';
            $('quiz-stem').textContent = q.item.word;
            $('quiz-stem-sub').textContent = q.item.meaning;
        } else if (q.type === 'reading_to_kanji') {
            $('quiz-type-label').textContent = '讀音 → 漢字';
            $('quiz-stem').textContent = q.item.reading;
            $('quiz-stem-sub').textContent = q.item.meaning;
        } else {
            $('quiz-type-label').textContent = '例句填空';
            const blanked = (q.item.example_raw || '').replace(q.item.word, '＿＿＿');
            $('quiz-stem').textContent = blanked;
            $('quiz-stem-sub').textContent = q.item.example_meaning || '';
        }

        const optDiv = $('quiz-options');
        optDiv.innerHTML = '';
        q.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.textContent = opt.label;
            btn.addEventListener('click', () => selectOption(btn, opt, q));
            optDiv.appendChild(btn);
        });
    }

    function selectOption(btn, opt, q) {
        const allBtns = $('quiz-options').querySelectorAll('.quiz-option');
        allBtns.forEach(b => { b.classList.add('disabled'); b.style.pointerEvents = 'none'; });

        const correct = opt.isCorrect;
        if (correct) {
            btn.classList.add('correct');
            quizScore += 10;
            $('quiz-score-live').textContent = quizScore;
        } else {
            btn.classList.add('wrong');
            allBtns.forEach(b => { if (q.options[Array.from(allBtns).indexOf(b)]?.isCorrect) b.classList.add('show-correct'); });
        }
        quizAnswers.push({
            question: q,
            selected: opt.label,
            correctLabel: q.options.find(o => o.isCorrect).label,
            isCorrect: correct
        });
        $('quiz-next-btn').disabled = false;
    }

    function nextQuizQ() {
        if (quizIdx < 9) { quizIdx++; renderQuizQ(); }
        else showQuizResult();
    }

    function showQuizResult() {
        $('quiz-active').style.display = 'none';
        $('quiz-result').style.display = 'flex';
        $('quiz-review-list').style.display = 'none';
        const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        const correctCount = quizAnswers.filter(a => a.isCorrect).length;
        $('result-score-num').textContent = quizScore;
        $('result-detail').textContent = `答對 ${correctCount} / 10`;
        $('result-time').textContent = `用時 ${mins}:${String(secs).padStart(2, '0')}`;

        // Save history with wrong answers
        const history = LS.get('jlpt_quiz_history', []);
        const wrongItems = quizAnswers.filter(a => !a.isCorrect).map(a => ({
            stem: a.question.type === 'kanji_to_reading' ? a.question.item.word
                : a.question.type === 'reading_to_kanji' ? a.question.item.reading
                : (a.question.item.example_raw || '').replace(a.question.item.word, '＿＿＿'),
            type: a.question.type,
            yourAnswer: a.selected,
            correctAnswer: a.correctLabel,
            word: a.question.item.word,
            reading: a.question.item.reading,
            meaning: a.question.item.meaning
        }));
        history.unshift({
            deck: quizDeck,
            score: quizScore,
            correct: correctCount,
            total: 10,
            time: elapsed,
            date: new Date().toISOString(),
            wrong: wrongItems
        });
        if (history.length > 100) history.length = 100;
        LS.set('jlpt_quiz_history', history);
    }

    function showReview() {
        const div = $('quiz-review-list');
        const wrongs = quizAnswers.filter(a => !a.isCorrect);
        if (!wrongs.length) { div.innerHTML = '<div class="starred-empty">全部答對，太棒了！🎉</div>'; }
        else {
            div.innerHTML = wrongs.map(a => {
                const stem = a.question.type === 'kanji_to_reading' ? a.question.item.word
                    : a.question.type === 'reading_to_kanji' ? a.question.item.reading
                    : (a.question.item.example_raw || '').replace(a.question.item.word, '＿＿＿');
                return `<div class="review-item">
                    <div class="review-q">${stem}</div>
                    <div class="review-your">✗ 你的答案: ${a.selected}</div>
                    <div class="review-correct">✓ 正確答案: ${a.correctLabel}</div>
                    <div style="color:var(--text3);font-size:.8rem;margin-top:.15rem;">${a.question.item.word}（${a.question.item.reading}）— ${a.question.item.meaning}</div>
                </div>`;
            }).join('');
        }
        div.style.display = 'flex';
    }

    // ==================== HISTORY ====================
    function renderHistory() {
        const history = LS.get('jlpt_quiz_history', []);
        const list = $('history-list');
        if (!history.length) { list.innerHTML = '<div class="history-empty">還沒有測驗記錄</div>'; return; }
        list.innerHTML = history.map((h, idx) => {
            const d = new Date(h.date);
            const dateStr = d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            const mins = Math.floor(h.time / 60);
            const secs = h.time % 60;
            const hasWrong = h.wrong && h.wrong.length > 0;
            return `<div class="history-item" data-idx="${idx}">
                <div class="history-info">
                    <div class="history-date">${dateStr}</div>
                    <div class="history-deck">${h.deck} Deck</div>
                    <div style="font-size:.75rem;color:var(--text3);">用時 ${mins}:${String(secs).padStart(2, '0')}</div>
                    ${hasWrong ? `<button class="history-review-btn" data-hidx="${idx}">查看錯題 →</button>` : ''}
                </div>
                <div class="history-stats">
                    <div class="history-score">${h.score}</div>
                    <div class="history-correct">${h.correct} / ${h.total} 正確</div>
                </div>
            </div>`;
        }).join('');
        // Attach review buttons
        list.querySelectorAll('.history-review-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.hidx);
                const h = history[idx];
                showHistoryReview(h.wrong);
            });
        });
    }

    function showHistoryReview(wrongItems) {
        // Switch to quiz tab and show review
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector('[data-tab="quiz"]').classList.add('active');
        $('tab-quiz').classList.add('active');

        $('quiz-start').style.display = 'none';
        $('quiz-active').style.display = 'none';
        $('quiz-result').style.display = 'flex';
        $('quiz-review-list').style.display = 'flex';

        $('result-score-num').textContent = '-';
        $('result-detail').textContent = '歷史錯題回顧';
        $('result-time').textContent = '';

        const div = $('quiz-review-list');
        if (!wrongItems || !wrongItems.length) {
            div.innerHTML = '<div class="starred-empty">此次測驗全部答對！🎉</div>';
        } else {
            div.innerHTML = wrongItems.map(w => `<div class="review-item">
                <div class="review-q">${w.stem}</div>
                <div class="review-your">✗ 你的答案: ${w.yourAnswer}</div>
                <div class="review-correct">✓ 正確答案: ${w.correctAnswer}</div>
                <div style="color:var(--text3);font-size:.8rem;margin-top:.15rem;">${w.word}（${w.reading}）— ${w.meaning}</div>
            </div>`).join('');
        }
    }

    // Back to quiz start from result
    $('result-retry-btn').addEventListener('click', () => {
        $('quiz-result').style.display = 'none';
        $('quiz-review-list').style.display = 'none';
        $('quiz-start').style.display = 'flex';
        startQuiz();
    });

    // ==================== UTILITY ====================
    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
});
