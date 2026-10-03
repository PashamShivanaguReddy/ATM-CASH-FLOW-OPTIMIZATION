import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useAuthContext } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { Loading } from "../components/ui/Loading";
import { Select } from "../components/ui/Select";
import { createUser, getUser, updateUser } from "../services/userService";
import { apiErrorMessage } from "../services/api";
import type { UserInput } from "../types/user";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const userFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().optional(),
  password: z.string().optional().refine((value) => !value || value.length >= 8, "Password must be at least 8 characters."),
  bankId: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "BANK_ADMIN", "BANK_MANAGER", "ATM_OPERATOR"]),
  status: z.enum(["ACTIVE", "INACTIVE", "LOCKED"]),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const roleOptions = [
  { label: "Super admin", value: "SUPER_ADMIN" },
  { label: "Bank admin", value: "BANK_ADMIN" },
  { label: "Bank manager", value: "BANK_MANAGER" },
  { label: "ATM operator", value: "ATM_OPERATOR" },
];
const statusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Locked", value: "LOCKED" },
];

export function UserForm() {
  const { id } = useParams();
  const creating = !id;
  const { user: currentUser } = useAuthContext();
  const permittedRoleOptions = currentUser?.role === "SUPER_ADMIN" ? roleOptions : roleOptions.filter((option) => option.value !== "SUPER_ADMIN");
  useDocumentTitle(creating ? "Create user" : "Edit user");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const existing = useQuery({ queryKey: ["user", id], queryFn: () => getUser(id!), enabled: Boolean(id) });
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", password: "", bankId: "", role: "ATM_OPERATOR", status: "ACTIVE" },
  });

  useEffect(() => {
    if (!existing.data) return;
    reset({
      firstName: existing.data.firstName,
      lastName: existing.data.lastName,
      email: existing.data.email,
      phone: existing.data.phone ?? "",
      password: "",
      bankId: existing.data.bankId == null ? "" : String(existing.data.bankId),
      role: existing.data.role,
      status: existing.data.status,
    });
  }, [existing.data, reset]);

  const save = useMutation({
    mutationFn: (input: UserInput) => creating ? createUser(input) : updateUser(id!, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      if (!creating) await queryClient.invalidateQueries({ queryKey: ["user", id] });
      navigate("/users");
    },
    onError: (error) => setSubmitError(apiErrorMessage(error, "Could not save this user.")),
  });

  const submit = handleSubmit((values) => {
    setSubmitError(null);
    if (creating && !values.password) {
      setError("password", { message: "Password is required for a new user." });
      return;
    }
    save.mutate({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone || undefined,
      password: values.password || undefined,
      bankId: values.bankId ? Number(values.bankId) : null,
      role: values.role,
      status: values.status,
    });
  });

  if (!creating && existing.isPending) return <Loading label="Loading user" />;
  if (!creating && existing.isError) return <ErrorState title="User unavailable" message={apiErrorMessage(existing.error, "Could not load this user for editing.")} onRetry={() => void existing.refetch()} />;

  return (
    <div className="page-enter mx-auto max-w-3xl space-y-6">
      <header><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-moss">User directory</p><h1 className="mt-2 text-2xl font-bold text-ink">{creating ? "Create user" : "Edit user"}</h1><p className="mt-1 text-sm text-muted">Set account details and organization permissions.</p></header>
      <Card className="p-5 sm:p-6">
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={submit} noValidate>
          <Input label="First name" autoComplete="given-name" {...register("firstName")} error={errors.firstName?.message} />
          <Input label="Last name" autoComplete="family-name" {...register("lastName")} error={errors.lastName?.message} />
          <Input label="Email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
          <Input label="Phone" type="tel" autoComplete="tel" {...register("phone")} error={errors.phone?.message} />
          <Input label={creating ? "Temporary password" : "New password"} type="password" autoComplete="new-password" hint={creating ? "At least 8 characters." : "Leave blank to keep the current password."} {...register("password")} error={errors.password?.message} />
          <Input label="Bank ID" type="number" min="1" {...register("bankId")} error={errors.bankId?.message} />
          <Select label="Role" options={permittedRoleOptions} {...register("role")} error={errors.role?.message} />
          <Select label="Status" options={statusOptions} {...register("status")} error={errors.status?.message} />
          {submitError && <p role="alert" className="sm:col-span-2 rounded-md border border-[#efdfbf] bg-[#fff8e9] p-3 text-sm text-[#805415]">{submitError}</p>}
          <div className="flex justify-end gap-2 border-t border-line pt-5 sm:col-span-2">
            <Button variant="secondary" onClick={() => navigate("/users")}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : creating ? "Create user" : "Save changes"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
