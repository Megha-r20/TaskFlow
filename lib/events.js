import { EventEmitter } from 'events';

class TaskFlowEventEmitter extends EventEmitter {}

// Increase max listeners to avoid memory leak warnings (one per SSE connection)
global.taskFlowEvents = global.taskFlowEvents || new TaskFlowEventEmitter();
global.taskFlowEvents.setMaxListeners(100);

export const events = global.taskFlowEvents;

// Event names
export const EVENT_TYPES = {
  TASK_CREATED: 'TASK_CREATED',
  TASK_UPDATED: 'TASK_UPDATED',
  TASK_DELETED: 'TASK_DELETED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  NOTIFICATION: 'NOTIFICATION',
  MEMBER_JOINED: 'MEMBER_JOINED',
  PROJECT_UPDATED: 'PROJECT_UPDATED',
};

/**
 * Broadcast an event to all SSE subscribers.
 * @param {string} eventName - One of EVENT_TYPES
 * @param {object} payload - Data to send (must include workspaceId for workspace-scoped events)
 */
export function broadcastEvent(eventName, payload) {
  events.emit(eventName, { type: eventName, ...payload, _ts: Date.now() });
}
