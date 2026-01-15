<script>
  import { onMount, onDestroy } from 'svelte';
  import GameCard from '../components/GameCard.svelte';

  const slides = [
    {
      id: 'pong',
      kicker: 'Featured multiplayer',
      title: 'Pong Arena',
      copy: 'Classic paddles, modern matchmaking, and fast rematches built for quick sessions.',
      ctaLabel: 'Play Pong',
      ctaHref: '#/game/pong',
      accent: '#4da3ff',
      gradient:
        'linear-gradient(135deg, rgba(77, 163, 255, 0.45) 0%, rgba(8, 15, 26, 0.7) 45%, rgba(5, 10, 18, 0.9) 100%)'
    },
    {
      id: 'td-lite',
      kicker: 'Upcoming singleplayer',
      title: 'Tower Defense Lite',
      copy: 'Build your lanes, upgrade fast, and see how long your defenses can hold.',
      ctaLabel: 'View Details',
      ctaHref: '#/game/td-lite',
      accent: '#47e6c7',
      gradient:
        'linear-gradient(135deg, rgba(71, 230, 199, 0.35) 0%, rgba(9, 20, 30, 0.75) 50%, rgba(5, 10, 18, 0.92) 100%)'
    }
  ];

  const featured = [
    {
      id: 'pong',
      name: 'Pong Arena',
      mode: 'Multiplayer',
      desc: 'Fast duels, lobby invites, and instant rematches.'
    },
    {
      id: 'td-lite',
      name: 'Tower Defense Lite',
      mode: 'Singleplayer',
      desc: 'Short runs with quick upgrades and compact maps.'
    }
  ];

  let active = 0;
  let timer = null;
  let autoEnabled = true;

  const step = (direction, manual = false) => {
    active = (active + direction + slides.length) % slides.length;
    if (manual) resetAuto();
  };

  const goToSlide = (index) => {
    active = index;
    resetAuto();
  };

  const startAuto = () => {
    if (!autoEnabled) return;
    if (timer) return;
    timer = setInterval(() => step(1), 7000);
  };

  const stopAuto = () => {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  };

  const resetAuto = () => {
    if (!autoEnabled) return;
    stopAuto();
    startAuto();
  };

  const slideStyle = (slide) => {
    if (slide.image) {
      return `background-image: ${slide.gradient}, url(${slide.image});`;
    }
    return `background-image: ${slide.gradient};`;
  };

  onMount(() => {
    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    autoEnabled = !prefersReduced;
    if (autoEnabled) startAuto();
  });

  onDestroy(stopAuto);
</script>

<section class="hero" aria-label="Featured games">
  <div class="hero__slides" on:mouseenter={stopAuto} on:mouseleave={startAuto}>
    {#each slides as slide, index}
      <article
        class={`hero__slide ${index === active ? 'is-active' : ''}`}
        aria-hidden={index !== active}
        style={`--hero-accent: ${slide.accent};`}
      >
        <div class="hero__media" style={slideStyle(slide)}></div>
        <div class="hero__fade"></div>
        <div class="hero__inner container">
          <span class="hero__kicker">{slide.kicker}</span>
          <h1 class="hero__title">{slide.title}</h1>
          <p class="hero__copy">{slide.copy}</p>
          <div class="hero__actions">
            <a class="btn hero__cta" href={slide.ctaHref}>{slide.ctaLabel}</a>
            <a class="btn btn-ghost" href="#/games">Browse all games</a>
          </div>
          <div class="hero__meta">
            <span class="hero__meta-label">{slide.kicker}</span>
            <span class="hero__meta-index">
              {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </article>
    {/each}
  </div>
  <div class="hero__controls container">
    <button class="hero__arrow" type="button" on:click={() => step(-1, true)} aria-label="Previous slide">
      &larr;
    </button>
    <div class="hero__dots" role="tablist" aria-label="Select featured game">
      {#each slides as slide, index}
        <button
          class={`hero__dot ${index === active ? 'is-active' : ''}`}
          type="button"
          role="tab"
          aria-selected={index === active}
          aria-label={`Show ${slide.title}`}
          on:click={() => goToSlide(index)}
        ></button>
      {/each}
    </div>
    <button class="hero__arrow" type="button" on:click={() => step(1, true)} aria-label="Next slide">
      &rarr;
    </button>
  </div>
</section>

<section class="page-section">
  <div class="section-header">
    <div>
      <p class="section-eyebrow">Ready to play</p>
      <h2 class="section-title">Pick a quick match or a longer run</h2>
      <p class="section-copy">
        Highlighted games move fast, load instantly, and are ready for your next score chase.
      </p>
    </div>
    <a class="btn btn-ghost" href="#/games">View all</a>
  </div>
  <div class="grid md:grid-cols-2 gap-4 game-grid">
    {#each featured as g}
      <GameCard game={g} />
    {/each}
  </div>
</section>
