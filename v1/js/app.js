// App — orchestration, event delegation, init

import * as store from './store.js';
import * as router from './router.js';
import { icon, readingTime, formatNumber, timeAgo } from './render.js';
import * as homeView from './views/home.js';
import * as discoverView from './views/discover.js';
import * as savedView from './views/saved.js';
import * as youView from './views/you.js';
import * as articleView from './views/article.js';
import * as roomsView from './views/rooms.js';
import * as roomView from './views/room.js';

const mainContent = () => document.getElementById('main-content');
const topbarTitle = () => document.getElementById('topbar-title');

// Feed customization state
let myFeeds = [
  { id: 'recent', name: 'Recent', description: 'Latest from your subscriptions', icon: 'clock' },
  { id: 'foryou', name: 'For You', description: 'Personalized by your reading habits', icon: 'star' },
];

const allFeeds = [
  { id: 'recent', name: 'Recent', description: 'Latest from your subscriptions', icon: 'clock' },
  { id: 'foryou', name: 'For You', description: 'Personalized by your reading habits', icon: 'star' },
  { id: 'p2', name: 'P2', description: 'Updates from your P2 blogs', icon: 'users' },
  { id: 'latest', name: 'Latest', description: 'Everything, newest first', icon: 'rss' },
  { id: 'freshly-pressed', name: 'Freshly Pressed', description: 'Editor\'s picks from across WordPress', icon: 'star' },
  { id: 'first-posts', name: 'First Posts', description: 'Debut posts from new bloggers', icon: 'edit' },
  { id: 'long-reads', name: 'Long Reads', description: 'In-depth articles over 10 minutes', icon: 'book-open' },
  { id: 'photos', name: 'Photoblogs', description: 'Visual stories and photo essays', icon: 'image' },
  { id: 'conversations', name: 'Conversations', description: 'Most-commented posts today', icon: 'message-circle' },
  { id: 'daily-prompt', name: 'Daily Prompt', description: 'Community responses to today\'s prompt', icon: 'edit' },
  { id: 'likes', name: 'Liked by Friends', description: 'Posts your network is liking', icon: 'heart' },
  { id: 'surprise', name: 'Surprise Me', description: 'Random gems from the WordPress universe', icon: 'compass' },
];

function renderFeedItem(feed, type) {
  const grip = type === 'my' ? `<span class="feed-item-grip"><svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-grip-vertical"/></svg></span>` : '';
  const actionBtn = type === 'my'
    ? `<button class="feed-item-remove" data-action="feed-remove" data-feed-id="${feed.id}"><svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-x"/></svg></button>`
    : `<button class="feed-item-add"><svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-plus"/></svg></button>`;
  const clickAction = type === 'available' ? `data-action="feed-add" data-feed-id="${feed.id}"` : '';

  return `
    <div class="feed-item ${type === 'available' ? 'feed-item-available' : ''}" ${clickAction}>
      ${grip}
      <span class="feed-item-icon"><svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-${feed.icon}"/></svg></span>
      <div class="feed-item-info">
        <div class="feed-item-name">${feed.name}</div>
        <div class="feed-item-desc">${feed.description}</div>
      </div>
      ${actionBtn}
    </div>
  `;
}

function renderFeedsModal() {
  const available = allFeeds.filter(f => !myFeeds.find(m => m.id === f.id));

  return `
    <div class="feeds-modal-backdrop" data-action="feeds-modal-close-backdrop">
      <div class="feeds-modal">
        <div class="feeds-modal-header">
          <h2>Customize your feeds</h2>
          <button class="feeds-modal-close" data-action="feeds-modal-close"><svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-x"/></svg></button>
        </div>
        <div class="feeds-modal-body">
          <div class="feeds-modal-column">
            <div class="feeds-column-label">My Feeds</div>
            <div class="feeds-column-list" id="my-feeds-list">
              ${myFeeds.map(f => renderFeedItem(f, 'my')).join('')}
            </div>
          </div>
          <div class="feeds-modal-column">
            <div class="feeds-column-label">Available Feeds</div>
            <div class="feeds-column-list" id="available-feeds-list">
              ${available.map(f => renderFeedItem(f, 'available')).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function openFeedsModal() {
  closeFeedsModal();
  const wrapper = document.createElement('div');
  wrapper.id = 'feeds-modal-wrapper';
  wrapper.innerHTML = renderFeedsModal();
  document.body.appendChild(wrapper);
}

function closeFeedsModal() {
  const existing = document.getElementById('feeds-modal-wrapper');
  if (existing) existing.remove();
}

function rerenderFeedsModal() {
  const available = allFeeds.filter(f => !myFeeds.find(m => m.id === f.id));
  const myList = document.getElementById('my-feeds-list');
  const availList = document.getElementById('available-feeds-list');
  if (myList) myList.innerHTML = myFeeds.map(f => renderFeedItem(f, 'my')).join('');
  if (availList) availList.innerHTML = available.map(f => renderFeedItem(f, 'available')).join('');
}

let currentRoute = 'home';
let previousRoute = null;
let savedScrollY = 0;

// Cleanup references for article lifecycle
let scrollCleanup = null;
let highlightCleanup = null;

// Cleanup references for discover lifecycle
let discoverObserverCleanup = null;
let discoverPromptInterval = null;

// View titles
const titles = {
  home: 'Home',
  discover: 'Discover',
  rooms: 'Living Rooms',
  room: '',
  saved: 'Saved',
  you: 'You',
  article: '',
};

function showView(route, param) {
  const el = mainContent();
  if (!el) return;

  // Clean up lifecycles before switching
  cleanupArticleLifecycle();
  cleanupDiscoverLifecycle();
  closeSettingsPopover();
  closeSharePopover();

  // Save scroll position when leaving a non-article view to enter article
  if (route === 'article' && currentRoute !== 'article') {
    savedScrollY = window.scrollY;
  }

  const leavingArticle = currentRoute === 'article' && route !== 'article';

  previousRoute = currentRoute;
  currentRoute = route;

  let content;
  switch (route) {
    case 'home':
      content = homeView.render();
      break;
    case 'discover':
      content = discoverView.render();
      break;
    case 'saved':
      content = savedView.render(param);
      break;
    case 'you':
      content = youView.render();
      break;
    case 'rooms':
      content = roomsView.render();
      break;
    case 'room':
      content = roomView.render(param);
      break;
    case 'article':
      content = articleView.render(param);
      break;
    default:
      content = homeView.render();
      route = 'home';
  }

  el.innerHTML = content;

  // Toggle topbar visibility
  const topbar = document.querySelector('.topbar');
  if (topbar) {
    topbar.style.display = route === 'article' ? 'none' : '';
  }

  // Scroll handling
  const isSameRoute = previousRoute === route;
  if (leavingArticle) {
    // Restore scroll position when going back from article
    requestAnimationFrame(() => {
      window.scrollTo(0, savedScrollY);
    });
  } else if (!isSameRoute || route === 'article') {
    window.scrollTo(0, 0);
  }

  // Update topbar title
  const titleEl = topbarTitle();
  if (titleEl) {
    if (route === 'room') {
      const room = store.getRoom(param);
      titleEl.innerHTML = `<span class="topbar-back" data-route="rooms">${icon('chevron-left')}</span><span>${room?.name || 'Room'}</span>`;
    } else {
      titleEl.textContent = titles[route] || '';
    }
  }

  // Update active nav
  updateActiveNav(route);

  // Set up article lifecycle if entering article view
  if (route === 'article') {
    setupArticleScrollProgress();
    setupHighlightToolbar();
    reapplyHighlights(param);
    setupHighlightHoverDelete();
  }

  // Set up discover entrance animations
  if (route === 'discover') {
    setupDiscoverAnimations();
  }

  // Update contextual right sidebar
  updateSidebar(route, param);
}

// ── Contextual Right Sidebar ──

function sidebarSection(title, content) {
  return `<div class="right-sidebar-section">
    <div class="right-sidebar-title">${title}</div>
    ${content}
  </div>`;
}

function sidebarPostCard(post) {
  if (!post) return '';
  const site = store.getSite(post.siteId);
  return `<div class="sidebar-post-card" data-navigate="article/${post.id}">
    <div class="sidebar-post-card-title">${post.title}</div>
    <div class="sidebar-post-card-meta">${site?.name || ''} &middot; ${readingTime(post.readingTime)}</div>
  </div>`;
}

function updateSidebar(route, param) {
  const sidebar = document.getElementById('right-sidebar');
  if (!sidebar) return;

  switch (route) {
    case 'home': sidebar.innerHTML = renderHomeSidebar(); break;
    case 'discover': sidebar.innerHTML = renderDiscoverSidebar(); break;
    case 'saved': sidebar.innerHTML = renderSavedSidebar(); break;
    case 'article': sidebar.innerHTML = renderArticleSidebar(param); break;
    case 'rooms': sidebar.innerHTML = renderRoomsSidebar(); break;
    case 'room': sidebar.innerHTML = renderRoomSidebar(param); break;
    case 'you': sidebar.innerHTML = renderYouSidebar(); break;
    default: sidebar.innerHTML = '';
  }
}

function renderHomeSidebar() {
  const user = store.getUser();
  const streak = user.stats?.readingStreak || 0;

  const topics = ['#WebDevelopment', '#DesignSystems', '#CreativeWriting', '#Photography', '#SlowLiving'];
  const topicsHtml = topics.map(t => `<span class="sidebar-topic">${t}</span>`).join('');

  const state = store.getState();
  const streakHtml = !state.hideStreak
    ? sidebarSection('Reading Streak',
        `<div class="sidebar-streak">${icon('star-filled')} <strong>${streak}</strong> day streak</div>`)
    : '';

  return streakHtml
    + sidebarSection('Trending Topics', `<div class="sidebar-topics">${topicsHtml}</div>`);
}

function renderDiscoverSidebar() {
  const topics = ['#WebDevelopment', '#DesignSystems', '#CreativeWriting', '#Photography', '#SlowLiving'];
  const topicsHtml = topics.map(t => `<span class="sidebar-topic">${t}</span>`).join('');

  const state = store.getState();
  const suggestedSites = [
    { id: 'site-07', name: 'Treehouse Traveler', desc: 'Slow travel stories', avatar: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=80&h=80&fit=crop' },
    { id: 'site-09', name: 'Letters from an American', desc: 'Historical context', avatar: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=80&h=80&fit=crop' },
    { id: 'site-13', name: 'Daring Fireball', desc: 'Apple & tech commentary', avatar: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=80&h=80&fit=crop' },
  ];
  const followsHtml = suggestedSites.map(s => {
    const isFollowing = state.following.has(s.id);
    return `<div class="sidebar-follow-row">
      <img class="avatar avatar-site" src="${s.avatar}" alt="${s.name}" width="36" height="36">
      <div class="sidebar-follow-info">
        <div class="right-sidebar-name">${s.name}</div>
        <div class="right-sidebar-desc">${s.desc}</div>
      </div>
      <button class="btn btn-sm ${isFollowing ? 'btn-secondary is-following' : 'btn-secondary'}" data-action="follow" data-id="${s.id}">${isFollowing ? 'Following' : 'Follow'}</button>
    </div>`;
  }).join('');

  return sidebarSection('Trending Topics', `<div class="sidebar-topics">${topicsHtml}</div>`)
    + sidebarSection('Suggested Follows', followsHtml);
}

function renderSavedSidebar() {
  const saved = store.getSavedPosts();
  const totalTime = saved.reduce((sum, p) => sum + (p.readingTime || 0), 0);

  // Queue stats
  const statsHtml = `
    <div class="sidebar-stat">${icon('bookmark')} <span class="sidebar-stat-label">Saved</span> <strong>${saved.length}</strong> articles</div>
    <div class="sidebar-stat">${icon('clock')} <span class="sidebar-stat-label">Total</span> <strong>${totalTime}</strong> min</div>
  `;

  // Worth revisiting
  const readPosts = store.getReadPosts();
  let revisitHtml = '';
  if (readPosts.length > 0) {
    const random = readPosts[Math.floor(Math.random() * readPosts.length)];
    revisitHtml = sidebarSection('Worth Revisiting', sidebarPostCard(random));
  }

  return sidebarSection('Queue', statsHtml)
    + revisitHtml;
}

function renderArticleSidebar(postId) {
  const post = store.getPost(postId);
  if (!post) return '';

  const site = store.getSite(post.siteId);

  // More from this site
  const morePosts = site ? store.getPostsBySite(site.id, postId).slice(0, 3) : [];
  const moreHtml = morePosts.length > 0
    ? morePosts.map(p => sidebarPostCard(p)).join('')
    : '';

  // Related posts
  const related = store.getRelatedPosts(postId, 3);
  const relatedHtml = related.length > 0
    ? related.map(p => sidebarPostCard(p)).join('')
    : '';

  // Next up
  const allPosts = store.getPosts();
  const idx = allPosts.findIndex(p => p.id === postId);
  const nextPost = allPosts[(idx + 1) % allPosts.length];
  const nextHtml = nextPost
    ? `<div class="sidebar-post-card sidebar-next-card" data-navigate="article/${nextPost.id}">
        <div class="sidebar-next-label">Up Next</div>
        <div class="sidebar-post-card-title">${nextPost.title}</div>
        <div class="sidebar-post-card-meta">${readingTime(nextPost.readingTime)}</div>
      </div>`
    : '';

  let html = '';
  if (moreHtml) html += sidebarSection(`More from ${site?.name || 'this site'}`, moreHtml);
  if (relatedHtml) html += sidebarSection('Related Posts', relatedHtml);
  if (nextHtml) html += sidebarSection('Next Up', nextHtml);
  return html;
}

function renderRoomsSidebar() {
  const joined = store.getJoinedRooms();
  const allRooms = store.getRooms();
  const totalMembers = allRooms.reduce((sum, r) => sum + r.memberCount, 0);

  const statsHtml = `
    <div class="sidebar-stat">${icon('couch')} <span class="sidebar-stat-label">Your rooms</span> <strong>${joined.length}</strong></div>
    <div class="sidebar-stat">${icon('users')} <span class="sidebar-stat-label">Connected readers</span> <strong>${formatNumber(totalMembers)}</strong></div>
  `;

  return sidebarSection('Living Rooms', statsHtml);
}

function renderRoomSidebar(roomId) {
  const room = store.getRoom(roomId);
  if (!room) return '';

  const tagsHtml = room.tags.length > 0
    ? `<div class="sidebar-topics">${room.tags.map(t => `<span class="sidebar-topic">${t}</span>`).join('')}</div>`
    : '';

  const statsHtml = `
    <div class="sidebar-stat">${icon('message-square')} <span class="sidebar-stat-label">Discussions</span> <strong>${room.discussions.length}</strong></div>
    <div class="sidebar-stat">${icon('bookmark')} <span class="sidebar-stat-label">Shared articles</span> <strong>${room.sharedArticles.length}</strong></div>
    <div class="sidebar-stat">${icon('users')} <span class="sidebar-stat-label">Members</span> <strong>${formatNumber(room.memberCount)}</strong></div>
  `;

  let html = '';
  if (tagsHtml) html += sidebarSection('Topics', tagsHtml);
  html += sidebarSection('Activity', statsHtml);
  return html;
}

function renderYouSidebar() {
  const user = store.getUser();
  const stats = user.stats || {};

  // This week stats
  const state = store.getState();
  const streakLine = !state.hideStreak
    ? `<div class="sidebar-stat">${icon('star-filled')} <span class="sidebar-stat-label">Streak</span> <strong>${stats.readingStreak || 0}</strong> days</div>`
    : '';
  const statsHtml = `
    <div class="sidebar-stat">${icon('book-open')} <span class="sidebar-stat-label">Read</span> <strong>${stats.articlesRead || 0}</strong> articles</div>
    <div class="sidebar-stat">${icon('clock')} <span class="sidebar-stat-label">Time</span> <strong>${Math.round((stats.totalReadingTime || 0) / 60)}</strong> hours</div>
    ${streakLine}
  `;

  // Your sites
  const sites = user.sites || [];
  const sitesHtml = sites.length > 0
    ? sites.map(s => `
      <div class="sidebar-site-row">
        <div class="sidebar-writer-info">
          <span class="sidebar-site-row-name">${s.name}</span>
          <span class="sidebar-writer-topic">${s.posts} posts &middot; ${formatNumber(s.subscribers)} subscribers</span>
        </div>
      </div>
    `).join('')
    : '<div class="sidebar-empty">No sites yet</div>';

  // Top categories
  const categories = stats.topCategories || [];
  const categoriesHtml = categories.length > 0
    ? `<div class="sidebar-topics">${categories.map(c => `<span class="sidebar-topic">${c}</span>`).join('')}</div>`
    : '';

  return sidebarSection('Your Stats', statsHtml)
    + sidebarSection('Your Sites', sitesHtml)
    + (categoriesHtml ? sidebarSection('Top Interests', categoriesHtml) : '');
}

// Article scroll progress
function setupArticleScrollProgress() {
  const progressEl = document.getElementById('reading-progress');
  if (!progressEl) return;

  const handler = () => {
    const body = document.getElementById('article-body');
    if (!body) return;
    const rect = body.getBoundingClientRect();
    const bodyTop = rect.top + window.scrollY;
    const bodyHeight = rect.height;
    const scrolled = window.scrollY - bodyTop;
    const progress = Math.max(0, Math.min(1, scrolled / (bodyHeight - window.innerHeight * 0.5)));
    progressEl.style.width = (progress * 100) + '%';
  };

  window.addEventListener('scroll', handler, { passive: true });
  handler(); // initial calc

  scrollCleanup = () => {
    window.removeEventListener('scroll', handler);
  };
}

// Highlight toolbar on text selection
function setupHighlightToolbar() {
  const body = document.getElementById('article-body');
  if (!body) return;

  let toolbar = null;

  const removeToolbar = () => {
    if (toolbar) {
      toolbar.remove();
      toolbar = null;
    }
  };

  const handleMouseUp = (e) => {
    // Don't interfere when clicking on the toolbar itself
    if (toolbar && toolbar.contains(e.target)) return;

    removeToolbar();

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    // Only show toolbar for selections within article body
    if (!body.contains(range.commonAncestorContainer)) return;

    const text = selection.toString().trim();
    if (!text) return;

    const rect = range.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();

    toolbar = document.createElement('div');
    toolbar.className = 'highlight-toolbar';
    toolbar.innerHTML = `
      <span class="highlight-toolbar-btn" data-action="highlight-selection">
        <svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-highlight"/></svg>
        Highlight
      </span>
      <span class="highlight-toolbar-btn" data-action="share-selection">
        <svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-share"/></svg>
        Share
      </span>
    `;

    // Position above selection
    toolbar.style.left = (rect.left - bodyRect.left + rect.width / 2 - 90) + 'px';
    toolbar.style.top = (rect.top - bodyRect.top - 44) + 'px';

    // Prevent mousedown on toolbar from collapsing the text selection
    toolbar.addEventListener('mousedown', (e) => e.preventDefault());

    body.style.position = 'relative';
    body.appendChild(toolbar);
  };

  const handleMouseDown = (e) => {
    if (toolbar && !toolbar.contains(e.target)) {
      removeToolbar();
    }
  };

  body.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('mousedown', handleMouseDown);

  highlightCleanup = () => {
    body.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mousedown', handleMouseDown);
    removeToolbar();
  };
}

// Re-apply persisted highlights to article body
function reapplyHighlights(postId) {
  const body = document.getElementById('article-body');
  if (!body) return;

  const highlights = store.getHighlightsForPost(postId);
  if (!highlights.length) return;

  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  for (const hl of highlights) {
    for (const node of textNodes) {
      // Skip nodes already inside a <mark>
      if (node.parentElement?.tagName === 'MARK') continue;

      const idx = node.textContent.indexOf(hl.text);
      if (idx === -1) continue;

      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + hl.text.length);
      try {
        const mark = document.createElement('mark');
        mark.dataset.highlightId = hl.id;
        range.surroundContents(mark);
      } catch {
        // Cross-element boundary — skip
      }
      break; // Only wrap first match per highlight
    }
  }
}

// Floating delete button on highlight hover in article
let highlightHoverCleanup = null;

function setupHighlightHoverDelete() {
  const body = document.getElementById('article-body');
  if (!body) return;

  let deleteBtn = null;
  let activeMark = null;

  const removeBtn = () => {
    if (deleteBtn) {
      deleteBtn.remove();
      deleteBtn = null;
      activeMark = null;
    }
  };

  const handleOver = (e) => {
    const mark = e.target.closest('mark[data-highlight-id]');
    if (!mark || mark === activeMark) return;

    removeBtn();
    activeMark = mark;

    deleteBtn = document.createElement('span');
    deleteBtn.className = 'highlight-delete-btn';
    deleteBtn.innerHTML = `<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-x"/></svg>`;
    deleteBtn.dataset.action = 'remove-highlight';
    deleteBtn.dataset.id = mark.dataset.highlightId;

    mark.style.position = 'relative';
    mark.appendChild(deleteBtn);
  };

  const handleOut = (e) => {
    if (!activeMark) return;
    // Only remove if leaving the mark entirely (not entering the delete button)
    const related = e.relatedTarget;
    if (related && activeMark.contains(related)) return;
    removeBtn();
  };

  body.addEventListener('mouseover', handleOver);
  body.addEventListener('mouseout', handleOut);

  highlightHoverCleanup = () => {
    body.removeEventListener('mouseover', handleOver);
    body.removeEventListener('mouseout', handleOut);
    removeBtn();
  };
}

// Discover — scroll-triggered entrance animations
function setupDiscoverAnimations() {
  const sections = document.querySelectorAll('.section-enter');
  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('section-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  sections.forEach(el => observer.observe(el));

  discoverObserverCleanup = () => {
    observer.disconnect();
  };

  // Prompt response rotation
  const container = document.getElementById('prompt-responses');
  const dotsContainer = document.getElementById('prompt-dots');
  if (container) {
    const responses = container.querySelectorAll('.prompt-response');
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.prompt-response-dot') : [];
    if (responses.length > 1) {
      let current = 0;

      const goTo = (next) => {
        if (next === current) return;
        const prev = current;
        current = next;
        responses[prev].classList.remove('prompt-response-active');
        responses[prev].classList.add('prompt-response-exit');
        responses[current].classList.add('prompt-response-active');
        if (dots[prev]) dots[prev].classList.remove('active');
        if (dots[current]) dots[current].classList.add('active');
        setTimeout(() => {
          responses[prev].classList.remove('prompt-response-exit');
        }, 400);
      };

      const startTimer = () => {
        clearInterval(discoverPromptInterval);
        discoverPromptInterval = setInterval(() => {
          goTo((current + 1) % responses.length);
        }, 10000);
      };

      dots.forEach((dot, i) => {
        dot.style.cursor = 'pointer';
        dot.addEventListener('click', () => {
          goTo(i);
          startTimer();
        });
      });

      startTimer();
    }
  }
}

function cleanupDiscoverLifecycle() {
  if (discoverObserverCleanup) {
    discoverObserverCleanup();
    discoverObserverCleanup = null;
  }
  if (discoverPromptInterval) {
    clearInterval(discoverPromptInterval);
    discoverPromptInterval = null;
  }
}

function cleanupArticleLifecycle() {
  if (scrollCleanup) {
    scrollCleanup();
    scrollCleanup = null;
  }
  if (highlightCleanup) {
    highlightCleanup();
    highlightCleanup = null;
  }
  if (highlightHoverCleanup) {
    highlightHoverCleanup();
    highlightHoverCleanup = null;
  }
  // Remove progress bar
  const progress = document.getElementById('reading-progress');
  if (progress) progress.style.width = '0%';
}

function updateActiveNav(route) {
  const navRoute = (route === 'article') ? previousRoute : (route === 'room') ? 'rooms' : route;

  // Sidebar nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.route === navRoute);
  });

  // Mobile tab bar
  document.querySelectorAll('.tab-item').forEach(item => {
    item.classList.toggle('active', item.dataset.route === navRoute);
  });
}

function getAutoTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const effective = theme === 'auto' ? getAutoTheme() : theme;
  document.documentElement.setAttribute('data-theme', effective);

  // Update theme toggle button appearance
  const themeIcon = document.getElementById('theme-icon');
  const themeLabel = document.getElementById('theme-label');
  if (themeIcon) {
    themeIcon.innerHTML = effective === 'dark'
      ? `<use href="assets/icons.svg#icon-sun"/>`
      : `<use href="assets/icons.svg#icon-moon"/>`;
  }
  if (themeLabel) {
    themeLabel.textContent = effective === 'dark' ? 'Light mode' : 'Dark mode';
  }
}

function applyPreferences() {
  const state = store.getState();
  const root = document.documentElement;

  // Font scale
  const fontScaleMap = { xs: 0.85, small: 0.925, medium: 1, large: 1.1, xl: 1.25 };
  root.style.setProperty('--article-font-scale', fontScaleMap[state.fontSize] || 1);

  // Font family
  const fontFamilyMap = {
    serif: 'var(--font-serif)',
    sans: 'var(--font-sans)',
    dyslexia: 'OpenDyslexic, var(--font-sans)',
  };
  root.style.setProperty('--article-font-family', fontFamilyMap[state.typeface] || 'var(--font-serif)');

  // Line height
  const lineHeightMap = {
    compact: 'var(--leading-normal)',
    comfortable: 'var(--leading-loose)',
    spacious: '2.1',
  };
  root.style.setProperty('--article-line-height', lineHeightMap[state.lineSpacing] || 'var(--leading-loose)');

  // Card density
  const densityMap = {
    compact: 'var(--space-2)',
    comfortable: 'var(--space-5)',
    spacious: 'var(--space-8)',
  };
  root.style.setProperty('--card-gap', densityMap[state.contentDensity] || 'var(--space-5)');
}

// Settings popover — inline control builders (lightweight dupes of you.js helpers)

function settingsSegmented(key, options, current) {
  const buttons = options.map(opt =>
    `<button class="seg-btn ${opt.value === current ? 'seg-active' : ''}"
       data-action="set-preference" data-key="${key}" data-value="${opt.value}">${opt.label}</button>`
  ).join('');
  return `<div class="seg-control">${buttons}</div>`;
}

function settingsFontStepper(current) {
  const steps = [
    { value: 'xs', label: 'XS' },
    { value: 'small', label: 'S' },
    { value: 'medium', label: 'M' },
    { value: 'large', label: 'L' },
    { value: 'xl', label: 'XL' },
  ];
  const currentIdx = steps.findIndex(s => s.value === current);
  const items = steps.map((s, i) => {
    let cls = 'font-step';
    if (i === currentIdx) cls += ' font-step-active';
    else if (i < currentIdx) cls += ' font-step-filled';
    return `<button class="${cls}" data-action="set-preference" data-key="fontSize" data-value="${s.value}">
      <span class="font-step-label">${s.label}</span>
    </button>`;
  }).join('');
  return `<div class="font-size-stepper">${items}</div>`;
}

function renderSettingsPopoverBody() {
  const state = store.getState();
  return `
    <div class="settings-popover-title">Quick Settings</div>
    <div class="settings-row">
      <div><div class="settings-label">Font Size</div></div>
      ${settingsFontStepper(state.fontSize)}
    </div>
    <div class="settings-row">
      <div><div class="settings-label">Typeface</div></div>
      ${settingsSegmented('typeface', [
        { value: 'serif', label: 'Serif' },
        { value: 'sans', label: 'Sans' },
        { value: 'dyslexia', label: 'Dyslexia' },
      ], state.typeface)}
    </div>
    <div class="settings-row">
      <div><div class="settings-label">Line Spacing</div></div>
      ${settingsSegmented('lineSpacing', [
        { value: 'compact', label: 'Compact' },
        { value: 'comfortable', label: 'Comfortable' },
        { value: 'spacious', label: 'Spacious' },
      ], state.lineSpacing)}
    </div>
    <div class="settings-row">
      <div><div class="settings-label">Theme</div></div>
      ${settingsSegmented('theme', [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'auto', label: 'Auto' },
      ], state.theme)}
    </div>
  `;
}

function openSettingsPopover() {
  closeSettingsPopover();
  closeSharePopover();
  const btn = document.querySelector('[data-action="settings-popover-toggle"]');
  if (!btn) return;

  const rect = btn.getBoundingClientRect();
  const popover = document.createElement('div');
  popover.className = 'settings-popover';
  popover.innerHTML = renderSettingsPopoverBody();

  // Position below button, right-aligned
  popover.style.top = (rect.bottom + 8) + 'px';
  popover.style.right = Math.max(16, window.innerWidth - rect.right) + 'px';

  document.body.appendChild(popover);

  // Close on outside click (next tick)
  requestAnimationFrame(() => {
    const closeOnOutsideClick = (evt) => {
      if (!popover.contains(evt.target) && !btn.contains(evt.target)) {
        closeSettingsPopover();
        document.removeEventListener('click', closeOnOutsideClick, true);
      }
    };
    document.addEventListener('click', closeOnOutsideClick, true);
    // Store ref so we can remove on manual close
    popover._outsideClickHandler = closeOnOutsideClick;
  });
}

function closeSettingsPopover() {
  const existing = document.querySelector('.settings-popover');
  if (existing) {
    if (existing._outsideClickHandler) {
      document.removeEventListener('click', existing._outsideClickHandler, true);
    }
    existing.remove();
  }
}

function rerenderSettingsPopover() {
  const popover = document.querySelector('.settings-popover');
  if (!popover) return;
  // Update just the inner content, preserving the element and its position
  popover.innerHTML = renderSettingsPopoverBody();
}

// Share popover

function renderSharePopoverBody(postId) {
  return `
    <div class="share-popover-title">Share this article</div>
    <div class="share-option" data-action="share-to-room" data-id="${postId}">
      <svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-couch"/></svg>
      Share to Room
    </div>
    <div class="share-option" data-action="share-copy-link" data-id="${postId}">
      <svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-link"/></svg>
      Copy Link
    </div>
    <div class="share-option" data-action="share-x" data-id="${postId}">
      <svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-x-twitter"/></svg>
      X
    </div>
    <div class="share-option" data-action="share-facebook" data-id="${postId}">
      <svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-facebook"/></svg>
      Facebook
    </div>
    <div class="share-option" data-action="share-bluesky" data-id="${postId}">
      <svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-bluesky"/></svg>
      Bluesky
    </div>
    <div class="share-option" data-action="share-email" data-id="${postId}">
      <svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-mail"/></svg>
      Email
    </div>
  `;
}

function openSharePopover(btn) {
  closeSharePopover();
  closeSettingsPopover();

  const postId = btn.dataset.id || '';
  const rect = btn.getBoundingClientRect();
  const popover = document.createElement('div');
  popover.className = 'share-popover';
  popover.innerHTML = renderSharePopoverBody(postId);

  // Position below button, right-aligned
  popover.style.top = (rect.bottom + 8) + 'px';
  popover.style.right = Math.max(16, window.innerWidth - rect.right) + 'px';

  document.body.appendChild(popover);

  // Close on outside click (next tick)
  requestAnimationFrame(() => {
    const closeOnOutsideClick = (evt) => {
      if (!popover.contains(evt.target) && !btn.contains(evt.target)) {
        closeSharePopover();
        document.removeEventListener('click', closeOnOutsideClick, true);
      }
    };
    document.addEventListener('click', closeOnOutsideClick, true);
    popover._outsideClickHandler = closeOnOutsideClick;
  });
}

function closeSharePopover() {
  const existing = document.querySelector('.share-popover');
  if (existing) {
    if (existing._outsideClickHandler) {
      document.removeEventListener('click', existing._outsideClickHandler, true);
    }
    existing.remove();
  }
}

let toastTimer = null;

function showToast(message) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  // Reset animation
  el.classList.remove('toast-visible');
  clearTimeout(toastTimer);
  requestAnimationFrame(() => {
    el.classList.add('toast-visible');
    toastTimer = setTimeout(() => el.classList.remove('toast-visible'), 1800);
  });
}

function rerender() {
  const { route, param } = router.getCurrentRoute();
  showView(route, param);
}

// Close search overlay on backdrop click or Escape
document.addEventListener('click', (e) => {
  const overlay = document.getElementById('search-overlay');
  if (overlay?.classList.contains('search-open') && e.target === overlay) {
    overlay.classList.remove('search-open');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const sharePopover = document.querySelector('.share-popover');
    if (sharePopover) {
      closeSharePopover();
      return;
    }
    const settingsPopover = document.querySelector('.settings-popover');
    if (settingsPopover) {
      closeSettingsPopover();
      return;
    }
    const feedsModal = document.getElementById('feeds-modal-wrapper');
    if (feedsModal) {
      closeFeedsModal();
      return;
    }
    const overlay = document.getElementById('search-overlay');
    if (overlay?.classList.contains('search-open')) {
      overlay.classList.remove('search-open');
    }
  }
});

// Event delegation
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action], [data-navigate], [data-route]');
  if (!target) return;

  // Navigation via data-route
  if (target.dataset.route) {
    e.preventDefault();
    router.navigate(target.dataset.route);
    return;
  }

  // Navigation via data-navigate
  if (target.dataset.navigate) {
    e.preventDefault();
    router.navigate(target.dataset.navigate);
    return;
  }

  // Actions
  const action = target.dataset.action;
  if (!action) return;

  e.preventDefault();
  e.stopPropagation();

  switch (action) {
    case 'save': {
      const id = target.dataset.id;
      if (id) {
        store.toggleSave(id);
        rerender();
      }
      break;
    }
    case 'like': {
      const id = target.dataset.id;
      if (id) {
        store.toggleLike(id);
        rerender();
      }
      break;
    }
    case 'follow': {
      const id = target.dataset.id;
      if (id) {
        store.toggleFollow(id);
        rerender();
      }
      break;
    }
    case 'theme-toggle': {
      const st = store.getState();
      // Cycle: light -> dark -> light (simple toggle for sidebar button)
      const effective = st.theme === 'auto' ? getAutoTheme() : st.theme;
      const newTheme = effective === 'dark' ? 'light' : 'dark';
      store.setTheme(newTheme);
      applyTheme(newTheme);
      rerender();
      break;
    }
    case 'back': {
      if (previousRoute) {
        router.navigate(previousRoute);
      } else {
        router.navigate('home');
      }
      break;
    }
    case 'hero-prev': {
      const carousel = document.getElementById('hero-carousel');
      if (carousel) {
        if (carousel.scrollLeft <= 0) {
          carousel.scrollTo({ left: carousel.scrollWidth, behavior: 'smooth' });
        } else {
          const cardWidth = carousel.firstElementChild?.offsetWidth || carousel.offsetWidth;
          carousel.scrollBy({ left: -cardWidth, behavior: 'smooth' });
        }
      }
      break;
    }
    case 'hero-next': {
      const carousel = document.getElementById('hero-carousel');
      if (carousel) {
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        if (carousel.scrollLeft >= maxScroll - 1) {
          carousel.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          const cardWidth = carousel.firstElementChild?.offsetWidth || carousel.offsetWidth;
          carousel.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
      break;
    }
    case 'home-tab': {
      const tab = target.dataset.tab;
      if (tab) {
        homeView.setTab(tab);
        rerender();
      }
      break;
    }
    case 'saved-tab': {
      const tab = target.dataset.tab;
      if (tab) {
        router.navigate(tab === 'queue' ? 'saved' : `saved/${tab}`);
      }
      break;
    }
    case 'saved-queue-filter': {
      savedView.setQueueFilter(target.dataset.filter);
      rerender();
      break;
    }
    case 'saved-play-all': {
      const firstSaved = store.getSavedPosts()[0];
      if (firstSaved) {
        store.toggleTts(firstSaved.id);
        rerender();
      }
      break;
    }
    case 'site-filter': {
      const id = target.dataset.id;
      if (id) {
        const current = store.getActiveSiteFilter();
        if (current === id) {
          store.clearActiveSiteFilter();
        } else {
          store.setActiveSiteFilter(id);
        }
        rerender();
      }
      break;
    }
    case 'site-filter-clear': {
      store.clearActiveSiteFilter();
      rerender();
      break;
    }
    // TTS actions
    case 'tts-toggle': {
      const id = target.dataset.id;
      if (id) {
        store.toggleTts(id);
        rerender();
      }
      break;
    }
    case 'tts-close': {
      store.closeTts();
      rerender();
      break;
    }
    case 'tts-speed': {
      store.cycleTtsSpeed();
      rerender();
      break;
    }
    case 'tts-skip': {
      // No-op stub for prototype
      break;
    }
    // Comment scroll
    case 'comment': {
      const commentsEl = document.getElementById('article-comments');
      if (commentsEl) {
        commentsEl.scrollIntoView({ behavior: 'smooth' });
      }
      break;
    }
    // Highlight toolbar actions
    case 'highlight-selection': {
      const selection = window.getSelection();
      if (selection && selection.rangeCount) {
        const range = selection.getRangeAt(0);
        const text = selection.toString().trim();
        // Persist to store
        const hlId = 'hl-' + Date.now();
        try {
          const mark = document.createElement('mark');
          mark.dataset.highlightId = hlId;
          range.surroundContents(mark);
        } catch {
          // Cross-element selections can't be wrapped
        }
        if (text) {
          const route = router.getCurrentRoute();
          const postId = route.param;
          if (postId) {
            store.addHighlight({ id: hlId, postId, text, date: new Date().toISOString() });
          }
        }
        selection.removeAllRanges();
      }
      // Remove toolbar
      const ht = document.querySelector('.highlight-toolbar');
      if (ht) ht.remove();
      break;
    }
    case 'share-selection': {
      // Prototype stubs
      window.getSelection()?.removeAllRanges();
      const ht2 = document.querySelector('.highlight-toolbar');
      if (ht2) ht2.remove();
      break;
    }
    case 'remove-highlight': {
      const hlId = target.dataset.id;
      if (hlId) {
        // Remove the <mark> from the DOM if we're in article view
        const mark = document.querySelector(`mark[data-highlight-id="${hlId}"]`);
        if (mark) {
          const parent = mark.parentNode;
          while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
          mark.remove();
          parent.normalize();
        }
        store.removeHighlight(hlId);
        // Rerender if in saved view (highlights tab)
        if (currentRoute === 'saved') rerender();
      }
      break;
    }
    case 'settings-popover-toggle': {
      const popover = document.querySelector('.settings-popover');
      if (popover) {
        closeSettingsPopover();
      } else {
        openSettingsPopover();
      }
      break;
    }
    case 'search-open': {
      const overlay = document.getElementById('search-overlay');
      if (overlay) {
        overlay.classList.add('search-open');
        requestAnimationFrame(() => {
          document.getElementById('search-input')?.focus();
        });
      }
      break;
    }
    case 'search-close': {
      const overlay = document.getElementById('search-overlay');
      if (overlay) {
        overlay.classList.remove('search-open');
      }
      break;
    }
    case 'feeds-modal-open': {
      openFeedsModal();
      break;
    }
    case 'feeds-modal-close': {
      closeFeedsModal();
      break;
    }
    case 'feeds-modal-close-backdrop': {
      // Only close if clicking the backdrop itself, not the modal content
      if (e.target.classList.contains('feeds-modal-backdrop')) {
        closeFeedsModal();
      }
      break;
    }
    case 'feed-add': {
      const feedId = target.dataset.feedId;
      const feed = allFeeds.find(f => f.id === feedId);
      if (feed && !myFeeds.find(m => m.id === feedId)) {
        myFeeds.push(feed);
        rerenderFeedsModal();
      }
      break;
    }
    case 'feed-remove': {
      const feedId = target.dataset.feedId;
      myFeeds = myFeeds.filter(f => f.id !== feedId);
      rerenderFeedsModal();
      break;
    }
    case 'set-preference': {
      const key = target.dataset.key;
      const value = target.dataset.value;
      if (key && value !== undefined) {
        store.setPreference(key, value);
        if (key === 'theme') {
          applyTheme(value);
        }
        applyPreferences();
        rerender();
        rerenderSettingsPopover();
        showToast('Saved');
      }
      break;
    }
    case 'toggle-preference': {
      const key = target.dataset.key;
      if (key) {
        store.togglePreference(key);
        applyPreferences();
        rerender();
        showToast('Saved');
      }
      break;
    }
    case 'post-menu': {
      const postId = target.dataset.id;
      if (!postId) break;

      // Close any existing menu
      const existing = document.querySelector('.post-menu-dropdown');
      if (existing) existing.remove();

      const post = store.getPost(postId);
      const site = post ? store.getSite(post.siteId) : null;
      const isSaved = store.getState().saved.has(postId);

      const menu = document.createElement('div');
      menu.className = 'post-menu-dropdown';
      menu.innerHTML = `
        <div class="post-menu-item" data-action="mute-site" data-id="${postId}">
          <svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-volume-x"/></svg>
          Mute ${site?.name || 'this site'}
        </div>
        <div class="post-menu-item" data-action="not-interested" data-id="${postId}">
          <svg class="icon" aria-hidden="true"><use href="assets/icons.svg#icon-eye-off"/></svg>
          Not interested
        </div>
      `;

      // Position below the button
      const rect = target.getBoundingClientRect();
      menu.style.top = `${rect.bottom + 4}px`;
      menu.style.left = `${Math.min(rect.left, window.innerWidth - 220)}px`;

      document.body.appendChild(menu);

      // Close on outside click (next tick)
      requestAnimationFrame(() => {
        const closeMenu = (evt) => {
          if (!menu.contains(evt.target) || evt.target.closest('.post-menu-item')) {
            menu.remove();
            document.removeEventListener('click', closeMenu, true);
          }
        };
        document.addEventListener('click', closeMenu, true);
      });
      break;
    }
    case 'mute-site': {
      const postId = target.dataset.id;
      if (postId) {
        const post = store.getPost(postId);
        if (post) {
          store.toggleMute(post.siteId);
          const menu = document.querySelector('.post-menu-dropdown');
          if (menu) menu.remove();
          rerender();
        }
      }
      break;
    }
    case 'not-interested':
    case 'share-post': {
      // Prototype stubs — close menu
      const menu = document.querySelector('.post-menu-dropdown');
      if (menu) menu.remove();
      break;
    }
    case 'share': {
      // Close post-menu if open
      const menu = document.querySelector('.post-menu-dropdown');
      if (menu) menu.remove();
      // Toggle share popover
      const sharePopover = document.querySelector('.share-popover');
      if (sharePopover) {
        closeSharePopover();
      } else {
        openSharePopover(target);
      }
      break;
    }
    case 'share-copy-link': {
      closeSharePopover();
      showToast('Link copied');
      break;
    }
    case 'share-x': {
      closeSharePopover();
      showToast('Opening X...');
      break;
    }
    case 'share-facebook': {
      closeSharePopover();
      showToast('Opening Facebook...');
      break;
    }
    case 'share-bluesky': {
      closeSharePopover();
      showToast('Opening Bluesky...');
      break;
    }
    case 'share-email': {
      closeSharePopover();
      showToast('Opening email...');
      break;
    }
    case 'join-room': {
      const id = target.dataset.id;
      if (id) {
        store.toggleJoinRoom(id);
        rerender();
      }
      break;
    }
    case 'create-room': {
      showToast('Room creation coming soon');
      break;
    }
    case 'room-topic-filter': {
      const tag = target.dataset.tag;
      if (tag) {
        roomsView.setTopic(tag);
        rerender();
      }
      break;
    }
    case 'room-tab': {
      const tab = target.dataset.tab;
      if (tab) {
        roomView.setTab(tab);
        rerender();
      }
      break;
    }
    case 'share-room': {
      showToast('Room sharing coming soon');
      break;
    }
    case 'share-to-room': {
      closeSharePopover();
      showToast('Room sharing coming soon');
      break;
    }
  }
});

// Init
async function init() {
  await store.init();

  const state = store.getState();
  applyTheme(state.theme);
  applyPreferences();

  // Listen for OS color scheme changes (for auto theme)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const s = store.getState();
    if (s.theme === 'auto') {
      applyTheme('auto');
    }
  });

  // Register routes
  router.registerRoute('home', () => showView('home'));
  router.registerRoute('discover', () => showView('discover'));
  router.registerRoute('saved', (param) => showView('saved', param));
  router.registerRoute('you', () => showView('you'));
  router.registerRoute('rooms', () => showView('rooms'));
  router.registerRoute('room', (param) => showView('room', param));
  router.registerRoute('article', (param) => showView('article', param));

  router.init();
}

init();
