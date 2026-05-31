/**
 * lib/genlayer.ts
 *
 * Frontend GenLayer client for GenLayer Chronicles.
 *
 * Architecture:
 *   - Writes (store_memory) go through your Express backend, NOT from the
 *     browser directly. The backend holds the signing key.
 *   - Reads (find_related, get_memory_count etc.) call the GenLayer Studio
 *     RPC directly via JSON-RPC 2.0 — no package needed.
 *
 * Required .env.local:
 *   NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
 *   NEXT_PUBLIC_CONTRACT_ADDRESS=0x39Ad40AEdaf4b1ffB3bD9545358981b131607c2A
 *   NEXT_PUBLIC_API_URL=http://localhost:3001
 */

// ─── Config ───────────────────────────────────────────────────────────────────

// GenLayer Studio hosted RPC — this is the correct URL for Studionet
const GL_RPC = (
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? 'https://studio.genlayer.com/api'
).replace(/\/+$/, '');

// Your deployed contract address
const CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '';

// Your Express backend base URL
const API = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
).replace(/\/+$/, '');

// ─── Types ────────────────────────────────────────────────────────────────────

/** Matches the MemoryRecord dataclass in chronicles.py */
export interface OnChainMemory {
  owner:            string;
  mongo_id:         string;   // MongoDB _id — use this to hydrate with full story data
  media_url:        string;
  media_type:       string;
  title:            string;
  core_story:       string;
  summary:          string;
  primary_theme:    string;
  emotional_weight: { primary: string; intensity: number };
  timestamp:        number;
}

export type EmotionPrimary =
  | 'milestone' | 'challenge' | 'joy'
  | 'loss' | 'reflection' | 'gratitude';

// ─── JSON-RPC helper ──────────────────────────────────────────────────────────

let _rpcId = 1;

// Define a type that accepts either an array or an object
type RpcParams = Record<string, unknown> | unknown[];

async function rpc(method: string, params: unknown[]): Promise<unknown> {
  const body = JSON.stringify({ jsonrpc: '2.0', id: _rpcId++, method, params });
  console.log('GenLayer RPC request:', body);
  const res = await fetch(GL_RPC, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const json = await res.json();
  console.log('GenLayer RPC response:', JSON.stringify(json));
  if (json.error) {
    throw new Error(`GenLayer RPC error ${json.error.code}: ${json.error.message}`);
  }
  return json.result;
}

function genCall(functionName: string, args: unknown[]): unknown[] {
  return [{
    to:   CONTRACT,
    func: functionName,   // try "func" instead of "function"
    args: args,
  }];
}
// ─── Safe JSON parse helper ───────────────────────────────────────────────────
// Contract view methods return JSON strings — parse them safely

function parseJsonResult<T>(result: unknown, fallback: T): T {
  if (!result) return fallback;
  if (typeof result === 'string') {
    try { return JSON.parse(result) as T; } catch { return fallback; }
  }
  return result as T;
}

// ─── READ: find_related ───────────────────────────────────────────────────────
/**
 * Given a MongoDB story ID, ask the contract for semantically related memories.
 * Returns an array of on-chain memory objects (light — hydrate with Mongo for full data).
 *
 * NOTE: This is also available via GET /api/stories/:id/related on your backend,
 * which already handles fallback to tag-based search. Prefer using that route
 * unless you specifically need the raw on-chain result.
 */
// In lib/genlayer.ts — replace findRelatedOnChain with a backend call
export async function findRelatedOnChain(mongoId: string, limit = 6): Promise<OnChainMemory[]> {
  if (!CONTRACT) return [];
  try {
    const res = await fetch(`${API}/api/stories/${mongoId}/related`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn('findRelatedOnChain failed:', err);
    return [];
  }
}

// ─── READ: get_recent_memories ────────────────────────────────────────────────

export async function getRecentMemories(limit = 10): Promise<OnChainMemory[]> {
  if (!CONTRACT) return [];
  try {
    const result = await rpc('gen_call', genCall('get_recent_memories', [limit]));
    return parseJsonResult<OnChainMemory[]>(result, []);
  } catch (err) {
    console.warn('getRecentMemories failed:', err);
    return [];
  }
}

// ─── READ: get_memories_by_theme ──────────────────────────────────────────────

export async function getMemoriesByTheme(theme: string, limit = 10): Promise<OnChainMemory[]> {
  if (!CONTRACT) return [];
  try {
    const result = await rpc('gen_call', genCall('get_memories_by_theme', [theme, limit]));
    return parseJsonResult<OnChainMemory[]>(result, []);
  } catch (err) {
    console.warn('getMemoriesByTheme failed:', err);
    return [];
  }
}


// ─── READ: get_memories_by_emotion ────────────────────────────────────────────

export async function getMemoriesByEmotion(emotion: EmotionPrimary, limit = 10): Promise<OnChainMemory[]> {
  if (!CONTRACT) return [];
  try {
    const result = await rpc('gen_call', genCall('get_memories_by_emotion', [emotion, limit]));
    return parseJsonResult<OnChainMemory[]>(result, []);
  } catch (err) {
    console.warn('getMemoriesByEmotion failed:', err);
    return [];
  }
}

// ─── READ: get_memories_by_owner ─────────────────────────────────────────────

export async function getMemoriesByOwner(ownerAddress: string, limit = 20): Promise<OnChainMemory[]> {
  if (!CONTRACT) return [];
  try {
    const result = await rpc('gen_call', genCall('get_memories_by_owner', [ownerAddress, limit]));
    return parseJsonResult<OnChainMemory[]>(result, []);
  } catch (err) {
    console.warn('getMemoriesByOwner failed:', err);
    return [];
  }
}

// ─── READ: get_memory_count ───────────────────────────────────────────────────

export async function getOnChainMemoryCount(): Promise<number> {
  if (!CONTRACT) return 0;
  try {
    const result = await rpc('gen_call', genCall('get_memory_count', []));
    return Number(result ?? 0);
  } catch {
    return 0;
  }
}

// ─── READ: get_themes ─────────────────────────────────────────────────────────

export async function getOnChainThemes(): Promise<string[]> {
  if (!CONTRACT) return [];
  try {
    const result = await rpc('gen_call', genCall('get_themes', []));
    return parseJsonResult<string[]>(result, []);
  } catch {
    return [];
  }
}

// ─── READ: get single memory by index ────────────────────────────────────────

export async function getMemoryByIndex(index: number): Promise<OnChainMemory | null> {
  if (!CONTRACT) return null;
  try {
    const result = await rpc('gen_call', genCall('get_memory', [index]));
    return result ? (result as OnChainMemory) : null;
  } catch {
    return null;
  }
}




// ─── WRITE: store_memory (via your Express backend) ──────────────────────────
/**
 * DO NOT call the contract directly from the browser for writes.
 * The signing private key lives on the server.
 *
 * Instead, POST /api/stories — your backend handles:
 *   1. Cloudinary image upload
 *   2. Groq vision + semantic analysis
 *   3. MongoDB save
 *   4. GenLayer store_memory tx (async, non-blocking)
 *
 * This function is provided as a convenience wrapper around that route.
 */
export async function submitStory(formData: FormData): Promise<{
  id:             string;
  genLayerTxHash: string;
}> {
  const res = await fetch(`${API}/api/stories`, {
    method: 'POST',
    body:   formData,
    // Do NOT set Content-Type — browser sets it with the correct boundary for multipart
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  const story = await res.json();
  return { id: story.id, genLayerTxHash: story.genLayerTxHash ?? '' };
}

// ─── Poll: wait for tx confirmation (optional — tx is confirmed server-side) ──
/**
 * Only use this if you want the frontend to show a live "confirmed on-chain"
 * indicator. The story is already saved in MongoDB before this resolves.
 */
export async function waitForTx(
  txHash:  string,
  opts:    { pollMs?: number; timeoutMs?: number } = {},
): Promise<'finalized' | 'failed' | 'timeout'> {
  const { pollMs = 4000, timeoutMs = 180_000 } = opts;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const result = await rpc('gen_getTransactionByHash', [txHash]) as any;
      const status: string = (result?.status ?? result?.Status ?? '').toUpperCase();

      if (['FINALIZED', 'ACCEPTED'].includes(status)) return 'finalized';
      if (['FAILED', 'ERROR', 'UNDETERMINED'].includes(status)) {
        console.error('GenLayer tx failed:', txHash, result);
        return 'failed';
      }
    } catch {
      // Receipt not yet available — keep polling
    }
    await new Promise(r => setTimeout(r, pollMs));
  }

  console.warn('GenLayer tx timed out:', txHash);
  return 'timeout';
}