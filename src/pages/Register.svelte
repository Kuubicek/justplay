<script>
  import Page from '../components/Page.svelte';
  import { goto } from '../lib/router';
  import { signUp, signInWithGoogle } from '../lib/api/auth';

  let email = '';
  let password = '';
  let err = '';

  const doRegister = async () => {
    err = '';
    try {
      await signUp(email, password);
      goto('/profile');
    } catch (e) {
      err = e.message;
    }
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

<Page title="Register" subtitle="Create an account to track your progress.">
  <div class="auth-grid">
    <div class="auth-card">
      <div class="auth-header">
        <h2>Create your account</h2>
        <p>Register fast or continue with Google.</p>
      </div>
      <button class="btn auth-google" type="button" on:click={doGoogle}>Continue with Google</button>
      <div class="auth-divider"><span>or</span></div>
      <form class="auth-form" on:submit|preventDefault={doRegister}>
        <label class="auth-field">
          <span>Email</span>
          <input
            class="auth-input"
            placeholder="you@email.com"
            bind:value={email}
            type="email"
            required
          />
        </label>
        <label class="auth-field">
          <span>Password</span>
          <input
            class="auth-input"
            placeholder="Create a password"
            bind:value={password}
            type="password"
            required
          />
        </label>
        {#if err}
          <p class="auth-error">{err}</p>
        {/if}
        <button class="btn btn-accent auth-submit" type="submit">Create account</button>
      </form>
      <p class="auth-footer">Already have an account? <a href="#/login">Login</a></p>
    </div>
  </div>
</Page>
