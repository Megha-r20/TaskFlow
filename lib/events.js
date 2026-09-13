import { EventEmitter } from 'events';

class TaskFlowEventEmitter extends EventEmitter {}

global.taskFlowEvents = global.taskFlowEvents || new TaskFlowEventEmitter();

export const events = global.taskFlowEvents;

export function broadcastEvent(eventName, payload) {
  events.emit(eventName, payload);
}
