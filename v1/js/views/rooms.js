// Rooms browse view — Your Living Rooms, Explore, topic pills

import {
  getJoinedRooms, getExploreRooms, getRooms, isRoomJoined, getRoomsByTag
} from '../store.js';
import { html, icon, sectionHeader, timeAgo, formatNumber } from '../render.js';

let activeTopic = null;

export function setTopic(tag) {
  activeTopic = activeTopic === tag ? null : tag;
}

function memberAvatars(members, max = 3) {
  const shown = members.slice(0, max);
  const extra = members.length > max ? members.length - max : 0;
  return `<div class="room-avatar-stack">
    ${shown.map((m, i) => `<img class="avatar avatar-sm room-avatar-stacked" src="${m.avatar}" alt="${m.name}" width="24" height="24" style="z-index:${max - i}">`).join('')}
    ${extra > 0 ? `<span class="room-avatar-extra">+${extra}</span>` : ''}
  </div>`;
}

function roomCard(room) {
  const isJoined = isRoomJoined(room.id);
  const typeIcon = room.type === 'private' ? 'lock' : 'globe';
  return html`
    <div class="room-card" data-navigate="room/${room.id}">
      <div class="room-card-cover" style="background-image:url(${room.coverImage})">
        ${room.unread > 0 && isJoined ? `<span class="room-card-badge">${room.unread}</span>` : ''}
      </div>
      <div class="room-card-body">
        <div class="room-card-name">
          ${icon(typeIcon, 'icon-xs')} ${room.name}
        </div>
        <div class="room-card-meta">
          ${memberAvatars(room.members)}
          <span>${formatNumber(room.memberCount)} members</span>
          <span class="dot">&middot;</span>
          <span>${timeAgo(room.lastActivity)}</span>
        </div>
      </div>
    </div>
  `;
}

function popularRoomCard(room) {
  const typeIcon = room.type === 'private' ? 'lock' : 'globe';
  return html`
    <div class="room-popular-card" data-navigate="room/${room.id}">
      <div class="room-popular-card-cover" style="background-image:url(${room.coverImage})"></div>
      <div class="room-popular-card-body">
        <div class="room-popular-card-name">${icon(typeIcon, 'icon-xs')} ${room.name}</div>
        <div class="room-popular-card-meta">${formatNumber(room.memberCount)} members</div>
      </div>
    </div>
  `;
}

function exploreRoomRow(room, reason) {
  const typeIcon = room.type === 'private' ? 'lock' : 'globe';
  const joined = isRoomJoined(room.id);
  return html`
    <div class="room-explore-row">
      <div class="room-explore-row-cover" style="background-image:url(${room.coverImage})" data-navigate="room/${room.id}"></div>
      <div class="room-explore-row-body" data-navigate="room/${room.id}">
        <div class="room-explore-row-name">${icon(typeIcon, 'icon-xs')} ${room.name}</div>
        <div class="room-explore-row-desc">${room.description.length > 80 ? room.description.slice(0, 80) + '...' : room.description}</div>
        <div class="room-explore-row-meta">
          ${formatNumber(room.memberCount)} members
          ${reason ? `<span class="room-reason-pill">${reason}</span>` : ''}
        </div>
      </div>
      <button class="btn btn-sm ${joined ? 'btn-secondary is-following' : 'btn-primary'}" data-action="join-room" data-id="${room.id}">
        ${joined ? 'Joined' : 'Join'}
      </button>
    </div>
  `;
}

export function render() {
  const joined = getJoinedRooms().sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
  const explore = getExploreRooms();
  const allRooms = getRooms();

  // Your Living Rooms
  const yourRoomsSection = joined.length > 0 ? html`
    ${sectionHeader('Your Living Rooms', '')}
    <div class="rooms-grid">
      ${joined.map(r => roomCard(r)).join('')}
      <div class="rooms-create-btn" data-action="create-room">
        ${icon('plus')}
        <span>Create a Room</span>
      </div>
    </div>
  ` : html`
    ${sectionHeader('Your Living Rooms', '')}
    <div class="rooms-grid">
      <div class="rooms-create-btn" data-action="create-room">
        ${icon('plus')}
        <span>Create a Room</span>
      </div>
    </div>
  `;

  // Popular Rooms (sorted by memberCount)
  const popular = [...allRooms].sort((a, b) => b.memberCount - a.memberCount);
  const popularSection = html`
    ${sectionHeader('Popular Rooms', '')}
    <div class="horizontal-scroll">
      ${popular.map(r => popularRoomCard(r)).join('')}
    </div>
  `;

  // Rooms You Might Like
  const reasons = ['Based on your reading', 'Trending', 'Active community', 'New & growing'];
  const mightLikeSection = explore.length > 0 ? html`
    ${sectionHeader('Rooms You Might Like', '')}
    <div class="room-explore-list">
      ${explore.map((r, i) => exploreRoomRow(r, reasons[i % reasons.length])).join('')}
    </div>
  ` : '';

  // Browse by Topic
  const allTags = [...new Set(allRooms.flatMap(r => r.tags))].sort();
  const filteredRooms = activeTopic ? getRoomsByTag(activeTopic) : [];

  const topicSection = html`
    ${sectionHeader('Browse by Topic', '')}
    <div class="room-topic-pills">
      ${allTags.map(tag => html`
        <button class="room-topic-pill ${activeTopic === tag ? 'active' : ''}" data-action="room-topic-filter" data-tag="${tag}">
          ${tag}
        </button>
      `).join('')}
    </div>
    ${activeTopic ? (filteredRooms.length > 0 ? html`
      <div class="room-explore-list">
        ${filteredRooms.map(r => exploreRoomRow(r, '')).join('')}
      </div>
    ` : html`
      <div class="completion-state" style="padding:var(--space-8) 0">
        <p>No rooms match this topic yet.</p>
      </div>
    `) : ''}
  `;

  return html`
    <div class="view view-rooms">
      ${yourRoomsSection}
      ${popularSection}
      ${mightLikeSection}
      ${topicSection}
    </div>
  `;
}
