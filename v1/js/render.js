// Render — pure utility functions for building UI

import { getState, getPost, getSite, getSiteCategory } from './store.js';

// Tagged template for HTML (passthrough, enables syntax highlighting)
export function html(strings, ...values) {
  return strings.reduce((result, str, i) => result + str + (values[i] ?? ''), '');
}

// SVG icon helper
export function icon(name, className = '') {
  return `<svg class="icon ${className}" aria-hidden="true"><use href="assets/icons.svg#icon-${name}"/></svg>`;
}

// Time ago
export function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Reading time display
export function readingTime(minutes) {
  return `${minutes} min read`;
}

// Format number
export function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

// Post card
export function postCard(post, options = {}) {
  const site = getSite(post.siteId);
  const state = getState();
  const isSaved = options.forceSaved || state.saved.has(post.id);
  const isLiked = state.liked.has(post.id);
  const isRead = state.read.has(post.id);

  // Show image on ~60% of posts: when readingTime is even or likes > 300
  const showImage = post.image && (post.readingTime % 2 === 0 || post.likes > 300);

  // Only show reading time if > 5 min
  const readingTimeMeta = post.readingTime > 5
    ? html`<span class="dot">&middot;</span><span>${readingTime(post.readingTime)}</span>`
    : '';

  const whyAnnotation = options.whyTopic
    ? html`<div class="card-why">Based on your interest in ${options.whyTopic}</div>`
    : '';

  return html`
    <article class="card ${isRead ? 'is-read' : ''}" data-navigate="article/${post.id}">
      <div class="card-body">
        ${whyAnnotation}
        <div class="card-meta">
          ${site ? `<img class="avatar avatar-site" src="${site.avatar}" alt="${site.name}" width="24" height="24">` : ''}
          <span class="site-name">${site?.name || 'Unknown'}</span>
          <span class="dot">&middot;</span>
          <span>${timeAgo(post.date)}</span>
          ${readingTimeMeta}
          <span class="card-meta-spacer"></span>
          <span class="card-more" data-action="post-menu" data-id="${post.id}">${icon('more-horizontal')}</span>
        </div>
        <h3 class="card-title">${post.title}</h3>
        <p class="card-excerpt">${post.excerpt}</p>
        <div class="card-footer">
          <span class="card-action ${isLiked ? 'liked' : ''}" data-action="like" data-id="${post.id}">
            ${icon(isLiked ? 'heart-filled' : 'heart')} ${formatNumber(post.likes + (isLiked ? 1 : 0))}
          </span>
          <span class="card-action" data-action="comment">
            ${icon('message-circle')} ${post.comments}
          </span>
          <span class="card-action ${isSaved ? 'saved' : ''}" data-action="save" data-id="${post.id}">
            ${icon(isSaved ? 'bookmark-filled' : 'bookmark')}
          </span>
        </div>
      </div>
      ${showImage ? `<img class="card-image" src="${post.image}" alt="" loading="lazy">` : ''}
    </article>
  `;
}

// Subscription pill
export function subscriptionPill(site, isActiveFilter = false) {
  const hasUnread = site.unreadCount > 0;
  return html`
    <div class="subscription-pill ${hasUnread ? 'has-unread' : ''} ${isActiveFilter ? 'is-active' : ''}" data-action="site-filter" data-id="${site.id}">
      <img class="avatar avatar-site" src="${site.avatar}" alt="${site.name}" width="48" height="48">
      <span class="pill-name">${site.name.split(' ')[0]}</span>
    </div>
  `;
}

// Section header
export function sectionHeader(title, linkText, linkAction) {
  return html`
    <div class="section-header">
      <h2 class="section-title">${title}</h2>
      ${linkText ? `<span class="section-link" ${linkAction ? `data-action="${linkAction}"` : ''}>${linkText}</span>` : ''}
    </div>
  `;
}

// Hero card for Discover carousel
export function heroCard(item) {
  const post = getPost(item.postId);
  if (!post) return '';
  return html`
    <div class="hero-card" data-navigate="article/${post.id}">
      <img class="hero-card-image" src="${post.image}" alt="">
      <div class="hero-card-overlay"></div>
      <div class="hero-card-content">
        <div class="hero-card-label">${item.label}</div>
        <h2 class="hero-card-title">${post.title}</h2>
        <p class="hero-card-tagline">${item.tagline}</p>
      </div>
    </div>
  `;
}

// Comment card (for article view)
export function commentCard(comment) {
  return html`
    <div class="comment">
      <img class="avatar" src="${comment.avatar}" alt="${comment.author}" width="32" height="32">
      <div class="comment-body">
        <div class="comment-header">
          <span class="comment-author">${comment.author}</span>
          <span class="comment-time">${timeAgo(comment.date)}</span>
        </div>
        <div class="comment-text">${comment.content}</div>
        <div class="comment-actions">
          <span class="comment-action">${icon('heart')} ${comment.likes}</span>
          <span class="comment-action">Reply</span>
        </div>
      </div>
    </div>
  `;
}

// Small card (for article footer sections)
export function smallCard(post) {
  const site = getSite(post.siteId);
  return html`
    <div class="small-card" data-navigate="article/${post.id}">
      ${post.image ? `<img class="small-card-image" src="${post.image}" alt="" loading="lazy">` : ''}
      <div class="small-card-body">
        <div class="small-card-title">${post.title}</div>
        <div class="small-card-meta">${site?.name || ''} &middot; ${readingTime(post.readingTime)}</div>
      </div>
    </div>
  `;
}

// Word count display
export function wordCount(count) {
  if (!count) return '';
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K words';
  return count.toLocaleString() + ' words';
}

// Discover hero card — full-bleed image with gradient overlay
export function discoverHeroCard(item) {
  const post = getPost(item.postId);
  if (!post) return '';
  const site = getSite(post.siteId);
  const excerptTruncated = post.excerpt.length > 120 ? post.excerpt.slice(0, 120) + '...' : post.excerpt;
  return html`
    <div class="discover-hero-card" data-navigate="article/${post.id}">
      <img class="discover-hero-card-image" src="${post.image}" alt="" loading="lazy">
      <div class="discover-hero-card-overlay"></div>
      <div class="discover-hero-card-content">
        <span class="discover-hero-card-badge">${item.category}</span>
        <h2 class="discover-hero-card-title">${post.title}</h2>
        <p class="discover-hero-card-excerpt">${excerptTruncated}</p>
        <div class="discover-hero-card-author">
          ${site ? `<img class="avatar avatar-site" src="${site.avatar}" alt="${site.name}" width="24" height="24">` : ''}
          <span>${site?.name || ''}</span>
          <span class="dot">&middot;</span>
          <span>${readingTime(post.readingTime)}</span>
        </div>
      </div>
    </div>
  `;
}

// Trending item — numbered row with stats
export function trendingItem(post, rank) {
  const site = getSite(post.siteId);
  return html`
    <div class="trending-item" data-navigate="article/${post.id}">
      <span class="trending-rank">${rank}</span>
      <div class="trending-body">
        <div class="trending-site">
          ${site ? `<img class="avatar avatar-site" src="${site.avatar}" alt="${site.name}" width="20" height="20">` : ''}
          <span class="trending-site-name">${site?.name || ''}</span>
        </div>
        <h3 class="trending-title">${post.title}</h3>
        <div class="trending-stats">
          <span>${readingTime(post.readingTime)}</span>
          <span class="dot">&middot;</span>
          <span>${icon('heart')} ${formatNumber(post.likes)}</span>
          <span class="dot">&middot;</span>
          <span>${icon('message-circle')} ${post.comments}</span>
        </div>
      </div>
      ${post.image ? `<img class="trending-thumb" src="${post.image}" alt="" loading="lazy">` : ''}
    </div>
  `;
}

// Site recommendation card — vertical (card) or horizontal (row) layout
export function siteCard(siteData, options = {}) {
  const layout = options.layout || 'card';
  const state = getState();
  const isFollowing = state.following.has(siteData.id);
  const btnLabel = isFollowing ? 'Following' : 'Follow';
  const btnClass = isFollowing ? 'btn btn-sm btn-secondary is-following' : 'btn btn-sm btn-primary';

  if (layout === 'row') {
    return html`
      <div class="site-row">
        <img class="avatar avatar-site" src="${siteData.avatar}" alt="${siteData.name}" width="40" height="40">
        <div class="site-row-body">
          <div class="site-row-name">${siteData.name}</div>
          <div class="site-row-description">${siteData.description}</div>
        </div>
        <button class="${btnClass}" data-action="follow" data-id="${siteData.id}">${btnLabel}</button>
      </div>
    `;
  }

  return html`
    <div class="site-card">
      <img class="avatar avatar-lg avatar-site" src="${siteData.avatar}" alt="${siteData.name}" width="48" height="48">
      <div class="site-card-name">${siteData.name}</div>
      <div class="site-card-description">${siteData.description}</div>
      <div class="site-card-subscribers">${formatNumber(siteData.subscribers)} subscribers</div>
      <button class="${btnClass}" data-action="follow" data-id="${siteData.id}">${btnLabel}</button>
    </div>
  `;
}

// Rising voice card
export function risingVoiceCard(voice) {
  return html`
    <div class="rising-voice-card">
      <div class="rising-voice-card-header">
        <img class="avatar avatar-site" src="${voice.avatar}" alt="${voice.name}" width="40" height="40">
        <div class="rising-voice-card-info">
          <div class="rising-voice-card-name">${voice.name}</div>
          <div class="rising-voice-card-description">${voice.description}</div>
        </div>
      </div>
      <div class="rising-voice-card-badge">
        ${icon('trending-up', 'icon-rising')} ${voice.subscribers} subscribers
      </div>
      <div class="rising-voice-card-post">${voice.featuredPostTitle}</div>
    </div>
  `;
}

// Featured author spotlight
export function authorSpotlight(author) {
  const post = getPost(author.featuredPostId);
  const state = getState();
  const isFollowing = state.following.has(author.siteId);
  const btnLabel = isFollowing ? 'Following' : 'Follow';
  const btnClass = isFollowing ? 'btn btn-sm btn-secondary is-following' : 'btn btn-sm btn-primary';

  return html`
    <div class="author-spotlight">
      <img class="author-spotlight-photo" src="${author.photo}" alt="${author.name}" width="80" height="80">
      <div class="author-spotlight-body">
        <h3 class="author-spotlight-name">${author.name}</h3>
        <p class="author-spotlight-bio">${author.bio}</p>
        <div class="author-spotlight-meta">
          <span>${formatNumber(author.followers)} followers</span>
          ${post ? html`<span class="dot">&middot;</span><a class="author-spotlight-post" data-navigate="article/${post.id}">${post.title}</a>` : ''}
        </div>
        <button class="${btnClass}" data-action="follow" data-id="${author.siteId}">${btnLabel}</button>
      </div>
    </div>
  `;
}

// Notable writer card — centered portrait with follow button
export function notableWriterCard(writer) {
  const state = getState();
  const isFollowing = state.following.has(writer.id);
  const btnLabel = isFollowing ? 'Following' : 'Follow';
  const btnClass = isFollowing ? 'btn btn-sm btn-secondary is-following' : 'btn btn-sm btn-primary';

  return html`
    <div class="notable-writer-card">
      <img class="notable-writer-photo" src="${writer.photo}" alt="${writer.name}" width="64" height="64">
      <div class="notable-writer-name">${writer.name}</div>
      <div class="notable-writer-topic">${writer.topic}</div>
      <button class="${btnClass}" data-action="follow" data-id="${writer.id}">${btnLabel}</button>
    </div>
  `;
}

// Horizontal post card (for Discover sections)
export function horizontalCard(post) {
  const site = getSite(post.siteId);
  return html`
    <div class="horizontal-card" data-navigate="article/${post.id}">
      ${post.image ? `<img class="horizontal-card-image" src="${post.image}" alt="" loading="lazy">` : ''}
      <div class="horizontal-card-body">
        <h3 class="horizontal-card-title">${post.title}</h3>
        <div class="horizontal-card-meta">${site?.name || ''} &middot; ${readingTime(post.readingTime)}</div>
      </div>
    </div>
  `;
}
