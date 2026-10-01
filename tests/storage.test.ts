import { afterEach, describe, expect, it, vi } from 'vitest';
import { choose, createInitialState } from '../src/game/engine';
import { parseCampaign, SAVE_FORMAT, SAVE_VERSION, serializeCampaign } from '../src/game/save';
import { loadStoredCampaign, SAVE_KEY, saveStoredCampaign } from '../src/game/storage';

const BACKUP_KEY = 'crossroads-silk-roads-before-v4';

class MemoryStorage implements Storage {
  entries = new Map<string, string>();
  writes: string[] = [];
  readFailure = false;
  blockedWrites = new Set<string>();
  get length() { return this.entries.size; }
  clear() { this.entries.clear(); }
  key(index: number) { return [...this.entries.keys()][index] ?? null; }
  removeItem(key: string) { this.entries.delete(key); }
  getItem(key: string) {
    if (this.readFailure) throw new DOMException('Storage denied', 'SecurityError');
    return this.entries.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.blockedWrites.has(key)) throw new DOMException('Storage full', 'QuotaExceededError');
    this.writes.push(key);
    this.entries.set(key, String(value));
  }
}

function storageWith(raw?: string) {
  const storage = new MemoryStorage();
  if (raw !== undefined) storage.entries.set(SAVE_KEY, raw);
  vi.stubGlobal('localStorage', storage);
  return storage;
}

function legacyInitialSave(): string {
  const state: Record<string, unknown> = { ...createInitialState() };
  for (const key of ['mode', 'cargo', 'contracts', 'reflections', 'pendingStatus', 'lastTravelNote']) delete state[key];
  return JSON.stringify({ format: SAVE_FORMAT, version: 2, exportedAt: '2026-08-01T12:00:00.000Z', state });
}

afterEach(() => vi.unstubAllGlobals());

describe('browser autosave and recovery boundaries', () => {
  it('starts without a campaign when storage is empty and does not create a save on read', () => {
    const storage = storageWith();
    expect(loadStoredCampaign()).toEqual({ state: null, notice: '', blocked: false, raw: null });
    expect(storage.writes).toEqual([]);
  });

  it('saves and restores a normal pending outcome without advancing it', () => {
    const storage = storageWith();
    const state = choose(createInitialState(), 'travel-light');
    expect(saveStoredCampaign(state)).toBe(true);
    const raw = storage.entries.get(SAVE_KEY)!;
    expect(JSON.parse(raw).version).toBe(SAVE_VERSION);
    expect(loadStoredCampaign()).toEqual({ state, notice: '', blocked: false, raw });
    expect(storage.entries.has(BACKUP_KEY)).toBe(false);
    expect(storage.writes).toEqual([SAVE_KEY]);
  });

  it.each(['{broken json', 'null', JSON.stringify({ people: [null], decisions: [null] })])('keeps damaged stored bytes unchanged and blocks replacement autosave: %s', (raw) => {
    const storage = storageWith(raw);
    const result = loadStoredCampaign();
    expect(result).toMatchObject({ state: null, blocked: true, raw });
    expect(result.notice).toContain('kept unchanged');
    expect(storage.entries.get(SAVE_KEY)).toBe(raw);
    expect(storage.writes).toEqual([]);
  });

  it('backs up the original legacy bytes before a later explicit v3 save', () => {
    const raw = legacyInitialSave();
    const storage = storageWith(raw);
    const result = loadStoredCampaign();
    expect(result.state).not.toBeNull();
    expect(result.blocked).toBe(false);
    expect(result.notice).toContain('backed up');
    expect(storage.entries.get(SAVE_KEY)).toBe(raw);
    expect(storage.entries.get(BACKUP_KEY)).toBe(raw);
    expect(storage.writes).toEqual([BACKUP_KEY]);
    expect(saveStoredCampaign(result.state!)).toBe(true);
    const updated = storage.entries.get(SAVE_KEY)!;
    expect(JSON.parse(updated).version).toBe(SAVE_VERSION);
    expect(parseCampaign(updated)).toMatchObject({ ok: true, migrated: false });
    expect(storage.entries.get(BACKUP_KEY)).toBe(raw);
    expect(storage.writes).toEqual([BACKUP_KEY, SAVE_KEY]);
  });

  it('opens a legacy journey but pauses autosave when its backup cannot be written', () => {
    const raw = legacyInitialSave();
    const storage = storageWith(raw);
    storage.blockedWrites.add(BACKUP_KEY);
    const result = loadStoredCampaign();
    expect(result.state).not.toBeNull();
    expect(result).toMatchObject({ blocked: true, raw });
    expect(result.notice).toContain('Autosave is paused');
    expect(storage.entries.get(SAVE_KEY)).toBe(raw);
    expect(storage.entries.has(BACKUP_KEY)).toBe(false);
    expect(storage.writes).toEqual([]);
  });

  it('retains the original backup across repeated reads of that legacy save', () => {
    const raw = legacyInitialSave();
    const storage = storageWith(raw);
    const first = loadStoredCampaign();
    const second = loadStoredCampaign();
    expect(first.state).toEqual(second.state);
    expect(second.blocked).toBe(false);
    expect(storage.entries.get(BACKUP_KEY)).toBe(raw);
    expect(storage.writes).toEqual([BACKUP_KEY]);
  });

  it('reports write quota failure and preserves the previous campaign', () => {
    const raw = serializeCampaign(createInitialState());
    const storage = storageWith(raw);
    storage.blockedWrites.add(SAVE_KEY);
    expect(saveStoredCampaign(choose(createInitialState(), 'travel-light'))).toBe(false);
    expect(storage.entries.get(SAVE_KEY)).toBe(raw);
    expect(storage.writes).toEqual([]);
  });

  it('does not replace a healthy autosave with an invalid engine state', () => {
    const raw = serializeCampaign(createInitialState());
    const storage = storageWith(raw);
    const damaged = createInitialState();
    damaged.resources.water = NaN;
    expect(saveStoredCampaign(damaged)).toBe(false);
    expect(storage.entries.get(SAVE_KEY)).toBe(raw);
    expect(storage.writes).toEqual([]);
  });

  it('handles storage access denial without throwing and leaves the unavailable saved bytes alone', () => {
    const raw = serializeCampaign(createInitialState());
    const storage = storageWith(raw);
    storage.readFailure = true;
    storage.blockedWrites.add(SAVE_KEY);
    const result = loadStoredCampaign();
    expect(result.state).toBeNull();
    expect(result.notice).toContain('storage is unavailable');
    expect(saveStoredCampaign(createInitialState())).toBe(false);
    expect(storage.entries.get(SAVE_KEY)).toBe(raw);
    expect(storage.writes).toEqual([]);
  });

  it('handles an absent storage API as an export-only session', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(() => loadStoredCampaign()).not.toThrow();
    expect(loadStoredCampaign().notice).toContain('storage is unavailable');
    expect(saveStoredCampaign(createInitialState())).toBe(false);
  });
});
