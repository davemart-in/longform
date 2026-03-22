// Home view — subscription carousel, sub-tabs, post feed

import {
  getFollowedSites, getFollowedPosts, getState,
  getFilteredFollowedPosts, getActiveSiteFilter, getSite, getSiteCategory,
} from '../store.js';
import { html, postCard, subscriptionPill, icon } from '../render.js';

let activeTab = 'recent';

export function setTab(tab) {
  activeTab = tab;
}

export function render() {
  if (activeTab === 'saved') activeTab = 'recent';
  const sites = getFollowedSites();
  const state = getState();
  const activeSiteFilter = getActiveSiteFilter();

  // Sort sites: those with unread first, then alphabetical
  const sortedSites = [...sites].sort((a, b) => {
    if (a.unreadCount && !b.unreadCount) return -1;
    if (!a.unreadCount && b.unreadCount) return 1;
    return a.name.localeCompare(b.name);
  });

  // --- Carousel ---
  const allPillActive = !activeSiteFilter;
  const carousel = sortedSites.length > 0 ? html`
    <div class="subscription-section">
      <div class="subscription-header">
        <span class="subscription-label">Subscriptions</span>
      </div>
      <div class="subscription-carousel-wrapper">
        <div class="subscription-carousel">
          <div class="subscription-pill ${allPillActive ? 'is-active' : ''}" data-action="site-filter-clear">
            <div class="all-pill-avatar">All</div>
            <span class="pill-name">All</span>
          </div>
          ${sortedSites.map(s => subscriptionPill(s, activeSiteFilter === s.id)).join('')}
        </div>
      </div>
    </div>
  ` : '';

  // --- Filter chip ---
  const filterSite = activeSiteFilter ? getSite(activeSiteFilter) : null;
  const filterChip = filterSite ? html`
    <div class="active-filter-chip">
      Showing posts from <strong>&nbsp;${filterSite.name}</strong>
      <span class="filter-clear" data-action="site-filter-clear">${icon('x')}</span>
    </div>
  ` : '';

  // --- Tabs ---
  const tabs = html`
    <div class="sub-tabs">
      <button class="sub-tab ${activeTab === 'recent' ? 'active' : ''}" data-action="home-tab" data-tab="recent">Recent</button>
      <button class="sub-tab ${activeTab === 'foryou' ? 'active' : ''}" data-action="home-tab" data-tab="foryou">For You</button>
      <span class="sub-tabs-spacer"></span>
      <button class="sub-tabs-add" data-action="feeds-modal-open">
        ${icon('plus')} Add feed
      </button>
    </div>
  `;

  // --- Tab-specific content ---
  let feed = '';
  let completionState = '';

  if (activeTab === 'recent') {
    const posts = getFilteredFollowedPosts();
    if (posts.length > 0) {
      feed = posts.map(p => postCard(p)).join('');
      completionState = html`
        <div class="completion-state">
          <div class="completion-headline">You're all caught up.</div>
          <div class="completion-subtext">Come back later or explore something new.</div>
          <a class="completion-link" data-navigate="discover">Explore Discover &rarr;</a>
        </div>
      `;
    } else {
      feed = html`
        <div class="completion-state">
          <div class="completion-state-icon">${icon('home')}</div>
          <h3>${sites.length > 0 ? 'All caught up' : 'Nothing here yet'}</h3>
          <p>${sites.length > 0 ? 'You\'ve seen everything from your subscriptions. Enjoy the calm.' : 'Follow some sites to see their latest posts here.'}</p>
        </div>
      `;
    }
  } else if (activeTab === 'foryou') {
    // For You: all followed posts sorted by likes desc
    const posts = getFollowedPosts().sort((a, b) => b.likes - a.likes);
    if (posts.length > 0) {
      feed = posts.map((p, i) => {
        const whyTopic = (i % 3 === 2) ? getSiteCategory(p.siteId) : null;
        return postCard(p, { whyTopic });
      }).join('');
    } else {
      feed = html`
        <div class="completion-state">
          <div class="completion-state-icon">${icon('compass')}</div>
          <h3>We're learning what you like</h3>
          <p>Keep reading! We'll personalize this tab based on your interests.</p>
        </div>
      `;
    }
  }

  return html`
    <div class="view view-home">
      ${carousel}
      ${tabs}
      ${filterChip}
      <div class="post-feed">
        ${feed}
        ${completionState}
      </div>
    </div>
  `;
}
