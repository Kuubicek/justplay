<script>
  import Page from '../components/Page.svelte';
  import { goto } from '../lib/router';
  import { signIn } from '../lib/api/auth';
  import { guest } from '../lib/stores';

  let email = '';
  let password = '';
  let err = '';
  let loading = false;

  const doLogin = async () => {
    err = '';
    loading = true;
    try {
      await signIn(email, password);
      goto('/profile');
    } catch (e) {
      err = e.message;
    } finally {
      loading = false;
    }
  };

  const continueAsGuest = () => {
    guest.set(true);
    goto('/');
  };
</script>

<Page>
  <div class="auth-grid">
    <div class="auth-card">

      <div class="auth-header">
        <h2>Welcome back</h2>
        <p>Sign in to save scores, unlock achievements, and track your progress.</p>
      </div>

      <form class="auth-form" on:submit|preventDefault={doLogin}>
        <label class="auth-field">
          <span>Email</span>
          <input
            class="auth-input"
            placeholder="you@email.com"
            bind:value={email}
            type="email"
            autocomplete="email"
            required
          />
        </label>
        <label class="auth-field">
          <span>Password</span>
          <input
            class="auth-input"
            placeholder="Your password"
            bind:value={password}
            type="password"
            autocomplete="current-password"
            required
          />
        </label>
        {#if err}
          <p class="auth-error">{err}</p>
        {/if}
        <button class="btn btn-accent auth-submit" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>

      <div class="auth-divider"><span>or</span></div>

      <button class="btn btn-ghost auth-submit" type="button" on:click={continueAsGuest}>
        Continue as guest
      </button>

      <p class="auth-footer">No account? <a href="#/register">Register</a></p>
    </div>
  </div>
</Page>
