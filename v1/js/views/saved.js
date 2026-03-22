// Saved view — reading queue and history

import { getSavedPosts, getReadPosts, getHighlights, getSite, getPost, getTtsState, removeHighlight } from '../store.js';
import { html, icon, readingTime, timeAgo } from '../render.js';

const validTabs = ['queue', 'highlights', 'history'];
let queueFilter = null;

export function setQueueFilter(filter) {
  queueFilter = queueFilter === filter ? null : filter;
}

// Date grouping for History
function groupByDate(posts) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);

  const groups = { 'Today': [], 'Yesterday': [], 'This Week': [], 'Earlier': [] };

  posts.forEach(p => {
    const d = new Date(p.date);
    if (d >= today) groups['Today'].push(p);
    else if (d >= yesterday) groups['Yesterday'].push(p);
    else if (d >= weekAgo) groups['This Week'].push(p);
    else groups['Earlier'].push(p);
  });

  return Object.entries(groups).filter(([, items]) => items.length > 0);
}

// TTS bar markup (shared pattern from article.js)
function renderTtsBar() {
  const tts = getTtsState();
  if (!tts.active) return '';

  const ttsPost = getPost(tts.postId);
  if (!ttsPost) return '';
  const speedLabel = tts.speed === 1 ? '1x' : tts.speed + 'x';

  return html`
    <div class="tts-bar">
      <div class="tts-bar-progress"></div>
      <div class="tts-bar-inner">
        ${ttsPost.image ? `<img class="tts-bar-thumb" src="${ttsPost.image}" alt="">` : ''}
        <div class="tts-bar-info">
          <div class="tts-bar-title">${ttsPost.title}</div>
          <div class="tts-bar-time">${readingTime(ttsPost.readingTime)} left</div>
        </div>
        <div class="tts-bar-btn" data-action="tts-toggle" data-id="${tts.postId}">
          ${icon(tts.playing ? 'pause' : 'play')}
        </div>
        <div class="tts-bar-btn" data-action="tts-skip">
          ${icon('skip-forward')}
        </div>
        <div class="tts-bar-speed" data-action="tts-speed">${speedLabel}</div>
        <div class="tts-bar-close" data-action="tts-close">
          ${icon('x')}
        </div>
      </div>
    </div>
  `;
}

// --- Queue Tab ---
function renderQueue() {
  const saved = getSavedPosts();

  if (saved.length === 0) {
    return html`
      <div class="empty-state">
        <div>${icon('bookmark')}</div>
        <h3>Your queue is empty</h3>
        <p>Save articles while browsing and they'll appear here, ready for when you have time to read.</p>
      </div>
    `;
  }

  // Apply filter
  let filtered = saved;
  if (queueFilter === 'quick') filtered = saved.filter(p => p.readingTime < 5);
  else if (queueFilter === 'deep') filtered = saved.filter(p => p.readingTime > 10);

  const totalTime = saved.reduce((sum, p) => sum + p.readingTime, 0);

  const headerHtml = html`
    <div class="saved-queue-header">
      <span class="saved-queue-summary">${saved.length} article${saved.length !== 1 ? 's' : ''} &middot; ~${totalTime} min total</span>
      <button class="btn btn-sm btn-secondary saved-play-all-btn" data-action="saved-play-all">
        ${icon('headphones')} Play All
      </button>
    </div>
  `;

  const chipsHtml = html`
    <div class="saved-filter-chips">
      <button class="saved-filter-chip ${queueFilter === 'quick' ? 'active' : ''}" data-action="saved-queue-filter" data-filter="quick">Quick Reads (&lt; 5 min)</button>
      <button class="saved-filter-chip ${queueFilter === 'deep' ? 'active' : ''}" data-action="saved-queue-filter" data-filter="deep">Deep Dives (&gt; 10 min)</button>
    </div>
  `;

  let itemsHtml;
  if (filtered.length === 0) {
    itemsHtml = html`<div class="saved-no-results">No articles match this filter.</div>`;
  } else {
    itemsHtml = filtered.map(post => {
      const site = getSite(post.siteId);
      return html`
        <div class="saved-item" data-navigate="article/${post.id}">
          <span class="saved-item-grip">${icon('grip-vertical')}</span>
          ${site ? `<img class="avatar avatar-site saved-item-avatar" src="${site.avatar}" alt="${site.name}" width="32" height="32">` : ''}
          <div class="saved-item-body">
            <div class="saved-item-title">${post.title}</div>
            <div class="saved-item-meta">
              <span>${site?.name || ''}</span>
              <span>&middot;</span>
              <span>${readingTime(post.readingTime)}</span>
              <span>&middot;</span>
              <span>${timeAgo(post.date)}</span>
            </div>
          </div>
          <button class="saved-item-play" data-action="tts-toggle" data-id="${post.id}" title="Listen">
            ${icon('play')}
          </button>
          <button class="saved-item-remove" data-action="save" data-id="${post.id}" title="Remove from queue">
            ${icon('x')}
          </button>
        </div>
      `;
    }).join('');
  }

  return headerHtml + chipsHtml + itemsHtml + renderTtsBar();
}

// --- History Tab ---
function renderHistory() {
  const readPosts = getReadPosts();

  if (readPosts.length === 0) {
    return html`
      <div class="empty-state">
        <div>${icon('clock')}</div>
        <h3>No reading history yet</h3>
        <p>Articles you read will appear here so you can easily find them again.</p>
      </div>
    `;
  }

  // Sort by date descending
  const sorted = [...readPosts].sort((a, b) => new Date(b.date) - new Date(a.date));
  const groups = groupByDate(sorted);

  let revisitHtml = '';
  const earlierGroup = groups.find(([label]) => label === 'Earlier');
  if (earlierGroup && earlierGroup[1].length > 0) {
    const revisitPost = earlierGroup[1][Math.floor(Math.random() * earlierGroup[1].length)];
    const revisitSite = getSite(revisitPost.siteId);
    revisitHtml = html`
      <div class="history-revisit" data-navigate="article/${revisitPost.id}">
        <div class="history-revisit-label">Worth revisiting</div>
        <div class="history-revisit-title">${revisitPost.title}</div>
        <div class="history-revisit-meta">${revisitSite?.name || ''} &middot; ${readingTime(revisitPost.readingTime)}</div>
      </div>
    `;
  }

  const groupsHtml = groups.map(([label, posts]) => html`
    <div class="history-group">
      <div class="history-group-label">${label}</div>
      ${posts.map(post => {
        const site = getSite(post.siteId);
        return html`
          <div class="history-item" data-navigate="article/${post.id}">
            ${site ? `<img class="avatar avatar-site history-item-avatar" src="${site.avatar}" alt="${site.name}" width="32" height="32">` : ''}
            <div class="history-item-body">
              <div class="history-item-title">${post.title}</div>
              <div class="history-item-meta">
                <span>${site?.name || ''}</span>
                <span>&middot;</span>
                <span>${readingTime(post.readingTime)}</span>
                <span>&middot;</span>
                <span>${timeAgo(post.date)}</span>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');

  return revisitHtml + groupsHtml;
}

// --- Highlights Tab ---
function renderHighlights() {
  const highlights = getHighlights();

  if (highlights.length === 0) {
    return html`
      <div class="empty-state">
        <div>${icon('highlight')}</div>
        <h3>No highlights yet</h3>
        <p>Select text in any article and tap Highlight to save passages you want to remember.</p>
      </div>
    `;
  }

  // Group highlights by postId
  const grouped = new Map();
  for (const hl of highlights) {
    if (!grouped.has(hl.postId)) grouped.set(hl.postId, []);
    grouped.get(hl.postId).push(hl);
  }

  let groupsHtml = '';
  for (const [postId, items] of grouped) {
    const post = getPost(postId);
    const site = post ? getSite(post.siteId) : null;

    const headerHtml = html`
      <div class="highlight-group-header" data-navigate="article/${postId}">
        ${site ? `<img class="avatar avatar-site" src="${site.avatar}" alt="${site.name}" width="24" height="24">` : ''}
        <div class="highlight-group-header-body">
          <div class="highlight-group-header-title">${post?.title || 'Unknown article'}</div>
          <div class="highlight-group-header-meta">${site?.name || ''}</div>
        </div>
      </div>
    `;

    const itemsHtml = items.map(hl => html`
      <div class="highlight-item" data-navigate="article/${postId}">
        <div class="highlight-item-text">${hl.text}</div>
        <div class="highlight-item-date">${timeAgo(hl.date)}</div>
        <button class="highlight-item-remove" data-action="remove-highlight" data-id="${hl.id}" title="Remove highlight">
          ${icon('x')}
        </button>
      </div>
    `).join('');

    groupsHtml += `<div class="highlight-group">${headerHtml}${itemsHtml}</div>`;
  }

  return groupsHtml;
}

export function render(param) {
  const activeTab = validTabs.includes(param) ? param : 'queue';

  const tabs = html`
    <div class="sub-tabs">
      <button class="sub-tab ${activeTab === 'queue' ? 'active' : ''}" data-action="saved-tab" data-tab="queue">Queue</button>
      <button class="sub-tab ${activeTab === 'highlights' ? 'active' : ''}" data-action="saved-tab" data-tab="highlights">Highlights</button>
      <button class="sub-tab ${activeTab === 'history' ? 'active' : ''}" data-action="saved-tab" data-tab="history">History</button>
    </div>
  `;

  let content;
  if (activeTab === 'queue') content = renderQueue();
  else if (activeTab === 'highlights') content = renderHighlights();
  else content = renderHistory();

  return html`
    <div class="view view-saved">
      ${tabs}
      ${content}
    </div>
  `;
}
