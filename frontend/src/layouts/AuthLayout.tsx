import { Outlet } from "react-router-dom";
import flowlineMark from "../assets/flowline-mark.svg";

export function AuthLayout() {
  return (
    <main className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
      <section className="relative hidden overflow-hidden bg-[#14221f] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-28 top-1/4 size-[420px] rounded-full border border-white/[0.08]" />
        <div className="absolute -right-10 top-[30%] size-[260px] rounded-full border border-white/[0.08]" />
        <div className="relative flex items-center gap-3"><span className="grid size-10 place-items-center rounded-md bg-[#cce7da]"><img src={flowlineMark} alt="" className="size-5" /></span><span className="text-lg font-bold">Flowline</span></div>
        <div className="relative max-w-xl pb-5">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#a8d4bd]">ATM cash operations</p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight xl:text-5xl">Keep every location ready for what comes next.</h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/60">A unified workspace for visibility across cash, service levels, and replenishment planning.</p>
        </div>
        <p className="relative text-xs text-white/35">Secure access for authorized operators.</p>
      </section>
      <section className="flex min-h-screen flex-col items-center justify-center px-5 py-12 sm:px-10">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden"><span className="grid size-9 place-items-center rounded-md bg-[#cce7da]"><img src={flowlineMark} alt="" className="size-5" /></span><span className="font-bold text-ink">Flowline</span></div>
        <Outlet />
        <p className="mt-10 text-center text-[11px] text-muted">ATM Cash Flow Optimization System</p>
      </section>
    </main>
  );
}