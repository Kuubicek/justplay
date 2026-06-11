<script>
  import Nav from './components/Nav.svelte';
  import Footer from './components/Footer.svelte';
  import { path } from './lib/router';
  import { initAuth } from './lib/api/auth';

  import Home from './pages/Home.svelte';
  import Games from './pages/Games.svelte';
  import GameDetail from './pages/GameDetail.svelte';
  import Pong from './pages/Pong.svelte';
  import Dodger from './pages/Dodger.svelte';
  import TowerDefense from './pages/TowerDefense.svelte';
  import AgeOfWar from './pages/AgeOfWar.svelte';
  import PulseRally from './pages/PulseRally.svelte';
  import TapRush from './pages/TapRush.svelte';
  import OrbCollector from './pages/OrbCollector.svelte';
  import Leaderboard from './pages/Leaderboard.svelte';
  import Lobby from './pages/Lobby.svelte';
  import Rooms from './pages/Rooms.svelte';
  import Profile from './pages/Profile.svelte';
  import Login from './pages/Login.svelte';
  import Register from './pages/Register.svelte';
  import About from './pages/About.svelte';
  import TOS from './pages/TOS.svelte';
  import PrivacyPolicy from './pages/PrivacyPolicy.svelte';
  import NotFound from './pages/NotFound.svelte';

  initAuth();

  const route = (p) => {
    if (p === '/') return Home;
    if (p === '/games') return Games;
    if (p === '/play/pong') return Pong;
    if (p === '/play/pulse-rally') return PulseRally;
    if (p === '/play/dodger') return Dodger;
    if (p === '/play/td-lite') return TowerDefense;
    if (p === '/play/age-of-war-lite') return AgeOfWar;
    if (p === '/play/tap-rush') return TapRush;
    if (p === '/play/orb-collector') return OrbCollector;
    if (p.startsWith('/game/')) return GameDetail;
    if (p === '/leaderboard') return Leaderboard;
    if (p === '/lobby') return Lobby;
    if (p === '/rooms') return Rooms;
    if (p === '/profile' || p.startsWith('/profile/')) return Profile;
    if (p === '/login') return Login;
    if (p === '/register') return Register;
    if (p === '/about') return About;
    if (p === '/tos') return TOS;
    if (p === '/privacy') return PrivacyPolicy;
    return NotFound;
  };

  $: currentPath = ($path || '/');
  $: Current = route(currentPath);
</script>

<div class="min-h-dvh flex flex-col">
  <Nav />
  <main class="flex-1 pb-8" class:pt-24={currentPath !== '/'}>
    <svelte:component this={Current} />
  </main>
  <Footer />
</div>
