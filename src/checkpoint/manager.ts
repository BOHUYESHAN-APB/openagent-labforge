import type { CheckpointCleanupConfig } from '../config/schema';
import type { CheckpointStorage, ContextCheckpoint } from './types';
import { cleanupCheckpoints } from './cleaner';
import { ConversationMemoryStore } from './conversation-memory';
import {
  getRepositoryWorkspaces,
  registerWorkspace,
} from './global-index';
import { loadCheckpointStorage, saveCheckpointStorage } from './persistence';
import { RepositoryMemoryStore } from './repository-memory';
import { SessionMemoryStore } from './session-memory';
import { WorkingMemoryStore } from './working-memory';
import { WorkspaceMemoryStore } from './workspace-memory';

export class CheckpointManager {
  private storage: CheckpointStorage;
  private workspaceRoot: string | null = null;
  public workingMemory: WorkingMemoryStore;
  public conversationMemory: ConversationMemoryStore;
  public sessionMemory: SessionMemoryStore;
  public workspaceMemory: WorkspaceMemoryStore;
  public repositoryMemory: RepositoryMemoryStore;

  constructor(workspaceRoot?: string) {
    this.workspaceRoot = workspaceRoot ?? null;
    this.storage = workspaceRoot
      ? loadCheckpointStorage(workspaceRoot)
      : {
          workingMemory: new Map(),
          conversationMemory: new Map(),
          sessionMemory: new Map(),
          workspaceMemory: new Map(),
          repositoryMemory: new Map(),
        };

    this.workingMemory = new WorkingMemoryStore(this.storage.workingMemory);
    this.conversationMemory = new ConversationMemoryStore(
      this.storage.conversationMemory,
    );
    this.sessionMemory = new SessionMemoryStore(this.storage.sessionMemory);
    this.workspaceMemory = new WorkspaceMemoryStore(
      this.storage.workspaceMemory,
    );
    this.repositoryMemory = new RepositoryMemoryStore(
      this.storage.repositoryMemory,
    );
  }

  private persist(): void {
    if (!this.workspaceRoot) return;
    saveCheckpointStorage(this.workspaceRoot, this.storage);
  }

  createCheckpoint(
    sessionID: string,
    summary: string,
    keyDecisions: string[],
    openIssues: string[],
    tokenCount: number,
    conversationID?: string,
  ): ContextCheckpoint {
    const checkpoint: ContextCheckpoint = {
      id: `cp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      sessionID,
      conversationID,
      summary,
      keyDecisions,
      openIssues,
      tokenCount,
    };

    this.sessionMemory.addCheckpoint(sessionID, checkpoint);

    if (conversationID) {
      this.conversationMemory.addCheckpoint(conversationID, checkpoint);
    }

    this.persist();

    return checkpoint;
  }

  initializeSession(
    sessionID: string,
    workspaceRoot: string,
    repositoryId?: string,
    conversationID?: string,
  ): void {
    const session = this.sessionMemory.create(
      sessionID,
      workspaceRoot,
      repositoryId,
      conversationID,
    );

    let workspace = this.workspaceMemory.get(workspaceRoot);
    if (!workspace) {
      workspace = this.workspaceMemory.create(workspaceRoot, repositoryId);
    }
    this.workspaceMemory.addSession(workspaceRoot, session);

    if (repositoryId) {
      let repo = this.repositoryMemory.get(repositoryId);
      if (!repo) {
        repo = this.repositoryMemory.create(repositoryId);
      }
      this.repositoryMemory.addWorkspace(repositoryId, workspace);
      registerWorkspace(repositoryId, workspaceRoot);
    }

    if (conversationID) {
      let conversation = this.conversationMemory.get(conversationID);
      if (!conversation) {
        conversation = this.conversationMemory.create(conversationID, sessionID);
      } else {
        this.conversationMemory.addSession(conversationID, sessionID);
      }
    }

    this.workingMemory.set(sessionID, {});
    this.workspaceRoot = workspaceRoot;
    this.persist();
  }

  cleanupSession(sessionID: string): void {
    this.workingMemory.clear(sessionID);
    this.sessionMemory.clear(sessionID);
    this.persist();
  }

  getRepositoryCheckpoints(repositoryId: string): ContextCheckpoint[] {
    const workspaceRoots = getRepositoryWorkspaces(repositoryId);
    const checkpoints: ContextCheckpoint[] = [];

    for (const root of workspaceRoots) {
      const storage = loadCheckpointStorage(root);
      for (const session of storage.sessionMemory.values()) {
        if (session.repositoryId === repositoryId) {
          checkpoints.push(...session.checkpoints);
        }
      }
    }

    return checkpoints.sort((a, b) => b.timestamp - a.timestamp);
  }

  cleanup(config: CheckpointCleanupConfig): void {
    if (!this.workspaceRoot) return;
    const stats = cleanupCheckpoints(this.workspaceRoot, this.storage, config);
    if (stats.checkpointsRemoved > 0) {
      this.persist();
    }
  }
}
