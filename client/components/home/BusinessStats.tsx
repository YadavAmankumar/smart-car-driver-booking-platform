"use client";

import { useEffect, useRef, useState } from "react";


type Stat = {
  label: string;
  value: number;
  suffix?: string;
};

const stats: Stat[] = [
  { label: "Happy Customers", value: 5000, suffix: "+" },
  { label: "Professional Drivers", value: 100, suffix: "+" },
  { label: "Premium Vehicles", value: 50, suffix: "+" },
  { label: "Customer Support", value: 24, suffix: "+/7" },
];

function formatStatValue(stat: Stat, n: number) {
  // Simple formatting to keep UI stable.
  if (stat.suffix === "+/7") {
    return `${Math.round(n)}${stat.suffix}`;
  }
  return `${Math.round(n)}${stat.suffix || ""}`;
}

function useCountUp(target: number, durationMs: number, enabled: boolean) {
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const el = enabled;
    if (!el) return;

    const start = performance.now();
    startRef.current = start;

    const step = (now: number) => {
      const elapsed = now - (startRef.current ?? start);
      const t = Math.min(1, elapsed / durationMs);
      const current = target * (1 - Math.pow(1 - t, 3));

      const customEvent = new CustomEvent("smartdrive:stat", {
        detail: { value: current },
      });
      window.dispatchEvent(customEvent);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, enabled]);
}

function StatCard({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLElement | null>(null);
  const mounted = useRef(false);
  const [enabled, setEnabled] = useState(false);


  // Avoid complex hooks; use IntersectionObserver with minimal state.
  const valueRef = useRef<HTMLSpanElement | null>(null);
  const enabledRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting && !enabledRef.current) {
          enabledRef.current = true;
          setEnabled(true);
          mounted.current = true;
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [setEnabled]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ value: number }>;
      if (!valueRef.current) return;
      valueRef.current.textContent = formatStatValue(stat, ce.detail.value);
    };
    window.addEventListener("smartdrive:stat", handler);
    return () => window.removeEventListener("smartdrive:stat", handler);
  }, [stat]);

  useCountUp(stat.value, 900, enabled);

  return (
    <article
      ref={(n) => {
        ref.current = n;
      }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {stat.label}
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              ref={valueRef}
              className="text-3xl font-extrabold tracking-tight text-slate-900"
            >
              0
            </span>
          </div>
        </div>
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-slate-900/5 to-emerald-500/10" />
      </div>
    </article>
  );
}

export default function BusinessStats() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16" id="stats">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-10 shadow-sm sm:px-10">
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">Business statistics</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Trusted by customers worldwide
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
            Premium service, consistent drivers, and transparent dispatch.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
}

