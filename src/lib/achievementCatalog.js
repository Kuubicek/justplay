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
  },
  {
    id: 'leaderboard-top10',
    title: 'Rank Keeper',
    description: 'Stay in the top 10 leaderboard ranking for a game with at least 3 submitted scores.',
    points: 45,
    sort_order: 10,
    criteria: { type: 'leaderboard_rank', threshold: 10, min_scores: 3 }
  },
  {
    id: 'leaderboard-top3',
    title: 'Podium Pressure',
    description: 'Hold a top 3 leaderboard rank for a game with at least 5 submitted scores.',
    points: 80,
    sort_order: 11,
    criteria: { type: 'leaderboard_rank', threshold: 3, min_scores: 5 }
  },
  {
    id: 'plays-3',
    title: 'Warm-up Runner',
    description: 'Play 3 matches in total.',
    points: 8,
    sort_order: 12,
    criteria: { type: 'plays_total', threshold: 3 }
  },
  {
    id: 'plays-5',
    title: 'Session Starter',
    description: 'Play 5 matches in total.',
    points: 12,
    sort_order: 13,
    criteria: { type: 'plays_total', threshold: 5 }
  },
  {
    id: 'plays-12',
    title: 'Arcade Habit',
    description: 'Play 12 matches in total.',
    points: 22,
    sort_order: 14,
    criteria: { type: 'plays_total', threshold: 12 }
  },
  {
    id: 'discover-2',
    title: 'First Discovery',
    description: 'Play at least 2 different games.',
    points: 10,
    sort_order: 15,
    criteria: { type: 'unique_games', threshold: 2 }
  },
  {
    id: 'discover-4',
    title: 'Game Explorer',
    description: 'Play at least 4 different games.',
    points: 18,
    sort_order: 16,
    criteria: { type: 'unique_games', threshold: 4 }
  },
  {
    id: 'discover-7',
    title: 'Platform Explorer',
    description: 'Play every core game mode (7 different games).',
    points: 35,
    sort_order: 17,
    criteria: { type: 'unique_games', threshold: 7 }
  },
  {
    id: 'active-days-3',
    title: 'Comeback Player',
    description: 'Play on 3 different days.',
    points: 14,
    sort_order: 18,
    criteria: { type: 'active_days', threshold: 3 }
  },
  {
    id: 'active-days-7',
    title: 'Weekly Grinder',
    description: 'Play on 7 different days.',
    points: 28,
    sort_order: 19,
    criteria: { type: 'active_days', threshold: 7 }
  }
];
