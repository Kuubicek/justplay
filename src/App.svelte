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
  import Leaderboard from './pages/Leaderboard.svelte';
  import Lobby from './pages/Lobby.svelte';
  import Rooms from './pages/Rooms.svelte';
  import Profile from './pages/Profile.svelte';
  import Login from './pages/Login.svelte';
  import Register from './pages/Register.svelte';
  import About from './pages/About.svelte';
  import NotFound from './pages/NotFound.svelte';

  initAuth();

  const route = (p) => {
    if (p === '/') return Home;
    if (p === '/games') return Games;
    if (p === '/play/pong') return Pong;
    if (p === '/play/dodger') return Dodger;
    if (p.startsWith('/game/')) return GameDetail;
    if (p === '/leaderboard') return Leaderboard;
    if (p === '/lobby') return Lobby;
    if (p === '/rooms') return Rooms;
    if (p === '/profile' || p.startsWith('/profile/')) return Profile;
    if (p === '/login') return Login;
    if (p === '/register') return Register;
    if (p === '/about') return About;
    return NotFound;
  };

  $: currentPath = ($path || '/');
  $: Current = route(currentPath);
</script>

<div class="min-h-dvh flex flex-col">
  <Nav />
  <main class="flex-1">
    <svelte:component this={Current} />
  </main>
  <Footer />
</div>
