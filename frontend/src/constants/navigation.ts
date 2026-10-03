import {
  Activity,
  Bell,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  CircleDollarSign,
  FileBarChart,
  Gauge,
  Settings2,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "../types/auth";

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
  group: "Workspace" | "Management";
  allowedRoles: UserRole[];
}

const allRoles: UserRole[] = ["SUPER_ADMIN", "BANK_ADMIN", "BANK_MANAGER", "ATM_OPERATOR"];
const bankAdmins: UserRole[] = ["SUPER_ADMIN", "BANK_ADMIN"];
const managers: UserRole[] = ["SUPER_ADMIN", "BANK_MANAGER"];
const operations: UserRole[] = ["SUPER_ADMIN", "BANK_ADMIN", "BANK_MANAGER"];

export const navigationItems: NavigationItem[] = [
  { label: "Overview", path: "/dashboard", icon: Gauge, group: "Workspace", allowedRoles: allRoles },
  { label: "ATMs", path: "/atms", icon: Building2, group: "Workspace", allowedRoles: allRoles },
  { label: "Transactions", path: "/transactions", icon: Activity, group: "Workspace", allowedRoles: operations },
  { label: "Cash inventory", path: "/cash-inventory", icon: Boxes, group: "Workspace", allowedRoles: ["SUPER_ADMIN", "BANK_ADMIN", "ATM_OPERATOR"] },
  { label: "Refills", path: "/refills", icon: CircleDollarSign, group: "Workspace", allowedRoles: ["SUPER_ADMIN", "BANK_ADMIN", "ATM_OPERATOR"] },
  { label: "Predictions", path: "/predictions", icon: ChartNoAxesCombined, group: "Workspace", allowedRoles: managers },
  { label: "Recommendations", path: "/optimization", icon: Settings2, group: "Management", allowedRoles: managers },
  { label: "Alerts", path: "/alerts", icon: Bell, group: "Management", allowedRoles: managers },
  { label: "Users", path: "/users", icon: Users, group: "Management", allowedRoles: bankAdmins },
  { label: "Reports", path: "/reports", icon: FileBarChart, group: "Management", allowedRoles: bankAdmins },
];