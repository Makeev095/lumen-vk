(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LumenEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const TILES = {
    fern: { name: "Папоротники", one: "папоротник" },
    beetle: { name: "Жуки", one: "жук" },
    moss: { name: "Мох", one: "мох" },
    pearl: { name: "Жемчуг", one: "жемчужина" },
    vine: { name: "Лозы", one: "лоза" },
  };

  const LEVELS = [
    {
      id: 1,
      night: "Ночь 01",
      name: "Первый фонарь",
      line: "В стекле ещё темно. Собери лунные папоротники: они держат первый свет.",
      rows: 8,
      cols: 8,
      types: ["fern", "beetle", "moss", "pearl"],
      moves: 20,
      goals: [{ kind: "collect", tile: "fern", count: 16 }],
      glass: [],
    },
    {
      id: 2,
      night: "Ночь 02",
      name: "Иней на стекле",
      line: "На холодных стёклах осел иней. Сбей его совпадением рядом и собери тех, кто прячется за ним.",
      rows: 8,
      cols: 8,
      types: ["fern", "beetle", "moss", "pearl", "vine"],
      moves: 22,
      goals: [
        { kind: "collect", tile: "pearl", count: 14 },
        { kind: "collect", tile: "beetle", count: 14 },
        { kind: "glass", count: 4 },
      ],
      glass: [
        { r: 3, c: 3, hp: 1 },
        { r: 3, c: 4, hp: 1 },
        { r: 4, c: 3, hp: 1 },
        { r: 4, c: 4, hp: 1 },
      ],
    },
    {
      id: 3,
      night: "Ночь 03",
      name: "Три жилы света",
      line: "Лампа почти погасла. Расколи толстый иней и собери мох, лозу и папоротник.",
      rows: 8,
      cols: 8,
      types: ["fern", "beetle", "moss", "pearl", "vine"],
      moves: 24,
      goals: [
        { kind: "collect", tile: "moss", count: 12 },
        { kind: "collect", tile: "vine", count: 12 },
        { kind: "collect", tile: "fern", count: 12 },
        { kind: "glass", count: 5 },
      ],
      glass: [
        { r: 2, c: 3, hp: 2 },
        { r: 3, c: 2, hp: 2 },
        { r: 3, c: 4, hp: 2 },
        { r: 4, c: 3, hp: 2 },
        { r: 5, c: 4, hp: 2 },
      ],
    },
  ];

  function key(r, c) {
    return r + "," + c;
  }

  function cloneCell(cell) {
    if (!cell) return null;
    return {
      kind: cell.kind,
      id: cell.id,
      tile: cell.tile,
      power: cell.power || null,
      hp: cell.hp,
      maxHp: cell.maxHp,
    };
  }

  function cloneGrid(grid) {
    return grid.map((row) => row.map(cloneCell));
  }

  function cloneState(state) {
    return {
      levelId: state.levelId,
      night: state.night,
      name: state.name,
      line: state.line,
      rows: state.rows,
      cols: state.cols,
      types: state.types.slice(),
      movesLeft: state.movesLeft,
      score: state.score,
      collected: { ...state.collected },
      glassCleared: state.glassCleared,
      glassTotalHp: state.glassTotalHp,
      nextId: state.nextId,
      goals: state.goals.map((goal) => ({ ...goal })),
      grid: cloneGrid(state.grid),
    };
  }

  function makeTile(state, type) {
    return {
      kind: "tile",
      id: state.nextId++,
      tile: type || state.types[(Math.random() * state.types.length) | 0],
      power: null,
    };
  }

  function colorAt(grid, r, c) {
    const cell = grid[r] && grid[r][c];
    if (!cell || cell.kind !== "tile") return null;
    return cell.tile;
  }

  function analyze(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    const hLen = Array.from({ length: rows }, () => Array(cols).fill(0));
    const vLen = Array.from({ length: rows }, () => Array(cols).fill(0));
    const seen = new Set();
    const matched = [];

    for (let r = 0; r < rows; r++) {
      let c = 0;
      while (c < cols) {
        const type = colorAt(grid, r, c);
        if (!type) {
          c += 1;
          continue;
        }
        let k = c + 1;
        while (k < cols && colorAt(grid, r, k) === type) k += 1;
        if (k - c >= 3) {
          for (let i = c; i < k; i++) {
            hLen[r][i] = k - c;
            const id = key(r, i);
            if (!seen.has(id)) {
              seen.add(id);
              matched.push([r, i]);
            }
          }
        }
        c = k;
      }
    }

    for (let c = 0; c < cols; c++) {
      let r = 0;
      while (r < rows) {
        const type = colorAt(grid, r, c);
        if (!type) {
          r += 1;
          continue;
        }
        let k = r + 1;
        while (k < rows && colorAt(grid, k, c) === type) k += 1;
        if (k - r >= 3) {
          for (let i = r; i < k; i++) {
            vLen[i][c] = k - r;
            const id = key(i, c);
            if (!seen.has(id)) {
              seen.add(id);
              matched.push([i, c]);
            }
          }
        }
        r = k;
      }
    }

    return { hLen, vLen, matched };
  }

  function hasMatch(grid) {
    return analyze(grid).matched.length > 0;
  }

  function patternAt(h, v) {
    if (h >= 5 || v >= 5) return "lamp";
    if (h >= 3 && v >= 3) return "burst";
    if (h >= 4) return "row";
    if (v >= 4) return "col";
    return null;
  }

  function inBounds(state, r, c) {
    return r >= 0 && c >= 0 && r < state.rows && c < state.cols;
  }

  function expand(state, queueStart, lampHints, clearAll) {
    const queue = [];
    const cleared = new Set();
    const glassHit = new Set();
    const seen = new Set();

    if (clearAll) {
      for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
          if (state.grid[r][c] && state.grid[r][c].kind === "tile") queue.push(key(r, c));
        }
      }
    }
    queueStart.forEach((item) => queue.push(item));

    function consider(r, c) {
      if (!inBounds(state, r, c)) return;
      const cell = state.grid[r][c];
      if (!cell) return;
      const id = key(r, c);
      if (cell.kind === "glass") {
        glassHit.add(id);
        return;
      }
      if (!seen.has(id)) queue.push(id);
    }

    while (queue.length) {
      const id = queue.shift();
      if (seen.has(id)) continue;
      const [r, c] = id.split(",").map(Number);
      const cell = state.grid[r][c];
      if (!cell || cell.kind !== "tile") continue;
      seen.add(id);
      cleared.add(id);
      if (!cell.power) continue;
      if (cell.power === "row") {
        for (let cc = 0; cc < state.cols; cc++) consider(r, cc);
      } else if (cell.power === "col") {
        for (let rr = 0; rr < state.rows; rr++) consider(rr, c);
      } else if (cell.power === "burst") {
        for (let rr = r - 1; rr <= r + 1; rr++) {
          for (let cc = c - 1; cc <= c + 1; cc++) consider(rr, cc);
        }
      } else if (cell.power === "lamp") {
        const type = lampHints.get(id) || cell.tile;
        for (let rr = 0; rr < state.rows; rr++) {
          for (let cc = 0; cc < state.cols; cc++) {
            const other = state.grid[rr][cc];
            if (other && other.kind === "tile" && other.tile === type) consider(rr, cc);
          }
        }
      }
    }

    cleared.forEach((id) => {
      const [r, c] = id.split(",").map(Number);
      [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
      ].forEach(([rr, cc]) => {
        if (!inBounds(state, rr, cc)) return;
        const cell = state.grid[rr][cc];
        if (cell && cell.kind === "glass") glassHit.add(key(rr, cc));
      });
    });

    return { cleared, glassHit };
  }

  function chooseAnchor(state, analysis, prefer) {
    const rank = { lamp: 3, burst: 2, row: 1, col: 1 };
    let best = null;
    analysis.matched.forEach(([r, c]) => {
      const pattern = patternAt(analysis.hLen[r][c], analysis.vLen[r][c]);
      if (!pattern) return;
      const cell = state.grid[r][c];
      if (!cell || cell.kind !== "tile" || cell.power) return;
      const isPivot = prefer.some((item) => item.r === r && item.c === c);
      const score = rank[pattern];
      if (
        !best ||
        score > best.score ||
        (score === best.score && isPivot && !best.isPivot)
      ) {
        best = { r, c, power: pattern, score, isPivot, id: cell.id };
      }
    });
    return best;
  }

  function gravity(state) {
    const falls = [];
    const spawns = [];
    for (let c = 0; c < state.cols; c++) {
      const segments = [];
      let current = [];
      for (let r = 0; r < state.rows; r++) {
        const cell = state.grid[r][c];
        if (cell && cell.kind === "glass") {
          if (current.length) segments.push(current);
          current = [];
        } else {
          current.push(r);
        }
      }
      if (current.length) segments.push(current);

      segments.forEach((segment) => {
        const tiles = [];
        segment.forEach((r) => {
          const cell = state.grid[r][c];
          if (cell && cell.kind === "tile") tiles.push({ fromR: r, cell });
          state.grid[r][c] = null;
        });
        const empty = segment.length - tiles.length;
        tiles.forEach((entry, index) => {
          const toR = segment[empty + index];
          state.grid[toR][c] = entry.cell;
          if (toR !== entry.fromR) {
            falls.push({ id: entry.cell.id, fromR: entry.fromR, toR, c });
          }
        });
        let hole = 0;
        segment.forEach((r) => {
          if (state.grid[r][c]) return;
          hole += 1;
          const tile = makeTile(state);
          state.grid[r][c] = tile;
          spawns.push({ id: tile.id, r, c, dist: hole });
        });
      });
    }
    return { falls, spawns };
  }

  function differentType(state, type) {
    const pool = state.types.filter((item) => item !== type);
    return pool[(Math.random() * pool.length) | 0] || type;
  }

  function repair(state) {
    for (let n = 0; n < 400; n++) {
      const matched = analyze(state.grid).matched;
      if (!matched.length) return true;
      const [r, c] = matched[n % matched.length];
      const cell = state.grid[r][c];
      if (!cell || cell.kind !== "tile") continue;
      cell.tile = differentType(state, cell.tile);
      cell.power = null;
    }
    return !hasMatch(state.grid);
  }

  function adjacent(r1, c1, r2, c2) {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
  }

  function getValidMoves(state) {
    const moves = [];
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        [
          [r, c + 1],
          [r + 1, c],
        ].forEach(([rr, cc]) => {
          if (!inBounds(state, rr, cc)) return;
          if (swapWorks(state, r, c, rr, cc)) moves.push({ r1: r, c1: c, r2: rr, c2: cc });
        });
      }
    }
    return moves;
  }

  function swapWorks(state, r1, c1, r2, c2) {
    const a = state.grid[r1][c1];
    const b = state.grid[r2][c2];
    if (!a || !b || a.kind !== "tile" || b.kind !== "tile") return false;
    if (a.power || b.power) return true;
    const grid = cloneGrid(state.grid);
    grid[r1][c1] = cloneCell(b);
    grid[r2][c2] = cloneCell(a);
    return hasMatch(grid);
  }

  function fillTiles(state) {
    for (let attempt = 0; attempt < 60; attempt++) {
      for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
          if (state.grid[r][c] && state.grid[r][c].kind === "glass") continue;
          state.grid[r][c] = makeTile(state);
        }
      }
      repair(state);
      if (!hasMatch(state.grid) && getValidMoves(state).length) return;
    }
  }

  function createState(levelId) {
    const level = LEVELS[levelId - 1];
    const state = {
      levelId: level.id,
      night: level.night,
      name: level.name,
      line: level.line,
      rows: level.rows,
      cols: level.cols,
      types: level.types.slice(),
      movesLeft: level.moves,
      score: 0,
      collected: {},
      glassCleared: 0,
      glassTotalHp: 0,
      nextId: 1,
      goals: level.goals.map((goal) => ({ ...goal })),
      grid: Array.from({ length: level.rows }, () => Array(level.cols).fill(null)),
    };
    level.types.forEach((type) => {
      state.collected[type] = 0;
    });
    (level.glass || []).forEach((glass) => {
      state.grid[glass.r][glass.c] = {
        kind: "glass",
        id: state.nextId++,
        hp: glass.hp,
        maxHp: glass.hp,
      };
      state.glassTotalHp += glass.hp;
    });
    fillTiles(state);
    return state;
  }

  function remainingGlassHp(state) {
    let hp = 0;
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cell = state.grid[r][c];
        if (cell && cell.kind === "glass") hp += cell.hp;
      }
    }
    return hp;
  }

  function goalsMet(state) {
    return state.goals.every((goal) => {
      if (goal.kind === "collect") return (state.collected[goal.tile] || 0) >= goal.count;
      return state.glassCleared >= goal.count;
    });
  }

  function goalFraction(state) {
    if (!state.goals.length) return 1;
    const total = state.goals.reduce((sum, goal) => {
      if (goal.kind === "collect") {
        return sum + Math.min(1, (state.collected[goal.tile] || 0) / goal.count);
      }
      if (!state.glassTotalHp) return sum + 1;
      const done = state.glassTotalHp - remainingGlassHp(state);
      return sum + Math.min(1, done / state.glassTotalHp);
    }, 0);
    return total / state.goals.length;
  }

  function snapshot(state) {
    return {
      collected: { ...state.collected },
      score: state.score,
      glassCleared: state.glassCleared,
      movesLeft: state.movesLeft,
    };
  }

  function resolve(state, seeds, prefer, clearAll) {
    const frames = [];
    let pivot = prefer.slice();
    let combo = 1;
    let clearedTotal = 0;
    let glassDamaged = 0;
    let first = true;

    while (combo < 14) {
      const before = cloneGrid(state.grid);
      const analysis = analyze(state.grid);
      const queueStart = new Set(analysis.matched.map(([r, c]) => key(r, c)));
      const lampHints = new Map();
      if (first && seeds) {
        seeds.forEach((seed) => {
          queueStart.add(key(seed.r, seed.c));
          if (seed.lampTarget) lampHints.set(key(seed.r, seed.c), seed.lampTarget);
        });
      }
      if (!queueStart.size && !(first && clearAll)) break;

      const expanded = expand(state, queueStart, lampHints, first && clearAll);
      const anchor = chooseAnchor(state, analysis, pivot);
      let powerUp = null;
      if (anchor) {
        expanded.cleared.delete(key(anchor.r, anchor.c));
        powerUp = { r: anchor.r, c: anchor.c, power: anchor.power, id: anchor.id };
      }
      pivot = [];
      first = false;

      if (!expanded.cleared.size && !expanded.glassHit.size && !powerUp) break;

      const popIds = [];
      let gained = 0;
      expanded.cleared.forEach((id) => {
        const [r, c] = id.split(",").map(Number);
        const cell = state.grid[r][c];
        if (!cell || cell.kind !== "tile") return;
        popIds.push(cell.id);
        state.collected[cell.tile] = (state.collected[cell.tile] || 0) + 1;
        gained += cell.power ? 70 : 40;
      });
      gained *= combo;
      state.score += gained;
      clearedTotal += popIds.length;

      const cracks = [];
      expanded.glassHit.forEach((id) => {
        const [r, c] = id.split(",").map(Number);
        const cell = state.grid[r][c];
        if (!cell || cell.kind !== "glass") return;
        cell.hp -= 1;
        glassDamaged += 1;
        if (cell.hp <= 0) {
          cracks.push({ id: cell.id, hp: 0 });
          state.glassCleared += 1;
          state.grid[r][c] = null;
        } else {
          cracks.push({ id: cell.id, hp: cell.hp });
        }
      });

      expanded.cleared.forEach((id) => {
        const [r, c] = id.split(",").map(Number);
        state.grid[r][c] = null;
      });

      if (powerUp) state.grid[powerUp.r][powerUp.c].power = powerUp.power;

      frames.push({
        type: "clear",
        popIds,
        cracks,
        powerUp,
        gained,
        combo,
        hud: snapshot(state),
      });

      const fall = gravity(state);
      frames.push({
        type: "fall",
        grid: cloneGrid(state.grid),
        falls: fall.falls,
        spawns: fall.spawns,
        hud: snapshot(state),
      });
      combo += 1;
    }

    return { frames, clearedTotal, glassDamaged };
  }

  function applyPlayerMove(state, r1, c1, r2, c2) {
    if (!adjacent(r1, c1, r2, c2)) return { ok: false };
    const next = cloneState(state);
    const a = next.grid[r1][c1];
    const b = next.grid[r2][c2];
    if (!a || !b || a.kind !== "tile" || b.kind !== "tile") return { ok: false };
    const typeA = a.tile;
    const typeB = b.tile;
    const powerA = a.power;
    const powerB = b.power;
    next.grid[r1][c1] = b;
    next.grid[r2][c2] = a;
    const powered = Boolean(powerA || powerB);
    if (!powered && !hasMatch(next.grid)) return { ok: false };

    const seeds = [];
    if (powerA) seeds.push({ r: r2, c: c2, lampTarget: typeB });
    if (powerB) seeds.push({ r: r1, c: c1, lampTarget: typeA });
    next.movesLeft -= 1;
    const gridAfterSwap = cloneGrid(next.grid);
    const resolved = resolve(
      next,
      seeds,
      [
        { r: r2, c: c2 },
        { r: r1, c: c1 },
      ],
      powerA === "lamp" && powerB === "lamp"
    );
    if (!resolved.clearedTotal && !resolved.glassDamaged) return { ok: false };
    return {
      ok: true,
      state: next,
      gridAfterSwap,
      frames: resolved.frames,
    };
  }

  function shuffleTiles(state) {
    const next = cloneState(state);
    fillTiles(next);
    return {
      state: next,
      frame: { type: "shuffle", grid: cloneGrid(next.grid), hud: snapshot(next) },
    };
  }

  function suggestMove(state) {
    const moves = getValidMoves(state);
    let best = null;
    let bestValue = -Infinity;
    moves.forEach((move) => {
      const result = applyPlayerMove(state, move.r1, move.c1, move.r2, move.c2);
      if (!result.ok) return;
      const value = goalFraction(result.state) * 100000 + result.state.score;
      if (value > bestValue) {
        bestValue = value;
        best = move;
      }
    });
    return best;
  }

  return {
    TILES,
    LEVELS,
    createState,
    cloneState,
    applyPlayerMove,
    getValidMoves,
    goalsMet,
    goalFraction,
    suggestMove,
    shuffleTiles,
    hasMatch,
  };
});
