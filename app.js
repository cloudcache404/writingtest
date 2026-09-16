/**
 * TypePulse Core Application Engine (Ultra-Fast & Zero-Lag)
 * Blazing 144Hz responsive typing, cached DOM lookup maps,
 * hardware-accelerated caret transforms, and instant feedback.
 */

class TypePulseApp {
  constructor() {
    this.state = {
      mode: 'time',
      modeVal: 30,
      punctuation: false,
      numbers: false,
      theme: 'midnight',
      soundProfile: 'thock',
      showKeyboard: true,

      status: 'idle',
      words: [],
      currentWordIndex: 0,
      currentCharIndex: 0,
      currentWordEl: null,
      currentWordRect: null,

      startTime: null,
      endTime: null,
      timerInterval: null,
      timeLeft: 30,

      keystrokes: {
        total: 0,
        correct: 0,
        incorrect: 0,
        extra: 0,
        missed: 0
      },
      keyErrors: {},
      timelineData: [],
      rawKeystrokeLog: [],

      customText: ''
    };

    this.replayPlayer = {
      timer: null,
      speed: 1,
      isPlaying: false
    };

    this.kbKeyMap = new Map();
    this.dom = {};
    this.init();
  }

  init() {
    this.cacheDom();
    this.cacheVirtualKeys();
    this.loadPreferences();
    this.bindEvents();
    this.startNewTest();
  }

  cacheDom() {
    this.dom = {
      body: document.body,
      html: document.documentElement,
      configToolbar: document.getElementById('config-toolbar'),
      subOptionsRow: document.getElementById('sub-options-row'),
      togglePunc: document.getElementById('toggle-punctuation'),
      toggleNum: document.getElementById('toggle-numbers'),

      themeBtn: document.getElementById('theme-btn'),
      soundBtn: document.getElementById('sound-btn'),
      keyboardToggleBtn: document.getElementById('keyboard-toggle-btn'),
      historyBtn: document.getElementById('history-btn'),

      typingArena: document.getElementById('typing-arena'),
      wordsContainer: document.getElementById('words-container'),
      wordsWrapper: document.getElementById('words-wrapper'),
      caret: document.getElementById('caret'),
      typingInput: document.getElementById('typing-input'),
      focusAlert: document.getElementById('focus-alert'),

      hudWpm: document.getElementById('hud-wpm'),
      hudAcc: document.getElementById('hud-acc'),
      hudTimer: document.getElementById('hud-timer'),
      restartBtn: document.getElementById('restart-btn'),

      virtualKeyboard: document.getElementById('virtual-keyboard'),

      // Results screen
      resultsScreen: document.getElementById('results-screen'),
      resultsBadge: document.getElementById('results-badge-mode'),
      resWpm: document.getElementById('res-wpm'),
      resAcc: document.getElementById('res-acc'),
      resAccSub: document.getElementById('res-acc-sub'),
      resRaw: document.getElementById('res-raw'),
      resConsistency: document.getElementById('res-consistency'),
      resultsChart: document.getElementById('results-chart'),
      problemKeysList: document.getElementById('problem-keys-list'),
      statCorrect: document.getElementById('stat-correct'),
      statIncorrect: document.getElementById('stat-incorrect'),
      statExtra: document.getElementById('stat-extra'),
      statTime: document.getElementById('stat-time'),
      nextTestBtn: document.getElementById('next-test-btn'),
      copyScoreBtn: document.getElementById('copy-score-btn'),

      // Replay
      replayArena: document.getElementById('replay-arena'),
      replayScrubber: document.getElementById('replay-scrubber'),
      replayPlayBtn: document.getElementById('replay-play-btn'),

      // Modals
      themeModal: document.getElementById('theme-modal'),
      customModal: document.getElementById('custom-modal'),
      historyModal: document.getElementById('history-modal'),
      customTextInput: document.getElementById('custom-text-input'),
      applyCustomBtn: document.getElementById('apply-custom-text-btn'),
      toastNotice: document.getElementById('toast-notice'),

      // History summary in modal
      histBestWpm: document.getElementById('hist-best-wpm'),
      histTotalTests: document.getElementById('hist-total-tests'),
      histAvgWpm: document.getElementById('hist-avg-wpm'),
      historyItemsContainer: document.getElementById('history-items-container'),
      clearHistoryBtn: document.getElementById('clear-history-btn')
    };
  }

  cacheVirtualKeys() {
    const keys = document.querySelectorAll('.kb-key');
    keys.forEach(k => {
      const keyVal = k.getAttribute('data-key');
      if (keyVal) {
        const lower = keyVal.toLowerCase();
        if (!this.kbKeyMap.has(lower)) {
          this.kbKeyMap.set(lower, []);
        }
        this.kbKeyMap.get(lower).push(k);
      }
    });
  }

  loadPreferences() {
    const savedTheme = localStorage.getItem('typepulse_theme') || 'midnight';
    this.setTheme(savedTheme);

    const savedSound = localStorage.getItem('typepulse_sound') || 'thock';
    this.setSoundProfile(savedSound);

    const savedKb = localStorage.getItem('typepulse_show_kb');
    if (savedKb !== null) {
      this.state.showKeyboard = savedKb === 'true';
      this.toggleKeyboard(this.state.showKeyboard);
    }
  }

  bindEvents() {
    // Mode Switchers
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        this.setMode(mode);
      });
    });

    // Sub Options (15, 30, 60, 100...)
    this.dom.subOptionsRow.addEventListener('click', (e) => {
      const btn = e.target.closest('.sub-pill');
      if (!btn) return;
      const val = parseInt(btn.getAttribute('data-val'), 10);
      this.setSubOption(val, btn);
    });

    // Punctuation & Numbers Toggles
    this.dom.togglePunc.addEventListener('click', () => {
      this.state.punctuation = !this.state.punctuation;
      this.dom.togglePunc.classList.toggle('active', this.state.punctuation);
      this.startNewTest();
    });

    this.dom.toggleNum.addEventListener('click', () => {
      this.state.numbers = !this.state.numbers;
      this.dom.toggleNum.classList.toggle('active', this.state.numbers);
      this.startNewTest();
    });

    // Restart Test
    this.dom.restartBtn.addEventListener('click', () => this.startNewTest());
    this.dom.nextTestBtn.addEventListener('click', () => this.startNewTest());

    // Focus handling
    this.dom.wordsContainer.addEventListener('click', () => this.focusTypingInput());
    this.dom.focusAlert.addEventListener('click', () => this.focusTypingInput());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.startNewTest();
        return;
      }
      if (e.key === 'Escape') {
        this.dom.typingInput.blur();
        this.updateFocusOverlay(false);
        return;
      }

      if (document.querySelector('.modal-backdrop.open')) {
        if (e.key === 'Escape') this.closeAllModals();
        return;
      }

      if (document.activeElement !== this.dom.typingInput &&
          document.activeElement !== this.dom.customTextInput &&
          !e.ctrlKey && !e.metaKey && e.key.length === 1) {
        this.focusTypingInput();
      }
    });

    // Fast Input Handling
    this.dom.typingInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.dom.typingInput.addEventListener('focus', () => this.updateFocusOverlay(true));
    this.dom.typingInput.addEventListener('blur', () => this.updateFocusOverlay(false));

    // Global Key visualizer highlights
    window.addEventListener('keydown', (e) => this.highlightKey(e.key, true));
    window.addEventListener('keyup', (e) => this.highlightKey(e.key, false));

    // Theme Picker
    this.dom.themeBtn.addEventListener('click', () => this.openModal(this.dom.themeModal));
    document.querySelectorAll('[data-theme-val]').forEach(card => {
      card.addEventListener('click', () => {
        const theme = card.getAttribute('data-theme-val');
        this.setTheme(theme);
        this.closeAllModals();
      });
    });

    // Sound Switcher
    this.dom.soundBtn.addEventListener('click', () => this.cycleSoundProfile());

    // Keyboard Visualizer Toggle
    this.dom.keyboardToggleBtn.addEventListener('click', () => {
      this.toggleKeyboard(!this.state.showKeyboard);
    });

    // History Modal
    this.dom.historyBtn.addEventListener('click', () => {
      this.renderHistoryModal();
      this.openModal(this.dom.historyModal);
    });

    this.dom.clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your typing history?')) {
        localStorage.removeItem('typepulse_history');
        this.renderHistoryModal();
        this.showToast('History cleared.');
      }
    });

    // Custom text handling
    this.dom.applyCustomBtn.addEventListener('click', () => {
      const text = this.dom.customTextInput.value.trim();
      if (text.length > 0) {
        this.state.customText = text;
        this.closeAllModals();
        this.startNewTest();
      }
    });

    // Modal Close buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.closeAllModals();
      });
    });

    this.dom.copyScoreBtn.addEventListener('click', () => this.copyScoreCard());

    // Replay Controls
    this.dom.replayPlayBtn.addEventListener('click', () => this.toggleReplay());
    document.querySelectorAll('.replay-speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.replay-speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.replayPlayer.speed = parseInt(btn.getAttribute('data-speed'), 10);
      });
    });

    window.addEventListener('resize', () => {
      if (this.state.status !== 'finished') {
        this.updateCaretPosition();
      }
    });
  }

  /* ----------------------------------------------------
     Mode & Config Management
     ---------------------------------------------------- */
  setMode(mode) {
    this.state.mode = mode;
    document.querySelectorAll('[data-mode]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-mode') === mode);
    });

    if (mode === 'custom') {
      this.openModal(this.dom.customModal);
      return;
    }

    this.renderSubOptions();
    this.startNewTest();
  }

  renderSubOptions() {
    const { mode } = this.state;
    let html = '';

    if (mode === 'time') {
      [15, 30, 60, 120].forEach(val => {
        const active = this.state.modeVal === val ? 'active' : '';
        html += `<button class="sub-pill ${active}" data-val="${val}">${val}s</button>`;
      });
      this.dom.subOptionsRow.style.display = 'flex';
    } else if (mode === 'words') {
      [10, 25, 50, 100].forEach(val => {
        const active = this.state.modeVal === val ? 'active' : '';
        html += `<button class="sub-pill ${active}" data-val="${val}">${val}</button>`;
      });
      this.dom.subOptionsRow.style.display = 'flex';
    } else {
      this.dom.subOptionsRow.style.display = 'none';
    }

    this.dom.subOptionsRow.innerHTML = html;
  }

  setSubOption(val, element) {
    this.state.modeVal = val;
    this.dom.subOptionsRow.querySelectorAll('.sub-pill').forEach(b => b.classList.remove('active'));
    if (element) element.classList.add('active');
    this.startNewTest();
  }

  setTheme(themeName) {
    this.state.theme = themeName;
    this.dom.html.setAttribute('data-theme', themeName);
    localStorage.setItem('typepulse_theme', themeName);
    document.querySelectorAll('[data-theme-val]').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-theme-val') === themeName);
    });
  }

  cycleSoundProfile() {
    const profiles = ['thock', 'blue', 'topre', 'typewriter', 'off'];
    const currIdx = profiles.indexOf(this.state.soundProfile);
    const nextProfile = profiles[(currIdx + 1) % profiles.length];
    this.setSoundProfile(nextProfile);
    this.showToast(`Sound: ${nextProfile.toUpperCase()}`);
  }

  setSoundProfile(profile) {
    this.state.soundProfile = profile;
    window.soundEngine.setProfile(profile);
    localStorage.setItem('typepulse_sound', profile);
    this.dom.soundBtn.setAttribute('data-tooltip', `Sound: ${profile.toUpperCase()}`);
    this.dom.soundBtn.classList.toggle('active', profile !== 'off');
  }

  toggleKeyboard(show) {
    this.state.showKeyboard = show;
    this.dom.virtualKeyboard.classList.toggle('hidden', !show);
    this.dom.keyboardToggleBtn.classList.toggle('active', show);
    localStorage.setItem('typepulse_show_kb', show);
  }

  /* ----------------------------------------------------
     Test Lifecycle Engine
     ---------------------------------------------------- */
  startNewTest() {
    clearInterval(this.state.timerInterval);
    this.stopReplay();

    this.state.status = 'idle';
    this.state.currentWordIndex = 0;
    this.state.currentCharIndex = 0;
    this.state.startTime = null;
    this.state.endTime = null;
    this.state.timelineData = [];
    this.state.rawKeystrokeLog = [];
    this.state.keyErrors = {};

    this.state.keystrokes = {
      total: 0,
      correct: 0,
      incorrect: 0,
      extra: 0,
      missed: 0
    };

    this.dom.resultsScreen.style.display = 'none';
    this.dom.typingArena.style.display = 'flex';
    this.dom.configToolbar.classList.remove('hidden-typing');

    this.dom.hudWpm.textContent = '0';
    this.dom.hudAcc.textContent = '100%';

    this.generateContent();
    this.renderWordTokens();

    if (this.state.mode === 'time') {
      this.state.timeLeft = this.state.modeVal || 30;
      this.dom.hudTimer.textContent = String(this.state.timeLeft);
    } else if (this.state.mode === 'words') {
      this.dom.hudTimer.textContent = `0 / ${this.state.modeVal || 25}`;
    } else if (this.state.mode === 'zen') {
      this.dom.hudTimer.textContent = '∞';
    } else {
      this.dom.hudTimer.textContent = `${this.state.words.length}w`;
    }

    this.dom.typingInput.value = '';
    this.focusTypingInput();
    this.state.currentWordEl = document.getElementById('word-0');
    this.updateCaretPosition();
  }

  generateContent() {
    const { mode, modeVal, punctuation, numbers, customText } = this.state;

    if (mode === 'custom' && customText) {
      this.state.words = customText.split(/\s+/).filter(w => w.length > 0);
    } else if (mode === 'quote') {
      const quoteObj = TextGenerator.getRandomQuote();
      this.state.words = quoteObj.text.split(' ');
    } else if (mode === 'code') {
      const codeObj = TextGenerator.getRandomCodeSnippet();
      this.state.words = codeObj.text.split(' ');
    } else if (mode === 'words') {
      const count = modeVal || 25;
      this.state.words = TextGenerator.getWords(count, { punctuation, numbers });
    } else if (mode === 'zen') {
      this.state.words = TextGenerator.getWords(100, { punctuation, numbers });
    } else {
      this.state.words = TextGenerator.getWords(120, { punctuation, numbers });
    }
  }

  renderWordTokens() {
    const wrapper = this.dom.wordsWrapper;
    wrapper.style.transform = 'translate3d(0, 0, 0)';
    wrapper.dataset.translateY = '0';

    const fragment = document.createDocumentFragment();

    this.state.words.forEach((wordStr, wordIdx) => {
      const wordEl = document.createElement('div');
      wordEl.className = `word ${wordIdx === 0 ? 'current-word' : ''}`;
      wordEl.id = `word-${wordIdx}`;

      for (let i = 0; i < wordStr.length; i++) {
        const charSpan = document.createElement('span');
        charSpan.className = 'char';
        charSpan.textContent = wordStr[i];
        wordEl.appendChild(charSpan);
      }

      fragment.appendChild(wordEl);
    });

    wrapper.innerHTML = '';
    wrapper.appendChild(fragment);
  }

  focusTypingInput() {
    this.dom.typingInput.focus();
    this.updateFocusOverlay(true);
  }

  updateFocusOverlay(isFocused) {
    this.dom.focusAlert.classList.toggle('active', !isFocused);
    this.dom.wordsContainer.classList.toggle('focused', isFocused);
  }

  /* ----------------------------------------------------
     Instant Keystroke Processing
     ---------------------------------------------------- */
  handleKeyDown(e) {
    if (this.state.status === 'finished') return;

    if (this.state.status === 'idle') {
      if (e.key.length === 1 || e.key === ' ' || e.key === 'Backspace') {
        this.startTestClock();
      }
    }

    // Play switch audio instantly
    window.soundEngine.playKeySound(e.key);

    if (e.key === 'Backspace' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.clearCurrentWord();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      this.handleBackspace();
      return;
    }

    if (e.key === ' ' || e.key === 'Space') {
      e.preventDefault();
      this.advanceToNextWord();
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      this.handleCharacterInput(e.key);
    }
  }

  handleCharacterInput(char) {
    const { currentWordIndex, currentCharIndex, words } = this.state;
    const targetWord = words[currentWordIndex] || '';
    const wordEl = this.state.currentWordEl || document.getElementById(`word-${currentWordIndex}`);
    if (!wordEl) return;

    const expectedChar = targetWord[currentCharIndex];
    const isCorrect = char === expectedChar;

    this.state.keystrokes.total++;

    if (!isCorrect) {
      const errTarget = expectedChar || 'extra';
      this.state.keyErrors[errTarget] = (this.state.keyErrors[errTarget] || 0) + 1;
      this.state.keystrokes.incorrect++;
      window.soundEngine.playErrorSound();
    } else {
      this.state.keystrokes.correct++;
    }

    this.state.rawKeystrokeLog.push({
      key: char,
      expected: expectedChar,
      time: Date.now() - this.state.startTime,
      isCorrect,
      wordIdx: currentWordIndex,
      charIdx: currentCharIndex
    });

    if (currentCharIndex < targetWord.length) {
      const charSpan = wordEl.children[currentCharIndex];
      if (charSpan) {
        charSpan.className = isCorrect ? 'char correct' : 'char incorrect';
      }
    } else {
      this.state.keystrokes.extra++;
      const extraSpan = document.createElement('span');
      extraSpan.className = 'char extra';
      extraSpan.textContent = char;
      wordEl.appendChild(extraSpan);
    }

    this.state.currentCharIndex++;
    this.updateCaretPosition();
  }

  handleBackspace() {
    const { currentWordIndex, currentCharIndex, words } = this.state;
    const wordEl = this.state.currentWordEl || document.getElementById(`word-${currentWordIndex}`);
    if (!wordEl) return;

    if (currentCharIndex > 0) {
      this.state.currentCharIndex--;
      const targetWord = words[currentWordIndex] || '';

      if (this.state.currentCharIndex >= targetWord.length) {
        const lastChild = wordEl.lastChild;
        if (lastChild && lastChild.classList.contains('extra')) {
          wordEl.removeChild(lastChild);
        }
      } else {
        const charSpan = wordEl.children[this.state.currentCharIndex];
        if (charSpan) {
          charSpan.className = 'char';
        }
      }
      this.updateCaretPosition();
    }
  }

  clearCurrentWord() {
    const { currentWordIndex, words } = this.state;
    const wordEl = this.state.currentWordEl || document.getElementById(`word-${currentWordIndex}`);
    const targetWord = words[currentWordIndex] || '';
    if (!wordEl) return;

    const extras = wordEl.querySelectorAll('.char.extra');
    extras.forEach(e => e.remove());

    for (let i = 0; i < targetWord.length; i++) {
      const charSpan = wordEl.children[i];
      if (charSpan) charSpan.className = 'char';
    }

    this.state.currentCharIndex = 0;
    this.updateCaretPosition();
  }

  advanceToNextWord() {
    const { currentWordIndex, currentCharIndex, words } = this.state;
    const currentWord = words[currentWordIndex] || '';
    const wordEl = this.state.currentWordEl || document.getElementById(`word-${currentWordIndex}`);

    if (currentCharIndex === 0) return;

    let hasError = false;
    if (currentCharIndex < currentWord.length) {
      hasError = true;
      this.state.keystrokes.missed += (currentWord.length - currentCharIndex);
    } else {
      const incorrectSpans = wordEl.querySelectorAll('.char.incorrect, .char.extra');
      if (incorrectSpans.length > 0) hasError = true;
    }

    if (hasError) {
      wordEl.classList.add('error-word');
    }

    wordEl.classList.remove('current-word');
    this.state.currentWordIndex++;
    this.state.currentCharIndex = 0;

    if (this.state.currentWordIndex >= words.length) {
      this.finishTest();
      return;
    }

    const nextWordEl = document.getElementById(`word-${this.state.currentWordIndex}`);
    this.state.currentWordEl = nextWordEl;
    if (nextWordEl) {
      nextWordEl.classList.add('current-word');
    }

    if ((this.state.mode === 'time' || this.state.mode === 'zen') &&
        this.state.currentWordIndex > words.length - 20) {
      this.appendMoreWords(50);
    }

    this.checkLineScroll();
    this.updateCaretPosition();
    this.updateLiveHUD();
  }

  appendMoreWords(count = 50) {
    const moreWords = TextGenerator.getWords(count, {
      punctuation: this.state.punctuation,
      numbers: this.state.numbers
    });

    const startIdx = this.state.words.length;
    this.state.words.push(...moreWords);

    const wrapper = this.dom.wordsWrapper;
    const fragment = document.createDocumentFragment();

    moreWords.forEach((wordStr, idx) => {
      const wordIdx = startIdx + idx;
      const wordEl = document.createElement('div');
      wordEl.className = 'word';
      wordEl.id = `word-${wordIdx}`;

      for (let i = 0; i < wordStr.length; i++) {
        const charSpan = document.createElement('span');
        charSpan.className = 'char';
        charSpan.textContent = wordStr[i];
        wordEl.appendChild(charSpan);
      }
      fragment.appendChild(wordEl);
    });

    wrapper.appendChild(fragment);
  }

  /* ----------------------------------------------------
     Hardware-Accelerated Caret Positioning
     ---------------------------------------------------- */
  updateCaretPosition() {
    const { currentWordIndex, currentCharIndex } = this.state;
    const wordEl = this.state.currentWordEl || document.getElementById(`word-${currentWordIndex}`);
    if (!wordEl) return;

    const caret = this.dom.caret;
    const containerRect = this.dom.wordsContainer.getBoundingClientRect();

    let targetLeft = 0;
    let targetTop = 0;

    if (currentCharIndex === 0) {
      const wordRect = wordEl.getBoundingClientRect();
      targetLeft = wordRect.left - containerRect.left;
      targetTop = wordRect.top - containerRect.top + 4;
    } else {
      const charSpan = wordEl.children[currentCharIndex - 1];
      if (charSpan) {
        const charRect = charSpan.getBoundingClientRect();
        targetLeft = charRect.right - containerRect.left;
        targetTop = charRect.top - containerRect.top + 4;
      }
    }

    caret.style.transform = `translate3d(${Math.max(0, targetLeft)}px, ${Math.max(0, targetTop)}px, 0)`;
  }

  checkLineScroll() {
    const wordEl = this.state.currentWordEl || document.getElementById(`word-${this.state.currentWordIndex}`);
    if (!wordEl) return;

    const wrapper = this.dom.wordsWrapper;
    const containerRect = this.dom.wordsContainer.getBoundingClientRect();
    const wordRect = wordEl.getBoundingClientRect();

    const relativeTop = wordRect.top - containerRect.top;

    if (relativeTop > 65) {
      const currentTranslate = parseInt(wrapper.dataset.translateY || '0', 10);
      const newTranslate = currentTranslate - 46;
      wrapper.style.transform = `translate3d(0, ${newTranslate}px, 0)`;
      wrapper.dataset.translateY = String(newTranslate);
    }
  }

  /* ----------------------------------------------------
     Timer & Live Metrics
     ---------------------------------------------------- */
  startTestClock() {
    this.state.status = 'running';
    this.state.startTime = Date.now();
    this.dom.configToolbar.classList.add('hidden-typing');

    let secondsPassed = 0;

    this.state.timerInterval = setInterval(() => {
      secondsPassed++;
      const timeElapsed = (Date.now() - this.state.startTime) / 1000;

      const metrics = this.calculateMetrics(timeElapsed);
      this.state.timelineData.push({
        second: secondsPassed,
        wpm: metrics.wpm,
        rawWpm: metrics.rawWpm,
        errors: this.state.keystrokes.incorrect
      });

      if (this.state.mode === 'time') {
        this.state.timeLeft--;
        this.dom.hudTimer.textContent = String(Math.max(0, this.state.timeLeft));
        if (this.state.timeLeft <= 0) {
          this.finishTest();
        }
      } else if (this.state.mode === 'words') {
        this.dom.hudTimer.textContent = `${this.state.currentWordIndex} / ${this.state.modeVal}`;
      } else if (this.state.mode === 'zen') {
        this.dom.hudTimer.textContent = `${Math.floor(timeElapsed)}s`;
      }

      this.updateLiveHUD(metrics);
    }, 1000);
  }

  calculateMetrics(timeElapsedSec) {
    if (!timeElapsedSec || timeElapsedSec <= 0) {
      return { wpm: 0, rawWpm: 0, accuracy: 100, consistency: 100 };
    }

    const minutes = timeElapsedSec / 60;
    const correctChars = this.state.keystrokes.correct;
    const totalTyped = this.state.keystrokes.total;

    const netWpm = Math.max(0, Math.round((correctChars / 5) / minutes));
    const rawWpm = Math.max(0, Math.round((totalTyped / 5) / minutes));
    const accuracy = totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 100;

    let consistency = 95;
    if (this.state.timelineData.length >= 3) {
      const wpms = this.state.timelineData.map(d => d.wpm);
      const avg = wpms.reduce((a, b) => a + b, 0) / wpms.length;
      const variance = wpms.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / wpms.length;
      const stdDev = Math.sqrt(variance);
      consistency = Math.max(40, Math.min(100, Math.round(100 - (stdDev / (avg || 1)) * 100)));
    }

    return { wpm: netWpm, rawWpm, accuracy, consistency };
  }

  updateLiveHUD(metrics = null) {
    const elapsed = this.state.startTime ? (Date.now() - this.state.startTime) / 1000 : 0;
    const m = metrics || this.calculateMetrics(elapsed);

    this.dom.hudWpm.textContent = String(m.wpm);
    this.dom.hudAcc.textContent = `${m.accuracy}%`;
  }

  /* ----------------------------------------------------
     Test Completion & Analytics
     ---------------------------------------------------- */
  finishTest() {
    clearInterval(this.state.timerInterval);
    this.state.status = 'finished';
    this.state.endTime = Date.now();

    window.soundEngine.playCompleteSound();

    const totalTimeSec = (this.state.endTime - this.state.startTime) / 1000;
    const metrics = this.calculateMetrics(totalTimeSec);

    this.saveSessionStats(metrics, totalTimeSec);
    this.renderResults(metrics, totalTimeSec);
  }

  renderResults(metrics, totalTimeSec) {
    this.dom.typingArena.style.display = 'none';
    this.dom.resultsScreen.style.display = 'block';

    const modeLabel = `${this.state.mode.toUpperCase()} ${this.state.mode === 'time' || this.state.mode === 'words' ? this.state.modeVal : ''}`;
    this.dom.resultsBadge.textContent = modeLabel;

    this.dom.resWpm.textContent = String(metrics.wpm);
    this.dom.resAcc.textContent = `${metrics.accuracy}%`;
    this.dom.resAccSub.textContent = `${this.state.keystrokes.incorrect} errors`;
    this.dom.resRaw.textContent = String(metrics.rawWpm);
    this.dom.resConsistency.textContent = `${metrics.consistency}%`;

    this.dom.statCorrect.textContent = String(this.state.keystrokes.correct);
    this.dom.statIncorrect.textContent = String(this.state.keystrokes.incorrect);
    this.dom.statExtra.textContent = String(this.state.keystrokes.extra);
    this.dom.statTime.textContent = `${Math.round(totalTimeSec)}s`;

    const sortedErrors = Object.entries(this.state.keyErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (sortedErrors.length > 0) {
      this.dom.problemKeysList.innerHTML = sortedErrors.map(([key, count]) =>
        `<span class="problem-key-pill">${key === ' ' ? 'Space' : key}: ${count} miskeys</span>`
      ).join('');
    } else {
      this.dom.problemKeysList.innerHTML = '<span class="problem-key-pill" style="color:var(--char-correct); background:rgba(0,240,255,0.1); border-color:var(--accent);">Flawless Run! 🎯</span>';
    }

    this.drawResultsChart();
    this.setupReplay();
  }

  drawResultsChart() {
    const canvas = this.dom.resultsChart;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const width = canvas.parentElement.clientWidth - 36;
    const height = 160;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const data = this.state.timelineData;
    if (data.length < 2) return;

    const padding = { top: 15, right: 15, bottom: 25, left: 30 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxWpm = Math.max(...data.map(d => Math.max(d.wpm, d.rawWpm)), 40);
    const minWpm = 0;

    const getX = (i) => padding.left + (i / (data.length - 1)) * chartW;
    const getY = (val) => padding.top + chartH - ((val - minWpm) / (maxWpm - minWpm)) * chartH;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const yVal = minWpm + (i / 4) * (maxWpm - minWpm);
      const yPos = getY(yVal);

      ctx.beginPath();
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(width - padding.right, yPos);
      ctx.stroke();

      ctx.fillStyle = '#6e7a91';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(Math.round(yVal), 4, yPos + 3);
    }

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    data.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d.rawWpm);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00f0ff';

    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, `${accentColor}33`);
    gradient.addColorStop(1, `${accentColor}00`);

    ctx.beginPath();
    data.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d.wpm);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(getX(data.length - 1), height - padding.bottom);
    ctx.lineTo(getX(0), height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    data.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d.wpm);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = '#ff3366';
    data.forEach((d, i) => {
      if (d.errors > 0 && i > 0 && d.errors > data[i - 1].errors) {
        const x = getX(i);
        const y = getY(d.wpm);
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  /* ----------------------------------------------------
     Keystroke Replay
     ---------------------------------------------------- */
  setupReplay() {
    this.stopReplay();
    this.dom.replayArena.innerHTML = '';
    this.dom.replayPlayBtn.textContent = '▶ Play Replay';
    this.dom.replayScrubber.value = '0';
    this.dom.replayScrubber.max = String(this.state.rawKeystrokeLog.length);
  }

  toggleReplay() {
    if (this.replayPlayer.isPlaying) {
      this.stopReplay();
    } else {
      this.startReplay();
    }
  }

  startReplay() {
    const logs = this.state.rawKeystrokeLog;
    if (logs.length === 0) return;

    this.replayPlayer.isPlaying = true;
    this.dom.replayPlayBtn.textContent = '⏸ Pause';
    this.dom.replayArena.innerHTML = '';

    let idx = 0;
    const intervalTime = 50 / this.replayPlayer.speed;

    this.replayPlayer.timer = setInterval(() => {
      if (idx >= logs.length) {
        this.stopReplay();
        return;
      }

      const item = logs[idx];
      const span = document.createElement('span');
      span.className = `char ${item.isCorrect ? 'correct' : 'incorrect'}`;
      span.textContent = item.key;
      this.dom.replayArena.appendChild(span);
      this.dom.replayArena.scrollTop = this.dom.replayArena.scrollHeight;

      this.dom.replayScrubber.value = String(idx);
      idx++;
    }, intervalTime);
  }

  stopReplay() {
    this.replayPlayer.isPlaying = false;
    clearInterval(this.replayPlayer.timer);
    this.dom.replayPlayBtn.textContent = '▶ Play Replay';
  }

  /* ----------------------------------------------------
     O(1) Virtual Keyboard Key Lighting
     ---------------------------------------------------- */
  highlightKey(keyStr, isActive) {
    if (!this.state.showKeyboard) return;
    const lower = keyStr.toLowerCase();
    const keyElements = this.kbKeyMap.get(lower) || this.kbKeyMap.get(keyStr);
    if (keyElements) {
      for (let i = 0; i < keyElements.length; i++) {
        if (isActive) keyElements[i].classList.add('active');
        else keyElements[i].classList.remove('active');
      }
    }
  }

  /* ----------------------------------------------------
     History & Share Utilities
     ---------------------------------------------------- */
  saveSessionStats(metrics, durationSec) {
    const session = {
      date: new Date().toLocaleDateString(),
      wpm: metrics.wpm,
      rawWpm: metrics.rawWpm,
      accuracy: metrics.accuracy,
      mode: `${this.state.mode} ${this.state.modeVal || ''}`,
      time: Math.round(durationSec)
    };

    const history = JSON.parse(localStorage.getItem('typepulse_history') || '[]');
    history.unshift(session);
    if (history.length > 50) history.pop();
    localStorage.setItem('typepulse_history', JSON.stringify(history));
  }

  renderHistoryModal() {
    const history = JSON.parse(localStorage.getItem('typepulse_history') || '[]');
    const totalTests = history.length;

    let bestWpm = 0;
    let avgWpm = 0;

    if (totalTests > 0) {
      bestWpm = Math.max(...history.map(h => h.wpm));
      avgWpm = Math.round(history.reduce((a, b) => a + b.wpm, 0) / totalTests);
    }

    this.dom.histBestWpm.textContent = String(bestWpm);
    this.dom.histTotalTests.textContent = String(totalTests);
    this.dom.histAvgWpm.textContent = String(avgWpm);

    if (history.length === 0) {
      this.dom.historyItemsContainer.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted)">No test history yet. Complete a test to see your stats here!</div>';
      return;
    }

    this.dom.historyItemsContainer.innerHTML = history.map(item => `
      <div class="history-item">
        <div>
          <div class="history-wpm">${item.wpm} <span style="font-size:0.8rem; color:var(--text-muted)">WPM</span></div>
          <div class="history-meta">${item.accuracy}% acc · ${item.mode}</div>
        </div>
        <div class="history-meta">${item.date}</div>
      </div>
    `).join('');
  }

  copyScoreCard() {
    const wpm = this.dom.resWpm.textContent;
    const acc = this.dom.resAcc.textContent;
    const mode = this.dom.resultsBadge.textContent;
    const text = `⚡ TypePulse Score: ${wpm} WPM | ${acc} Accuracy | Mode: ${mode} 🔥 test your speed at TypePulse!`;

    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Score copied to clipboard! 📋');
    }).catch(() => {
      this.showToast('Score generated!');
    });
  }

  showToast(message) {
    const toast = this.dom.toastNotice;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  openModal(modal) {
    modal.classList.add('open');
  }

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
    this.focusTypingInput();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new TypePulseApp();
});
