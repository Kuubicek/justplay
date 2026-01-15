<script>
  import Page from '../components/Page.svelte';
  import { goto } from '../lib/router';
  import { signIn, signInWithGoogle } from '../lib/api/auth';
  import { guest } from '../lib/stores';

  let email = '';
  let password = '';
  let err = '';

  const doLogin = async () => {
    err = '';
    try {
      await signIn(email, password);
      goto('/profile');
    } catch (e) {
      err = e.message;
    }
  };

  const continueAsGuest = () => {
    guest.set(true);
    goto('/');
  };

  const doGoogle = async () => {
    err = '';
    try {
      await signInWithGoogle();
    } catch (e) {
      err = e.message;
    }
  };
</script>

<Page title="Login" subtitle="Sign in to save stats and compete.">
  <div class="auth-grid">
    <div class="auth-card">
      <div class="auth-header">
        <h2>Welcome back</h2>
        <p>Use email or Google to continue.</p>
      </div>
      <button class="btn auth-google" type="button" on:click={doGoogle}>Continue with Google</button>
      <div class="auth-divider"><span>or</span></div>
      <form class="auth-form" on:submit|preventDefault={doLogin}>
        <label class="auth-field">
          <span>Email</span>
          <input class="auth-input" placeholder="you@email.com" bind:value={email} type="email" required />
        </label>
        <label class="auth-field">
          <span>Password</span>
          <input class="auth-input" placeholder="Your password" bind:value={password} type="password" required />
        </label>
        {#if err}<p class="auth-error">{err}</p>{/if}
        <button class="btn btn-accent auth-submit" type="submit">Login</button>
        <button class="btn btn-ghost auth-submit" type="button" on:click={continueAsGuest}>Continue as guest</button>
      </form>
      <p class="auth-footer">No account? <a href="#/register">Register</a></p>
    </div>
  </div>
</Page>
