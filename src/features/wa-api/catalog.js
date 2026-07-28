// Catalog of open-wa API operations, grouped as in the server's Swagger.
// Each op: { m: method, p: path (with {params}), s: summary, b?: sample body }.
// `{sessionId}` is auto-filled from the session picker; other {params} prompt
// for a value. Paths are relative to open-wa's /api (the wa-proxy adds it).
export const WA_CATALOG = [
  {
    group: 'Sessions',
    ops: [
      { m: 'GET', p: 'sessions', s: 'List sessions' },
      { m: 'POST', p: 'sessions', s: 'Create session', b: { name: 'default' } },
      { m: 'GET', p: 'sessions/{sessionId}', s: 'Get session' },
      { m: 'DELETE', p: 'sessions/{sessionId}', s: 'Delete session' },
      { m: 'POST', p: 'sessions/{sessionId}/start', s: 'Start session' },
      { m: 'POST', p: 'sessions/{sessionId}/stop', s: 'Stop session' },
      { m: 'POST', p: 'sessions/{sessionId}/force-kill', s: 'Force kill session' },
      { m: 'GET', p: 'sessions/{sessionId}/qr', s: 'Get QR code' },
      { m: 'POST', p: 'sessions/{sessionId}/pairing-code', s: 'Request pairing code', b: { phoneNumber: '918452015261' } },
      { m: 'GET', p: 'sessions/stats/overview', s: 'Sessions stats overview' },
    ],
  },
  {
    group: 'Messages',
    ops: [
      { m: 'GET', p: 'sessions/{sessionId}/messages', s: 'List messages' },
      { m: 'POST', p: 'sessions/{sessionId}/messages/send-text', s: 'Send text', b: { chatId: '918452015261@c.us', text: 'Hello' } },
      { m: 'POST', p: 'sessions/{sessionId}/messages/send-template', s: 'Send template', b: { chatId: '918452015261@c.us', template: 'welcome', variables: {} } },
      { m: 'POST', p: 'sessions/{sessionId}/messages/send-image', s: 'Send image', b: { chatId: '918452015261@c.us', file: { url: 'https://picsum.photos/400', mimetype: 'image/jpeg', filename: 'img.jpg' }, caption: '' } },
      { m: 'POST', p: 'sessions/{sessionId}/messages/send-video', s: 'Send video', b: { chatId: '918452015261@c.us', file: { url: 'https://example.com/clip.mp4', mimetype: 'video/mp4', filename: 'clip.mp4' }, caption: '' } },
      { m: 'POST', p: 'sessions/{sessionId}/messages/send-audio', s: 'Send audio', b: { chatId: '918452015261@c.us', file: { url: 'https://example.com/a.mp3', mimetype: 'audio/mpeg', filename: 'a.mp3' } } },
      { m: 'POST', p: 'sessions/{sessionId}/messages/send-document', s: 'Send document', b: { chatId: '918452015261@c.us', file: { url: 'https://example.com/f.pdf', mimetype: 'application/pdf', filename: 'f.pdf' }, caption: '' } },
      { m: 'POST', p: 'sessions/{sessionId}/messages/send-location', s: 'Send location', b: { chatId: '918452015261@c.us', latitude: 19.076, longitude: 72.877, name: 'Mumbai' } },
      { m: 'POST', p: 'sessions/{sessionId}/messages/send-contact', s: 'Send contact', b: { chatId: '918452015261@c.us', contactId: '918452015261@c.us' } },
      { m: 'POST', p: 'sessions/{sessionId}/messages/send-sticker', s: 'Send sticker', b: { chatId: '918452015261@c.us', file: { url: 'https://example.com/s.webp', mimetype: 'image/webp' } } },
      { m: 'POST', p: 'sessions/{sessionId}/messages/send-poll', s: 'Send poll', b: { chatId: '918452015261@c.us', name: 'Question?', options: ['A', 'B'] } },
      { m: 'POST', p: 'sessions/{sessionId}/messages/reply', s: 'Reply to a message', b: { chatId: '918452015261@c.us', text: 'Reply', quotedMessageId: '' } },
      { m: 'POST', p: 'sessions/{sessionId}/messages/forward', s: 'Forward a message', b: { chatId: '918452015261@c.us', messageId: '' } },
      { m: 'POST', p: 'sessions/{sessionId}/messages/react', s: 'React to a message', b: { messageId: '', reaction: '👍' } },
      { m: 'GET', p: 'sessions/{sessionId}/messages/{chatId}/history', s: 'Chat history' },
      { m: 'GET', p: 'sessions/{sessionId}/messages/{chatId}/{messageId}/reactions', s: 'Message reactions' },
      { m: 'POST', p: 'sessions/{sessionId}/messages/delete', s: 'Delete a message', b: { messageId: '' } },
      { m: 'POST', p: 'sessions/{sessionId}/messages/edit', s: 'Edit a message', b: { messageId: '', text: '' } },
      { m: 'POST', p: 'sessions/{sessionId}/messages/send-bulk', s: 'Send bulk', b: { messages: [{ chatId: '918452015261@c.us', text: 'Hi' }] } },
      { m: 'GET', p: 'sessions/{sessionId}/messages/batch/{batchId}', s: 'Get bulk batch' },
      { m: 'POST', p: 'sessions/{sessionId}/messages/batch/{batchId}/cancel', s: 'Cancel bulk batch' },
    ],
  },
  {
    group: 'Chats',
    ops: [
      { m: 'GET', p: 'sessions/{sessionId}/chats', s: 'List chats' },
      { m: 'POST', p: 'sessions/{sessionId}/chats/read', s: 'Mark chat read', b: { chatId: '918452015261@c.us' } },
      { m: 'POST', p: 'sessions/{sessionId}/chats/unread', s: 'Mark chat unread', b: { chatId: '918452015261@c.us' } },
      { m: 'POST', p: 'sessions/{sessionId}/chats/delete', s: 'Delete chat', b: { chatId: '918452015261@c.us' } },
      { m: 'POST', p: 'sessions/{sessionId}/chats/typing', s: 'Set typing', b: { chatId: '918452015261@c.us', typing: true } },
    ],
  },
  {
    group: 'Contacts',
    ops: [
      { m: 'GET', p: 'sessions/{sessionId}/contacts', s: 'List contacts' },
      { m: 'GET', p: 'sessions/{sessionId}/contacts/profile-pictures', s: 'All profile pictures' },
      { m: 'GET', p: 'sessions/{sessionId}/contacts/check/{number}', s: 'Check number on WhatsApp' },
      { m: 'GET', p: 'sessions/{sessionId}/contacts/{contactId}', s: 'Get contact' },
      { m: 'GET', p: 'sessions/{sessionId}/contacts/{contactId}/profile-picture', s: 'Contact profile picture' },
      { m: 'GET', p: 'sessions/{sessionId}/contacts/{contactId}/phone', s: 'Contact phone' },
      { m: 'POST', p: 'sessions/{sessionId}/contacts/{contactId}/block', s: 'Block contact' },
      { m: 'DELETE', p: 'sessions/{sessionId}/contacts/{contactId}/block', s: 'Unblock contact' },
    ],
  },
  {
    group: 'Groups',
    ops: [
      { m: 'GET', p: 'sessions/{sessionId}/groups', s: 'List groups' },
      { m: 'POST', p: 'sessions/{sessionId}/groups', s: 'Create group', b: { name: 'My Group', participants: ['918452015261@c.us'] } },
      { m: 'GET', p: 'sessions/{sessionId}/groups/{groupId}', s: 'Get group' },
      { m: 'POST', p: 'sessions/{sessionId}/groups/join', s: 'Join group by code', b: { code: '' } },
      { m: 'GET', p: 'sessions/{sessionId}/groups/{groupId}/settings', s: 'Group settings' },
      { m: 'PUT', p: 'sessions/{sessionId}/groups/{groupId}/settings', s: 'Update settings', b: {} },
      { m: 'POST', p: 'sessions/{sessionId}/groups/{groupId}/participants', s: 'Add participants', b: { participants: ['918452015261@c.us'] } },
      { m: 'DELETE', p: 'sessions/{sessionId}/groups/{groupId}/participants', s: 'Remove participants', b: { participants: ['918452015261@c.us'] } },
      { m: 'POST', p: 'sessions/{sessionId}/groups/{groupId}/participants/promote', s: 'Promote to admin', b: { participants: [] } },
      { m: 'POST', p: 'sessions/{sessionId}/groups/{groupId}/participants/demote', s: 'Demote admin', b: { participants: [] } },
      { m: 'PUT', p: 'sessions/{sessionId}/groups/{groupId}/subject', s: 'Set subject', b: { subject: '' } },
      { m: 'PUT', p: 'sessions/{sessionId}/groups/{groupId}/description', s: 'Set description', b: { description: '' } },
      { m: 'POST', p: 'sessions/{sessionId}/groups/{groupId}/leave', s: 'Leave group' },
      { m: 'GET', p: 'sessions/{sessionId}/groups/{groupId}/invite-code', s: 'Get invite code' },
      { m: 'POST', p: 'sessions/{sessionId}/groups/{groupId}/invite-code/revoke', s: 'Revoke invite code' },
    ],
  },
  {
    group: 'Labels',
    ops: [
      { m: 'GET', p: 'sessions/{sessionId}/labels', s: 'List labels' },
      { m: 'GET', p: 'sessions/{sessionId}/labels/{labelId}', s: 'Get label' },
      { m: 'GET', p: 'sessions/{sessionId}/labels/chat/{chatId}', s: 'Chat labels' },
      { m: 'POST', p: 'sessions/{sessionId}/labels/chat/{chatId}', s: 'Add label to chat', b: { labelId: '' } },
      { m: 'DELETE', p: 'sessions/{sessionId}/labels/chat/{chatId}/{labelId}', s: 'Remove label from chat' },
    ],
  },
  {
    group: 'Channels',
    ops: [
      { m: 'GET', p: 'sessions/{sessionId}/channels', s: 'List channels' },
      { m: 'GET', p: 'sessions/{sessionId}/channels/{channelId}', s: 'Get channel' },
      { m: 'GET', p: 'sessions/{sessionId}/channels/{channelId}/messages', s: 'Channel messages' },
      { m: 'POST', p: 'sessions/{sessionId}/channels/subscribe', s: 'Subscribe channel', b: { channelId: '' } },
      { m: 'DELETE', p: 'sessions/{sessionId}/channels/{channelId}', s: 'Unsubscribe channel' },
    ],
  },
  {
    group: 'Status',
    ops: [
      { m: 'GET', p: 'sessions/{sessionId}/status', s: 'Get statuses' },
      { m: 'GET', p: 'sessions/{sessionId}/status/{contactId}', s: 'Contact status' },
      { m: 'POST', p: 'sessions/{sessionId}/status/send-text', s: 'Post text status', b: { text: 'Hello status' } },
      { m: 'POST', p: 'sessions/{sessionId}/status/send-image', s: 'Post image status', b: { file: { url: '' } } },
      { m: 'POST', p: 'sessions/{sessionId}/status/send-video', s: 'Post video status', b: { file: { url: '' } } },
      { m: 'DELETE', p: 'sessions/{sessionId}/status/{statusId}', s: 'Delete status' },
    ],
  },
  {
    group: 'Profile',
    ops: [
      { m: 'PUT', p: 'sessions/{sessionId}/profile/name', s: 'Set profile name', b: { name: '' } },
      { m: 'PUT', p: 'sessions/{sessionId}/profile/status', s: 'Set profile status', b: { status: '' } },
      { m: 'PUT', p: 'sessions/{sessionId}/profile/picture', s: 'Set profile picture', b: { url: '' } },
    ],
  },
  {
    group: 'Templates',
    ops: [
      { m: 'GET', p: 'sessions/{sessionId}/templates', s: 'List templates' },
      { m: 'POST', p: 'sessions/{sessionId}/templates', s: 'Create template', b: { name: '', content: '' } },
      { m: 'GET', p: 'sessions/{sessionId}/templates/{id}', s: 'Get template' },
      { m: 'PUT', p: 'sessions/{sessionId}/templates/{id}', s: 'Update template', b: {} },
      { m: 'DELETE', p: 'sessions/{sessionId}/templates/{id}', s: 'Delete template' },
    ],
  },
  {
    group: 'Catalog',
    ops: [
      { m: 'GET', p: 'sessions/{sessionId}/catalog', s: 'Get catalog' },
      { m: 'GET', p: 'sessions/{sessionId}/catalog/products', s: 'List products' },
      { m: 'GET', p: 'sessions/{sessionId}/catalog/products/{productId}', s: 'Get product' },
      { m: 'POST', p: 'sessions/{sessionId}/messages/send-product', s: 'Send product', b: { chatId: '918452015261@c.us', productId: '' } },
      { m: 'POST', p: 'sessions/{sessionId}/messages/send-catalog', s: 'Send catalog', b: { chatId: '918452015261@c.us' } },
    ],
  },
  {
    group: 'Calls',
    ops: [
      { m: 'POST', p: 'sessions/{sessionId}/calls/{callId}/reject', s: 'Reject call' },
    ],
  },
  {
    group: 'Webhooks',
    ops: [
      { m: 'GET', p: 'sessions/{sessionId}/webhooks', s: 'List webhooks' },
      { m: 'POST', p: 'sessions/{sessionId}/webhooks', s: 'Create webhook', b: { url: 'https://example.com/hook', events: ['message'] } },
      { m: 'GET', p: 'sessions/{sessionId}/webhooks/{id}', s: 'Get webhook' },
      { m: 'PUT', p: 'sessions/{sessionId}/webhooks/{id}', s: 'Update webhook', b: {} },
      { m: 'POST', p: 'sessions/{sessionId}/webhooks/{id}/test', s: 'Test webhook' },
      { m: 'DELETE', p: 'sessions/{sessionId}/webhooks/{id}', s: 'Delete webhook' },
      { m: 'GET', p: 'webhooks', s: 'List all webhooks' },
      { m: 'GET', p: 'webhooks/delivery-failures', s: 'Delivery failures' },
    ],
  },
  {
    group: 'Auth',
    ops: [
      { m: 'GET', p: 'auth/api-keys', s: 'List API keys' },
      { m: 'POST', p: 'auth/api-keys', s: 'Create API key', b: { name: '', role: 'OPERATOR' } },
      { m: 'GET', p: 'auth/api-keys/{id}', s: 'Get API key' },
      { m: 'PUT', p: 'auth/api-keys/{id}', s: 'Update API key', b: {} },
      { m: 'DELETE', p: 'auth/api-keys/{id}', s: 'Delete API key' },
      { m: 'POST', p: 'auth/api-keys/{id}/revoke', s: 'Revoke API key' },
      { m: 'POST', p: 'auth/validate', s: 'Validate API key', b: {} },
    ],
  },
  {
    group: 'Plugins',
    ops: [
      { m: 'GET', p: 'plugins', s: 'List plugins' },
      { m: 'GET', p: 'plugins/catalog', s: 'Plugin catalog' },
      { m: 'POST', p: 'plugins/install', s: 'Install plugin', b: {} },
      { m: 'POST', p: 'plugins/install-url', s: 'Install from URL', b: { url: '' } },
      { m: 'GET', p: 'plugins/{id}', s: 'Get plugin' },
      { m: 'POST', p: 'plugins/{id}/enable', s: 'Enable plugin' },
      { m: 'POST', p: 'plugins/{id}/disable', s: 'Disable plugin' },
      { m: 'PUT', p: 'plugins/{id}/config', s: 'Update plugin config', b: {} },
      { m: 'GET', p: 'plugins/{id}/config-ui', s: 'Plugin config UI' },
    ],
  },
  {
    group: 'Infrastructure',
    ops: [
      { m: 'GET', p: 'infra/status', s: 'Infra status' },
      { m: 'GET', p: 'infra/engines', s: 'List engines' },
      { m: 'GET', p: 'infra/engines/current', s: 'Current engine' },
      { m: 'GET', p: 'infra/config', s: 'Get config' },
      { m: 'PUT', p: 'infra/config', s: 'Update config', b: {} },
      { m: 'POST', p: 'infra/restart', s: 'Restart server' },
      { m: 'GET', p: 'infra/health', s: 'Infra health' },
      { m: 'GET', p: 'infra/export-data', s: 'Export data' },
      { m: 'GET', p: 'infra/storage/files/count', s: 'Storage file count' },
      { m: 'GET', p: 'infra/storage/export', s: 'Storage export' },
    ],
  },
  {
    group: 'Settings & System',
    ops: [
      { m: 'GET', p: 'settings', s: 'Get settings' },
      { m: 'PUT', p: 'settings', s: 'Update settings', b: {} },
      { m: 'GET', p: 'stats/overview', s: 'Stats overview' },
      { m: 'GET', p: 'stats/messages', s: 'Message stats' },
      { m: 'GET', p: 'stats/sessions/{sessionId}', s: 'Session stats' },
      { m: 'GET', p: 'metrics', s: 'Prometheus metrics' },
      { m: 'GET', p: 'audit', s: 'Audit log' },
      { m: 'GET', p: 'health', s: 'Health' },
      { m: 'GET', p: 'health/live', s: 'Liveness' },
      { m: 'GET', p: 'health/ready', s: 'Readiness' },
    ],
  },
];

export const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

// Extract {param} tokens from a path, e.g. 'sessions/{sessionId}/chats' -> ['sessionId'].
export function pathParams(p) {
  return [...String(p).matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
}
