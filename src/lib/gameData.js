const gameImages = {
  pong: '/images/games/pong.jpg',
  'pulse-rally': '/images/games/pulse-rally.jpg',
  dodger: '/images/games/dodger.jpg',
  'td-lite': '/images/games/td-lite.jpg',
  'age-of-war-lite': '/images/games/age-of-war-lite.svg',
  'tap-rush': '/images/games/tap-rush.svg',
  'orb-collector': '/images/games/orb-collector.svg'
};

export const gameCatalog = {
  singleplayer: [
    {
      id: 'dodger',
      name: 'Astro Dodger',
      mode: 'Singleplayer',
      desc: 'Dodge meteor waves, survive longer each run, and chase top leaderboard ranks.',
      image: gameImages['dodger']
    },
    {
      id: 'td-lite',
      name: 'Tower Defense Lite',
      mode: 'Singleplayer',
      desc: 'Build, upgrade, and adapt lane defense against escalating enemy waves.',
      image: gameImages['td-lite']
    },
    {
      id: 'age-of-war-lite',
      name: 'Age of War Lite',
      mode: 'Singleplayer',
      desc: 'Lane battle with evolving tech ages, unit counters, and base-rush win conditions.',
      image: gameImages['age-of-war-lite']
    },
    {
      id: 'tap-rush',
      name: 'Tap Rush',
      mode: 'Singleplayer',
      desc: 'Reaction sprint with random bonus targets, time boosts, and combo score bursts.',
      image: gameImages['tap-rush']
    },
    {
      id: 'orb-collector',
      name: 'Orb Collector',
      mode: 'Singleplayer',
      desc: 'Grid chase with timed orb spawns and speed-based time rewards.',
      image: gameImages['orb-collector']
    }
  ],
  multiplayer: [
    {
      id: 'pong',
      name: 'Pong',
      mode: 'Multiplayer',
      desc: 'Realtime 1v1 paddles with room presence, rematch voting, and fallback shadow mode.',
      image: gameImages['pong']
    },
    {
      id: 'pulse-rally',
      name: 'Pulse Rally',
      mode: 'Multiplayer',
      desc: 'Head-to-head tap duel with randomized key prompts and live room sync.',
      image: gameImages['pulse-rally']
    }
  ]
};

export const gameDetails = {
  pong: {
    id: 'pong',
    name: 'Pong Arena',
    mode: 'Multiplayer',
    status: 'Live',
    image: gameImages['pong'],
    summary: 'Classic paddles meet fast matchmaking and lobby invites built for quick rematches.',
    description: 'Challenge a friend to a real-time 1v1 paddle match. Create a room and share the code, or join an existing game in seconds. First to 7 points takes the round — instant rematch voting keeps the action going. Spectators can watch live, and shadow mode keeps the game running smoothly even when one player drops.',
    features: ['Room codes & lobby invites', 'Instant rematch voting', 'Spectator support', 'Shadow play on disconnect'],
    controls: ['W / S — move left paddle', 'Up / Down — move right paddle', 'Space — serve'],
    playHref: '#/play/pong',
    playPanel: true,
    playNote: 'Local match: W/S left paddle, Up/Down right paddle.',
    actions: [
      { label: 'Create match', href: '#/lobby?game=pong', variant: 'accent' },
      { label: 'Join match', href: '#/rooms?game=pong', variant: 'ghost' },
      { label: 'Local match', href: '#/play/pong?mode=local', variant: 'ghost' }
    ],
    meta: [
      { label: 'Game ID', value: 'pong' },
      { label: 'Players', value: '2 players' },
      { label: 'Session', value: '3–6 min' }
    ]
  },
  'pulse-rally': {
    id: 'pulse-rally',
    name: 'Pulse Rally',
    mode: 'Multiplayer',
    status: 'Live',
    image: gameImages['pulse-rally'],
    summary: 'Charge your engine and race another player to 30 pulses.',
    description: 'Two players. One bar. First to 30 pulses wins. Tap Space or click Charge as fast as you can to fill your meter ahead of your opponent. The host starts each round — rounds rarely last more than a minute. Spectators can watch live and the results are visible to the whole room.',
    features: ['Head-to-head tap race', 'Live room sync', 'Spectator view', 'Quick rounds under 60s'],
    controls: ['Space or click Charge to fill your meter', 'First to 30 pulses wins', 'Host starts each round'],
    playHref: '#/play/pulse-rally',
    playPanel: true,
    playNote: 'Host starts each round. Tap fast to fill your meter first.',
    actions: [
      { label: 'Create match', href: '#/lobby?game=pulse-rally', variant: 'accent' },
      { label: 'Join match', href: '#/rooms?game=pulse-rally', variant: 'ghost' }
    ],
    meta: [
      { label: 'Game ID', value: 'pulse-rally' },
      { label: 'Players', value: '2 players' },
      { label: 'Session', value: '1–3 min' }
    ]
  },
  dodger: {
    id: 'dodger',
    name: 'Astro Dodger',
    mode: 'Singleplayer',
    status: 'Live',
    image: gameImages['dodger'],
    summary: 'Dodge debris, chase your best score, and climb the leaderboards.',
    description: 'Deep-space debris is closing in and there is nowhere to hide. Weave through meteor showers that grow faster and denser every few seconds. Each wave you survive adds to your multiplier — miss once and it is over. Push past your personal best, submit your score, and climb the global leaderboard.',
    features: ['Escalating wave difficulty', 'Score multiplier system', 'Global leaderboard', 'Mouse & keyboard support'],
    controls: ['Mouse or touch — move your ship', 'A / D or Left / Right arrow keys — move'],
    actions: [
      { label: 'Play Astro Dodger', href: '#/play/dodger', variant: 'accent' },
      { label: 'View Leaderboard', href: '#/leaderboard', variant: 'ghost' }
    ],
    meta: [
      { label: 'Game ID', value: 'dodger' },
      { label: 'Players', value: '1 player' },
      { label: 'Session', value: '5–10 min' }
    ]
  },
  'td-lite': {
    id: 'td-lite',
    name: 'Tower Defense Lite',
    mode: 'Singleplayer',
    status: 'Live',
    image: gameImages['td-lite'],
    summary: 'Build your lanes, upgrade fast, and see how long your defenses can hold.',
    description: 'Place defensive towers along the path to stop enemy waves from reaching your base. Earn gold by defeating enemies and spend it on new towers or upgrades between rounds. Wave difficulty ramps up fast — the difference between surviving and losing comes down to where you place your first tower.',
    features: ['Multiple tower types', 'Gold economy & upgrades', 'Escalating wave system', 'Strategic lane placement'],
    controls: ['Click to place a tower on the grid', 'Start Wave to launch the next enemy wave', 'Protect the core — if enemies reach it, the game ends'],
    actions: [
      { label: 'Play Tower Defense', href: '#/play/td-lite', variant: 'accent' },
      { label: 'View Leaderboard', href: '#/leaderboard', variant: 'ghost' }
    ],
    meta: [
      { label: 'Game ID', value: 'td-lite' },
      { label: 'Players', value: '1 player' },
      { label: 'Session', value: '8–15 min' }
    ]
  },
  'age-of-war-lite': {
    id: 'age-of-war-lite',
    name: 'Age of War Lite',
    mode: 'Singleplayer',
    status: 'Live',
    image: gameImages['age-of-war-lite'],
    summary: 'Spawn units, earn gold, upgrade ages, and push the lane to take down the enemy base.',
    description: 'Evolving lane combat across human history. Spend gold to spawn units that march toward the enemy base, earn more gold from kills, and use it to upgrade into stronger ages. Each age unlocks new unit types with different attack and defense traits. Push hard enough and fast enough, and the enemy base falls.',
    features: ['Multiple historical ages', 'Unit counter system', 'Gold & upgrade economy', 'Lane push mechanics'],
    controls: ['Click a unit card to deploy it', 'Upgrade age when you have enough gold to unlock stronger units', 'Destroy the enemy base to win'],
    actions: [
      { label: 'Play Age of War', href: '#/play/age-of-war-lite', variant: 'accent' },
      { label: 'View Leaderboard', href: '#/leaderboard', variant: 'ghost' }
    ],
    meta: [
      { label: 'Game ID', value: 'age-of-war-lite' },
      { label: 'Players', value: '1 player' },
      { label: 'Session', value: '6–12 min' }
    ]
  },
  'tap-rush': {
    id: 'tap-rush',
    name: 'Tap Rush',
    mode: 'Singleplayer',
    status: 'Live',
    image: gameImages['tap-rush'],
    summary: 'Hit the glowing target as fast as possible in a 30-second sprint.',
    description: 'One target. Thirty seconds. Hit it before it moves. The target jumps around the field after each click — land your hits fast to keep the combo alive. Bonus targets worth extra points appear at random, and time extension orbs give you a few extra seconds when you need them most. Your best score is posted to the leaderboard automatically.',
    features: ['30-second reaction sprint', 'Bonus & time-extension targets', 'Combo multiplier system', 'Auto-submitted leaderboard scores'],
    controls: ['Click the glowing target to score a point', 'Avoid misses — they break your combo', '30-second round, bonus targets extend time'],
    actions: [
      { label: 'Play Tap Rush', href: '#/play/tap-rush', variant: 'accent' },
      { label: 'View Leaderboard', href: '#/leaderboard', variant: 'ghost' }
    ],
    meta: [
      { label: 'Game ID', value: 'tap-rush' },
      { label: 'Players', value: '1 player' },
      { label: 'Session', value: '~1 min' }
    ]
  },
  'orb-collector': {
    id: 'orb-collector',
    name: 'Orb Collector',
    mode: 'Singleplayer',
    status: 'Live',
    image: gameImages['orb-collector'],
    summary: 'Collect glowing orbs on a grid before the timer runs out.',
    description: 'A grid full of glowing orbs that appear and disappear on a timer. Move your collector across the field, gather as many orbs as you can before they fade, and use speed bursts to cover more ground. Each orb collected adds to your score — the rarer the orb color, the more points it is worth. 45 seconds on the clock.',
    features: ['Timed orb spawns', 'Rare orb bonus scoring', 'Speed burst mechanic', 'Auto-submitted leaderboard scores'],
    controls: ['Arrow keys or WASD — move the collector', 'Collect orbs by moving over them', '45-second round'],
    actions: [
      { label: 'Play Orb Collector', href: '#/play/orb-collector', variant: 'accent' },
      { label: 'View Leaderboard', href: '#/leaderboard', variant: 'ghost' }
    ],
    meta: [
      { label: 'Game ID', value: 'orb-collector' },
      { label: 'Players', value: '1 player' },
      { label: 'Session', value: '2–3 min' }
    ]
  }
};

export const gameList = [...gameCatalog.singleplayer, ...gameCatalog.multiplayer];

export const multiplayerGames = gameCatalog.multiplayer.map((game) => ({
  id: game.id,
  name: game.name
}));
