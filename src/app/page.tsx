"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, Bell, Timer, ChevronDown } from "lucide-react";
import { APP_NAME } from "@/lib/brand";

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

const features = [
  { icon: MapPin, label: "Find Courts", desc: "Discover nearby tennis & pickleball courts on a live map" },
  { icon: Timer, label: "Join the Queue", desc: "Claim your spot and track your place in real time" },
  { icon: Bell, label: "Get Notified", desc: "Receive instant alerts the moment a court opens up" },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040404] flex flex-col items-center justify-center px-5">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="orb-1 absolute w-[600px] h-[600px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, hsl(142 72% 45% / 0.7) 0%, transparent 70%)",
            top: "-15%",
            left: "-10%",
            filter: "blur(60px)",
          }}
        />
        <div
          className="orb-2 absolute w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(199 89% 55% / 0.8) 0%, transparent 70%)",
            bottom: "0%",
            right: "-5%",
            filter: "blur(70px)",
          }}
        />
        <div
          className="orb-3 absolute w-[350px] h-[350px] rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, hsl(262 83% 58% / 0.6) 0%, transparent 70%)",
            top: "40%",
            right: "15%",
            filter: "blur(55px)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.06] backdrop-blur-md px-4 py-2 text-xs font-medium text-white/70 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Live in Oakville
          </div>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 mb-5 drop-shadow-[0_0_30px_hsl(142_72%_45%_/_0.5)]">
            <LogoPaddleIcon />
          </div>
          <span className="text-sm font-semibold tracking-[0.25em] uppercase text-white/40">
            {APP_NAME}
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
          <span className="shimmer-text">Skip the Wait.</span>
          <br />
          <span className="text-white">Own the Court.</span>
        </h1>

        <p className="text-base sm:text-lg text-white/50 leading-relaxed max-w-md mb-10">
          Find tennis &amp; pickleball courts near you, join the live queue, and get notified the
          moment your spot opens up.
        </p>

        <div className="mb-14">
          <button
            onClick={() => router.push("/app")}
            className="cta-glow inline-flex items-center gap-3 px-8 py-4 rounded-2xl gradient-primary text-[hsl(0_0%_4%)] font-bold text-base sm:text-lg tracking-tight transition-transform duration-200 hover:scale-[1.04] active:scale-[0.97]"
          >
            Enter the App
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          {features.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm p-5 text-left"
            >
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center mb-3 shadow-md shadow-primary/20">
                <Icon className="w-4 h-4 text-[hsl(0_0%_4%)]" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">{label}</p>
              <p className="text-xs text-white/45 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/20">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );
}
