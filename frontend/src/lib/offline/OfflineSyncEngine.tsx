"use client";

import { useState, useEffect, useCallback } from "react";

interface QueuedOperation {
  id: string;
  type: "triage" | "finalize" | "writeback";
  payload: any;
  timestamp: number;
  retries: number;
  status: "pending" | "syncing" | "completed" | "failed";
}

const STORAGE_KEY = "sehat_offline_queue";
const MAX_RETRIES = 3;
const SYNC_INTERVAL = 30000; // 30 seconds

class OfflineSyncEngine {
  private operations: QueuedOperation[] = [];
  private isOnline = true;
  private syncing = false;
  private listeners: Set<() => void> = new Set();
  private syncTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.loadFromStorage();
      this.setupOnlineListener();
      this.startSyncTimer();
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.operations = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to load offline queue:", e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.operations));
    } catch (e) {
      console.warn("Failed to save offline queue:", e);
    }
  }

  private setupOnlineListener() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.notifyListeners();
      this.processQueue();
    });
    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.notifyListeners();
    });
    this.isOnline = navigator.onLine;
  }

  private startSyncTimer() {
    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.syncing) {
        this.processQueue();
      }
    }, SYNC_INTERVAL);
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb());
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  getState() {
    return {
      operations: this.operations,
      isOnline: this.isOnline,
      syncing: this.syncing,
    };
  }

  async queueOperation(type: QueuedOperation["type"], payload: any): Promise<string> {
    const operation: QueuedOperation = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      retries: 0,
      status: "pending",
    };

    this.operations.push(operation);
    this.saveToStorage();
    this.notifyListeners();

    if (this.isOnline) {
      this.processQueue();
    }

    return operation.id;
  }

  private async processQueue() {
    if (this.syncing || !this.isOnline) return;

    const pending = this.operations.filter((op) => op.status === "pending" || (op.status === "failed" && op.retries < MAX_RETRIES));
    if (pending.length === 0) return;

    this.syncing = true;
    this.notifyListeners();

    for (const op of pending) {
      if (!this.isOnline) break;

      op.status = "syncing";
      this.notifyListeners();

      try {
        await this.executeOperation(op);
        op.status = "completed";
      } catch (error) {
        op.retries++;
        op.status = op.retries >= MAX_RETRIES ? "failed" : "pending";
        console.error(`Operation ${op.id} failed:`, error);
      }

      this.saveToStorage();
      this.notifyListeners();
    }

    // Clean up completed operations older than 24 hours
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.operations = this.operations.filter((op) => op.status !== "completed" || op.timestamp > dayAgo);
    this.saveToStorage();
    this.syncing = false;
    this.notifyListeners();
  }

  private async executeOperation(op: QueuedOperation): Promise<void> {
    const { type, payload } = op;
    let endpoint = "";
    let method = "POST";

    switch (type) {
      case "triage":
        endpoint = "/api/triage/differential";
        break;
      case "finalize":
        endpoint = "/api/triage/finalize";
        break;
      case "writeback":
        endpoint = "/api/abha/writeback";
        break;
    }

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
  }

  destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
}

let engineInstance: OfflineSyncEngine | null = null;

function getOfflineSyncEngine(): OfflineSyncEngine {
  if (!engineInstance) {
    engineInstance = new OfflineSyncEngine();
  }
  return engineInstance;
}

function useOfflineSync() {
  const [state, setState] = useState(() => getOfflineSyncEngine().getState());

  useEffect(() => {
    const engine = getOfflineSyncEngine();
    const unsubscribe = engine.subscribe(() => setState(engine.getState()));
    return unsubscribe;
  }, []);

  const queueTriage = useCallback(async (payload: any) => {
    return getOfflineSyncEngine().queueOperation("triage", payload);
  }, []);

  const queueFinalize = useCallback(async (payload: any) => {
    return getOfflineSyncEngine().queueOperation("finalize", payload);
  }, []);

  const queueWriteback = useCallback(async (payload: any) => {
    return getOfflineSyncEngine().queueOperation("writeback", payload);
  }, []);

  return {
    ...state,
    queueTriage,
    queueFinalize,
    queueWriteback,
  };
}

export { OfflineSyncEngine, getOfflineSyncEngine, useOfflineSync };