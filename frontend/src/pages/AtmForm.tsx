import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useToast } from "../context/ToastContext";
import { useAuthContext } from "../context/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { apiErrorMessage } from "../services/api";
import { createAtm, getAtm, updateAtm } from "../services/atmService";
import type { AtmInput, AtmStatus, AtmType } from "../types/atm";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { Loading } from "../components/ui/Loading";
import { Select } from "../components/ui/Select";

const schema = z.object({
  atmCode: z.string().trim().min(1, "ATM code is required.").max(32),
  bankId: z.number().int().positive("Enter a valid bank ID."),
  location: z.string().trim().min(1, "Location is required.").max(500),
  city: z.string().trim().min(1, "City is required.").max(100),
  state: z.string().trim().min(1, "State is required.").max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  atmType: z.enum(["STANDARD", "DRIVE_THROUGH", "KIOSK"]),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "OUT_OF_SERVICE", "LOW_CASH"]),
  cashCapacity: z.number().positive("Capacity must be greater than zero."),
  minimumCashThreshold: z.number().min(0),
  maximumCashThreshold: z.number().min(0),
  currentCash: z.number().min(0),
}).refine((value) => value.maximumCashThreshold >= value.minimumCashThreshold, { path: ["maximumCashThreshold"], message: "Maximum threshold must be at least the minimum threshold." });

type FormValues = z.infer<typeof schema>;
const statusOptions = ["ACTIVE", "INACTIVE", "MAINTENANCE", "OUT_OF_SERVICE", "LOW_CASH"].map((value) => ({ label: value.replaceAll("_", " "), value }));
const typeOptions = [{ label: "Standard", value: "STANDARD" }, { label: "Drive-through", value: "DRIVE_THROUGH" }, { label: "Kiosk", value: "KIOSK" }];

export function AtmForm() {
  const { id = "" } = useParams();
  const creating = !id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuthContext();
  const existing = useQuery({ queryKey: ["atm", id], queryFn: () => getAtm(id), enabled: !creating });
  useDocumentTitle(creating ? "Create ATM" : "Edit ATM");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { atmCode: "", bankId: user?.bankId ?? undefined, location: "", city: "", state: "", latitude: 0, longitude: 0, atmType: "STANDARD", status: "ACTIVE", cashCapacity: 0, minimumCashThreshold: 0, maximumCashThreshold: 0, currentCash: 0 },
  });

  useEffect(() => {
    if (!existing.data) return;
    reset({ ...existing.data, bankId: existing.data.bankId, atmType: existing.data.atmType as AtmType, status: existing.data.status as AtmStatus });
  }, [existing.data, reset]);

  const save = useMutation({
    mutationFn: (values: AtmInput) => creating ? createAtm(values) : updateAtm(id, values),
    onSuccess: async (record) => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["atms"] }), queryClient.invalidateQueries({ queryKey: ["atm", id] })]);
      showToast(creating ? "ATM created." : "ATM updated.");
      navigate(`/atms/${record.id}`);
    },
    onError: (error) => showToast(apiErrorMessage(error, "Could not save ATM."), "error"),
  });

  if (!creating && existing.isPending) return <Loading label="Loading ATM for editing" />;
  if (!creating && existing.isError) return <ErrorState title="ATM unavailable" message={apiErrorMessage(existing.error, "This ATM could not be loaded for editing.")} onRetry={() => void existing.refetch()} />;

  return (
    <div className="page-enter mx-auto max-w-4xl space-y-6">
      <header><Link to={creating ? "/atms" : `/atms/${id}`} className="text-xs font-semibold text-muted hover:text-ink">← Back to ATM</Link><h1 className="mt-3 text-2xl font-bold text-ink">{creating ? "Create ATM" : "Edit ATM"}</h1><p className="mt-1 text-sm text-muted">Configure the location, service state, and cash thresholds.</p></header>
      <Card className="p-5 sm:p-6">
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit((values) => save.mutate(values))} noValidate>
          <Input label="ATM code" maxLength={32} {...register("atmCode")} error={errors.atmCode?.message} />
          <Input label="Bank ID" type="number" min="1" {...register("bankId", { valueAsNumber: true })} error={errors.bankId?.message} />
          <Input label="Location" maxLength={500} {...register("location")} error={errors.location?.message} />
          <Input label="City" maxLength={100} {...register("city")} error={errors.city?.message} />
          <Input label="State" maxLength={100} {...register("state")} error={errors.state?.message} />
          <Select label="ATM type" options={typeOptions} {...register("atmType")} error={errors.atmType?.message} />
          <Input label="Latitude" type="number" step="any" min="-90" max="90" {...register("latitude", { valueAsNumber: true })} error={errors.latitude?.message} />
          <Input label="Longitude" type="number" step="any" min="-180" max="180" {...register("longitude", { valueAsNumber: true })} error={errors.longitude?.message} />
          <Select label="Status" options={statusOptions} {...register("status")} error={errors.status?.message} />
          <Input label="Cash capacity (₹)" type="number" min="1" step="0.01" {...register("cashCapacity", { valueAsNumber: true })} error={errors.cashCapacity?.message} />
          <Input label="Minimum threshold (₹)" type="number" min="0" step="0.01" {...register("minimumCashThreshold", { valueAsNumber: true })} error={errors.minimumCashThreshold?.message} />
          <Input label="Maximum threshold (₹)" type="number" min="0" step="0.01" {...register("maximumCashThreshold", { valueAsNumber: true })} error={errors.maximumCashThreshold?.message} />
          <Input label="Current cash (₹)" type="number" min="0" step="0.01" {...register("currentCash", { valueAsNumber: true })} error={errors.currentCash?.message} />
          <div className="flex justify-end gap-2 border-t border-line pt-5 sm:col-span-2"><Button variant="secondary" onClick={() => navigate(creating ? "/atms" : `/atms/${id}`)}>Cancel</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : creating ? "Create ATM" : "Save changes"}</Button></div>
        </form>
      </Card>
    </div>
  );
}