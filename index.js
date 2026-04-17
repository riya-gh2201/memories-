// ── TOAST ──
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}

// ── CLEAR OLD ENTRIES ON LOAD ──
localStorage.removeItem('memoryEntries');

// ── JOURNAL FEED ──
function renderJournalFeed() {
    const feed = document.getElementById('journalFeed');
    const entries = JSON.parse(localStorage.getItem('memoryEntries') || '[]');

    if (entries.length === 0) {
        feed.innerHTML = `
          <div class="section-head">
            <h2>your journal</h2>
          </div>
          <div class="empty-state">
            <h3>a blank page</h3>
            <p>You haven't captured any memories yet. The best time to start is now.</p>
            <a href="template-editor.html" class="add-btn" style="max-width:200px;margin:0 auto;display:block;">+ create entry</a>
          </div>
        `;
        return;
    }

    let html = `
        <div class="section-head">
          <h2>recent entries</h2>
          <span class="tally">${entries.length} total</span>
        </div>
      `;

    entries.forEach(e => {
        let dateStr = e.date;
        try {
            const d = new Date(e.date + 'T00:00:00');
            dateStr = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        } catch (err) { }

        const safeEmoji = e.emoji ? e.emoji.replace(/'/g, "\\'") : '📷';

        let mediaHtml = '';
        if (e.photos && e.photos.length > 0) {
            mediaHtml = `<img src="${e.photos[0]}" class="mc-img" alt="Memory Photo" onerror="this.outerHTML='<div class=\\'mc-img-placeholder\\'>${safeEmoji}</div>'">`;
        } else {
            mediaHtml = `<div class="mc-img-placeholder">${e.emoji || '📷'}</div>`;
        }

        html += `
          <div class="memory-card">
            ${mediaHtml}
            <div class="mc-body">
              <div class="mc-date">${dateStr}${e.mood ? ' &middot; ' + e.mood : ''}</div>
              <h3 class="mc-title">${e.emoji || ''} ${e.theme || 'Just Today'}</h3>
              <p class="mc-text">${e.caption || 'No words needed.'}</p>
            </div>
          </div>
        `;
    });

    feed.innerHTML = html;
}

renderJournalFeed();

// ── PHOTO CAROUSEL ──
(function initCarousel() {
    const slides = document.querySelectorAll('.c-slide');
    const dotsWrap = document.getElementById('cDots');
    const total = slides.length;
    let current = 0;

    // build dots
    for (let i = 0; i < total; i++) {
        const d = document.createElement('button');
        d.className = 'c-dot' + (i === 0 ? ' active' : '');
        d.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(d);
    }

    function goTo(idx) {
        slides[current].classList.remove('active');
        dotsWrap.children[current].classList.remove('active');
        current = (idx + total) % total;
        slides[current].classList.add('active');
        dotsWrap.children[current].classList.add('active');
    }

    document.getElementById('cPrev').addEventListener('click', () => goTo(current - 1));
    document.getElementById('cNext').addEventListener('click', () => goTo(current + 1));

    // auto-advance every 4s
    let timer = setInterval(() => goTo(current + 1), 4000);
    const card = document.querySelector('.carousel-card');
    card.addEventListener('mouseenter', () => clearInterval(timer));
    card.addEventListener('mouseleave', () => { timer = setInterval(() => goTo(current + 1), 4000); });
})();

// ── SENTENCE CASE ──
function capitalizeSentence(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        let text = node.nodeValue;
        let newText = text.replace(/(^\s*|\.\s+|\!\s+|\?\s+)([a-z])/g, (m, space, letter) => space + letter.toUpperCase());
        if (text !== newText) node.nodeValue = newText;
    } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
        node.childNodes.forEach(capitalizeSentence);
        ['placeholder', 'title'].forEach(attr => {
            if (node.hasAttribute(attr)) {
                let txt = node.getAttribute(attr);
                node.setAttribute(attr, txt.replace(/(^\s*|\.\s+|\!\s+|\?\s+)([a-z])/g, (m, s, l) => s + l.toUpperCase()));
            }
        });
    }
}
capitalizeSentence(document.body);