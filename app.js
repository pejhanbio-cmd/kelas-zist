const state = { currentKey: null, notesTimer: null };

const navEl     = document.getElementById('nav');
const contentEl = document.getElementById('content');
const sidebarEl = document.getElementById('sidebar');
const searchEl  = document.getElementById('search');
const toastEl   = document.getElementById('toast');

/* ---------- ابزارها ---------- */
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function getBook(id) {
  return data.books.find(b => b.id === id);
}

function lessonKey(bookId, chIdx, lesIdx) {
  return `${bookId}|${chIdx}|${lesIdx}`;
}

function getLesson(bookId, chIdx, lesIdx) {
  const book = getBook(bookId);
  if (!book) return null;
  if (chIdx === 'h') {
    const lesson = book.lessons?.[lesIdx];
    return lesson ? { lesson, chapter: null, book } : null;
  }
  const chapter = book.chapters?.[chIdx];
  const lesson = chapter?.lessons?.[lesIdx];
  return lesson ? { lesson, chapter, book } : null;
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 1800);
}

/* ---------- تم ---------- */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-toggle').textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('bioTheme', theme);
}
function initTheme() {
  const saved = localStorage.getItem('bioTheme')
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(saved);
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });
}

/* ---------- منو ---------- */
function buildNav() {
  navEl.innerHTML = '';
  data.books.forEach(book => {
    const bookWrap = el('div', 'nav-book collapsed');

    const title = el('button', 'nav-book-title',
      `<span class="arrow">▾</span>
       <span class="nav-book-emoji">${book.emoji || '📘'}</span>
       <span>${book.title}</span>`);
    title.addEventListener('click', () => bookWrap.classList.toggle('collapsed'));
    bookWrap.appendChild(title);

    const body = el('div', 'nav-book-body');

    if (book.chapters) {
      book.chapters.forEach((chapter, ci) => {
        const chapWrap = el('div', 'nav-chapter collapsed');
        const chapBtn = el('button', 'nav-chapter-title',
          `<span class="arrow">▾</span><span>${chapter.title}</span>`);
        chapBtn.addEventListener('click', e => {
          e.stopPropagation();
          chapWrap.classList.toggle('collapsed');
        });
        chapWrap.appendChild(chapBtn);

        const chapBody = el('div', 'nav-chapter-body');
        chapter.lessons.forEach((lesson, li) => {
          const key = lessonKey(book.id, ci, li);
          chapBody.appendChild(makeLessonNavBtn(book.id, ci, li, lesson.title, key));
        });
        chapWrap.appendChild(chapBody);
        body.appendChild(chapWrap);
      });
    }

    if (book.lessons) {
      book.lessons.forEach((lesson, li) => {
        const key = lessonKey(book.id, 'h', li);
        body.appendChild(makeLessonNavBtn(book.id, 'h', li, lesson.title, key));
      });
    }

    bookWrap.appendChild(body);
    navEl.appendChild(bookWrap);
  });
}

function makeLessonNavBtn(bookId, chIdx, lesIdx, title, key) {
  const btn = el('button', 'nav-lesson', title);
  btn.dataset.key = key;
  btn.addEventListener('click', () => {
    location.hash = `#/lesson/${bookId}/${chIdx}/${lesIdx}`;
    sidebarEl.classList.remove('open');
  });
  return btn;
}

function setActiveNav(key) {
  document.querySelectorAll('.nav-lesson.active').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.nav-book, .nav-chapter').forEach(el => el.classList.add('collapsed'));
  if (!key) return;
  const btn = document.querySelector(`.nav-lesson[data-key="${key}"]`);
  if (!btn) return;
  btn.classList.add('active');
  let parent = btn.parentElement;
  while (parent && parent !== navEl) {
    if (parent.classList.contains('nav-chapter') || parent.classList.contains('nav-book')) {
      parent.classList.remove('collapsed');
    }
    parent = parent.parentElement;
  }
}

/* ---------- روتینگ ---------- */
function handleRoute() {
  const hash = location.hash.slice(1) || '/';

  if (hash === '/' || hash === '') {
    renderHome();
    setActiveNav(null);
    return;
  }
  if (hash.startsWith('/book/')) {
    const bookId = hash.split('/')[2];
    renderBook(bookId);
    setActiveNav(null);
    return;
  }
  if (hash.startsWith('/lesson/')) {
    const parts = hash.split('/');
    const bookId = parts[2];
    const chIdx = parts[3];
    const lesIdx = parseInt(parts[4], 10);
    renderLesson(bookId, chIdx, lesIdx);
    setActiveNav(lessonKey(bookId, chIdx, lesIdx));
    return;
  }
  renderHome();
}

/* ---------- خانه ---------- */
function renderHome() {
  const totalLessons = data.books.reduce((sum, b) => {
    if (b.chapters) return sum + b.chapters.reduce((s, c) => s + c.lessons.length, 0);
    return sum + (b.lessons?.length || 0);
  }, 0);

  contentEl.innerHTML = `
    <div class="home-hero">
      <h1>🍵 به کلاس زیست من خوش آمدی</h1>
      <p>${totalLessons} درس، در ۴ کتاب درسی — انتخاب کن و یاد بگیر.</p>
    </div>
    <div class="cards-grid">
      ${data.books.map(b => {
        const chapterCount = b.chapters ? b.chapters.length : 0;
        const lessonCount = b.chapters
          ? b.chapters.reduce((s, c) => s + c.lessons.length, 0)
          : (b.lessons?.length || 0);
        const meta = b.chapters
          ? `${chapterCount} فصل • ${lessonCount} گفتار`
          : `${lessonCount} درس`;
        return `
          <a class="book-card" href="#/book/${b.id}">
            <span class="emoji">${b.emoji || '📘'}</span>
            <div class="title">${b.title}</div>
            <div class="meta">${meta}</div>
            <span class="cta">مشاهده ←</span>
          </a>
        `;
      }).join('')}
    </div>
  `;
  window.scrollTo({ top: 0 });
}

/* ---------- صفحهٔ کتاب ---------- */
function renderBook(bookId) {
  const book = getBook(bookId);
  if (!book) { renderHome(); return; }

  let html = `
    <div class="crumb"><a href="#/">خانه</a> › ${book.title}</div>
    <h2 class="page-title">${book.emoji || '📘'} ${book.title}</h2>
  `;

  if (book.chapters) {
    book.chapters.forEach((chapter, ci) => {
      const lessons = chapter.lessons.map((lesson, li) => `
        <a class="lesson-link" href="#/lesson/${book.id}/${ci}/${li}">
          <span class="bullet">◆</span>
          <span>${lesson.title}</span>
        </a>
      `).join('');
      html += `
        <div class="chapter-block">
          <h3>${chapter.title}</h3>
          ${lessons}
        </div>
      `;
    });
  }

  if (book.lessons) {
    html += `<div class="chapter-block">
      <h3>درس‌ها</h3>
      ${book.lessons.map((lesson, li) => `
        <a class="lesson-link" href="#/lesson/${book.id}/h/${li}">
          <span class="bullet">◆</span>
          <span>${lesson.title}</span>
        </a>
      `).join('')}
    </div>`;
  }

  contentEl.innerHTML = html;
  window.scrollTo({ top: 0 });
}

/* ---------- صفحهٔ درس ---------- */
function renderLesson(bookId, chIdx, lesIdx) {
  const info = getLesson(bookId, chIdx, lesIdx);
  if (!info) { renderHome(); return; }

  const { lesson, chapter, book } = info;
  const key = lessonKey(bookId, chIdx, lesIdx);

  const bookmarks = getBookmarks();
  const isBookmarked = bookmarks.includes(key);

  const noteKey = 'bioNote_' + key;
  const savedNote = localStorage.getItem(noteKey) || '';

  const chapterCrumb = chapter
    ? ` › <a href="#/book/${book.id}">${chapter.title}</a>`
    : '';

  contentEl.innerHTML = `
    <div class="crumb">
      <a href="#/">خانه</a> ›
      <a href="#/book/${book.id}">${book.title}</a>${chapterCrumb}
    </div>
    <h2 class="page-title">${lesson.title}</h2>

    <div class="tools">
      <button class="tool-btn" id="btn-print">🖨️ چاپ / PDF</button>
      <button class="tool-btn ${isBookmarked ? 'active' : ''}" id="btn-bookmark">
        ${isBookmarked ? '⭐ نشان‌شده' : '☆ نشان‌کردن'}
      </button>
    </div>

    <div class="body-card">
      ${lesson.content && lesson.content.trim()
        ? lesson.content
        : '<p class="empty">محتوای این درس هنوز اضافه نشده است.</p>'}
    </div>

    <div class="notes-section">
      <h3>📝 یادداشت شخصی من</h3>
      <textarea id="note-input" placeholder="یادداشت‌های خودت را اینجا بنویس... (فقط روی همین مرورگر ذخیره می‌شود)"></textarea>
      <div class="notes-hint">✍️ یادداشت‌ها به‌صورت خودکار ذخیره می‌شوند — فقط خودت می‌بینی.</div>
    </div>
  `;

  document.getElementById('btn-print').addEventListener('click', () => window.print());

  document.getElementById('btn-bookmark').addEventListener('click', e => {
    const list = getBookmarks();
    const idx = list.indexOf(key);
    if (idx >= 0) {
      list.splice(idx, 1);
      e.currentTarget.classList.remove('active');
      e.currentTarget.innerHTML = '☆ نشان‌کردن';
      showToast('نشانه برداشته شد');
    } else {
      list.push(key);
      e.currentTarget.classList.add('active');
      e.currentTarget.innerHTML = '⭐ نشان‌شده';
      showToast('درس نشانه شد ⭐');
    }
    localStorage.setItem('bioBookmarks', JSON.stringify(list));
  });

  const noteInput = document.getElementById('note-input');
  noteInput.value = savedNote;
  noteInput.addEventListener('input', () => {
    clearTimeout(state.notesTimer);
    state.notesTimer = setTimeout(() => {
      localStorage.setItem(noteKey, noteInput.value);
    }, 400);
  });

  state.currentKey = key;
  window.scrollTo({ top: 0 });
}

/* ---------- بوکمارک ---------- */
function getBookmarks() {
  try { return JSON.parse(localStorage.getItem('bioBookmarks') || '[]'); }
  catch { return []; }
}

/* ---------- جستجو ---------- */
function setupSearch() {
  searchEl.addEventListener('input', () => {
    const q = searchEl.value.trim().toLowerCase();

    document.querySelectorAll('.nav-book').forEach(book => {
      let anyVisible = false;
      book.querySelectorAll('.nav-lesson').forEach(btn => {
        const match = !q || btn.textContent.toLowerCase().includes(q);
        btn.classList.toggle('hidden', !match);
        if (match) anyVisible = true;
      });
      book.querySelectorAll('.nav-chapter').forEach(chap => {
        const hasVisible = chap.querySelector('.nav-lesson:not(.hidden)');
        if (q) chap.classList.toggle('collapsed', !hasVisible);
      });
      book.style.display = anyVisible ? '' : 'none';
      if (q) book.classList.remove('collapsed');
    });

    if (q.length >= 2) {
      renderSearchResults(q);
    } else if (q.length === 0 && location.hash === '') {
      renderHome();
    }
  });
}

function renderSearchResults(q) {
  const results = [];
  data.books.forEach(book => {
    if (book.chapters) {
      book.chapters.forEach((ch, ci) => {
        ch.lessons.forEach((les, li) => {
          if (les.title.toLowerCase().includes(q)) {
            results.push({
              bookTitle: book.title,
              chapterTitle: ch.title,
              lessonTitle: les.title,
              href: `#/lesson/${book.id}/${ci}/${li}`
            });
          }
        });
      });
    }
    if (book.lessons) {
      book.lessons.forEach((les, li) => {
        if (les.title.toLowerCase().includes(q)) {
          results.push({
            bookTitle: book.title,
            chapterTitle: null,
            lessonTitle: les.title,
            href: `#/lesson/${book.id}/h/${li}`
          });
        }
      });
    }
  });

  let html = `<div class="search-results">
    <h2>🔍 ${results.length} نتیجه برای «${q}»</h2>`;
  if (results.length === 0) {
    html += '<p class="empty">چیزی پیدا نشد.</p>';
  } else {
    html += results.map(r => `
      <a class="lesson-link" href="${r.href}">
        <span class="bullet">◆</span>
        <span>
          <b>${r.lessonTitle}</b>
          <br><small style="color:var(--text-muted)">${r.bookTitle}${r.chapterTitle ? ' — ' + r.chapterTitle : ''}</small>
        </span>
      </a>
    `).join('');
  }
  html += '</div>';
  contentEl.innerHTML = html;
}

/* ---------- منوی موبایل ---------- */
function setupMenu() {
  document.getElementById('menu-toggle').addEventListener('click', () => {
    sidebarEl.classList.toggle('open');
  });
  document.addEventListener('click', e => {
    if (window.innerWidth > 880) return;
    if (sidebarEl.classList.contains('open')
      && !sidebarEl.contains(e.target)
      && !e.target.closest('#menu-toggle')) {
      sidebarEl.classList.remove('open');
    }
  });
}

/* ---------- شروع ---------- */
initTheme();
buildNav();
setupSearch();
setupMenu();
handleRoute();
window.addEventListener('hashchange', () => {
  searchEl.value = '';
  document.querySelectorAll('.nav-lesson').forEach(b => b.classList.remove('hidden'));
  document.querySelectorAll('.nav-book').forEach(b => b.style.display = '');
  handleRoute();
});
