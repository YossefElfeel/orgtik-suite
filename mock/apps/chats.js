const express = require('express');
const crypto = require('node:crypto');
const codec = require('./chats/runtime-state');
const clone = value => JSON.parse(JSON.stringify(value));
const reject = (status, code, message) => { throw Object.assign(new Error(message), { status, code }); };
const ownRoles = (identity, user) => identity.userScopes(user).filter(scope => scope.scope === 'hq').flatMap(scope => scope.roles);
const actorId = user => String(user.id);

function routes(router, ctx, options) {
  // The legacy build registers the launcher only. Customer routes require a private graph.
  if (!options?.state) return;
  const identity = ctx.identity, state = options.state, db = state.data, seq = state.sequences;
  function actor(user) {
    const roles = user && ownRoles(identity, user);
    if (!user || user.isActive === false || !roles?.some(role => ['owner', 'admin', 'member'].includes(role))) reject(403, 'workspace_chat_required', 'Workspace conversations require an assigned Chats member.');
    return { user, id: actorId(user), roles, admin: roles.some(role => ['owner', 'admin'].includes(role)) };
  }
  const members = () => identity.users.filter(user => user.isActive !== false && ownRoles(identity, user).some(role => ['owner', 'admin', 'member'].includes(role)));
  function channelFor(id, who, write = false) {
    const channel = db.channels.find(row => row.id === id);
    if (!channel || !channel.memberIds.includes(who.id)) reject(404, 'channel_not_found', 'Conversation not found.');
    if (write && (channel.archived || channel.custodyReadOnly)) reject(423, 'channel_read_only', 'This conversation is read-only.');
    return channel;
  }
  function messageFor(id, who) {
    const message = db.messages.find(row => row.id === id);
    if (!message) reject(404, 'message_not_found', 'Message not found.');
    channelFor(message.channelId, who, true); return message;
  }
  const mayManage = (channel, who) => { if (channel.ownerId !== who.id && !who.admin) reject(403, 'channel_manager_required', 'Only a conversation manager can make this change.'); };
  function nextEntity(prefix, inputId, counter, rows) {
    let next = seq[counter] + 1;
    if (inputId) { const match = inputId.match?.(new RegExp('^' + prefix + '-([0-9]+)$')); if (match) next = Math.max(next, Number(match[1])); }
    else while (rows.some(row => row.id === prefix + '-' + next)) next++;
    if (!Number.isSafeInteger(next)) reject(422, 'invalid_entity_id', 'Entity counter is outside the supported range.');
    return { id: inputId || prefix + '-' + next, next };
  }
  const directoryIds = () => new Set(members().map(actorId));
  function admittedIds(input) {
    if (!Array.isArray(input) || input.length > 200 || input.some(id => typeof id !== 'string' || !directoryIds().has(id))) reject(422, 'invalid_members', 'Choose current workspace members.');
    return [...new Set(input)];
  }
  function bootstrap(user) {
    const who = actor(user), visible = db.channels.filter(channel => channel.memberIds.includes(who.id));
    const visibleIds = new Set(visible.map(channel => channel.id));
    const reads = db.readState[who.id] || {}, preferences = db.channelPreferences[who.id] || {};
    const messages = db.messages.filter(message => visibleIds.has(message.channelId));
    const users = members().map(person => {
      const roles = ownRoles(identity, person), name = identity.fullName(person) || person.email || 'Workspace member';
      return { id: actorId(person), name, role: roles.includes('owner') ? 'owner' : roles.includes('admin') ? 'admin' : 'member', title: person.profile?.jobTitle || person.jobTitle || '', initials: name.split(/\s+/).map(word => word[0]).join('').slice(0, 2).toUpperCase(), tint: Number(person.id) % 12, timezone: person.profile?.timeZone || person.timezone || options.timeZone || 'Africa/Cairo' };
    });
    const channels = visible.map(channel => {
      const incoming = messages.filter(message => message.channelId === channel.id && message.sequence > (reads[channel.id] || 0) && message.authorId !== who.id && !message.deletedAt);
      return { ...clone(channel), memberIds: channel.memberIds.filter(id => directoryIds().has(id)), unread: incoming.length, mentions: incoming.filter(message => message.text.includes('@' + who.id)).length, notify: preferences[channel.id] || channel.notify };
    });
    const threadReplies = Object.fromEntries(messages.filter(message => message.threadId).reduce((entries, message) => { const entry = entries.find(([key]) => key === message.threadId); if (entry) entry[1].push(clone(message)); else entries.push([message.threadId, [clone(message)]]); return entries; }, []));
    const historicalIds = new Set(messages.flatMap(message => [message.authorId, ...message.replyUserIds]));
    const context = identity.currentContext?.(), canWrite = typeof identity.canWrite === 'function' ? identity.canWrite(user) : true;
    return { workspaceId: identity.workspaceId, dataRevision: seq.revision, me: who.id, access: { canWrite, readOnly: context?.actor.readOnly === true, roles: who.roles }, users, historicalUsers: clone(db.historicalUsers.filter(user => historicalIds.has(user.id))), channels, messages: clone(messages.filter(message => !message.threadId)), threadReplies, readState: clone(reads), presence: users.map(user => ({ userId: user.id, status: 'offline', position: { x: 14, y: 20 }, since: options.seedAt, speaking: false })), floor: clone(db.floor), meetings: clone(db.meetings.filter(meeting => meeting.participantIds.includes(who.id))), pastMeetings: clone(db.pastMeetings.filter(meeting => meeting.participantIds.includes(who.id))), notifications: [], insight: clone(db.insight), myTime: who.id === db.fixtureOwnerId ? clone(db.myTime) : codec.emptyTime(), settings: { ...clone(db.settings), activation: { state: context?.tools?.chat?.access === 'trial' ? 'trial' : 'active', tier: 'business', userCap: context?.tools?.chat?.seats?.capacity ?? null } }, whiteboards: clone(db.whiteboards), fixtureId: options.fixtureId || null };
  }
  function command(event, user, operationId) {
    const who = actor(user);
    if (typeof identity.canWrite === 'function' && !identity.canWrite(user)) reject(423, 'read_only', 'Changes are turned off for this workspace.');
    if (!event || typeof event.type !== 'string' || !codec.id(operationId)) reject(422, 'invalid_command', 'A command and operation ID are required.');
    // A receipt never bypasses today's channel membership, role or author policy.
    // This check runs before the duplicate lookup and does not mutate state.
    if (event.type === 'channel.created') {
      if (db.settings.canCreateChannels === 'admins' && !who.admin && ['public', 'private'].includes(event.channel?.kind)) reject(403, 'channel_creation_denied', 'An administrator must create this channel.');
      admittedIds(event.channel?.memberIds || []);
    } else if (event.type.startsWith('channel.') && event.type !== 'channel.all_read') {
      const channel = channelFor(event.channelId, who, event.type !== 'channel.read');
      if (['channel.members_added', 'channel.member_removed'].includes(event.type) || event.type === 'channel.updated' && Object.keys(event.patch || {}).some(key => key !== 'notify')) mayManage(channel, who);
    } else if (event.type === 'message.created') channelFor(event.message?.channelId, who, true);
    else if (event.type.startsWith('message.')) {
      const message = messageFor(event.messageId, who);
      if (event.type === 'message.edited' && message.authorId !== who.id || event.type === 'message.deleted' && message.authorId !== who.id && !who.admin) reject(403, 'message_author_required', 'The current role cannot change this message.');
    }
    const fingerprint = crypto.createHash('sha256').update(JSON.stringify({ actor: who.id, event })).digest('hex');
    const previous = db.processedCommands.find(row => row.id === operationId);
    if (previous) { if (previous.fingerprint !== fingerprint) reject(409, 'operation_conflict', 'This operation ID was used for another change.'); return bootstrap(user); }
    switch (event.type) {
      case 'channel.created': {
        const input = event.channel || {}, name = typeof input.name === 'string' && input.name.trim();
        if (!name || name.length > 100 || !['public', 'private', 'dm', 'group'].includes(input.kind) || input.topic && (typeof input.topic !== 'string' || input.topic.length > 500)) reject(422, 'invalid_channel', 'Enter a valid conversation name and kind.');
        if (db.settings.canCreateChannels === 'admins' && !who.admin && ['public', 'private'].includes(input.kind)) reject(403, 'channel_creation_denied', 'An administrator must create this channel.');
        const memberIds = [...new Set([who.id, ...admittedIds(input.memberIds || [])])];
        if (input.kind === 'dm' && memberIds.length !== 2) reject(422, 'invalid_dm', 'Choose one other workspace member.');
        const { id, next } = nextEntity('c', input.id, 'channels', db.channels);
        if (!codec.id(id) || db.channels.some(channel => channel.id === id)) reject(409, 'channel_id_conflict', 'Conversation ID is already used.');
        db.channels.push({ id, name, kind: input.kind, ...(input.topic ? { topic: input.topic.trim() } : {}), memberIds, ownerId: who.id, unread: 0, mentions: 0, archived: false, notify: db.settings.channelNotifyDefault }); seq.channels = next; break;
      }
      case 'channel.updated': {
        const channel = channelFor(event.channelId, who, true), patch = event.patch || {};
        if (Object.keys(patch).some(key => !['name', 'topic', 'notify', 'archived'].includes(key))) reject(422, 'invalid_channel_patch', 'Unsupported conversation change.');
        if (patch.notify !== undefined && !['all', 'mentions', 'none'].includes(patch.notify)) reject(422, 'invalid_notify', 'Choose a notification preference.');
        if (patch.name !== undefined && (typeof patch.name !== 'string' || !patch.name.trim() || patch.name.length > 100) || patch.topic !== undefined && (typeof patch.topic !== 'string' || patch.topic.length > 500) || patch.archived !== undefined && typeof patch.archived !== 'boolean') reject(422, 'invalid_channel_patch', 'Enter valid conversation details.');
        if (Object.keys(patch).some(key => key !== 'notify')) mayManage(channel, who);
        if (patch.notify !== undefined) (db.channelPreferences[who.id] ||= {})[channel.id] = patch.notify;
        for (const key of ['name', 'topic', 'archived']) if (patch[key] !== undefined) channel[key] = patch[key]; break;
      }
      case 'channel.members_added': { const channel = channelFor(event.channelId, who, true); mayManage(channel, who); channel.memberIds = [...new Set([...channel.memberIds, ...admittedIds(event.userIds)])]; break; }
      case 'channel.member_removed': { const channel = channelFor(event.channelId, who, true); mayManage(channel, who); if (event.userId === channel.ownerId) reject(422, 'channel_owner_required', 'Transfer conversation ownership before removing its owner.'); channel.memberIds = channel.memberIds.filter(id => id !== event.userId); break; }
      case 'channel.left': { const channel = channelFor(event.channelId, who, true); if (channel.ownerId === who.id) reject(422, 'channel_owner_required', 'Transfer conversation ownership before leaving.'); channel.memberIds = channel.memberIds.filter(id => id !== who.id); break; }
      case 'channel.read': { channelFor(event.channelId, who); (db.readState[who.id] ||= {})[event.channelId] = seq.messages; break; }
      case 'channel.all_read': { for (const channel of db.channels.filter(channel => channel.memberIds.includes(who.id))) (db.readState[who.id] ||= {})[channel.id] = seq.messages; break; }
      case 'message.created': {
        const input = event.message || {}, channel = channelFor(input.channelId, who, true);
        if (typeof input.text !== 'string' || !input.text.trim() || input.text.length > 10000) reject(422, 'invalid_message', 'Enter a message.');
        if (input.attachments?.length || input.contextRef) reject(501, 'file_reference_required', 'Files references will be connected in R2.');
        const thread = input.threadId && db.messages.find(message => message.id === input.threadId && !message.threadId && message.channelId === channel.id && !message.deletedAt);
        if (input.threadId && !thread) reject(422, 'invalid_thread', 'Choose a thread in this conversation.');
        const { id, next } = nextEntity('m', input.id, 'messages', db.messages);
        if (!codec.id(id) || db.messages.some(message => message.id === id)) reject(409, 'message_id_conflict', 'Message ID is already used.');
        seq.messages = next;
        db.messages.push({ id, channelId: channel.id, authorId: who.id, text: input.text, createdAt: new Date().toISOString(), sequence: next, replyCount: 0, replyUserIds: [], reactions: [], attachments: [], pinned: false, ...(thread ? { threadId: thread.id } : {}) });
        if (!db.historicalUsers.some(person => person.id === who.id)) { const name = identity.fullName(user) || 'Workspace member'; db.historicalUsers.push({ id: who.id, name, initials: name.split(/\s+/).map(word => word[0]).join('').slice(0, 2).toUpperCase(), tint: Number(user.id) % 12 }); }
        if (thread) { thread.replyCount++; thread.replyUserIds = [...new Set([...thread.replyUserIds, who.id])].slice(-5); } break;
      }
      case 'message.edited': { const message = messageFor(event.messageId, who); if (message.authorId !== who.id || message.deletedAt) reject(403, 'message_author_required', 'Only the author can edit this message.'); if (typeof event.text !== 'string' || !event.text.trim() || event.text.length > 10000) reject(422, 'invalid_message', 'Enter a message.'); message.text = event.text; message.editedAt = new Date().toISOString(); break; }
      case 'message.deleted': { const message = messageFor(event.messageId, who); if (message.authorId !== who.id && !who.admin) reject(403, 'message_author_required', 'Only the author or a moderator can delete this message.'); message.deletedAt ||= new Date().toISOString(); message.text = ''; message.attachments = []; break; }
      case 'message.reaction_toggled': { const message = messageFor(event.messageId, who); if (typeof event.emoji !== 'string' || !event.emoji.trim() || event.emoji.length > 32 || message.deletedAt) reject(422, 'invalid_reaction', 'Choose a reaction.'); let reaction = message.reactions.find(reaction => reaction.emoji === event.emoji); if (!reaction) { reaction = { emoji: event.emoji, userIds: [] }; message.reactions.push(reaction); } reaction.userIds = reaction.userIds.includes(who.id) ? reaction.userIds.filter(id => id !== who.id) : [...reaction.userIds, who.id]; message.reactions = message.reactions.filter(reaction => reaction.userIds.length); break; }
      case 'message.pin_toggled': { const message = messageFor(event.messageId, who); message.pinned = !message.pinned; break; }
      default: reject(501, 'chat_flow_deferred', 'This simulated flow is deferred; workspace conversations are available.');
    }
    seq.revision++; db.processedCommands.push({ id: operationId, fingerprint }); db.processedCommands = db.processedCommands.slice(-256); return bootstrap(user);
  }
  const handle = fn => (req, res) => { const user = identity.requireUser(req, res); if (!user) return; try { res.json({ success: true, data: fn(req, user) }); } catch (error) { if (!error.status) throw error; res.status(error.status).json({ success: false, code: error.code, message: error.message }); } };
  router.get('/api/hq/bootstrap', handle((_req, user) => bootstrap(user)));
  router.post('/api/hq/commands', handle((req, user) => command(req.body.event, user, req.get('Idempotency-Key') || req.body.operationId)));
  return {
    bootstrap, exportState: () => codec.encode(state), usage: () => [{ key: 'chat.messages', used: db.messages.length }], close() {},
    transferOwnership({ fromUserId, target, operationId }) {
      if (!Number.isSafeInteger(fromUserId) || !codec.id(operationId) || !target || !['member', 'archive'].includes(target.kind)) reject(422, 'invalid_custody', 'Choose a custody destination.');
      if (db.custodyOperations.includes(operationId)) return { transferred: [], archived: [] };
      const recipient = target.kind === 'member' && members().find(user => user.id === target.userId);
      if (target.kind === 'member' && (!recipient || recipient.id === fromUserId)) reject(422, 'invalid_custody_member', 'Choose another admitted Chats member.');
      const result = { transferred: [], archived: [] }, from = String(fromUserId);
      for (const channel of db.channels) {
        channel.memberIds = channel.memberIds.filter(id => id !== from);
        if (channel.ownerId !== from) continue;
        if (recipient) { channel.ownerId = actorId(recipient); channel.memberIds = [...new Set([...channel.memberIds, channel.ownerId])]; result.transferred.push('chat:channel:' + channel.id); }
        else { channel.ownerId = 'system:workspace'; channel.archived = true; channel.custodyReadOnly = true; result.archived.push('chat:channel:' + channel.id); }
      }
      db.custodyOperations.push(operationId); seq.revision++; return result;
    },
  };
}
module.exports = {
  scopes: [{ name: 'hq', displayName: 'Chats', description: 'Workspace conversations and meetings.', metadata: { icon: 'solar:chat-round-dots-bold', color: '#c04170' } }],
  grants: { hq: { admin: ['owner'], manager: ['admin'], u15: ['admin'], ...Object.fromEntries(['employee', 'sales', 'finance', 'u7', 'u8', 'u9', 'u10', 'u11', 'u12', 'u13', 'u14', 'u16'].map(key => [key, ['member']])) } }, routes,
  createWorkspaceRuntime: input => require('../lib/tool-adapters/chats').createWorkspaceRuntime(input, module.exports),
};
