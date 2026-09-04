import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Send, ShieldCheck, Eye, EyeOff, ArrowRight, Sparkles, ArrowLeft } from 'lucide-react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getErrorCode } from '../lib/utils';

interface AuthLocationState {
  from?: { pathname?: string };
}

export const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const from = (location.state as AuthLocationState | null)?.from?.pathname || '/profile';

  /** Maps Firebase auth error codes to translated, user-facing messages. Returns null for user-cancelled popups. */
  const describeAuthError = (err: unknown): string | null => {
    const code = getErrorCode(err);
    switch (code) {
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return null;
      case 'auth/popup-blocked':
        return t('auth.error.popupBlocked');
      case 'auth/network-request-failed':
        return t('auth.error.network');
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return t('auth.error.invalidCredentials');
      case 'auth/email-already-in-use':
        return t('auth.error.emailInUse');
      case 'auth/weak-password':
        return t('auth.error.weakPassword');
      case 'auth/invalid-email':
        return t('auth.error.invalidEmail');
      default:
        return t('auth.error.general');
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    setInfo(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login failed', err);
      setError(describeAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!email || !password) {
      setError(t('auth.error.missingFields'));
      return;
    }
    setIsLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Auth error', err);
      setError(describeAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (isLoading) return;
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError(t('auth.resetNeedEmail'));
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo(t('auth.resetSent'));
    } catch (err) {
      console.error('Password reset failed', err);
      // Don't reveal whether the address exists; only surface format / network problems.
      const code = getErrorCode(err);
      if (code === 'auth/invalid-email') setError(t('auth.error.invalidEmail'));
      else if (code === 'auth/network-request-failed') setError(t('auth.error.network'));
      else setInfo(t('auth.resetSent'));
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    t('auth.feat1'),
    t('auth.feat2'),
    t('auth.feat3'),
    t('auth.feat4'),
  ];

  return (
    /* h-screen w-full — sahifa to'liq viewport ni egallaydi, scroll bo'lmaydi */
    <div className="h-screen w-full bg-background flex overflow-hidden">

      {/* ═══════════════════════════════════════
          LEFT PANEL — Branding (only lg+)
          ═══════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[52%] relative flex-col justify-between p-10 xl:p-14 overflow-hidden shrink-0">
        {/* Dark base */}
        <div className="absolute inset-0 bg-[#060503]" />

        {/* Gold glow blobs */}
        <div className="absolute -top-40 -left-40 w-[550px] h-[550px] bg-brand-gold/18 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-[420px] h-[420px] bg-brand-bronze/12 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand-gold/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(197,160,89,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(197,160,89,1) 1px, transparent 1px)`,
            backgroundSize: '56px 56px',
          }}
        />

        {/* Animated rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          {[280, 440, 600].map((size, i) => (
            <motion.div
              key={size}
              className="absolute rounded-full border border-brand-gold/[0.07]"
              style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: 35 + i * 12, repeat: Infinity, ease: 'linear' }}
            />
          ))}
        </div>

        {/* ── Logo ── */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <span className="text-xl xl:text-2xl font-display font-black tracking-tighter text-white">
              <span className="text-brand-gold group-hover:brightness-110">FAXR</span> MEBEL
            </span>
          </Link>
        </div>

        {/* ── Main content ── */}
        <div className="relative z-10 space-y-7 xl:space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-brand-gold/10 border border-brand-gold/20 rounded-full px-4 py-2 w-fit"
          >
            <Sparkles className="w-3 h-3 text-brand-gold" />
            <span className="text-brand-gold text-[9px] xl:text-[10px] font-bold uppercase tracking-widest">
              {t('auth.badge')}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-4xl xl:text-5xl font-display font-light text-white leading-[1.08] tracking-tight">
              {t('auth.heroTitle')}
              <br />
              <span className="italic font-extralight text-brand-gold">{t('auth.heroSub')}</span>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/40 text-xs xl:text-sm leading-relaxed max-w-xs font-light"
          >
            {t('auth.heroDesc')}
          </motion.p>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            {features.map((feat, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.07 }}
                className="flex items-center gap-3 text-white/55 text-xs font-medium"
              >
                <span className="text-brand-gold text-sm leading-none shrink-0">✦</span>
                {feat}
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {/* ── Testimonial ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="relative z-10 bg-white/[0.04] backdrop-blur border border-white/[0.06] rounded-2xl p-5"
        >
          <p className="text-white/50 text-xs leading-relaxed italic mb-4">
            "{t('auth.testimonial')}"
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center shrink-0">
              <span className="text-brand-gold text-xs font-bold">E</span>
            </div>
            <div>
              <p className="text-white text-xs font-bold">{t('home.testimonial.name')}</p>
              <p className="text-white/40 text-[10px]">{t('home.testimonial.role')}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════
          RIGHT PANEL — Form
          ═══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
        <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 md:px-12 py-8 relative min-h-full">

          {/* Soft glow top-right */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/4 blur-[90px] rounded-full pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
            className="w-full max-w-[420px] relative z-10"
          >

            {/* ── Mobile / Tablet: Top bar ── */}
            <div className="lg:hidden mb-8 sm:mb-10">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-foreground/40 hover:text-foreground/70 transition-colors text-xs mb-6 group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5" />
                {t('nav.home')}
              </Link>
              <div className="text-center">
                <Link to="/" className="inline-block text-2xl sm:text-3xl font-display font-black tracking-tighter text-foreground mb-2">
                  <span className="text-brand-gold">FAXR</span> MEBEL
                </Link>
                <p className="text-foreground/35 text-[9px] uppercase tracking-[0.25em] font-bold">
                  {t('auth.subtitle')}
                </p>
              </div>
            </div>

            {/* ── Tab Switcher ── */}
            <div className="bg-foreground/[0.05] border border-foreground/[0.07] p-1 rounded-2xl flex mb-6 sm:mb-7">
              {[
                { key: true,  label: t('auth.signIn') },
                { key: false, label: t('auth.signUp') },
              ].map(({ key, label }) => (
                <button
                  key={String(key)}
                  type="button"
                  onClick={() => {
                    setIsLogin(key);
                    setError(null);
                    setInfo(null);
                  }}
                  className={`flex-1 py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest rounded-xl ${
                    isLogin === key
                      ? 'bg-brand-gold text-black shadow-md'
                      : 'text-foreground/40 hover:text-foreground/70'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ── Heading ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={String(isLogin)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="mb-6"
              >
                <h1 className="text-2xl sm:text-3xl font-display font-light tracking-tight text-foreground mb-1.5 leading-tight">
                  {isLogin ? (
                    <>
                      <span className="font-bold">{t('auth.welcomeBack')}</span>{' '}
                      <span className="italic text-brand-gold">{t('auth.glad')}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold">{t('auth.joinUs')}</span>{' '}
                      <span className="italic text-brand-gold">{t('auth.joinGold')}</span>
                    </>
                  )}
                </h1>
                <p className="text-foreground/40 text-xs leading-relaxed">
                  {isLogin ? t('auth.loginDesc') : t('auth.registerDesc')}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* ── Form ── */}
            <form className="space-y-4" onSubmit={handleSubmit}>

              {/* Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[11px] font-bold flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Info Banner (e.g. password reset sent) */}
              <AnimatePresence>
                {info && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    role="status"
                    className="p-4 bg-brand-gold/10 border border-brand-gold/20 text-brand-gold rounded-2xl text-[11px] font-bold flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />
                    {info}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email input */}
              <div className="space-y-1.5">
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-foreground/40 ml-1">
                  {t('auth.email')}
                </label>
                <div className={`relative ${focused === 'email' ? 'scale-[1.01]' : ''}`}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="alexander@prestige.com"
                    className="w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-brand-gold/50 focus:bg-foreground/[0.06] transition-all text-foreground placeholder:text-foreground/25 pr-12"
                  />
                  <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focused === 'email' ? 'text-brand-gold' : 'text-foreground/20'}`}>
                    <Mail className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Password input */}
              <div className="space-y-1.5">
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-foreground/40 ml-1">
                  {t('auth.passcode')}
                </label>
                <div className={`relative ${focused === 'pass' ? 'scale-[1.01]' : ''}`}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('pass')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••••"
                    className="w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-brand-gold/50 focus:bg-foreground/[0.06] transition-all text-foreground placeholder:text-foreground/25 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300 hover:text-brand-gold ${focused === 'pass' ? 'text-brand-gold' : 'text-foreground/20'}`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              {isLogin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    className="text-[9px] sm:text-[10px] text-brand-gold/60 hover:text-brand-gold uppercase tracking-widest font-bold transition-colors disabled:opacity-50"
                  >
                    {t('auth.forgot')}
                  </button>
                </div>
              )}

              {/* Submit button */}
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                className="relative w-full bg-brand-gold text-black py-4 rounded-2xl font-bold text-[10px] sm:text-xs uppercase tracking-hero overflow-hidden group mt-1 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                    />
                  ) : (
                    <>
                      {isLogin ? t('auth.grantAccess') : t('auth.createAccount')}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1" />
                    </>
                  )}
                </span>
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-white/10 translate-x-[-110%] group-hover:translate-x-[110%] skew-x-12" />
              </motion.button>
            </form>

            {/* ── Divider ── */}
            <div className="relative flex items-center my-5">
              <div className="flex-1 h-px bg-foreground/[0.08]" />
              <span className="px-4 text-[9px] sm:text-[10px] uppercase tracking-widest text-foreground/25 font-bold whitespace-nowrap">
                {t('auth.orConnect')}
              </span>
              <div className="flex-1 h-px bg-foreground/[0.08]" />
            </div>

            {/* ── Google login ── */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-foreground/[0.04] border border-foreground/[0.08] text-foreground py-3.5 rounded-2xl flex items-center justify-center gap-3 hover:bg-foreground/[0.08] hover:border-foreground/15 transition-all text-[10px] sm:text-[11px] font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {/* Official Google icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('auth.continueGoogle')}
            </motion.button>

            {/* ── Switch mode ── */}
            <p className="mt-6 text-center text-[10px] sm:text-[11px] text-foreground/40">
              {isLogin ? t('auth.newToFaxr') : t('auth.alreadyMember')}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setInfo(null);
                }}
                className="text-brand-gold font-bold hover:underline underline-offset-4 decoration-brand-gold/30"
              >
                {isLogin ? t('auth.apply') : t('auth.login')}
              </button>
            </p>

            {/* ── Trust badges ── */}
            <div className="mt-8 flex items-center justify-center gap-5 sm:gap-6">
              <div className="flex items-center gap-1.5 text-foreground/25">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-gold/35" />
                <span className="text-[8px] sm:text-[9px] uppercase tracking-widest font-bold">{t('auth.secure')}</span>
              </div>
              <div className="w-px h-3 bg-foreground/10" />
              <div className="flex items-center gap-1.5 text-foreground/25">
                <Lock className="w-3 h-3 text-brand-gold/35" />
                <span className="text-[8px] sm:text-[9px] uppercase tracking-widest font-bold">{t('auth.privacy')}</span>
              </div>
              <div className="w-px h-3 bg-foreground/10" />
              <div className="flex items-center gap-1.5 text-foreground/25">
                <Send className="w-3 h-3 text-brand-gold/35" />
                <span className="text-[8px] sm:text-[9px] uppercase tracking-widest font-bold">FAXR</span>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
};
