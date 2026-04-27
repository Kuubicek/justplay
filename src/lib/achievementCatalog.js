export const achievementCatalog = [
  {
    id: 'first-score',
    title: 'First Upload',
    description: 'Submit your first score.',
    points: 10,
    sort_order: 1,
    criteria: { type: 'score', threshold: 1 }
  },
  {
    id: 'dodger-150',
    title: 'Astro Dodger 150',
    description: 'Reach a score of 150 in Astro Dodger.',
    points: 20,
    sort_order: 2,
    game_id: 'dodger',
    criteria: { type: 'score', threshold: 150 }
  },
  {
    id: 'taprush-35',
    title: 'Tap Rush 35',
    description: 'Score 35 hits in Tap Rush.',
    points: 20,
    sort_order: 3,
    game_id: 'tap-rush',
    criteria: { type: 'score', threshold: 35 }
  },
  {
    id: 'orb-collector-20',
    title: 'Orb Collector 20',
    description: 'Collect 20 orbs in one run.',
    points: 20,
    sort_order: 4,
    game_id: 'orb-collector',
    criteria: { type: 'score', threshold: 20 }
  },
  {
    id: 'age-of-war-win',
    title: 'Age of War: First Victory',
    description: 'Defeat the enemy base in Age of War Lite.',
    points: 40,
    sort_order: 5,
    game_id: 'age-of-war-lite',
    criteria: { type: 'win' }
  },
  {
    id: 'age-of-war-age3',
    title: 'Age of War: Technologist',
    description: 'Reach Age 3 in a single match.',
    points: 30,
    sort_order: 6,
    game_id: 'age-of-war-lite',
    criteria: { type: 'meta', key: 'age', threshold: 3 }
  },
  {
    id: 'td-wave-8',
    title: 'Tower Defense: Wave 8',
    description: 'Reach wave 8 in Tower Defense Lite.',
    points: 30,
    sort_order: 7,
    game_id: 'td-lite',
    criteria: { type: 'meta', key: 'wave', threshold: 8 }
  },
  {
    id: 'pong-score-5',
    title: 'Pong: Match Winner',
    description: 'Score 5 points in one Pong match.',
    points: 25,
    sort_order: 8,
    game_id: 'pong',
    criteria: { type: 'score', threshold: 5 }
  },
  {
    id: 'pulse-rally-30',
    title: 'Pulse Rally: Full Charge',
    description: 'Reach 30 taps in one Pulse Rally match.',
    points: 25,
    sort_order: 9,
    game_id: 'pulse-rally',
    criteria: { type: 'score', threshold: 30 }
  }
];
