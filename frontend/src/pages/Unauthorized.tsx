import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function Unauthorized() {
  useDocumentTitle("Access denied");
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-5 py-12">
      <section className="w-full max-w-md text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-md bg-[#fff0e8] text-[#a94f35]"><ShieldAlert aria-hidden="true" className="size-6" /></span>
        <h1 className="mt-5 text-2xl font-bold text-ink">Access not permitted</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Your account does not have permission to view this page. Contact your administrator if you need access.</p>
        <Link to="/dashboard" className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-moss px-4 text-sm font-semibold text-white hover:bg-[#0e5949]">Return to dashboard</Link>
      </section>
    </main>
  );
}