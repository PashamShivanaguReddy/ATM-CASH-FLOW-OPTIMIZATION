export const dashboardMetrics = [
  { label: "Network availability", value: "98.7%", change: "+1.2%", trend: "up" as const, note: "vs. previous 30 days" },
  { label: "Cash positioned", value: "$4.82M", change: "$184K", trend: "neutral" as const, note: "across active ATMs" },
  { label: "Refills due today", value: "18", change: "6 urgent", trend: "down" as const, note: "next 12 hours" },
  { label: "Shortage exposure", value: "$26.4K", change: "−18%", trend: "up" as const, note: "vs. previous 30 days" },
];

export const cashFlowSeries = [
  { day: "Mon", demand: 62, replenishment: 48 },
  { day: "Tue", demand: 71, replenishment: 53 },
  { day: "Wed", demand: 66, replenishment: 58 },
  { day: "Thu", demand: 82, replenishment: 61 },
  { day: "Fri", demand: 76, replenishment: 73 },
  { day: "Sat", demand: 91, replenishment: 68 },
  { day: "Sun", demand: 69, replenishment: 57 },
];

export const priorityAtms = [
  { id: "ATM-0284", location: "Riverside Market", city: "Portland, OR", cash: "$8,420", level: "Low", due: "Today, 2:30 PM" },
  { id: "ATM-0117", location: "Union Station", city: "Seattle, WA", cash: "$12,800", level: "Watch", due: "Today, 4:00 PM" },
  { id: "ATM-0392", location: "Northgate Center", city: "Seattle, WA", cash: "$6,150", level: "Low", due: "Tomorrow, 9:00 AM" },
];

export const attentionItems = [
  { title: "Low cash forecast", detail: "6 ATMs below reserve threshold", tone: "danger" as const, time: "12 min ago" },
  { title: "Refill route adjusted", detail: "Route 04 · 3 stops reordered", tone: "info" as const, time: "38 min ago" },
  { title: "Demand spike detected", detail: "Downtown district · +14% vs forecast", tone: "warning" as const, time: "1 hr ago" },
];