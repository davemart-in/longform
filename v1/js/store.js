// Store — data loading + mutable state with localStorage persistence

let data = {
  sites: [],
  posts: [],
  user: {},
  discover: {},
  rooms: [],
};

let state = {
  saved: new Set(),
  read: new Set(),
  liked: new Set(),
  following: new Set(),
  pinned: new Set(),
  muted: new Set(),
  highlights: [],
  theme: 'light',
  fontSize: 'medium',
  typeface: 'serif',
  lineSpacing: 'comfortable',
  contentDensity: 'comfortable',
  defaultSort: 'chronological',
  calmMode: false,
  notifyPosts: true,
  notifyLikes: true,
  notifyComments: true,
  notifyFollows: true,
  goInvisible: false,
  hideStreak: false,
  algoTransparency: true,
  autoClearQueue: 'never',
  joinedRooms: new Set(),
};

// Transient state (not persisted)
let activeSiteFilter = null;

let ttsState = { active: false, playing: false, postId: null, speed: 1 };

const listeners = [];

function loadState() {
  try {
    const raw = localStorage.getItem('longform-state');
    if (raw) {
      const parsed = JSON.parse(raw);
      state.saved = new Set(parsed.saved || []);
      state.read = new Set(parsed.read || []);
      state.liked = new Set(parsed.liked || []);
      state.following = new Set(parsed.following || []);
      state.pinned = new Set(parsed.pinned || []);
      state.muted = new Set(parsed.muted || []);
      state.highlights = parsed.highlights || [];
      state.theme = parsed.theme || 'light';
      state.fontSize = parsed.fontSize || 'medium';
      state.typeface = parsed.typeface || 'serif';
      state.lineSpacing = parsed.lineSpacing || 'comfortable';
      state.contentDensity = parsed.contentDensity || 'comfortable';
      state.defaultSort = parsed.defaultSort || 'chronological';
      state.calmMode = parsed.calmMode ?? false;
      state.notifyPosts = parsed.notifyPosts ?? true;
      state.notifyLikes = parsed.notifyLikes ?? true;
      state.notifyComments = parsed.notifyComments ?? true;
      state.notifyFollows = parsed.notifyFollows ?? true;
      state.goInvisible = parsed.goInvisible ?? false;
      state.hideStreak = parsed.hideStreak ?? false;
      state.algoTransparency = parsed.algoTransparency ?? true;
      state.autoClearQueue = parsed.autoClearQueue ?? 'never';
      state.joinedRooms = new Set(parsed.joinedRooms || []);
    }
  } catch (e) {
    // ignore corrupt state
  }
}

function saveState() {
  localStorage.setItem('longform-state', JSON.stringify({
    saved: [...state.saved],
    read: [...state.read],
    liked: [...state.liked],
    following: [...state.following],
    pinned: [...state.pinned],
    muted: [...state.muted],
    highlights: state.highlights,
    theme: state.theme,
    fontSize: state.fontSize,
    typeface: state.typeface,
    lineSpacing: state.lineSpacing,
    contentDensity: state.contentDensity,
    defaultSort: state.defaultSort,
    calmMode: state.calmMode,
    notifyPosts: state.notifyPosts,
    notifyLikes: state.notifyLikes,
    notifyComments: state.notifyComments,
    notifyFollows: state.notifyFollows,
    goInvisible: state.goInvisible,
    hideStreak: state.hideStreak,
    algoTransparency: state.algoTransparency,
    autoClearQueue: state.autoClearQueue,
    joinedRooms: [...state.joinedRooms],
  }));
}

function notify() {
  listeners.forEach(fn => fn(state));
}

function toggle(set, id) {
  if (set.has(id)) {
    set.delete(id);
  } else {
    set.add(id);
  }
  saveState();
  notify();
}

// Public API

export async function init() {
  loadState();

  const [sites, posts, user, discover, rooms] = await Promise.all([
    fetch('data/sites.json').then(r => r.json()),
    fetch('data/posts.json').then(r => r.json()),
    fetch('data/user.json').then(r => r.json()),
    fetch('data/discover.json').then(r => r.json()),
    fetch('data/rooms.json').then(r => r.json()),
  ]);

  data.sites = sites;
  data.posts = posts;
  data.user = user;
  data.discover = discover;
  data.rooms = rooms;

  // Seed following from data if state is empty
  if (state.following.size === 0) {
    sites.filter(s => s.isFollowing).forEach(s => state.following.add(s.id));
    saveState();
  }

  // Seed joinedRooms from data if state is empty
  if (state.joinedRooms.size === 0) {
    rooms.filter(r => r.isJoined).forEach(r => state.joinedRooms.add(r.id));
    saveState();
  }
}

export function getState() {
  return state;
}

export function getPosts() {
  return data.posts;
}

export function getSites() {
  return data.sites;
}

export function getUser() {
  return data.user;
}

export function getDiscover() {
  return data.discover;
}

export function getPost(id) {
  return data.posts.find(p => p.id === id);
}

export function getSite(id) {
  return data.sites.find(s => s.id === id);
}

export function getSavedPosts() {
  return data.posts.filter(p => state.saved.has(p.id));
}

export function getFollowedSites() {
  return data.sites.filter(s => state.following.has(s.id));
}

export function getFollowedPosts() {
  return data.posts
    .filter(p => state.following.has(p.siteId))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function toggleSave(postId) {
  toggle(state.saved, postId);
}

export function markRead(postId) {
  state.read.add(postId);
  saveState();
}

export function toggleLike(postId) {
  toggle(state.liked, postId);
}

export function toggleFollow(siteId) {
  toggle(state.following, siteId);
}

export function togglePin(siteId) {
  toggle(state.pinned, siteId);
}

export function toggleMute(siteId) {
  toggle(state.muted, siteId);
}

// Rooms

export function getRooms() {
  return data.rooms;
}

export function getRoom(id) {
  return data.rooms.find(r => r.id === id);
}

export function getJoinedRooms() {
  return data.rooms.filter(r => state.joinedRooms.has(r.id));
}

export function getExploreRooms() {
  return data.rooms.filter(r => !state.joinedRooms.has(r.id));
}

export function isRoomJoined(roomId) {
  return state.joinedRooms.has(roomId);
}

export function toggleJoinRoom(roomId) {
  toggle(state.joinedRooms, roomId);
}

export function getRoomsByTag(tag) {
  return data.rooms.filter(r => r.tags.includes(tag));
}

export function setActiveSiteFilter(siteId) {
  activeSiteFilter = siteId;
  notify();
}

export function clearActiveSiteFilter() {
  activeSiteFilter = null;
  notify();
}

export function getActiveSiteFilter() {
  return activeSiteFilter;
}

export function getFilteredFollowedPosts() {
  let posts = data.posts
    .filter(p => state.following.has(p.siteId))
    .filter(p => !state.muted.has(p.siteId));

  if (activeSiteFilter) {
    posts = posts.filter(p => p.siteId === activeSiteFilter);
  }

  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getSiteCategory(siteId) {
  const site = data.sites.find(s => s.id === siteId);
  return site?.category || 'General';
}

export function getTtsState() {
  return ttsState;
}

export function toggleTts(postId) {
  if (ttsState.active && ttsState.postId === postId) {
    ttsState.playing = !ttsState.playing;
  } else {
    ttsState = { active: true, playing: true, postId, speed: ttsState.speed };
  }
  notify();
}

export function closeTts() {
  ttsState = { active: false, playing: false, postId: null, speed: 1 };
  notify();
}

export function cycleTtsSpeed() {
  const speeds = [1, 1.25, 1.5, 2];
  const idx = speeds.indexOf(ttsState.speed);
  ttsState.speed = speeds[(idx + 1) % speeds.length];
  notify();
}

export function getPostsBySite(siteId, excludePostId) {
  return data.posts
    .filter(p => p.siteId === siteId && p.id !== excludePostId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getRelatedPosts(postId, limit = 4) {
  const post = data.posts.find(p => p.id === postId);
  if (!post) return [];
  const site = data.sites.find(s => s.id === post.siteId);
  const category = site?.category;

  return data.posts
    .filter(p => p.id !== postId)
    .map(p => {
      const pSite = data.sites.find(s => s.id === p.siteId);
      const score = pSite?.category === category ? 2 : 0;
      return { post: p, score };
    })
    .sort((a, b) => b.score - a.score || new Date(b.post.date) - new Date(a.post.date))
    .slice(0, limit)
    .map(r => r.post);
}

export function getReadPosts() {
  return data.posts.filter(p => state.read.has(p.id));
}

export function setTheme(theme) {
  state.theme = theme;
  saveState();
  notify();
}

export function addHighlight(highlight) {
  state.highlights.push(highlight);
  saveState();
  notify();
}

export function getHighlights() {
  return state.highlights;
}

export function getHighlightsForPost(postId) {
  return state.highlights.filter(h => h.postId === postId);
}

export function removeHighlight(id) {
  state.highlights = state.highlights.filter(h => h.id !== id);
  saveState();
  notify();
}

export function setPreference(key, value) {
  if (key in state) {
    state[key] = value;
    saveState();
    notify();
  }
}

export function togglePreference(key) {
  if (typeof state[key] === 'boolean') {
    state[key] = !state[key];
    saveState();
    notify();
  }
}

export function subscribe(fn) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}
