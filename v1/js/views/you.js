// You view — profile, reading stats, settings

import { getUser, getState, getFollowedSites } from '../store.js';
import { html, icon, sectionHeader, formatNumber } from '../render.js';

// Control helpers

function segmented(key, options, current) {
  const buttons = options.map(opt =>
    `<button class="seg-btn ${opt.value === current ? 'seg-active' : ''}"
       data-action="set-preference" data-key="${key}" data-value="${opt.value}">${opt.label}</button>`
  ).join('');
  return `<div class="seg-control">${buttons}</div>`;
}

function toggleSwitch(key, isOn) {
  return `<button class="toggle-switch ${isOn ? 'toggle-on' : ''}"
    data-action="toggle-preference" data-key="${key}">
    <span class="toggle-track"></span>
    <span class="toggle-thumb"></span>
  </button>`;
}

function fontSizeStepper(current) {
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

// Section renderers

function renderProfileHeader(user, stats, totalHours) {
  return html`
    <div class="profile-header">
      <img class="profile-avatar" src="${user.avatar}" alt="${user.name}" width="80" height="80">
      <div class="profile-info">
        <div class="profile-name-row">
          <h1>${user.name}</h1>
          <span class="profile-edit-btn">${icon('edit')}</span>
        </div>
        <div class="profile-username">@${user.username}</div>
        <div class="profile-bio">${user.bio}</div>
        <div class="profile-stats-row">
          <span>${formatNumber(stats.articlesRead)} articles read</span>
          <span>&middot;</span>
          <span>${totalHours}h read</span>
          <span>&middot;</span>
          <span>${stats.readingStreak} day streak</span>
        </div>
        <a class="profile-blog-link" href="https://${user.url}" target="_blank">
          ${user.url} ${icon('link')}
        </a>
      </div>
    </div>
  `;
}

function renderStreakCard() {
  const days = [
    { day: 'M', articles: 3, minutes: 45 },
    { day: 'T', articles: 5, minutes: 72 },
    { day: 'W', articles: 2, minutes: 28 },
    { day: 'T', articles: 4, minutes: 55 },
    { day: 'F', articles: 6, minutes: 85 },
    { day: 'S', articles: 1, minutes: 12 },
    { day: 'S', articles: 3, minutes: 40 },
  ];

  const maxMin = Math.max(...days.map(d => d.minutes));
  const totalArticles = days.reduce((s, d) => s + d.articles, 0);
  const totalMin = days.reduce((s, d) => s + d.minutes, 0);

  const bars = days.map(d => {
    const height = Math.max(4, Math.round((d.minutes / maxMin) * 80));
    return `<div class="streak-bar-group">
      <div class="streak-bar" style="height:${height}px"></div>
      <span class="streak-bar-label">${d.day}</span>
    </div>`;
  }).join('');

  return html`
    <div class="streak-card">
      <div class="streak-card-header">
        <span class="streak-card-title">This Week</span>
        <span class="streak-card-summary">${totalArticles} articles, ${totalMin} min</span>
      </div>
      <div class="streak-chart">${bars}</div>
      <div class="streak-card-footer">
        ${icon('trending-up')} Personal best: 8 articles in one week
      </div>
    </div>
  `;
}

function renderYourSites(sites) {
  const colors = ['#0066ff', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'];

  const siteCards = sites.map((site, i) => {
    const color = colors[i % colors.length];
    const initial = site.name.charAt(0).toUpperCase();
    return html`
      <div class="user-site">
        <div class="site-initial" style="background:${color}">${initial}</div>
        <div style="flex:1">
          <div class="user-site-name">${site.name}</div>
          <div class="user-site-meta">${site.posts} posts &middot; ${formatNumber(site.subscribers)} subscribers</div>
        </div>
        <button class="btn btn-sm btn-secondary">Manage</button>
      </div>
    `;
  }).join('');

  return html`
    ${sectionHeader('Your Sites', '')}
    ${siteCards}
  `;
}

function renderSubscriptions(followedSites) {
  const state = getState();
  const top5 = followedSites.slice(0, 5);

  const rows = top5.map(site => {
    const isFollowing = state.following.has(site.id);
    const btnLabel = isFollowing ? 'Unfollow' : 'Follow';
    const btnClass = isFollowing ? 'btn btn-sm btn-secondary' : 'btn btn-sm btn-primary';
    return html`
      <div class="site-row">
        <img class="avatar avatar-site" src="${site.avatar}" alt="${site.name}" width="40" height="40">
        <div class="site-row-body">
          <div class="site-row-name">${site.name}</div>
          <div class="site-row-description">${site.description}</div>
        </div>
        <button class="${btnClass}" data-action="follow" data-id="${site.id}">${btnLabel}</button>
      </div>
    `;
  }).join('');

  const seeAll = followedSites.length > 5
    ? `<div class="see-all-link">See All ${followedSites.length} Sites</div>`
    : '';

  return html`
    ${sectionHeader(`Following ${followedSites.length} sites`, 'Manage')}
    ${rows}
    ${seeAll}
  `;
}

function renderLists() {
  const lists = [
    {
      name: 'Weekend Reads',
      count: 12,
      thumbs: [
        'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=64&h=64&fit=crop',
        'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=64&h=64&fit=crop',
        'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=64&h=64&fit=crop',
      ],
    },
    {
      name: 'Design Inspiration',
      count: 8,
      thumbs: [
        'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=64&h=64&fit=crop',
        'https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=64&h=64&fit=crop',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop',
      ],
    },
    {
      name: 'Tech Deep Dives',
      count: 15,
      thumbs: [
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=64&h=64&fit=crop',
        'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=64&h=64&fit=crop',
        'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=64&h=64&fit=crop',
      ],
    },
  ];

  const rows = lists.map(list => {
    const thumbs = list.thumbs.map(src =>
      `<img class="list-thumb" src="${src}" alt="" width="32" height="32">`
    ).join('');
    return html`
      <div class="list-row">
        <div class="list-thumbs">${thumbs}</div>
        <div class="list-row-body">
          <div class="list-row-name">${list.name}</div>
          <div class="list-row-count">${list.count} articles</div>
        </div>
        ${icon('chevron-right')}
      </div>
    `;
  }).join('');

  return html`
    ${sectionHeader('Lists', '')}
    ${rows}
    <button class="btn btn-secondary create-list-btn">
      ${icon('plus')} Create New List
    </button>
  `;
}

function renderSettings(state) {
  return html`
    ${sectionHeader('Settings', '')}

    <div class="settings-subsection">
      <div class="settings-subsection-title">Reading Preferences</div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Font Size</div>
          <div class="settings-description">Adjust reading text size</div>
        </div>
        ${fontSizeStepper(state.fontSize)}
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Typeface</div>
          <div class="settings-description">Choose your reading font</div>
        </div>
        ${segmented('typeface', [
          { value: 'serif', label: 'Serif' },
          { value: 'sans', label: 'Sans' },
          { value: 'dyslexia', label: 'Dyslexia' },
        ], state.typeface)}
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Line Spacing</div>
          <div class="settings-description">Adjust paragraph spacing</div>
        </div>
        ${segmented('lineSpacing', [
          { value: 'compact', label: 'Compact' },
          { value: 'comfortable', label: 'Comfortable' },
          { value: 'spacious', label: 'Spacious' },
        ], state.lineSpacing)}
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Theme</div>
          <div class="settings-description">Light, dark, or match your system</div>
        </div>
        ${segmented('theme', [
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'auto', label: 'Auto' },
        ], state.theme)}
      </div>
    </div>

    <div class="settings-subsection">
      <div class="settings-subsection-title">Feed Preferences</div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Default Sort</div>
          <div class="settings-description">How to order your feed</div>
        </div>
        ${segmented('defaultSort', [
          { value: 'chronological', label: 'Chronological' },
          { value: 'quality', label: 'Quality' },
        ], state.defaultSort)}
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Content Density</div>
          <div class="settings-description">How much content per screen</div>
        </div>
        ${segmented('contentDensity', [
          { value: 'compact', label: 'Compact' },
          { value: 'comfortable', label: 'Comfortable' },
          { value: 'spacious', label: 'Spacious' },
        ], state.contentDensity)}
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Auto-Clear Queue</div>
          <div class="settings-description">Automatically mark older saved items as read</div>
        </div>
        ${segmented('autoClearQueue', [
          { value: 'never', label: 'Never' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
        ], state.autoClearQueue)}
      </div>
    </div>

    <div class="settings-subsection">
      <div class="settings-subsection-title">Notifications</div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Calm Mode</div>
          <div class="settings-description">Batch notifications to 2x per day</div>
        </div>
        ${toggleSwitch('calmMode', state.calmMode)}
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-label">New Posts</div>
        </div>
        ${toggleSwitch('notifyPosts', state.notifyPosts)}
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Likes</div>
        </div>
        ${toggleSwitch('notifyLikes', state.notifyLikes)}
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Comments</div>
        </div>
        ${toggleSwitch('notifyComments', state.notifyComments)}
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-label">New Followers</div>
        </div>
        ${toggleSwitch('notifyFollows', state.notifyFollows)}
      </div>
    </div>

    <div class="settings-subsection">
      <div class="settings-subsection-title">Preferences</div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Go Invisible</div>
          <div class="settings-description">Hide your activity from other readers</div>
        </div>
        ${toggleSwitch('goInvisible', state.goInvisible)}
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Hide Reading Streak</div>
          <div class="settings-description">Don't show your streak publicly</div>
        </div>
        ${toggleSwitch('hideStreak', state.hideStreak)}
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Algorithm Transparency</div>
          <div class="settings-description">Show why content is recommended</div>
        </div>
        ${toggleSwitch('algoTransparency', state.algoTransparency)}
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Export All Data</div>
          <div class="settings-description">Download your reading data and subscriptions</div>
        </div>
        <button class="btn btn-sm btn-secondary">Export</button>
      </div>
    </div>

    <div class="settings-subsection">
      <div class="settings-subsection-title">Import</div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Import Subscriptions</div>
          <div class="settings-description">Bring your feeds from other platforms</div>
        </div>
        <div class="import-buttons">
          <button class="btn btn-sm btn-secondary">OPML</button>
          <button class="btn btn-sm btn-secondary">Substack</button>
          <button class="btn btn-sm btn-secondary">Mastodon</button>
        </div>
      </div>
    </div>
  `;
}

// Main render

export function render() {
  const user = getUser();
  const state = getState();
  const followedSites = getFollowedSites();

  const stats = user.stats;
  const totalHours = Math.round(stats.totalReadingTime / 60);

  return html`
    <div class="view view-you">
      ${renderProfileHeader(user, stats, totalHours)}
      ${!state.hideStreak ? renderStreakCard() : ''}
      ${renderYourSites(user.sites)}
      ${renderSubscriptions(followedSites)}
      ${renderLists()}
      ${renderSettings(state)}
    </div>
  `;
}
