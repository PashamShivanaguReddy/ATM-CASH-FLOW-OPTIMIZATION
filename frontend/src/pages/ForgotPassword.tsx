import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function ForgotPassword() {
  useDocumentTitle("Forgot password");
  return (
    <div className="w-full max-w-[390px]">
      <h2 className="text-2xl font-bold tracking-tight text-ink">Reset your password</h2>
      <p className="mt-2 text-sm leading-6 text-muted">Password recovery is not available yet. Contact your organization administrator for help restoring access.</p>
      <form className="mt-7 grid gap-5" onSubmit={(event) => event.preventDefault()}>
        <Input label="Work email" type="email" autoComplete="email" placeholder="name@company.com" disabled />
        <Button type="submit" className="w-full" disabled>Send reset link</Button>
      </form>
      <Link to="/login" className="mt-5 block text-center text-sm font-semibold text-moss hover:underline">Back to sign in</Link>
    </div>
  );
}