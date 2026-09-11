export type MultiTabMessage =
  | { type: 'STATE_CHANGED'; timestamp: number }
  | { type: 'REMOTE_SYNC_COMPLETED'; revision: number; timestamp: number }
  | { type: 'PAIR_STATUS_CHANGED'; syncGroupId: string | null; timestamp: number };

type MessageListener = (msg: MultiTabMessage) => void;

class MultiTabSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<MessageListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('neuronode-multi-tab-sync');
        this.channel.onmessage = (event: MessageEvent<MultiTabMessage>) => {
          this.notifyListeners(event.data);
        };
      } catch (err) {
        console.warn('[NEURO//NODE MultiTab] BroadcastChannel init error:', err);
      }
    }
  }

  public subscribe(listener: MessageListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public broadcast(message: MultiTabMessage): void {
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (err) {
        console.warn('[NEURO//NODE MultiTab] Failed to postMessage:', err);
      }
    }
  }

  private notifyListeners(message: MultiTabMessage): void {
    for (const listener of this.listeners) {
      try {
        listener(message);
      } catch (err) {
        console.error('[NEURO//NODE MultiTab] Listener error:', err);
      }
    }
  }

  public close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }
}

export const multiTabSync = new MultiTabSyncService();
