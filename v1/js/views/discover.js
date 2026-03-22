// Discover view — curated magazine layout

import { getDiscover, getPost, getSite, getRooms } from '../store.js';
import {
  html, horizontalCard, sectionHeader, icon, formatNumber,
  discoverHeroCard, trendingItem, siteCard, authorSpotlight, notableWriterCard
} from '../render.js';

export function render() {
  const discover = getDiscover();

  // 1. Hero carousel
  const heroCards = discover.heroCarousel.map(item => discoverHeroCard(item)).join('');
  const hero = html`
    <div class="section-enter">
      <div class="discover-hero-wrap">
        <div class="discover-hero-carousel" id="hero-carousel">
          ${heroCards}
        </div>
        <button class="discover-hero-nav prev" data-action="hero-prev">${icon('chevron-left')}</button>
        <button class="discover-hero-nav next" data-action="hero-next">${icon('chevron-right')}</button>
      </div>
    </div>
  `;

  // 3. Daily Prompt
  const prompt = discover.dailyPrompt;
  const promptResponses = prompt.featuredResponses.map((r, i) => html`
    <div class="prompt-response ${i === 0 ? 'prompt-response-active' : ''}" data-response-index="${i}">
      <img class="avatar avatar-sm" src="${r.authorAvatar}" alt="${r.authorName}" width="32" height="32">
      <div class="prompt-response-content">
        <div class="prompt-response-author">${r.authorName}</div>
        <div>${r.content}</div>
      </div>
    </div>
  `).join('');

  const promptDots = prompt.featuredResponses.map((_, i) =>
    `<span class="prompt-response-dot ${i === 0 ? 'active' : ''}" data-dot-index="${i}"></span>`
  ).join('');

  const dailyPrompt = html`
    <div class="section-enter">
      <div class="daily-prompt-card">
        <div class="daily-prompt-label">Today's Writing Prompt</div>
        <div class="daily-prompt-text">${prompt.prompt}</div>
        <span class="daily-prompt-cta">Share your thoughts</span>
        <div class="daily-prompt-separator">From the community &middot; ${prompt.responseCount} responses</div>
        <div class="daily-prompt-responses" id="prompt-responses">
          ${promptResponses}
        </div>
        <div class="prompt-response-dots" id="prompt-dots">
          ${promptDots}
        </div>
      </div>
    </div>
  `;

  // 4. Freshly Pressed
  const freshlyPressedPosts = discover.freshlyPressed.map(id => getPost(id)).filter(Boolean);
  const freshlyPressed = html`
    <div class="section-enter">
      ${sectionHeader('Freshly Pressed', 'See all')}
      <div class="horizontal-scroll">
        ${freshlyPressedPosts.map(p => horizontalCard(p)).join('')}
      </div>
    </div>
  `;

  // 5. Trending
  const trendingItems = discover.trending.map((entry, i) => {
    const post = getPost(entry.postId);
    if (!post) return '';
    return trendingItem(post, i + 1);
  }).join('');

  const trending = html`
    <div class="section-enter">
      ${sectionHeader('Trending', 'See all')}
      <div class="trending-list">
        ${trendingItems}
      </div>
    </div>
  `;

  // 6. Because You Follow
  const sourceSite = getSite(discover.becauseYouFollow.sourceSiteId);
  const recSiteRows = discover.becauseYouFollow.recommendedSites
    .map(s => siteCard(s, { layout: 'row' }))
    .join('');

  const becauseYouFollow = html`
    <div class="section-enter">
      ${sectionHeader(`Because you follow ${sourceSite?.name || ''}`, '')}
      <div class="because-you-follow-list">
        ${recSiteRows}
      </div>
    </div>
  `;

  // 6b. Notable Writers
  const notableWritersCards = discover.notableWriters
    .map(w => notableWriterCard(w))
    .join('');

  const notableWriters = html`
    <div class="section-enter">
      ${sectionHeader('Notable Writers', '')}
      <div class="notable-writers-grid">
        ${notableWritersCards}
      </div>
    </div>
  `;

  // 7. Rising Voices
  const risingVoicesCards = discover.risingVoices
    .map(v => siteCard(v))
    .join('');

  const risingVoices = html`
    <div class="section-enter">
      ${sectionHeader('Rising Voices', '')}
      <div class="site-card-grid">
        ${risingVoicesCards}
      </div>
    </div>
  `;

  // 8. You Might Like Sites
  const youMightLikeSiteData = discover.youMightLikeSites
    .map(id => getSite(id))
    .filter(Boolean);

  const youMightLikeRows = youMightLikeSiteData
    .map(s => siteCard(s, { layout: 'row' }))
    .join('');

  const youMightLike = html`
    <div class="section-enter">
      ${sectionHeader('You Might Like', 'See all')}
      <div class="you-might-like-list">
        ${youMightLikeRows}
      </div>
    </div>
  `;

  // 9. Featured Author
  const featured = html`
    <div class="section-enter">
      ${sectionHeader('Featured Author', '')}
      ${authorSpotlight(discover.featuredAuthor)}
    </div>
  `;

  // 10. Popular in Living Rooms
  const topRooms = [...getRooms()].sort((a, b) => b.memberCount - a.memberCount).slice(0, 3);
  const roomCards = topRooms.map(r => {
    const typeIcon = r.type === 'private' ? 'lock' : 'globe';
    return html`
      <div class="room-discover-card" data-navigate="room/${r.id}">
        <div class="room-discover-card-cover" style="background-image:url(${r.coverImage})"></div>
        <div class="room-discover-card-body">
          <div class="room-discover-card-name">${icon(typeIcon, 'icon-xs')} ${r.name}</div>
          <div class="room-discover-card-meta">${formatNumber(r.memberCount)} members</div>
        </div>
      </div>
    `;
  }).join('');

  const popularRooms = topRooms.length > 0 ? html`
    <div class="section-enter">
      ${sectionHeader('Popular in Living Rooms', 'See all')}
      <div class="horizontal-scroll">
        ${roomCards}
      </div>
    </div>
  ` : '';

  return html`
    <div class="view view-discover">
      ${hero}
      ${dailyPrompt}
      ${freshlyPressed}
      ${becauseYouFollow}
      ${trending}
      ${notableWriters}
      ${risingVoices}
      ${youMightLike}
      ${featured}
      ${popularRooms}
    </div>
  `;
}
