"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, Bell, Timer, ChevronDown } from "lucide-react";

/* ── Pickleball SVG ──────────────────────────────────────────────────────── */
function PickleballSVG({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id="pb-body" cx="38%" cy="30%" r="65%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#e8ff5a" />
          <stop offset="45%"  stopColor="#a8d910" />
          <stop offset="100%" stopColor="#5a8400" />
        </radialGradient>
        <radialGradient id="pb-shine" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="white" stopOpacity="0.45" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <filter id="pb-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#7acc00" floodOpacity="0.8" />
        </filter>
      </defs>
      {/* Main ball */}
      <circle cx="30" cy="30" r="28" fill="url(#pb-body)" filter="url(#pb-shadow)" />
      {/* Seam lines */}
      <path d="M 5 28 Q 30 16 55 28" stroke="rgba(0,0,0,0.15)" strokeWidth="1.2" fill="none" />
      <path d="M 5 32 Q 30 44 55 32" stroke="rgba(0,0,0,0.15)" strokeWidth="1.2" fill="none" />
      {/* Holes — scattered in realistic pickleball pattern */}
      {[
        [16,14],[28,10],[40,14],[12,24],[24,20],[36,20],[48,24],
        [10,32],[20,29],[30,30],[40,29],[50,32],
        [14,40],[26,42],[38,42],[46,38],
        [20,48],[32,50],[42,46],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.5" fill="rgba(0,0,0,0.30)" />
      ))}
      {/* Specular highlight */}
      <ellipse cx="21" cy="17" rx="9" ry="6" fill="url(#pb-shine)" />
    </svg>
  );
}

/* ── Paddle SVG (transition) ─────────────────────────────────────────────── */
function PaddleSVG({ size = 90 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 65" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tpd-face" x1="5" y1="3" x2="37" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(142 72% 58%)" />
          <stop offset="1" stopColor="hsl(155 80% 36%)" />
        </linearGradient>
        <radialGradient id="tpd-shine" cx="38%" cy="28%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.28" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <filter id="tpd-glow">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="hsl(142 72% 55%)" floodOpacity="0.7" />
        </filter>
      </defs>
      {/* Head */}
      <ellipse cx="25" cy="22" rx="18" ry="19" fill="url(#tpd-face)" filter="url(#tpd-glow)" />
      <ellipse cx="25" cy="22" rx="18" ry="19" fill="url(#tpd-shine)" />
      {/* Court lines on face */}
      <ellipse cx="25" cy="22" rx="12" ry="13" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" />
      <line x1="9"  y1="14" x2="41" y2="30" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <line x1="9"  y1="30" x2="41" y2="14" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      {/* Handle */}
      <rect x="22.5" y="40" width="5" height="20" rx="2.5" fill="hsl(25 60% 35%)" />
      <rect x="22.5" y="40" width="5" height="6"  rx="2"   fill="hsl(25 60% 45%)" />
    </svg>
  );
}

/* ── Logo paddle (small) ─────────────────────────────────────────────────── */
function LogoPaddleIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="18" cy="16" rx="12" ry="13" fill="url(#logo-grad)" opacity="0.95" />
      <ellipse cx="18" cy="16" rx="8.5" ry="9.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <line x1="10" y1="10" x2="26" y2="22" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <line x1="10" y1="22" x2="26" y2="10" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <rect x="16" y="28" width="4" height="10" rx="2" fill="url(#logo-handle)" />
      <circle cx="31" cy="10" r="4" fill="hsl(142 72% 65%)" opacity="0.9" />
      <defs>
        <linearGradient id="logo-grad" x1="6" y1="4" x2="30" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(142 72% 52%)" />
          <stop offset="1" stopColor="hsl(158 84% 40%)" />
        </linearGradient>
        <linearGradient id="logo-handle" x1="16" y1="28" x2="20" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(142 72% 40%)" />
          <stop offset="1" stopColor="hsl(142 50% 25%)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Transition overlay ──────────────────────────────────────────────────── */
/*
 * Hit point: 15% from left, 68% from top.
 * All three elements (paddle, impact flash, ball + trail) anchor here so
 * the paddle visually makes contact exactly where the ball launches from.
 * On mobile the vw/vh units + % positioning scale automatically.
 */
function EnterTransition({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  // Hit point as % of the full screen
  const hitLeft = "15%";
  const hitTop  = "68%";
  // Ball radius in px (half of 88px)
  const r = 44;

  return (
    <div className="overlay-enter fixed inset-0 z-50 overflow-hidden pointer-events-none">

      {/* ── SVG comet trail ─────────────────────────────────────────────────
          Path starts at (15, 68) in % coords, peaks at ~(55, 16), exits at
          (103, 66).  Uses preserveAspectRatio="none" so it fills the screen
          at any aspect ratio — works identically on mobile & desktop.       */}
      <svg
        aria-hidden
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="tl-grad" gradientUnits="userSpaceOnUse" x1="15" y1="0" x2="103" y2="0">
            <stop offset="0%"   stopColor="hsl(90 90% 65%)" stopOpacity="0"   />
            <stop offset="15%"  stopColor="hsl(90 90% 65%)" stopOpacity="0.3" />
            <stop offset="55%"  stopColor="hsl(90 90% 72%)" stopOpacity="0.7" />
            <stop offset="85%"  stopColor="hsl(90 90% 65%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(90 90% 65%)" stopOpacity="0"   />
          </linearGradient>
          <linearGradient id="tl-soft" gradientUnits="userSpaceOnUse" x1="15" y1="0" x2="103" y2="0">
            <stop offset="0%"   stopColor="hsl(90 90% 55%)" stopOpacity="0"   />
            <stop offset="35%"  stopColor="hsl(90 90% 55%)" stopOpacity="0.18"/>
            <stop offset="65%"  stopColor="hsl(90 90% 55%)" stopOpacity="0.38"/>
            <stop offset="100%" stopColor="hsl(90 90% 55%)" stopOpacity="0"   />
          </linearGradient>
          <filter id="tl-blur"><feGaussianBlur stdDeviation="0.7" /></filter>
        </defs>
        {/* Bright core stroke */}
        <path d="M 15,68 Q 52,14 103,66"
          stroke="url(#tl-grad)" strokeWidth="0.9" fill="none"
          pathLength="1" strokeDasharray="1" strokeDashoffset="1"
          style={{ animation: "arc-draw 1.65s linear 0.42s both" }} />
        {/* Soft wide glow stroke */}
        <path d="M 15,68 Q 52,14 103,66"
          stroke="url(#tl-soft)" strokeWidth="4" fill="none"
          filter="url(#tl-blur)"
          pathLength="1" strokeDasharray="1" strokeDashoffset="1"
          style={{ animation: "arc-draw 1.65s linear 0.42s both" }} />
      </svg>

      {/* ── Paddle ─────────────────────────────────────────────────────────
          Anchored at hit point; swings in from bottom-left, arrives at
          contact at ~0.42 s, follows through, then fades out.             */}
      <div style={{ position: "absolute", top: hitTop, left: hitLeft }}>
        <div className="pb-paddle" style={{ transformOrigin: "bottom center" }}>
          {/* Offset so paddle face centre aligns with hit point */}
          <div style={{ marginTop: `-${r}px`, marginLeft: `-${r * 0.6}px` }}>
            <PaddleSVG size={88} />
          </div>
        </div>
      </div>

      {/* ── Impact flash ────────────────────────────────────────────────── */}
      <div style={{ position: "absolute", top: hitTop, left: hitLeft }}>
        <div className="pb-impact"
          style={{
            width: "90px", height: "90px",
            marginTop: "-45px", marginLeft: "-45px",
            borderRadius: "50%",
            background: "radial-gradient(circle, hsl(80 100% 80% / 0.9) 0%, hsl(90 90% 55% / 0.5) 40%, transparent 70%)",
            filter: "blur(4px)",
          }} />
      </div>

      {/* ── Ball — two-div parabola ─────────────────────────────────────────
          Both divs anchored at the hit point. No negative start offset needed
          since the anchor IS the start position.
          pb-x:  linear horizontal sweep  0 → 88vw
          pb-y:  ease vertical arc        0 → -48vh → +2vh
          Both delayed 0.42 s (contact moment).                             */}
      <div style={{ position: "absolute", top: hitTop, left: hitLeft }}>
        <div className="pb-x">
          <div className="pb-y">
            {/* Ambient glow halo */}
            <div style={{
              position: "absolute",
              inset: "-26px",
              borderRadius: "50%",
              background: "radial-gradient(circle, hsl(90 90% 60% / 0.4) 0%, transparent 65%)",
              filter: "blur(14px)",
            }} />
            {/* The ball itself: spin + glow */}
            <div className="pb-spin pb-glow"
              style={{ marginTop: `-${r}px`, marginLeft: `-${r}px` }}>
              <PickleballSVG size={r * 2} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ── Feature cards data ──────────────────────────────────────────────────── */
const features = [
  { icon: MapPin, label: "Find Courts",    desc: "Discover nearby tennis & pickleball courts on a live map",       delay: "0.55s", float: "float-slow" },
  { icon: Timer,  label: "Join the Queue", desc: "Claim your spot and track your place in real time",              delay: "0.65s", float: "float-mid"  },
  { icon: Bell,   label: "Get Notified",   desc: "Receive instant alerts the moment a court opens up",             delay: "0.75s", float: "float-fast" },
];

/* ── Landing page ────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const router   = useRouter();
  const [ready,    setReady]    = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleEnter = useCallback(() => {
    if (entering) return;
    setEntering(true);
  }, [entering]);

  const handleTransitionDone = useCallback(() => {
    router.push("/app");
  }, [router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040404] flex flex-col items-center justify-center px-5">

      {/* Animated background orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb-1 absolute w-[600px] h-[600px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, hsl(142 72% 45% / 0.7) 0%, transparent 70%)", top: "-15%", left: "-10%", filter: "blur(60px)" }} />
        <div className="orb-2 absolute w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, hsl(199 89% 55% / 0.8) 0%, transparent 70%)", bottom: "0%", right: "-5%", filter: "blur(70px)" }} />
        <div className="orb-3 absolute w-[350px] h-[350px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, hsl(262 83% 58% / 0.6) 0%, transparent 70%)", top: "40%", right: "15%", filter: "blur(55px)" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full">

        {/* Location pill */}
        <div className="badge-pop mb-8" style={{ animationDelay: "0.1s", opacity: ready ? undefined : 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.06] backdrop-blur-md px-4 py-2 text-xs font-medium text-white/70 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live in Oakville · Burlington · Halton Hills
          </div>
        </div>

        {/* Logo */}
        <div className="hero-in flex flex-col items-center mb-6" style={{ animationDelay: "0.2s", opacity: ready ? undefined : 0 }}>
          <div className="w-20 h-20 mb-5 drop-shadow-[0_0_30px_hsl(142_72%_45%_/_0.5)]">
            <LogoPaddleIcon />
          </div>
          <span className="text-sm font-semibold tracking-[0.25em] uppercase text-white/40">
            CourtQueue
          </span>
        </div>

        {/* Headline */}
        <h1 className="hero-in text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6"
          style={{ animationDelay: "0.3s", opacity: ready ? undefined : 0 }}>
          <span className="shimmer-text">Skip the Wait.</span>
          <br />
          <span className="text-white">Own the Court.</span>
        </h1>

        {/* Subtitle */}
        <p className="hero-in text-base sm:text-lg text-white/50 leading-relaxed max-w-md mb-10"
          style={{ animationDelay: "0.42s", opacity: ready ? undefined : 0 }}>
          Find tennis &amp; pickleball courts near you, join the live queue,
          and get notified the moment your spot opens up.
        </p>

        {/* CTA */}
        <div className="hero-in mb-14" style={{ animationDelay: "0.5s", opacity: ready ? undefined : 0 }}>
          <button
            onClick={handleEnter}
            disabled={entering}
            className={`cta-glow inline-flex items-center gap-3 px-8 py-4 rounded-2xl gradient-primary text-[hsl(0_0%_4%)] font-bold text-base sm:text-lg tracking-tight transition-all duration-200 ${
              entering
                ? "scale-95 opacity-70 cursor-not-allowed"
                : "hover:scale-[1.04] active:scale-[0.97]"
            }`}
          >
            {entering ? (
              <>
                <PickleballSVG size={22} />
                Launching…
              </>
            ) : (
              <>
                Enter the App
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Feature cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          {features.map(({ icon: Icon, label, desc, delay, float: f }) => (
            <div key={label}
              className={`hero-in ${f} rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm p-5 text-left`}
              style={{ animationDelay: delay, opacity: ready ? undefined : 0 }}>
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center mb-3 shadow-md shadow-primary/20">
                <Icon className="w-4 h-4 text-[hsl(0_0%_4%)]" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">{label}</p>
              <p className="text-xs text-white/45 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/20">
        <ChevronDown className="w-4 h-4 animate-bounce" />
      </div>

      {/* Transition overlay — rendered when entering */}
      {entering && <EnterTransition onDone={handleTransitionDone} />}
    </div>
  );
}
