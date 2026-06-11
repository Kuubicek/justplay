<script>
  import { onMount } from 'svelte';
  import Page from '../components/Page.svelte';
  import { signUp, isLikelyValidEmail, normalizeEmail } from '../lib/api/auth';

  let username = '';
  let email = '';
  let confirmEmail = '';
  let password = '';
  let captchaAnswer = '';
  let captchaA = 0;
  let captchaB = 0;
  let trapField = '';
  let err = '';
  let showVerify = false;
  let verifyEmail = '';

  const newCaptcha = () => {
    captchaA = Math.floor(Math.random() * 9) + 1;
    captchaB = Math.floor(Math.random() * 9) + 1;
  };

  const validateRegisterForm = () => {
    const safeEmail = normalizeEmail(email);
    const safeConfirm = normalizeEmail(confirmEmail);
    if (trapField.trim()) return 'Registration blocked. Please refresh and try again.';
    if (!username.trim()) return 'Nickname is required.';
    if (username.trim().length < 2) return 'Nickname must be at least 2 characters long.';
    if (username.trim().length > 24) return 'Nickname must be at most 24 characters long.';
    if (!/^[a-zA-Z0-9_\- ]+$/.test(username.trim())) return 'Nickname can only contain letters, numbers, spaces, hyphens, and underscores.';
    if (!isLikelyValidEmail(safeEmail)) return 'Enter a valid email address (example@domain.com).';
    if (safeEmail !== safeConfirm) return 'Email and confirmation email must match.';
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    if (Number(captchaAnswer) !== captchaA + captchaB) return 'Captcha answer is incorrect.';
    return '';
  };

  const doRegister = async () => {
    err = '';
    const validationError = validateRegisterForm();
    if (validationError) {
      err = validationError;
      newCaptcha();
      captchaAnswer = '';
      return;
    }
    try {
      const safeEmail = normalizeEmail(email);
      await signUp(safeEmail, password, username.trim());
      verifyEmail = safeEmail;
      showVerify = true;
      password = '';
      captchaAnswer = '';
      newCaptcha();
    } catch (e) {
      err = e.message;
    }
  };

  const closeVerify = () => {
    showVerify = false;
  };

  onMount(() => {
    newCaptcha();
  });
</script>

<Page title="Register" subtitle="Create an account to track your progress.">
  {#if showVerify}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div class="w-full max-w-md rounded-2xl border border-emerald-400/40 bg-slate-900 p-5 shadow-xl">
        <h3 class="text-lg font-semibold">Check your email</h3>
        <p class="mt-2 text-sm text-white/70">
          We sent a confirmation link{verifyEmail ? ` to ${verifyEmail}` : ''}. Open it to verify your account.
        </p>
        <button class="btn btn-accent mt-4 w-full" type="button" on:click={closeVerify}>
          OK
        </button>
      </div>
    </div>
  {/if}
  <div class="auth-grid">
    <div class="auth-card">
      <div class="auth-header">
        <h2>Create your account</h2>
        <p>Register to save scores, unlock achievements, and appear on the leaderboard.</p>
      </div>
      <form class="auth-form" on:submit|preventDefault={doRegister}>
        <input
          type="text"
          class="hidden"
          tabindex="-1"
          autocomplete="off"
          bind:value={trapField}
          aria-hidden="true"
        />
        <label class="auth-field">
          <span>Nickname</span>
          <input
            class="auth-input"
            placeholder="Your display name"
            bind:value={username}
            type="text"
            maxlength="24"
            required
          />
        </label>
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
          <span>Confirm email</span>
          <input
            class="auth-input"
            placeholder="Repeat your email"
            bind:value={confirmEmail}
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
            minlength="8"
            required
          />
        </label>
        <label class="auth-field">
          <span>Captcha: {captchaA} + {captchaB} = ?</span>
          <input
            class="auth-input"
            placeholder="Type the result"
            bind:value={captchaAnswer}
            inputmode="numeric"
            pattern="[0-9]*"
            required
          />
        </label>
        {#if err}
          <p class="auth-error">{err}</p>
        {/if}
        <p class="text-white/60 text-xs">
          Registration requires valid email syntax and email confirmation. You will receive a verification link after sign up.
        </p>
        <button class="btn btn-accent auth-submit" type="submit">Create account</button>
      </form>
      <p class="auth-footer">Already have an account? <a href="#/login">Login</a></p>
    </div>
  </div>
</Page>
