// Single room view — header, sub-tabs (Feed/Discussions/Members/Reading List)

import { getRoom, getPost, getSite, isRoomJoined } from '../store.js';
import { html, icon, timeAgo, readingTime, formatNumber } from '../render.js';

let activeTab = 'feed';

export function setTab(tab) {
  activeTab = tab;
}

function getMember(room, memberId) {
  return room.members.find(m => m.id === memberId);
}

function memberAvatarStack(members, max = 5) {
  const shown = members.slice(0, max);
  const extra = members.length > max ? members.length - max : 0;
  return `<div class="room-avatar-stack">
    ${shown.map((m, i) => `<img class="avatar avatar-sm room-avatar-stacked" src="${m.avatar}" alt="${m.name}" width="28" height="28" style="z-index:${max - i}">`).join('')}
    ${extra > 0 ? `<span class="room-avatar-extra">+${formatNumber(extra)} more</span>` : ''}
  </div>`;
}

function feedItem(article, room) {
  const sharer = getMember(room, article.sharedBy);
  const post = getPost(article.postId);
  if (!post) return '';
  const site = getSite(post.siteId);

  return html`
    <div class="room-feed-item">
      <div class="room-feed-sharer">
        ${sharer ? `<img class="avatar avatar-sm" src="${sharer.avatar}" alt="${sharer.name}" width="24" height="24">` : ''}
        <span class="room-feed-sharer-name">${sharer?.name || 'Unknown'}</span>
        <span class="room-feed-sharer-time">shared ${timeAgo(article.sharedAt)}</span>
      </div>
      ${article.note ? `<div class="room-feed-note">${article.note}</div>` : ''}
      <div class="room-feed-article" data-navigate="article/${post.id}">
        ${post.image ? `<img class="room-feed-article-image" src="${post.image}" alt="" loading="lazy">` : ''}
        <div class="room-feed-article-body">
          <div class="room-feed-article-site">${site?.name || ''}</div>
          <div class="room-feed-article-title">${post.title}</div>
          <div class="room-feed-article-meta">${readingTime(post.readingTime)}</div>
        </div>
      </div>
    </div>
  `;
}

function discussionItem(disc, room) {
  const author = getMember(room, disc.author);
  return html`
    <div class="room-discussion-item">
      <div class="room-discussion-header">
        ${author ? `<img class="avatar avatar-sm" src="${author.avatar}" alt="${author.name}" width="24" height="24">` : ''}
      </div>
      <div class="room-discussion-title">${disc.title}</div>
      <div class="room-discussion-meta">
        <span>${author?.name || 'Unknown'}</span>
        <span class="dot">&middot;</span>
        <span>${timeAgo(disc.date)}</span>
        <span class="dot">&middot;</span>
        <span>${icon('message-square')} ${disc.replyCount} replies</span>
      </div>
      <div class="room-discussion-preview">${disc.preview}</div>
    </div>
  `;
}

function memberRow(member) {
  const badge = member.role === 'host'
    ? '<span class="room-role-badge host">Host</span>'
    : member.role === 'co-host'
    ? '<span class="room-role-badge co-host">Co-host</span>'
    : '';
  return html`
    <div class="room-member-row">
      <img class="avatar avatar-sm" src="${member.avatar}" alt="${member.name}" width="32" height="32">
      <span class="room-member-name">${member.name}</span>
      ${badge}
    </div>
  `;
}

function readingListItem(post) {
  if (!post) return '';
  const site = getSite(post.siteId);
  return html`
    <div class="room-reading-item" data-navigate="article/${post.id}">
      ${post.image ? `<img class="room-reading-item-image" src="${post.image}" alt="" loading="lazy">` : ''}
      <div class="room-reading-item-body">
        <div class="room-reading-item-title">${post.title}</div>
        <div class="room-reading-item-meta">${site?.name || ''} &middot; ${readingTime(post.readingTime)}</div>
      </div>
    </div>
  `;
}

export function render(roomId) {
  const room = getRoom(roomId);

  if (!room) {
    return html`
      <div class="view view-room">
        <div class="completion-state">
          <div class="completion-state-icon">${icon('couch')}</div>
          <h3>Room not found</h3>
          <p>This room doesn't exist or has been removed.</p>
          <a class="completion-link" data-navigate="rooms">Back to Rooms &rarr;</a>
        </div>
      </div>
    `;
  }

  const joined = isRoomJoined(room.id);
  const isPrivate = room.type === 'private';
  const typeIcon = isPrivate ? 'lock' : 'globe';
  const typeLabel = isPrivate ? 'Private Room' : 'Public Room';

  // Header
  const header = html`
    <div class="room-header">
      <div class="room-header-cover" style="background-image:url(${room.coverImage})"></div>
      <div class="room-header-content">
        <h1 class="room-header-name">${room.name}</h1>
        <div class="room-header-desc">${room.description}</div>
        <div class="room-header-type">${icon(typeIcon, 'icon-xs')} ${typeLabel}</div>
        <div class="room-header-members">
          ${memberAvatarStack(room.members)}
          <span>${formatNumber(room.memberCount)} members</span>
        </div>
        <div class="room-header-actions">
          <button class="btn ${joined ? 'btn-secondary is-following' : 'btn-primary'}" data-action="join-room" data-id="${room.id}">
            ${joined ? 'Joined' : 'Join Room'}
          </button>
          <button class="btn btn-secondary" data-action="share-room" data-id="${room.id}">
            ${icon('share')} Share
          </button>
        </div>
      </div>
    </div>
  `;

  // Sub-tabs
  const tabs = html`
    <div class="sub-tabs">
      <button class="sub-tab ${activeTab === 'feed' ? 'active' : ''}" data-action="room-tab" data-tab="feed">Feed</button>
      <button class="sub-tab ${activeTab === 'discussions' ? 'active' : ''}" data-action="room-tab" data-tab="discussions">Discussions</button>
      <button class="sub-tab ${activeTab === 'members' ? 'active' : ''}" data-action="room-tab" data-tab="members">Members</button>
      <button class="sub-tab ${activeTab === 'reading-list' ? 'active' : ''}" data-action="room-tab" data-tab="reading-list">Reading List</button>
    </div>
  `;

  // Private room gate for non-members
  if (isPrivate && !joined) {
    return html`
      <div class="view view-room">
        ${header}
        <div class="completion-state" style="padding:var(--space-8) 0">
          <div class="completion-state-icon">${icon('lock')}</div>
          <h3>This room is private</h3>
          <p>Join this room to see its content and participate in discussions.</p>
        </div>
      </div>
    `;
  }

  // Tab content
  let tabContent = '';

  if (activeTab === 'feed') {
    const promptCard = room.dailyPrompt ? html`
      <div class="room-prompt-card">
        <div class="room-prompt-label">Room Prompt</div>
        <div class="room-prompt-text">${room.dailyPrompt}</div>
      </div>
    ` : '';

    const articles = room.sharedArticles.map(a => feedItem(a, room)).join('');

    tabContent = articles || promptCard ? html`
      ${promptCard}
      ${articles || `<div class="completion-state" style="padding:var(--space-6) 0"><p>No articles shared yet. Be the first to share something!</p></div>`}
    ` : html`
      <div class="completion-state" style="padding:var(--space-6) 0">
        <p>No articles shared yet. Be the first to share something!</p>
      </div>
    `;
  } else if (activeTab === 'discussions') {
    const discussions = room.discussions.map(d => discussionItem(d, room)).join('');
    tabContent = discussions || html`
      <div class="completion-state" style="padding:var(--space-6) 0">
        <p>No discussions yet. Start one!</p>
      </div>
    `;
  } else if (activeTab === 'members') {
    const sorted = [...room.members].sort((a, b) => {
      const order = { host: 0, 'co-host': 1, member: 2 };
      return (order[a.role] ?? 2) - (order[b.role] ?? 2);
    });
    tabContent = sorted.map(m => memberRow(m)).join('');
  } else if (activeTab === 'reading-list') {
    const uniquePostIds = [...new Set(room.sharedArticles.map(a => a.postId))];
    const posts = uniquePostIds.map(id => getPost(id)).filter(Boolean);
    tabContent = posts.length > 0
      ? posts.map(p => readingListItem(p)).join('')
      : html`<div class="completion-state" style="padding:var(--space-6) 0"><p>Reading list is empty.</p></div>`;
  }

  return html`
    <div class="view view-room">
      ${header}
      ${tabs}
      <div class="room-tab-content">
        ${tabContent}
      </div>
    </div>
  `;
}
