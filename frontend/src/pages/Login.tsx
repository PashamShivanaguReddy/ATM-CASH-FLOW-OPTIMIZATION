import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CircleAlert, LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuthContext } from "../context/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const loginSchema = z.object({
  email: z.string().email("Enter a valid work email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function Login() {
  useDocumentTitle("Sign in");
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null);
    try {
      await signIn(email, password);
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";
      navigate(destination, { replace: true });
    } catch (reason) {
      setError(typeof reason === "object" && reason !== null && "response" in reason
        ? "The email or password is incorrect."
        : "Unable to sign in. Check your connection and try again.");
    }
  });

  return (
    <div className="w-full max-w-[390px]">
      <div className="mb-7 grid size-11 place-items-center rounded-md bg-mint text-moss"><LockKeyhole aria-hidden="true" className="size-5" /></div>
      <h2 className="text-2xl font-bold tracking-tight text-ink">Welcome back</h2>
      <p className="mt-2 text-sm text-muted">Sign in to your operations workspace.</p>
      <form className="mt-7 grid gap-5" onSubmit={onSubmit} noValidate>
        <Input label="Work email" type="email" autoComplete="username" placeholder="name@company.com" {...register("email")} error={errors.email?.message} />
        <Input id="password" label="Password" labelAction={<Link to="/forgot-password" className="text-xs font-semibold text-moss hover:underline">Forgot password?</Link>} type="password" autoComplete="current-password" placeholder="Enter your password" {...register("password")} error={errors.password?.message} />
        {error && <p role="alert" className="flex items-start gap-2 rounded-md border border-[#efdfbf] bg-[#fff8e9] p-3 text-xs leading-5 text-[#805415]"><CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{error}</p>}
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">Continue <ArrowRight aria-hidden="true" className="size-4" /></Button>
      </form>
      <p className="mt-6 text-center text-xs text-muted">Access is limited to authorized organization members.</p>
    </div>
  );
}