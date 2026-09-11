(function () {
  'use strict';

  const STORAGE_KEYS = {
    THEME: 'zodiac_theme',
    FAVORITES: 'zodiac_favorites',
    DATA: 'zodiac_data_cache'
  };

  const state = {
    zodiacSigns: [],
    tarotCards: [],
    currentZodiacTab: 'all',
    currentFortuneTab: 'today',
    searchKeyword: '',
    favorites: [],
    theme: 'light',
    drawnTarot: null,
    pairResult: null,
    luckySignKey: null
  };

  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $$(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function getAssetPath(relativePath) {
    const base = document.querySelector('base')?.getAttribute('href') || '';
    return base + relativePath.replace(/^\.?\//, '');
  }

  async function loadData() {
    showLoading(true);
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.DATA);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          state.zodiacSigns = parsed.zodiacSigns || [];
          state.tarotCards = parsed.tarotCards || [];
          if (state.zodiacSigns.length > 0) {
            showLoading(false);
            return;
          }
        } catch (e) { /* ignore */ }
      }

      const resp = await fetch(getAssetPath('./data/data.json'), { cache: 'no-cache' });
      if (!resp.ok) throw new Error('Failed to load data');
      const data = await resp.json();
      state.zodiacSigns = data.zodiacSigns || [];
      state.tarotCards = data.tarotCards || [];
      try {
        localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(data));
      } catch (e) { /* ignore */ }
    } catch (err) {
      console.error('Load data error:', err);
      state.zodiacSigns = getFallbackZodiac();
      state.tarotCards = getFallbackTarot();
    } finally {
      showLoading(false);
    }
  }

  function getFallbackZodiac() {
    return [
      { id: 1, signKey: 'aries', name: '白羊座', enName: 'Aries', symbol: '♈', symbolEmoji: '🐏', dateRange: '3月21日-4月19日', guardianPlanet: '火星', element: '火', elementEmoji: '🔥', oppositeSign: '天秤座', luckyColor: '红色', luckyNumber: '9', luckyJewelry: '红宝石', personality: '白羊座的人热情冲动、爱冒险、慷慨，天不怕地不怕。', strengths: ['积极坦白', '热爱自由'], weaknesses: ['急躁冲动', '粗心大意'], bestMatches: ['狮子座', '射手座'], worstMatches: ['摩羯座', '巨蟹座'], loveCompatibility: [{sign:'金牛座',score:65},{sign:'双子座',score:90}], fortunes: { today:{total:85,love:88,career:82,wealth:78,health:85,text:['运势不错','工作顺利','感情甜蜜']}, week:{total:80,love:82,career:78,wealth:75,health:83,text:['一周顺利']}, month:{total:78,love:80,career:76,wealth:72,health:80,text:['一月平稳']}, year:{total:82,love:85,career:80,wealth:78,health:84,text:['一年向好']}, loveOnly:{total:88,text:['爱情甜蜜']}, careerOnly:{total:82,text:['事业顺利']}, wealthOnly:{total:78,text:['财运稳定']}, healthOnly:{total:85,text:['健康良好']} }, tarotId: 0, relatedIds: [5,9] }
    ];
  }

  function getFallbackTarot() {
    return [{id:0,name:'愚者',enName:'The Fool',img:'🃏',uprightMeaning:['新的开始'],reversedMeaning:['鲁莽'],keywords:['开始','冒险']}];
  }

  function showLoading(show) {
    const el = $('#loadingState');
    if (!el) return;
    el.style.display = show ? 'block' : 'none';
    const grid = $('#zodiacGrid');
    if (grid && !show) {
      renderZodiacGrid();
    }
  }

  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved) {
      state.theme = saved;
    } else {
      state.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme();

    const toggleBtn = $('#themeToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleTheme);
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
        state.theme = e.matches ? 'dark' : 'light';
        applyTheme();
      }
    });
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    const icon = document.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = state.theme === 'dark' ? '☀️' : '🌙';
    }
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
    applyTheme();
  }

  function initFavorites() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      state.favorites = saved ? JSON.parse(saved) : [];
    } catch (e) {
      state.favorites = [];
    }
    updateFavCount();

    const favBtn = $('#favoritesBtn');
    if (favBtn) {
      favBtn.addEventListener('click', showFavorites);
    }
  }

  function updateFavCount() {
    const countEl = $('#favCount');
    if (countEl) countEl.textContent = state.favorites.length;
  }

  function isFavorite(signKey) {
    return state.favorites.includes(signKey);
  }

  function toggleFavorite(signKey, event) {
    if (event) event.stopPropagation();
    const idx = state.favorites.indexOf(signKey);
    if (idx > -1) {
      state.favorites.splice(idx, 1);
    } else {
      state.favorites.push(signKey);
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(state.favorites));
    updateFavCount();
    renderZodiacGrid();
    renderFavoritesGrid();
    if (state.luckySignKey) renderLuckySection();
  }

  function showFavorites() {
    hideAllSections();
    $('#favoritesSection').style.display = 'block';
    renderFavoritesGrid();
    $('#favoritesSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderFavoritesGrid() {
    const grid = $('#favoritesGrid');
    const empty = $('#favEmptyState');
    if (!grid) return;

    const favSigns = state.zodiacSigns.filter(s => state.favorites.includes(s.signKey));
    if (favSigns.length === 0) {
      if (empty) empty.style.display = 'block';
      grid.innerHTML = '';
      return;
    }
    if (empty) empty.style.display = 'none';
    grid.innerHTML = favSigns.map(s => createZodiacCardHTML(s)).join('');
    bindCardEvents(grid);
  }

  function renderZodiacTabs() {
    const tabs = $('#zodiacTabs');
    if (!tabs) return;

    const allBtn = `
      <button class="zodiac-tab active" data-sign="all">
        <span class="zodiac-tab-icon">✨</span>
        <span>全部</span>
      </button>
    `;
    const signBtns = state.zodiacSigns.map(s => `
      <button class="zodiac-tab sign-tab-${s.signKey}" data-sign="${s.signKey}">
        <span class="zodiac-tab-icon">${s.symbolEmoji}</span>
        <span>${s.name}</span>
      </button>
    `).join('');

    tabs.innerHTML = allBtn + signBtns;

    tabs.querySelectorAll('.zodiac-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.querySelectorAll('.zodiac-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const sign = tab.dataset.sign;
        state.currentZodiacTab = sign;
        applyZodiacTabStyle(tab, sign);
        renderZodiacGrid();
        if (sign !== 'all') {
          const signData = state.zodiacSigns.find(s => s.signKey === sign);
          if (signData) {
            showAllSections();
          }
        } else {
          showAllSections();
        }
      });
    });
  }

  function applyZodiacTabStyle(tab, signKey) {
    if (signKey === 'all') {
      tab.style.background = 'var(--primary-gradient)';
      tab.style.color = 'white';
      tab.style.borderColor = 'transparent';
      return;
    }
    const gradientVar = `--${signKey}-gradient`;
    tab.style.setProperty('background', `var(${gradientVar})`);
    tab.style.color = 'white';
    tab.style.borderColor = 'transparent';
  }

  function resetZodiacTabStyles() {
    const tabs = $$('#zodiacTabs .zodiac-tab');
    tabs.forEach(tab => {
      if (!tab.classList.contains('active')) {
        tab.style.background = '';
        tab.style.color = '';
        tab.style.borderColor = '';
      }
    });
  }

  function renderFortuneTabs() {
    const tabs = $('#fortuneTabs');
    if (!tabs) return;

    const tabTypes = [
      { key: 'today', label: '今日运势' },
      { key: 'week', label: '本周运势' },
      { key: 'month', label: '本月运势' },
      { key: 'year', label: '本年运势' },
      { key: 'loveOnly', label: '爱情运势' },
      { key: 'careerOnly', label: '事业运势' },
      { key: 'wealthOnly', label: '财运运势' },
      { key: 'healthOnly', label: '健康运势' }
    ];

    tabs.querySelectorAll('.fortune-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.querySelectorAll('.fortune-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.currentFortuneTab = tab.dataset.type;
        renderZodiacGrid();
      });
    });
  }

  function initSearch() {
    const input = $('#searchInput');
    const clearBtn = $('#searchClear');
    const clearSearchBtn = $('#clearSearchBtn');

    if (!input) return;

    const debouncedSearch = debounce((val) => {
      state.searchKeyword = val.trim().toLowerCase();
      if (clearBtn) clearBtn.style.display = val ? 'flex' : 'none';
      renderZodiacGrid();
    }, 300);

    input.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        state.searchKeyword = '';
        clearBtn.style.display = 'none';
        renderZodiacGrid();
        input.focus();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        input.value = '';
        state.searchKeyword = '';
        if (clearBtn) clearBtn.style.display = 'none';
        renderZodiacGrid();
      });
    }
  }

  function renderZodiacGrid() {
    const grid = $('#zodiacGrid');
    const empty = $('#emptyState');
    if (!grid) return;

    resetZodiacTabStyles();

    let signs = [...state.zodiacSigns];

    if (state.currentZodiacTab !== 'all') {
      signs = signs.filter(s => s.signKey === state.currentZodiacTab);
    }

    if (state.searchKeyword) {
      const kw = state.searchKeyword;
      signs = signs.filter(s => {
        const inName = s.name.toLowerCase().includes(kw) || s.enName.toLowerCase().includes(kw);
        const inDate = s.dateRange.includes(kw);
        const inPersonality = s.personality.toLowerCase().includes(kw);
        const inStrengths = s.strengths.some(x => x.toLowerCase().includes(kw));
        const inWeak = s.weaknesses.some(x => x.toLowerCase().includes(kw));
        const inElement = s.element.includes(kw);
        return inName || inDate || inPersonality || inStrengths || inWeak || inElement;
      });
    }

    if (signs.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    grid.innerHTML = signs.map(s => createZodiacCardHTML(s)).join('');
    bindCardEvents(grid);
  }

  function createZodiacCardHTML(sign) {
    const fortune = sign.fortunes[state.currentFortuneTab] || sign.fortunes.today;
    const totalScore = fortune.total || 0;
    const favClass = isFavorite(sign.signKey) ? 'active' : '';

    return `
      <div class="zodiac-card sign-${sign.signKey}" data-sign="${sign.signKey}">
        <div class="card-gradient">
          <button class="card-fav-btn ${favClass}" data-fav="${sign.signKey}">
            <span class="fav-heart">${isFavorite(sign.signKey) ? '❤️' : '🤍'}</span>
          </button>
          <span class="card-symbol">${sign.symbolEmoji}</span>
        </div>
        <div class="card-body">
          <div class="card-title">
            <span class="card-name">${sign.name}</span>
            <span class="card-date">${sign.dateRange}</span>
          </div>
          <div class="card-meta">
            <span class="meta-tag element-tag">${sign.elementEmoji} ${sign.element}象</span>
            <span class="meta-tag guardian-tag">⭐ ${sign.guardianPlanet}</span>
          </div>
          <div class="score-section">
            <div class="score-label">
              <span>综合运势</span>
              <span>${totalScore}分</span>
            </div>
            <div class="score-bar">
              <div class="score-fill" style="width:0%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function bindCardEvents(container) {
    container.querySelectorAll('.zodiac-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-fav-btn')) return;
        const signKey = card.dataset.sign;
        openSignDetail(signKey);
      });
    });

    container.querySelectorAll('[data-fav]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        toggleFavorite(btn.dataset.fav, e);
      });
    });

    setTimeout(() => {
      container.querySelectorAll('.score-fill').forEach(fill => {
        const card = fill.closest('.zodiac-card');
        const signKey = card?.dataset.sign;
        const sign = state.zodiacSigns.find(s => s.signKey === signKey);
        if (sign) {
          const fortune = sign.fortunes[state.currentFortuneTab] || sign.fortunes.today;
          fill.style.width = (fortune.total || 0) + '%';
        }
      });
    }, 50);
  }

  function openSignDetail(signKey) {
    const sign = state.zodiacSigns.find(s => s.signKey === signKey);
    if (!sign) return;

    if (location.hash !== `#/sign/${signKey}`) {
      location.hash = `#/sign/${signKey}`;
    }
    renderDetailModal(sign);
  }

  function closeDetailModal() {
    const modal = $('#detailModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
    if (location.hash.startsWith('#/sign/')) {
      history.pushState('', document.title, location.pathname + location.search);
    }
  }

  function renderDetailModal(sign) {
    const modal = $('#detailModal');
    const content = $('#detailModalContent');
    if (!modal || !content) return;

    const gradientVar = `--${sign.signKey}-gradient`;
    const gradient = getComputedStyle(document.documentElement).getPropertyValue(gradientVar).trim() || 'var(--primary-gradient)';

    const fortuneTypes = [
      { key: 'today', label: '今日' },
      { key: 'week', label: '本周' },
      { key: 'month', label: '本月' },
      { key: 'year', label: '本年' },
      { key: 'loveOnly', label: '爱情' },
      { key: 'careerOnly', label: '事业' },
      { key: 'wealthOnly', label: '财运' },
      { key: 'healthOnly', label: '健康' }
    ];

    const relatedSigns = sign.relatedIds
      .map(id => state.zodiacSigns.find(s => s.id === id))
      .filter(Boolean);

    content.innerHTML = `
      <button class="modal-close" id="detailCloseBtn">✕</button>

      <div class="detail-hero" style="background:${gradient}">
        <div class="detail-hero-content">
          <div class="detail-hero-symbol">${sign.symbolEmoji}</div>
          <div class="detail-hero-text">
            <div class="detail-hero-en">${sign.enName}</div>
            <div class="detail-hero-name">${sign.name} ${sign.symbol}</div>
            <div class="detail-hero-date">📅 ${sign.dateRange}</div>
            <div class="detail-hero-tags">
              <span class="hero-tag">${sign.elementEmoji} ${sign.element}象</span>
              <span class="hero-tag">⭐ ${sign.guardianPlanet}</span>
              <span class="hero-tag">❤️ ${isFavorite(sign.signKey) ? '已收藏' : '未收藏'}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-body">
        <div class="detail-section">
          <h3 class="detail-section-title">📋 基本信息</h3>
          <div class="detail-info-grid">
            <div class="info-item"><div class="info-label">日期范围</div><div class="info-value">${sign.dateRange}</div></div>
            <div class="info-item"><div class="info-label">守护星</div><div class="info-value">⭐ ${sign.guardianPlanet}</div></div>
            <div class="info-item"><div class="info-label">元素属性</div><div class="info-value">${sign.elementEmoji} ${sign.element}象</div></div>
            <div class="info-item"><div class="info-label">对宫星座</div><div class="info-value">🔄 ${sign.oppositeSign}</div></div>
            <div class="info-item"><div class="info-label">幸运色</div><div class="info-value">🎨 ${sign.luckyColor}</div></div>
            <div class="info-item"><div class="info-label">幸运数字</div><div class="info-value">🔢 ${sign.luckyNumber}</div></div>
            <div class="info-item"><div class="info-label">幸运珠宝</div><div class="info-value">💎 ${sign.luckyJewelry}</div></div>
            <div class="info-item"><div class="info-label">收藏状态</div><div class="info-value">
              <button class="btn-secondary" style="padding:4px 12px;font-size:12px" id="detailFavBtn">${isFavorite(sign.signKey) ? '❤️ 取消收藏' : '🤍 收藏'}</button>
            </div></div>
          </div>
        </div>

        <div class="detail-section">
          <h3 class="detail-section-title">💭 性格简介</h3>
          <p class="detail-personality">${sign.personality}</p>
        </div>

        <div class="detail-section">
          <h3 class="detail-section-title">✨ 优点与缺点</h3>
          <div class="traits-grid">
            <div class="traits-box strengths-box">
              <div class="traits-title">💪 优点</div>
              <ul class="traits-list">
                ${sign.strengths.map(s => `<li>${s}</li>`).join('')}
              </ul>
            </div>
            <div class="traits-box weaknesses-box">
              <div class="traits-title">⚠️ 缺点</div>
              <ul class="traits-list">
                ${sign.weaknesses.map(s => `<li>${s}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3 class="detail-section-title">💞 最佳与最差配对</h3>
          <div class="matches-grid">
            <div class="matches-box best-box">
              <div class="matches-title">🥰 最佳配对</div>
              <ul class="matches-list">
                ${sign.bestMatches.map(m => `<li>${m}</li>`).join('')}
              </ul>
            </div>
            <div class="matches-box worst-box">
              <div class="matches-title">😅 最差配对</div>
              <ul class="matches-list">
                ${sign.worstMatches.map(m => `<li>${m}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3 class="detail-section-title">🔮 运势详情</h3>
          <div class="detail-fortune-tabs" id="detailFortuneTabs">
            ${fortuneTypes.map((ft, i) => `
              <button class="detail-fortune-tab ${i === 0 ? 'active' : ''}" data-type="${ft.key}" style="${i === 0 ? 'background:' + gradient + ';' : ''}">${ft.label}</button>
            `).join('')}
          </div>
          <div class="fortune-content" id="fortuneContent">
            ${renderFortuneContent(sign, 'today', gradient)}
          </div>
        </div>

        <div class="detail-section">
          <h3 class="detail-section-title">💕 爱情配对匹配度</h3>
          <div class="love-compat-list">
            ${sign.loveCompatibility.map(lc => {
              const targetSign = state.zodiacSigns.find(s => s.name === lc.sign);
              const emoji = targetSign?.symbolEmoji || '⭐';
              return `
                <div class="love-compat-item" data-pair="${lc.sign}">
                  <div class="love-compat-emoji">${emoji}</div>
                  <div class="love-compat-info">
                    <div class="love-compat-name">${lc.sign}</div>
                    <div class="love-compat-bar">
                      <div class="love-compat-fill" style="width:0%"></div>
                    </div>
                  </div>
                  <div class="love-compat-score">${lc.score}%</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        ${relatedSigns.length > 0 ? `
        <div class="detail-section">
          <h3 class="detail-section-title">🌟 相关推荐（同${sign.element}象星座）</h3>
          <div class="related-signs-grid">
            ${relatedSigns.map(rs => `
              <div class="related-sign-card" data-related="${rs.signKey}">
                <div class="related-sign-emoji">${rs.symbolEmoji}</div>
                <div class="related-sign-info">
                  <div class="related-sign-name">${rs.name}</div>
                  <div class="related-sign-date">${rs.dateRange}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    `;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    modal.scrollTop = 0;

    bindDetailEvents(sign, gradient, fortuneTypes);
  }

  function renderFortuneContent(sign, type, gradient) {
    const fortune = sign.fortunes[type] || sign.fortunes.today;
    const isPeriodType = ['today', 'week', 'month', 'year'].includes(type);

    if (isPeriodType) {
      return `
        <div class="fortune-score-grid">
          <div class="fortune-score-item">
            <span class="fortune-score-icon">⭐</span>
            <div class="fortune-score-name">综合</div>
            <div class="fortune-score-bar-sm"><div class="fortune-score-fill-sm" style="width:0%;background:${gradient}"></div></div>
            <div class="fortune-score-num">${fortune.total}分</div>
          </div>
          <div class="fortune-score-item">
            <span class="fortune-score-icon">💕</span>
            <div class="fortune-score-name">爱情</div>
            <div class="fortune-score-bar-sm"><div class="fortune-score-fill-sm" style="width:0%;background:linear-gradient(135deg,#fd79a8,#e84393)"></div></div>
            <div class="fortune-score-num">${fortune.love}分</div>
          </div>
          <div class="fortune-score-item">
            <span class="fortune-score-icon">💼</span>
            <div class="fortune-score-name">事业</div>
            <div class="fortune-score-bar-sm"><div class="fortune-score-fill-sm" style="width:0%;background:linear-gradient(135deg,#74b9ff,#0984e3)"></div></div>
            <div class="fortune-score-num">${fortune.career}分</div>
          </div>
          <div class="fortune-score-item">
            <span class="fortune-score-icon">💰</span>
            <div class="fortune-score-name">财运</div>
            <div class="fortune-score-bar-sm"><div class="fortune-score-fill-sm" style="width:0%;background:linear-gradient(135deg,#fdcb6e,#f39c12)"></div></div>
            <div class="fortune-score-num">${fortune.wealth}分</div>
          </div>
          <div class="fortune-score-item">
            <span class="fortune-score-icon">💚</span>
            <div class="fortune-score-name">健康</div>
            <div class="fortune-score-bar-sm"><div class="fortune-score-fill-sm" style="width:0%;background:linear-gradient(135deg,#55efc4,#00b894)"></div></div>
            <div class="fortune-score-num">${fortune.health}分</div>
          </div>
        </div>
        <div class="fortune-text-list">
          ${fortune.text.map(t => `<p class="fortune-text-item">${t}</p>`).join('')}
        </div>
      `;
    } else {
      return `
        <div class="fortune-score-grid">
          <div class="fortune-score-item">
            <span class="fortune-score-icon">${type === 'loveOnly' ? '💕' : type === 'careerOnly' ? '💼' : type === 'wealthOnly' ? '💰' : '💚'}</span>
            <div class="fortune-score-name">${type === 'loveOnly' ? '爱情指数' : type === 'careerOnly' ? '事业指数' : type === 'wealthOnly' ? '财富指数' : '健康指数'}</div>
            <div class="fortune-score-bar-sm"><div class="fortune-score-fill-sm" style="width:0%;background:${gradient}"></div></div>
            <div class="fortune-score-num">${fortune.total}分</div>
          </div>
        </div>
        <div class="fortune-text-list">
          ${fortune.text.map(t => `<p class="fortune-text-item">${t}</p>`).join('')}
        </div>
      `;
    }
  }

  function bindDetailEvents(sign, gradient, fortuneTypes) {
    $('#detailCloseBtn')?.addEventListener('click', closeDetailModal);
    $('#detailModal').addEventListener('click', (e) => {
      if (e.target.id === 'detailModal') closeDetailModal();
    });
    document.addEventListener('keydown', onEscKey, { once: true });

    $('#detailFavBtn')?.addEventListener('click', () => {
      toggleFavorite(sign.signKey);
      renderDetailModal(sign);
    });

    const tabs = $$('#detailFortuneTabs .detail-fortune-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.style.background = '';
        });
        tab.classList.add('active');
        tab.style.background = gradient;
        const content = $('#fortuneContent');
        if (content) {
          content.innerHTML = renderFortuneContent(sign, tab.dataset.type, gradient);
          setTimeout(() => {
            content.querySelectorAll('.fortune-score-fill-sm').forEach(f => {
              const scoreMatch = f.closest('.fortune-score-item')?.querySelector('.fortune-score-num')?.textContent;
              const score = parseInt(scoreMatch) || 0;
              f.style.width = score + '%';
            });
          }, 50);
        }
      });
    });

    setTimeout(() => {
      $$('#fortuneContent .fortune-score-fill-sm').forEach(f => {
        const scoreMatch = f.closest('.fortune-score-item')?.querySelector('.fortune-score-num')?.textContent;
        const score = parseInt(scoreMatch) || 0;
        f.style.width = score + '%';
      });
    }, 100);

    $$('.love-compat-item').forEach(item => {
      item.addEventListener('click', () => {
        const signName = item.dataset.pair;
        const targetSign = state.zodiacSigns.find(s => s.name === signName);
        if (targetSign) {
          closeDetailModal();
          setTimeout(() => openSignDetail(targetSign.signKey), 200);
        }
      });
      const fill = item.querySelector('.love-compat-fill');
      const scoreText = item.querySelector('.love-compat-score')?.textContent;
      const score = parseInt(scoreText) || 0;
      setTimeout(() => {
        if (fill) fill.style.width = score + '%';
      }, 200 + Math.random() * 300);
    });

    $$('.related-sign-card').forEach(card => {
      card.addEventListener('click', () => {
        const key = card.dataset.related;
        closeDetailModal();
        setTimeout(() => openSignDetail(key), 200);
      });
    });
  }

  function onEscKey(e) {
    if (e.key === 'Escape') closeDetailModal();
  }

  function initHashRouter() {
    checkHashRoute();
    window.addEventListener('hashchange', checkHashRoute);
  }

  function checkHashRoute() {
    const hash = location.hash;
    const match = hash.match(/^#\/sign\/([a-z]+)$/i);
    if (match) {
      const signKey = match[1].toLowerCase();
      const sign = state.zodiacSigns.find(s => s.signKey === signKey);
      if (sign) renderDetailModal(sign);
    } else {
      const modal = $('#detailModal');
      if (modal && modal.style.display !== 'none') {
        closeDetailModal();
      }
    }
  }

  function initTarot() {
    $('#tarotToolBtn')?.addEventListener('click', showTarotSection);
    $('#drawTarotBtn')?.addEventListener('click', drawTarot);
    $('#redrawTarotBtn')?.addEventListener('click', drawTarot);
  }

  function showTarotSection() {
    hideAllSections();
    $('#tarotSection').style.display = 'block';
    $('#tarotSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function drawTarot() {
    if (state.tarotCards.length === 0) return;

    const positions = ['过去', '现在', '未来'];
    const drawn = [];
    const usedIds = new Set();

    while (drawn.length < 3) {
      const idx = Math.floor(Math.random() * state.tarotCards.length);
      const card = state.tarotCards[idx];
      if (!usedIds.has(card.id)) {
        usedIds.add(card.id);
        const isReversed = Math.random() < 0.35;
        drawn.push({
          ...card,
          isReversed,
          position: positions[drawn.length]
        });
      }
    }

    state.drawnTarot = drawn;
    renderTarotCards(drawn);
  }

  function renderTarotCards(cards) {
    const wrapper = $('#tarotCardsWrapper');
    const cardsEl = $('#tarotCards');
    const resultEl = $('#tarotResult');

    if (!wrapper || !cardsEl) return;
    wrapper.style.display = 'block';

    cardsEl.innerHTML = cards.map((c, i) => `
      <div class="tarot-card ${c.isReversed ? 'reversed' : 'upright'}" data-index="${i}" style="transition-delay:${i * 0.1}s">
        <div class="tarot-card-face tarot-card-back">
          <div class="tarot-card-back-pattern"></div>
        </div>
        <div class="tarot-card-face tarot-card-front">
          <div class="tarot-card-position">${c.position}</div>
          <div class="tarot-card-img">${c.img}</div>
          <div class="tarot-card-name">${c.name}</div>
          <div class="tarot-card-en">${c.enName}</div>
          <div class="tarot-card-orientation">${c.isReversed ? '逆位' : '正位'}</div>
        </div>
      </div>
    `).join('');

    if (resultEl) {
      resultEl.innerHTML = cards.map((c, i) => `
        <div class="tarot-result-item">
          <div class="tarot-result-header">
            <span class="tarot-result-pos">${c.position}</span>
            <span class="tarot-result-name">${c.img} ${c.name}</span>
            <span class="tarot-result-orient ${c.isReversed ? 'reversed-label' : 'upright-label'}">${c.isReversed ? '逆位' : '正位'}</span>
          </div>
          <div class="tarot-result-text">
            ${c.isReversed ? c.reversedMeaning.join('；') : c.uprightMeaning.join('；')}
          </div>
          <div class="tarot-result-keywords">
            ${c.keywords.map(k => `<span class="keyword-tag">${k}</span>`).join('')}
          </div>
        </div>
      `).join('');
    }

    setTimeout(() => {
      cardsEl.querySelectorAll('.tarot-card').forEach((card, i) => {
        setTimeout(() => {
          card.classList.add('flipped');
        }, i * 400);
      });
    }, 200);
  }

  function initPair() {
    $('#pairToolBtn')?.addEventListener('click', showPairSection);
    $('#calcPairBtn')?.addEventListener('click', calcPair);

    const yourInput = $('#yourBirthday');
    const taInput = $('#taBirthday');
    if (yourInput) yourInput.addEventListener('change', updatePairSignInfo);
    if (taInput) taInput.addEventListener('change', updatePairSignInfo);
  }

  function showPairSection() {
    hideAllSections();
    $('#pairSection').style.display = 'block';
    $('#pairSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function getSignFromDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const m = date.getMonth() + 1;
    const d = date.getDate();

    const ranges = [
      { sign: 'capricorn2', s: [1, 1], e: [1, 19] },
      { sign: 'aquarius', s: [1, 20], e: [2, 18] },
      { sign: 'pisces', s: [2, 19], e: [3, 20] },
      { sign: 'aries', s: [3, 21], e: [4, 19] },
      { sign: 'taurus', s: [4, 20], e: [5, 20] },
      { sign: 'gemini', s: [5, 21], e: [6, 21] },
      { sign: 'cancer', s: [6, 22], e: [7, 22] },
      { sign: 'leo', s: [7, 23], e: [8, 22] },
      { sign: 'virgo', s: [8, 23], e: [9, 22] },
      { sign: 'libra', s: [9, 23], e: [10, 23] },
      { sign: 'scorpio', s: [10, 24], e: [11, 22] },
      { sign: 'sagittarius', s: [11, 23], e: [12, 21] },
      { sign: 'capricorn', s: [12, 22], e: [12, 31] }
    ];

    for (const r of ranges) {
      if ((m === r.s[0] && d >= r.s[1]) || (m === r.e[0] && d <= r.e[1])) {
        const key = r.sign === 'capricorn2' ? 'capricorn' : r.sign;
        return state.zodiacSigns.find(s => s.signKey === key);
      }
    }
    return null;
  }

  function updatePairSignInfo() {
    const yourInput = $('#yourBirthday');
    const taInput = $('#taBirthday');
    const yourInfo = $('#yourSignInfo');
    const taInfo = $('#taSignInfo');
    const calcBtn = $('#calcPairBtn');

    const yourSign = getSignFromDate(yourInput?.value);
    const taSign = getSignFromDate(taInput?.value);

    if (yourInfo) {
      if (yourSign) {
        yourInfo.innerHTML = `${yourSign.symbolEmoji} <strong>${yourSign.name}</strong> (${yourSign.dateRange})`;
        yourInfo.classList.add('has-sign');
      } else {
        yourInfo.innerHTML = '请选择生日';
        yourInfo.classList.remove('has-sign');
      }
    }
    if (taInfo) {
      if (taSign) {
        taInfo.innerHTML = `${taSign.symbolEmoji} <strong>${taSign.name}</strong> (${taSign.dateRange})`;
        taInfo.classList.add('has-sign');
      } else {
        taInfo.innerHTML = '请选择生日';
        taInfo.classList.remove('has-sign');
      }
    }

    if (calcBtn) {
      calcBtn.disabled = !(yourSign && taSign);
    }
  }

  function calcPair() {
    const yourInput = $('#yourBirthday');
    const taInput = $('#taBirthday');
    const yourSign = getSignFromDate(yourInput?.value);
    const taSign = getSignFromDate(taInput?.value);
    if (!yourSign || !taSign) return;

    const pairData = yourSign.loveCompatibility.find(lc => lc.sign === taSign.name);
    const pairDataReverse = taSign.loveCompatibility.find(lc => lc.sign === yourSign.name);
    let baseScore = 70;
    if (pairData) baseScore = pairData.score;
    else if (pairDataReverse) baseScore = pairDataReverse.score;

    const dateBonus = calculateDateBonus(yourInput.value, taInput.value);
    const finalScore = Math.min(99, Math.max(30, baseScore + dateBonus));

    const loveScore = calcSubScore(finalScore, yourSign, taSign, 'love');
    const careerScore = calcSubScore(finalScore, yourSign, taSign, 'career');
    const wealthScore = calcSubScore(finalScore, yourSign, taSign, 'wealth');
    const healthScore = calcSubScore(finalScore, yourSign, taSign, 'health');

    state.pairResult = { yourSign, taSign, finalScore, loveScore, careerScore, wealthScore, healthScore };
    renderPairResult(state.pairResult);
  }

  function calculateDateBonus(d1, d2) {
    if (!d1 || !d2) return 0;
    const a = new Date(d1);
    const b = new Date(d2);
    const diffDays = Math.abs(Math.floor((a - b) / (1000 * 60 * 60 * 24)));
    const mod = diffDays % 9;
    if (mod === 0) return 5;
    if (mod <= 3) return 3;
    if (mod <= 6) return 0;
    return -2;
  }

  function calcSubScore(base, s1, s2, type) {
    let bonus = 0;
    const sameElement = s1.element === s2.element;
    const best = s1.bestMatches.includes(s2.name) || s2.bestMatches.includes(s1.name);
    const worst = s1.worstMatches.includes(s2.name) || s2.worstMatches.includes(s1.name);

    if (sameElement) bonus += 5;
    if (best) bonus += 8;
    if (worst) bonus -= 10;

    if (type === 'love') {
      if (['水', '水'].includes(s1.element) || (s1.element === '水' && s2.element === '土')) bonus += 3;
      if (['火', '风'].includes(s1.element) && ['火', '风'].includes(s2.element)) bonus += 3;
    } else if (type === 'career') {
      if (s1.element === '土' || s2.element === '土') bonus += 2;
    } else if (type === 'wealth') {
      if (['土', '水'].includes(s1.element) && ['土', '水'].includes(s2.element)) bonus += 3;
    } else if (type === 'health') {
      if (sameElement) bonus += 2;
    }

    return Math.min(99, Math.max(30, base + bonus + Math.floor(Math.random() * 5) - 2));
  }

  function renderPairResult(result) {
    const resultEl = $('#pairResult');
    if (!resultEl) return;

    const advices = generatePairAdvice(result);

    resultEl.style.display = 'block';
    resultEl.innerHTML = `
      <div class="pair-result-header">
        <div class="pair-sign">
          <span class="pair-sign-emoji">${result.yourSign.symbolEmoji}</span>
          <div class="pair-sign-name">${result.yourSign.name}</div>
        </div>
        <div class="pair-heart">💞</div>
        <div class="pair-sign">
          <span class="pair-sign-emoji">${result.taSign.symbolEmoji}</span>
          <div class="pair-sign-name">${result.taSign.name}</div>
        </div>
      </div>

      <div class="pair-score-section">
        <div class="pair-score-label">✨ 星座爱情匹配度 ✨</div>
        <div class="pair-score-bar">
          <div class="pair-score-fill" style="width:0%"></div>
        </div>
        <div class="pair-score-value">${result.finalScore}%</div>
      </div>

      <div class="pair-sub-scores">
        <div class="sub-score-item">
          <span class="sub-score-icon">💕</span>
          <div class="sub-score-name">感情契合</div>
          <div class="sub-score-bar"><div class="sub-score-fill" style="width:0%;background:linear-gradient(90deg,#fd79a8,#e84393)"></div></div>
          <div class="sub-score-num">${result.loveScore}</div>
        </div>
        <div class="sub-score-item">
          <span class="sub-score-icon">💼</span>
          <div class="sub-score-name">事业互助</div>
          <div class="sub-score-bar"><div class="sub-score-fill" style="width:0%;background:linear-gradient(90deg,#74b9ff,#0984e3)"></div></div>
          <div class="sub-score-num">${result.careerScore}</div>
        </div>
        <div class="sub-score-item">
          <span class="sub-score-icon">💰</span>
          <div class="sub-score-name">财富共创</div>
          <div class="sub-score-bar"><div class="sub-score-fill" style="width:0%;background:linear-gradient(90deg,#fdcb6e,#f39c12)"></div></div>
          <div class="sub-score-num">${result.wealthScore}</div>
        </div>
        <div class="sub-score-item">
          <span class="sub-score-icon">💚</span>
          <div class="sub-score-name">生活和谐</div>
          <div class="sub-score-bar"><div class="sub-score-fill" style="width:0%;background:linear-gradient(90deg,#55efc4,#00b894)"></div></div>
          <div class="sub-score-num">${result.healthScore}</div>
        </div>
      </div>

      <div class="pair-detail-section" style="margin-top:24px">
        <div class="pair-detail-title">🔮 综合分析</div>
        <div class="pair-detail-text">${advices.summary}</div>
      </div>
      <div class="pair-detail-section">
        <div class="pair-detail-title">💡 相处建议</div>
        <div class="pair-detail-text">${advices.advice}</div>
      </div>
    `;

    setTimeout(() => {
      const scoreFill = resultEl.querySelector('.pair-score-fill');
      if (scoreFill) scoreFill.style.width = result.finalScore + '%';

      resultEl.querySelectorAll('.sub-score-fill').forEach((fill, i) => {
        const scores = [result.loveScore, result.careerScore, result.wealthScore, result.healthScore];
        setTimeout(() => {
          fill.style.width = scores[i] + '%';
        }, i * 150);
      });
    }, 100);

    resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function generatePairAdvice(result) {
    const { yourSign: s1, taSign: s2, finalScore } = result;
    let summary, advice;

    if (finalScore >= 90) {
      summary = `${s1.name}与${s2.name}是天造地设的一对！你们的匹配度高达${finalScore}%，在十二星座中属于顶级配对。${s1.element}象的${s1.name}与${s2.element}象的${s2.name}之间有着天然的吸引力，性格互补又默契十足，只要真诚相待，这段感情极有可能开花结果，走向幸福美满的婚姻。`;
      advice = '建议珍惜这份难得的缘分，多给对方一些惊喜和浪漫。虽然你们很般配，但也要记得保持沟通，不要因为太熟悉而忽略了对方的感受。偶尔一起旅行或尝试新鲜事物，能让你们的感情持续升温，永远保持初恋般的甜蜜。';
    } else if (finalScore >= 80) {
      summary = `${s1.name}和${s2.name}是非常理想的组合，匹配度${finalScore}%。${s1.guardianPlanet}守护的${s1.name}与${s2.guardianPlanet}守护的${s2.name}在很多方面都能产生共鸣，虽然偶尔会有小摩擦，但总体来说感情和谐、相处愉快，是很被看好的一对。`;
      advice = '建议你们多花时间了解彼此的内心世界，遇到分歧时不要急于争对错，学会换位思考。${s1.name}可以多一些耐心，${s2.name}可以多一些表达，只要双方都愿意为这段感情付出努力，未来一定会更加美好。';
    } else if (finalScore >= 65) {
      summary = `${s1.name}与${s2.name}的匹配度为${finalScore}%，属于中等偏上水平。你们的关系需要一些时间去磨合，彼此之间有吸引力但也存在明显的性格差异。如果能够相互包容、取长补短，这段感情依然有很大的发展空间。`;
      advice = '建议你们多培养共同的兴趣爱好，创造更多美好回忆。遇到矛盾时不要冷战，坦诚沟通是解决问题的关键。${s1.name}需要注意控制自己的${s1.weaknesses[0] || '情绪'}，${s2.name}则要多关注对方的感受，只要努力经营，感情一定会越来越好。';
    } else {
      summary = `${s1.name}和${s2.name}的匹配度为${finalScore}%，在星座配对中属于需要较多努力的组合。${s1.element}象与${s2.element}象的性格差异较大，生活方式和价值观也可能存在分歧，但这并不代表你们没有可能，真爱可以跨越一切障碍。`;
      advice = '建议你们给彼此更多的空间和时间去适应对方，不要急于求成。学会欣赏对方与自己不同的地方，而不是试图改变对方。多一些包容和理解，少一些指责和抱怨，如果真心相爱，就勇敢地一起面对挑战吧。';
    }

    return { summary, advice };
  }

  function initLucky() {
    $('#luckyToolBtn')?.addEventListener('click', showLuckySection);
  }

  function showLuckySection() {
    hideAllSections();
    $('#luckySection').style.display = 'block';
    state.luckySignKey = state.luckySignKey || (state.zodiacSigns[0]?.signKey || null);
    renderLuckySection();
    $('#luckySection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderLuckySection() {
    const container = $('#luckyContainer');
    if (!container) return;

    const signBtns = state.zodiacSigns.map(s => {
      const gradientVar = `--${s.signKey}-gradient`;
      const activeStyle = state.luckySignKey === s.signKey ? `background:var(${gradientVar});color:white;border-color:transparent;` : '';
      return `<button class="lucky-sign-btn ${state.luckySignKey === s.signKey ? 'active' : ''}" data-sign="${s.signKey}" style="${activeStyle}">
        <span>${s.symbolEmoji}</span><span>${s.name}</span>
      </button>`;
    }).join('');

    let innerHTML = `
      <div class="lucky-select">
        <div class="lucky-select-label">🎯 选择你的星座查看今日幸运数字</div>
        <div class="lucky-sign-btns">${signBtns}</div>
      </div>
    `;

    if (state.luckySignKey) {
      const sign = state.zodiacSigns.find(s => s.signKey === state.luckySignKey);
      if (sign) {
        const seed = Date.now() / 86400000 | 0;
        const luckyNum = generateLuckyNumber(sign.id, seed);
        const luckyNums = generateMultipleLucky(sign.id, seed, 5);
        const yiJi = generateYiJi(sign, seed);

        const gradientVar = `--${sign.signKey}-gradient`;

        innerHTML += `
          <div class="lucky-display">
            <div class="lucky-main-number" style="background:var(${gradientVar})">${luckyNum}</div>
            <div class="lucky-number-label">${sign.name} · 今日幸运数字</div>
            <div class="lucky-number-desc">${luckyNums.join(' · ')} 为你的助运数字</div>
          </div>

          <div class="lucky-grid">
            <div class="lucky-item">
              <div class="lucky-item-icon">🎨</div>
              <div class="lucky-item-title">幸运色</div>
              <div class="lucky-item-value">${sign.luckyColor}</div>
            </div>
            <div class="lucky-item">
              <div class="lucky-item-icon">💎</div>
              <div class="lucky-item-title">幸运珠宝</div>
              <div class="lucky-item-value">${sign.luckyJewelry}</div>
            </div>
            <div class="lucky-item">
              <div class="lucky-item-icon">⭐</div>
              <div class="lucky-item-title">守护星</div>
              <div class="lucky-item-value">${sign.guardianPlanet}</div>
            </div>
            <div class="lucky-item">
              <div class="lucky-item-icon">${sign.elementEmoji}</div>
              <div class="lucky-item-title">元素属性</div>
              <div class="lucky-item-value">${sign.element}象</div>
            </div>
          </div>

          <div class="lucky-yi-ji">
            <div class="yi-ji-box yi-box">
              <div class="yi-ji-title">✅ 今日宜</div>
              <ul class="yi-ji-list">
                ${yiJi.yi.map(y => `<li>${y}</li>`).join('')}
              </ul>
            </div>
            <div class="yi-ji-box ji-box">
              <div class="yi-ji-title">⛔ 今日忌</div>
              <ul class="yi-ji-list">
                ${yiJi.ji.map(j => `<li>${j}</li>`).join('')}
              </ul>
            </div>
          </div>
        `;
      }
    }

    container.innerHTML = innerHTML;

    container.querySelectorAll('.lucky-sign-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.luckySignKey = btn.dataset.sign;
        renderLuckySection();
      });
    });
  }

  function generateLuckyNumber(signId, seed) {
    const hash = (signId * 9301 + seed * 49297) % 233280;
    return (hash % 9) + 1;
  }

  function generateMultipleLucky(signId, seed, count) {
    const nums = [];
    let s = seed;
    while (nums.length < count) {
      s = (signId * 1103515245 + s * 12345) & 0x7fffffff;
      const n = (s % 9) + 1;
      if (!nums.includes(n)) nums.push(n);
    }
    return nums.sort((a, b) => a - b);
  }

  function generateYiJi(sign, seed) {
    const allYi = [
      '表白心意', '签订合同', '出门远行', '投资理财', '面试求职',
      '朋友聚会', '学习新技能', '整理房间', '体检就医', '购物消费',
      '运动健身', '读书学习', '相亲约会', '搬家装修', '项目启动'
    ];
    const allJi = [
      '争吵辩论', '大额投资', '熬夜加班', '冲动消费', '手术动刀',
      '签约担保', '远行搬家', '借贷担保', '饮食无忌', '久坐不动',
      '冷漠沟通', '投机赌博', '更换工作', '情绪化决策', '拖延重要事项'
    ];

    const yi = [];
    const ji = [];
    let s = seed + sign.id * 7;
    while (yi.length < 5) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const idx = s % allYi.length;
      if (!yi.includes(allYi[idx])) yi.push(allYi[idx]);
    }
    while (ji.length < 5) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const idx = s % allJi.length;
      if (!ji.includes(allJi[idx])) ji.push(allJi[idx]);
    }
    return { yi, ji };
  }

  function hideAllSections() {
    $$('.zodiac-section, .tarot-section, .pair-section, .lucky-section, .favorites-section').forEach(s => {
      s.style.display = 'none';
    });
  }

  function showAllSections() {
    $('#zodiacSection') && ($('#zodiacSection').style.display = 'block');
    $('#tarotSection') && ($('#tarotSection').style.display = 'none');
    $('#pairSection') && ($('#pairSection').style.display = 'none');
    $('#luckySection') && ($('#luckySection').style.display = 'none');
    $('#favoritesSection') && ($('#favoritesSection').style.display = 'none');
  }

  function initBackToTop() {
    const btn = $('#backToTop');
    if (!btn) return;

    const toggle = () => {
      if (window.scrollY > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', toggle, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  async function initApp() {
    initTheme();
    initFavorites();
    initBackToTop();
    initSearch();
    initTarot();
    initPair();
    initLucky();

    await loadData();

    renderZodiacTabs();
    renderFortuneTabs();
    renderZodiacGrid();
    initHashRouter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
