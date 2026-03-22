// Article view — full article reading experience

import { getPost, getSite, getState, markRead, getPostsBySite, getRelatedPosts, getTtsState, getPosts, getUser } from '../store.js';
import { html, icon, timeAgo, readingTime, formatNumber, commentCard, smallCard, wordCount } from '../render.js';

const stubComments = [
  {
    author: 'Mika Sato',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop',
    date: '2026-02-17T09:15:00Z',
    content: 'This really resonated with me. Bookmarked it to re-read later — there\'s a lot to sit with here.',
    likes: 24,
  },
  {
    author: 'Jordan Ellis',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop',
    date: '2026-02-16T22:40:00Z',
    content: 'Shared this with my whole team. The framing in the third section is exactly what I\'ve been trying to articulate for months.',
    likes: 18,
  },
  {
    author: 'Aisha Okonkwo',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop',
    date: '2026-02-16T17:05:00Z',
    content: 'I appreciate how measured this is. So much writing on this topic is either breathlessly optimistic or doom-and-gloom — this finds the middle ground.',
    likes: 31,
  },
  {
    author: 'Carlos Medina',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop',
    date: '2026-02-16T11:30:00Z',
    content: 'Would love a follow-up that goes deeper into the practical side. The theory here is solid but I\'m left wondering about real-world applications.',
    likes: 12,
  },
  {
    author: 'Nina Kowalski',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop',
    date: '2026-02-15T20:18:00Z',
    content: 'One of the best things I\'ve read this week. The writing itself is beautiful — clear without being simplistic.',
    likes: 42,
  },
];

export function render(postId) {
  const post = getPost(postId);
  if (!post) {
    return html`
      <div class="view view-article">
        <div class="article-nav">
          <div class="article-nav-back" data-action="back">${icon('chevron-left')}</div>
        </div>
        <div class="empty-state">
          <h3>Article not found</h3>
          <p>This article may have been moved or removed.</p>
        </div>
      </div>
    `;
  }

  const site = getSite(post.siteId);
  const state = getState();
  const isSaved = state.saved.has(post.id);
  const isLiked = state.liked.has(post.id);
  const isFollowing = site ? state.following.has(site.id) : false;
  const tts = getTtsState();

  // Mark as read
  markRead(post.id);

  const wc = post.wordCount || post.readingTime * 238;
  const likeCount = post.likes + (isLiked ? 1 : 0);

  // Next post in queue
  const allPosts = getPosts();
  const currentIdx = allPosts.findIndex(p => p.id === post.id);
  const nextPost = allPosts[(currentIdx + 1) % allPosts.length];

  // More from this site
  const morePosts = site ? getPostsBySite(site.id, post.id).slice(0, 3) : [];
  // Related posts
  const relatedPosts = getRelatedPosts(post.id, 4);

  // Comments — use real data if available, otherwise show stubs when a count exists
  const comments = post.commentData || (post.comments > 0 ? stubComments : []);

  // Format date
  const pubDate = new Date(post.date);
  const dateStr = pubDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // TTS bar (rendered outside .view-article as fixed element)
  let ttsBarHtml = '';
  if (tts.active && tts.postId === postId) {
    const ttsPost = getPost(tts.postId);
    const speedLabel = tts.speed === 1 ? '1x' : tts.speed + 'x';
    ttsBarHtml = html`
      <div class="tts-bar">
        <div class="tts-bar-progress"></div>
        <div class="tts-bar-inner">
          ${ttsPost?.image ? `<img class="tts-bar-thumb" src="${ttsPost.image}" alt="">` : ''}
          <div class="tts-bar-info">
            <div class="tts-bar-title">${ttsPost?.title || ''}</div>
            <div class="tts-bar-time">${readingTime(ttsPost?.readingTime || 0)} left</div>
          </div>
          <div class="tts-bar-btn" data-action="tts-toggle" data-id="${postId}">
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

  return html`
    <div class="view view-article">
      <!-- Nav bar -->
      <div class="article-nav">
        <div class="article-nav-back" data-action="back">${icon('chevron-left')}</div>
        <div class="article-nav-site">${site?.name || ''}</div>
        <div class="article-nav-actions">
          <div class="article-nav-btn ${isSaved ? 'saved' : ''}" data-action="save" data-id="${post.id}">
            ${icon(isSaved ? 'bookmark-filled' : 'bookmark')}
          </div>
          <div class="article-nav-btn" data-action="share" data-id="${post.id}">
            ${icon('share')}
          </div>
          <div class="article-nav-btn" data-action="settings-popover-toggle">
            ${icon('settings')}
          </div>
          <div class="article-nav-btn" data-action="tts-toggle" data-id="${post.id}">
            ${icon('headphones')}
          </div>
          <div class="article-nav-btn" data-action="post-menu" data-id="${post.id}">
            ${icon('more-horizontal')}
          </div>
        </div>
      </div>

      <!-- Reading progress target div (width set by JS) -->
      <div id="reading-progress" class="reading-progress"></div>

      <!-- Header -->
      <div class="article-header">
        <div class="article-site-line">
          ${site ? `<img class="avatar avatar-site" src="${site.avatar}" alt="${site.name}" width="36" height="36">` : ''}
          <span class="article-site-name">${site?.name || 'Unknown'}</span>
          ${site ? `<span class="article-follow-btn ${isFollowing ? 'is-following' : ''}" data-action="follow" data-id="${site.id}">${isFollowing ? 'Following' : 'Follow'}</span>` : ''}
        </div>
        <h1 class="article-title">${post.title}</h1>
        <div class="article-meta">
          <span>${dateStr}</span>
          <span class="dot">&middot;</span>
          <span>${readingTime(post.readingTime)}</span>
          <span class="dot">&middot;</span>
          <span>${wordCount(wc)}</span>
          <span class="article-play-btn" data-action="tts-toggle" data-id="${post.id}">
            ${icon('play')}
          </span>
        </div>
      </div>

      <!-- Hero image -->
      ${post.image ? `<img class="article-hero" src="${post.image}" alt="">` : ''}

      <!-- Body -->
      <div class="article-body" id="article-body">
        ${post.content}
      </div>

      <!-- Action bar -->
      <div class="article-action-bar">
        <div class="article-action-group">
          <div class="article-action-btn" data-action="share" data-id="${post.id}">
            ${icon('share')}
          </div>
          <div class="article-action-btn" data-action="repost" data-id="${post.id}">
            ${icon('repeat')}
          </div>
          <div class="article-action-btn" data-action="comment" data-id="${post.id}">
            ${icon('message-circle')}
            <span class="article-action-count">${formatNumber(post.comments)}</span>
          </div>
          <div class="article-action-btn ${isLiked ? 'liked' : ''}" data-action="like" data-id="${post.id}">
            ${icon(isLiked ? 'heart-filled' : 'heart')}
            <span class="article-action-count">${formatNumber(likeCount)}</span>
          </div>
        </div>
        ${nextPost ? `<a class="article-next-btn" data-navigate="article/${nextPost.id}">Next Post ${icon('chevron-right')}</a>` : ''}
      </div>

      <!-- Comments -->
      <div class="article-comments" id="article-comments">
        <div class="article-comments-title">${comments.length > 0 ? `Comments (${post.comments})` : `Comments (${post.comments})`}</div>
        <div class="comment-compose">
          <img class="avatar avatar-sm" src="${getUser().avatar}" alt="${getUser().name}" width="32" height="32">
          <textarea class="comment-compose-input" placeholder="Join the conversation..." rows="2"></textarea>
        </div>
        ${comments.length > 0
          ? comments.map(c => commentCard(c)).join('')
          : `<p style="font-size:var(--text-sm);color:var(--color-text-tertiary);padding:var(--space-4) 0">Join the conversation — be the first to comment.</p>`
        }
      </div>

      <!-- More from this site -->
      ${morePosts.length > 0 ? html`
        <div class="article-related">
          <div class="article-related-title">More from ${site?.name || 'this site'}</div>
          ${morePosts.map(p => smallCard(p)).join('')}
        </div>
      ` : ''}

      <!-- Related posts -->
      ${relatedPosts.length > 0 ? html`
        <div class="article-related">
          <div class="article-related-title">Related posts</div>
          ${relatedPosts.map(p => smallCard(p)).join('')}
        </div>
      ` : ''}
    </div>

    <!-- TTS bar (outside .view-article, fixed) -->
    ${ttsBarHtml}
  `;
}
