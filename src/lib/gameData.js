export const gameCatalog = {
  singleplayer: [
    {
      id: 'dodger',
      name: 'Astro Dodger',
      mode: 'Singleplayer',
      desc: 'Dodge falling debris and survive as long as you can.'
    },
    {
      id: 'td-lite',
      name: 'Tower Defense Lite',
      mode: 'Singleplayer',
      desc: 'Playable tower defense prototype.'
    },
    {
      id: 'age-of-war-lite',
      name: 'Age of War Lite',
      mode: 'Singleplayer',
      desc: 'Lane battle: spawn units, upgrade ages, destroy the enemy base.'
    },
    {
      id: 'tap-rush',
      name: 'Tap Rush',
      mode: 'Singleplayer',
      desc: '30-second clicking sprint with a moving target.'
    },
    {
      id: 'orb-collector',
      name: 'Orb Collector',
      mode: 'Singleplayer',
      desc: 'Collect glowing orbs on a grid before time runs out.'
    }
  ],
  multiplayer: [
    {
      id: 'pong',
      name: 'Pong',
      mode: 'Multiplayer',
      desc: 'MP core demo.'
    },
    {
      id: 'pulse-rally',
      name: 'Pulse Rally',
      mode: 'Multiplayer',
      desc: 'Race another player by charging your pulse meter.'
    }
  ]
};

export const gameDetails = {
  pong: {
    id: 'pong',
    name: 'Pong Arena',
    mode: 'Multiplayer',
    status: 'Live',
    summary: 'Classic paddles meet fast matchmaking and lobby invites built for quick rematches.',
    controls: ['W/S or Up/Down to move', 'Space to serve', 'Local: W/S left paddle, Up/Down right paddle'],
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
      { label: 'Session', value: '3-6 min' }
    ]
  },
  'pulse-rally': {
    id: 'pulse-rally',
    name: 'Pulse Rally',
    mode: 'Multiplayer',
    status: 'Live',
    summary: 'Charge up your engine and race another player to 30 pulses.',
    controls: ['Press Space or click Charge', 'First to 30 pulses wins', 'Spectators can watch live rounds'],
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
      { label: 'Session', value: '1-3 min' }
    ]
  },
  dodger: {
    id: 'dodger',
    name: 'Astro Dodger',
    mode: 'Singleplayer',
    status: 'Live',
    summary: 'Dodge debris, chase your best score, and climb the leaderboards.',
    controls: ['Mouse or touch to move', 'Arrow keys or A/D'],
    actions: [
      { label: 'Play Astro Dodger', href: '#/play/dodger', variant: 'accent' },
      { label: 'View Leaderboard', href: '#/leaderboard', variant: 'ghost' }
    ],
    meta: [
      { label: 'Game ID', value: 'dodger' },
      { label: 'Players', value: '1 player' },
      { label: 'Session', value: '5-10 min' }
    ]
  },
  'td-lite': {
    id: 'td-lite',
    name: 'Tower Defense Lite',
    mode: 'Singleplayer',
    status: 'Live',
    summary: 'Build your lanes, upgrade fast, and see how long your defenses can hold.',
    controls: ['Click to place towers', 'Start waves to spawn enemies', 'Protect the core to avoid game over'],
    actions: [
      { label: 'Play Tower Defense', href: '#/play/td-lite', variant: 'accent' },
      { label: 'View Roadmap', href: '#/games', variant: 'ghost' }
    ],
    meta: [
      { label: 'Game ID', value: 'td-lite' },
      { label: 'Players', value: '1 player' },
      { label: 'Session', value: '8-15 min' }
    ]
  },
  'age-of-war-lite': {
    id: 'age-of-war-lite',
    name: 'Age of War Lite',
    mode: 'Singleplayer',
    status: 'Live',
    summary: 'Spawn units, earn gold, upgrade ages, and push the lane to take down the enemy base.',
    controls: ['Click unit cards to deploy', 'Upgrade age to unlock stronger units', 'Destroy the enemy base'],
    actions: [
      { label: 'Play Age of War', href: '#/play/age-of-war-lite', variant: 'accent' },
      { label: 'View Leaderboard', href: '#/leaderboard', variant: 'ghost' }
    ],
    meta: [
      { label: 'Game ID', value: 'age-of-war-lite' },
      { label: 'Players', value: '1 player' },
      { label: 'Session', value: '6-12 min' }
    ]
  },
  'tap-rush': {
    id: 'tap-rush',
    name: 'Tap Rush',
    mode: 'Singleplayer',
    status: 'Live',
    summary: 'Hit the glowing target as fast as possible in a 30-second sprint.',
    controls: ['Click the target before it moves', 'Misses cost 1 point', '30-second round'],
    actions: [
      { label: 'Play Tap Rush', href: '#/play/tap-rush', variant: 'accent' },
      { label: 'View Leaderboard', href: '#/leaderboard', variant: 'ghost' }
    ],
    meta: [
      { label: 'Game ID', value: 'tap-rush' },
      { label: 'Players', value: '1 player' },
      { label: 'Session', value: '1 min' }
    ]
  },
  'orb-collector': {
    id: 'orb-collector',
    name: 'Orb Collector',
    mode: 'Singleplayer',
    status: 'Live',
    summary: 'Collect glowing orbs on a grid before the timer runs out.',
    controls: ['Move with arrow keys or WASD', 'Collect orbs to increase score', '45-second round'],
    actions: [
      { label: 'Play Orb Collector', href: '#/play/orb-collector', variant: 'accent' },
      { label: 'View Leaderboard', href: '#/leaderboard', variant: 'ghost' }
    ],
    meta: [
      { label: 'Game ID', value: 'orb-collector' },
      { label: 'Players', value: '1 player' },
      { label: 'Session', value: '2-3 min' }
    ]
  }
};

export const gameList = [...gameCatalog.singleplayer, ...gameCatalog.multiplayer];

export const multiplayerGames = gameCatalog.multiplayer.map((game) => ({
  id: game.id,
  name: game.name
}));
