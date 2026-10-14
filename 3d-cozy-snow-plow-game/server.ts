import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PlayerState {
  id: string;
  name: string;
  pilotIdx: number;
  normal: [number, number, number];
  forward: [number, number, number];
  speed: number;
  rigTier: number;
  speedTier: number;
  snowballRadius: number;
  peakSnowballRadius: number;
  score: number;
  bossKills: number;
  totalDamageDealt: number;
  dashAttackTimer: number;
  abilityActiveTimer: number;
  knockbackState: string;
  lastUpdated: number;
}

interface ClientSession {
  id: string;
  ws: WebSocket;
  roomCode: string;
  state: PlayerState;
}

interface CarvedSpot {
  x: number;
  y: number;
  z: number;
  r: number;
}

interface BossSyncState {
  id: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  state: string;
  stateTimer: number;
  normal: [number, number, number];
  forward: [number, number, number];
}

interface AiRacerSyncState {
  pilotIdx: number;
  normal: [number, number, number];
  forward: [number, number, number];
  speed: number;
  rigTier: number;
  speedTier: number;
  snowballRadius: number;
  peakSnowballRadius: number;
  score: number;
}

interface RoomState {
  code: string;
  stageIndex: number;
  loopCount: number;
  planetThemeIdx: number;
  hostId: string | null;
  clients: Map<string, ClientSession>;
  carvedSpots: CarvedSpot[];
  bosses: BossSyncState[];
  aiRacers: AiRacerSyncState[];
}

const DEFAULT_SPAWNS: Array<{ normal: [number, number, number]; forward: [number, number, number] }> = [
  { normal: [0.0, 0.60, 0.80], forward: [0.0, -0.80, 0.60] },
  { normal: [0.80, 0.60, 0.0], forward: [-0.60, -0.80, 0.0] },
  { normal: [-0.80, 0.60, 0.0], forward: [0.60, -0.80, 0.0] },
  { normal: [0.0, 0.60, -0.80], forward: [0.0, -0.80, -0.60] },
];

const rooms = new Map<string, RoomState>();

function sanitizeRoomCode(raw: unknown): string {
  const cleaned = String(raw || 'YUKI')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 8);
  return cleaned || 'YUKI';
}

function sanitizePlayerName(raw: unknown, fallbackIdx: number): string {
  const cleaned = String(raw || '')
    .trim()
    .slice(0, 16);
  return cleaned || `Pilot ${fallbackIdx + 1}`;
}

function getOrCreateRoom(code: string): RoomState {
  const cleanCode = sanitizeRoomCode(code);
  let room = rooms.get(cleanCode);
  if (!room) {
    room = {
      code: cleanCode,
      stageIndex: 1,
      loopCount: 1,
      planetThemeIdx: 0,
      hostId: null,
      clients: new Map(),
      carvedSpots: [],
      bosses: [],
      aiRacers: [],
    };
    rooms.set(cleanCode, room);
  }
  return room;
}

function assignRequestedPilot(room: RoomState, requested?: number, clientId?: string): number {
  const target = typeof requested === 'number' && Number.isFinite(requested)
    ? ((Math.round(requested) % 4) + 4) % 4
    : 0;

  // If another session in the room currently holds `target`, move that older session to a free slot
  // so the active player ALWAYS gets the exact pilot they selected (e.g. Kon-Chan = 0).
  for (const [cid, session] of room.clients.entries()) {
    if (cid !== clientId && session.state.pilotIdx === target) {
      const occupied = new Set<number>([target]);
      for (const [otherCid, otherSession] of room.clients.entries()) {
        if (otherCid !== cid && otherCid !== clientId) {
          occupied.add(otherSession.state.pilotIdx);
        }
      }
      for (let i = 0; i < 4; i++) {
        if (!occupied.has(i)) {
          session.state.pilotIdx = i;
          const sp = DEFAULT_SPAWNS[i] || DEFAULT_SPAWNS[0];
          session.state.normal = [...sp.normal];
          session.state.forward = [...sp.forward];
          break;
        }
      }
    }
  }
  return target;
}

function serializeRoomPlayers(room: RoomState): PlayerState[] {
  return Array.from(room.clients.values()).map((c) => c.state);
}

function broadcastToRoom(room: RoomState, payload: unknown, excludeClientId?: string) {
  const msg = JSON.stringify(payload);
  for (const [cid, client] of room.clients.entries()) {
    if (cid === excludeClientId) continue;
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(msg);
    }
  }
}

function sendToClient(ws: WebSocket, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function removeClientFromRoom(session: ClientSession) {
  const room = rooms.get(session.roomCode);
  if (!room) return;
  room.clients.delete(session.id);

  if (room.clients.size === 0) {
    rooms.delete(room.code);
    return;
  }

  if (room.hostId === session.id) {
    const nextHost = room.clients.keys().next().value || null;
    room.hostId = nextHost;
  }

  broadcastToRoom(room, {
    type: 'room:roster',
    roomCode: room.code,
    hostId: room.hostId,
    players: serializeRoomPlayers(room),
    leftPlayerId: session.id,
    leftPlayerName: session.state.name,
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/rooms', (_req, res) => {
    const list = Array.from(rooms.values()).map((r) => ({
      code: r.code,
      playerCount: r.clients.size,
      stageIndex: r.stageIndex,
      loopCount: r.loopCount,
      players: Array.from(r.clients.values()).map((c) => ({
        id: c.id,
        name: c.state.name,
        pilotIdx: c.state.pilotIdx,
      })),
    }));
    res.json({ rooms: list });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    const clientId = `p_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36).slice(-4)}`;
    let currentSession: ClientSession | null = null;

    ws.on('message', (rawBuf) => {
      let msg: Record<string, any>;
      try {
        msg = JSON.parse(String(rawBuf));
      } catch {
        return;
      }

      const type = msg.type;

      if (type === 'room:join') {
        if (currentSession) {
          removeClientFromRoom(currentSession);
          currentSession = null;
        }

        const roomCode = sanitizeRoomCode(msg.roomCode || 'YUKI');
        const room = getOrCreateRoom(roomCode);
        const playerName = sanitizePlayerName(msg.playerName, room.clients.size);

        // Evict any lingering ghost session from the same player (e.g. from a page reload before the old socket closed)
        for (const [cid, existing] of Array.from(room.clients.entries())) {
          if (
            cid !== clientId &&
            (existing.ws.readyState !== WebSocket.OPEN || existing.state.name === playerName)
          ) {
            room.clients.delete(cid);
            try {
              existing.ws.close();
            } catch {}
          }
        }
        if (room.clients.size === 0) {
          room.carvedSpots = [];
          room.bosses = [];
          room.aiRacers = [];
          room.stageIndex = 1;
          room.loopCount = 1;
        }

        const pilotIdx = assignRequestedPilot(room, typeof msg.preferredPilotIdx === 'number' ? msg.preferredPilotIdx : 0, clientId);
        const spawn = DEFAULT_SPAWNS[pilotIdx] || DEFAULT_SPAWNS[0];

        const initialState: PlayerState = {
          id: clientId,
          name: playerName,
          pilotIdx,
          normal: [...spawn.normal],
          forward: [...spawn.forward],
          speed: 0,
          rigTier: Number(msg.rigTier) || 1,
          speedTier: Number(msg.speedTier) || 1,
          snowballRadius: Number(msg.snowballRadius) || 1.1,
          peakSnowballRadius: Number(msg.peakSnowballRadius) || 1.1,
          score: Number(msg.score) || 0,
          bossKills: Number(msg.bossKills) || 0,
          totalDamageDealt: Number(msg.totalDamageDealt) || 0,
          dashAttackTimer: 0,
          abilityActiveTimer: 0,
          knockbackState: 'NONE',
          lastUpdated: Date.now(),
        };

        currentSession = {
          id: clientId,
          ws,
          roomCode: room.code,
          state: initialState,
        };

        room.clients.set(clientId, currentSession);
        if (!room.hostId || !room.clients.has(room.hostId)) {
          room.hostId = clientId;
        }

        sendToClient(ws, {
          type: 'room:init',
          clientId,
          roomCode: room.code,
          hostId: room.hostId,
          assignedPilotIdx: pilotIdx,
          stageIndex: room.stageIndex,
          loopCount: room.loopCount,
          planetThemeIdx: room.planetThemeIdx,
          players: serializeRoomPlayers(room),
          bosses: room.bosses,
          aiRacers: room.aiRacers,
          carvedSpots: room.carvedSpots,
        });

        broadcastToRoom(
          room,
          {
            type: 'room:roster',
            roomCode: room.code,
            hostId: room.hostId,
            players: serializeRoomPlayers(room),
            joinedPlayer: initialState,
          },
          clientId
        );
        return;
      }

      if (!currentSession) return;
      const room = rooms.get(currentSession.roomCode);
      if (!room) return;

      if (type === 'player:update') {
        const st = currentSession.state;
        if (Array.isArray(msg.normal) && msg.normal.length === 3) st.normal = msg.normal as [number, number, number];
        if (Array.isArray(msg.forward) && msg.forward.length === 3) st.forward = msg.forward as [number, number, number];
        if (typeof msg.speed === 'number') st.speed = msg.speed;
        if (typeof msg.rigTier === 'number') st.rigTier = msg.rigTier;
        if (typeof msg.speedTier === 'number') st.speedTier = msg.speedTier;
        if (typeof msg.snowballRadius === 'number') st.snowballRadius = msg.snowballRadius;
        if (typeof msg.peakSnowballRadius === 'number') st.peakSnowballRadius = msg.peakSnowballRadius;
        if (typeof msg.score === 'number') st.score = msg.score;
        if (typeof msg.bossKills === 'number') st.bossKills = msg.bossKills;
        if (typeof msg.totalDamageDealt === 'number') st.totalDamageDealt = msg.totalDamageDealt;
        if (typeof msg.dashAttackTimer === 'number') st.dashAttackTimer = msg.dashAttackTimer;
        if (typeof msg.abilityActiveTimer === 'number') st.abilityActiveTimer = msg.abilityActiveTimer;
        if (typeof msg.knockbackState === 'string') st.knockbackState = msg.knockbackState;
        st.lastUpdated = Date.now();

        broadcastToRoom(
          room,
          {
            type: 'player:updated',
            player: st,
          },
          clientId
        );
        return;
      }

      if (type === 'player:select_pilot') {
        const st = currentSession.state;
        if (typeof msg.playerName === 'string' && msg.playerName.trim()) {
          st.name = sanitizePlayerName(msg.playerName, st.pilotIdx);
        }
        if (typeof msg.pilotIdx === 'number') {
          const nextPilot = assignRequestedPilot(room, msg.pilotIdx, clientId);
          st.pilotIdx = nextPilot;
          const sp = DEFAULT_SPAWNS[nextPilot] || DEFAULT_SPAWNS[0];
          st.normal = [...sp.normal];
          st.forward = [...sp.forward];
        }
        sendToClient(ws, {
          type: 'player:pilot_confirmed',
          pilotIdx: st.pilotIdx,
          playerName: st.name,
        });
        broadcastToRoom(room, {
          type: 'room:roster',
          roomCode: room.code,
          hostId: room.hostId,
          players: serializeRoomPlayers(room),
        });
        return;
      }

      if (type === 'player:action') {
        broadcastToRoom(
          room,
          {
            type: 'player:action',
            playerId: clientId,
            pilotIdx: currentSession.state.pilotIdx,
            action: msg.action,
          },
          clientId
        );
        return;
      }

      if (type === 'snow:carve' && Array.isArray(msg.spots)) {
        const added: CarvedSpot[] = [];
        for (const s of msg.spots) {
          const x = Number(s.x);
          const y = Number(s.y);
          const z = Number(s.z);
          const r = Number(s.r);
          if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || !Number.isFinite(r)) continue;

          // Deduplicate against recent spots to keep room memory compact
          let duplicate = false;
          for (let i = room.carvedSpots.length - 1; i >= Math.max(0, room.carvedSpots.length - 160); i--) {
            const ex = room.carvedSpots[i];
            const dx = ex.x - x;
            const dy = ex.y - y;
            const dz = ex.z - z;
            if (dx * dx + dy * dy + dz * dz < 0.35 && ex.r >= r * 0.9) {
              duplicate = true;
              break;
            }
          }
          if (!duplicate) {
            const spot = { x: +x.toFixed(2), y: +y.toFixed(2), z: +z.toFixed(2), r: +r.toFixed(2) };
            if (room.carvedSpots.length < 1800) {
              room.carvedSpots.push(spot);
            }
            added.push(spot);
          }
        }
        if (added.length > 0) {
          broadcastToRoom(
            room,
            {
              type: 'snow:carved',
              spots: added,
            },
            clientId
          );
        }
        return;
      }

      if (type === 'boss:damage') {
        const bossId = Number(msg.bossId);
        const dmg = Math.max(0, Number(msg.dmg) || 0);
        const isCounter = Boolean(msg.isCounter);
        const maxHp = Math.max(100, Number(msg.maxHp) || 1250);

        let boss = room.bosses.find((b) => b.id === bossId);
        if (!boss) {
          boss = {
            id: bossId,
            hp: maxHp,
            maxHp,
            alive: true,
            state: 'PATROL',
            stateTimer: 1.5,
            normal: [0.58, -0.1, 0.81],
            forward: [0, 1, 0],
          };
          room.bosses.push(boss);
        }
        if (!boss.alive) return;

        boss.hp = Math.max(0, boss.hp - dmg);
        if (isCounter && boss.hp > 0) {
          boss.state = 'STUNNED';
          boss.stateTimer = 2.55;
        }
        if (boss.hp <= 0) {
          boss.alive = false;
        }

        broadcastToRoom(
          room,
          {
            type: 'boss:damaged',
            bossId,
            dmg,
            hp: boss.hp,
            maxHp: boss.maxHp,
            alive: boss.alive,
            isCounter,
            attackerId: clientId,
            attackerPilotIdx: currentSession.state.pilotIdx,
          },
          clientId
        );
        return;
      }

      if (type === 'world:sync' && room.hostId === clientId) {
        if (Array.isArray(msg.bosses)) {
          room.bosses = msg.bosses;
        }
        if (Array.isArray(msg.aiRacers)) {
          room.aiRacers = msg.aiRacers;
        }
        broadcastToRoom(
          room,
          {
            type: 'world:synced',
            bosses: room.bosses,
            aiRacers: room.aiRacers,
          },
          clientId
        );
        return;
      }

      if (type === 'stage:change') {
        if (typeof msg.stageIndex === 'number') room.stageIndex = msg.stageIndex;
        if (typeof msg.loopCount === 'number') room.loopCount = msg.loopCount;
        if (typeof msg.planetThemeIdx === 'number') room.planetThemeIdx = msg.planetThemeIdx;
        if (msg.resetSnow) {
          room.carvedSpots = [];
          room.bosses = [];
        }
        broadcastToRoom(
          room,
          {
            type: 'stage:changed',
            stageIndex: room.stageIndex,
            loopCount: room.loopCount,
            planetThemeIdx: room.planetThemeIdx,
            resetSnow: Boolean(msg.resetSnow),
            fullRestart: Boolean(msg.fullRestart),
          },
          clientId
        );
      }
    });

    ws.on('close', () => {
      if (currentSession) {
        removeClientFromRoom(currentSession);
        currentSession = null;
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Cozy Plow Multiplayer Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
