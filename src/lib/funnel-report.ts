import type {
  AdminFunnelBreakdownRow,
  AdminFunnelDashboard,
  AdminFunnelStage,
  AdminFunnelWindow,
  AdminFunnelWindowDays,
} from "@/lib/data/contracts";
import { FUNNEL_EVENT_NAMES, type FunnelEventName } from "@/lib/funnel-events";

export type FunnelReportEvent = {
  id: string;
  name: string;
  anonymousSessionId: string | null;
  userId: string | null;
  source: string;
  tool: string;
  createdAt: Date;
};

export type FunnelReportPayment = {
  status: string;
  amountVnd: number;
  createdAt: Date;
};

const DAY_MS = 86_400_000;
const STAGE_LABELS: Record<FunnelEventName, string> = {
  landing: "Vào trang",
  tool_view: "Xem công cụ",
  submit: "Gửi thông tin",
  result: "Nhận kết quả",
  save_intent: "Muốn lưu / xem sâu",
  account: "Có tài khoản",
  checkout: "Mở thanh toán",
  paid: "Thanh toán",
  reading_complete: "Nhận luận giải",
};

const SOURCE_LABELS: Record<string, string> = {
  ads: "Quảng cáo",
  organic_search: "Tìm kiếm tự nhiên",
  ai: "Công cụ AI",
  internal: "Điều hướng nội bộ",
  referral: "Trang giới thiệu",
  direct: "Truy cập trực tiếp",
  unknown: "Chưa xác định",
};

const TOOL_LABELS: Record<string, string> = {
  chart: "Lập lá số",
  date_finder: "Xem ngày",
  age_compatibility: "Tuổi vợ chồng",
  age_child: "Tuổi sinh con",
  age_house: "Tuổi xây nhà",
  age_business: "Tuổi làm ăn",
  age_marriage: "Tuổi cưới hỏi",
  age_vehicle: "Tuổi mua xe",
  wealth: "Tài lộc & đầu tư",
  compatibility: "Tương hợp lá số",
  full_reading: "Luận giải chuyên sâu",
  coin_topup: "Nạp xu",
  knowledge: "Bài kiến thức",
  other: "Khác",
};

function percent(value: number, base: number) {
  if (base <= 0) return 0;
  return Math.round((value / base) * 1_000) / 10;
}

function buildSessionUserMap(events: FunnelReportEvent[]) {
  const result = new Map<string, string>();
  for (const event of events) {
    if (event.anonymousSessionId && event.userId) result.set(event.anonymousSessionId, event.userId);
  }
  return result;
}

function actorKey(event: FunnelReportEvent, sessionUsers: Map<string, string>) {
  const linkedUser = event.userId || (event.anonymousSessionId ? sessionUsers.get(event.anonymousSessionId) : null);
  if (linkedUser) return `user:${linkedUser}`;
  if (event.anonymousSessionId) return `session:${event.anonymousSessionId}`;
  return `event:${event.id}`;
}

function actorsFor(events: FunnelReportEvent[], sessionUsers: Map<string, string>) {
  return new Set(events.map((event) => actorKey(event, sessionUsers)));
}

function stageActors(events: FunnelReportEvent[], name: FunnelEventName, sessionUsers: Map<string, string>) {
  return actorsFor(events.filter((event) => event.name === name), sessionUsers).size;
}

function buildStages(
  current: FunnelReportEvent[],
  previous: FunnelReportEvent[],
  sessionUsers: Map<string, string>,
): AdminFunnelStage[] {
  let currentBase = 0;
  let previousBase = 0;
  return FUNNEL_EVENT_NAMES.map((name, index) => {
    const actors = stageActors(current, name, sessionUsers);
    const previousActors = stageActors(previous, name, sessionUsers);
    const conversionRate = index === 0 ? (actors ? 100 : 0) : percent(actors, currentBase);
    const previousConversionRate = index === 0 ? (previousActors ? 100 : 0) : percent(previousActors, previousBase);
    currentBase = actors;
    previousBase = previousActors;
    return { name, label: STAGE_LABELS[name], actors, previousActors, conversionRate, previousConversionRate };
  });
}

function buildBreakdown(
  events: FunnelReportEvent[],
  field: "source" | "tool",
  labels: Record<string, string>,
  sessionUsers: Map<string, string>,
): AdminFunnelBreakdownRow[] {
  const groups = new Map<string, FunnelReportEvent[]>();
  for (const event of events) {
    const key = event[field] || "unknown";
    groups.set(key, [...(groups.get(key) || []), event]);
  }
  return Array.from(groups, ([key, rows]) => ({
    key,
    label: labels[key] || key.replaceAll("_", " "),
    actors: actorsFor(rows, sessionUsers).size,
    results: stageActors(rows, "result", sessionUsers),
    accounts: stageActors(rows, "account", sessionUsers),
    checkouts: stageActors(rows, "checkout", sessionUsers),
    paid: stageActors(rows, "paid", sessionUsers),
  }))
    .sort((a, b) => b.results - a.results || b.actors - a.actors || a.label.localeCompare(b.label, "vi"));
}

function inRange(event: FunnelReportEvent, start: Date, end: Date) {
  return event.createdAt >= start && event.createdAt < end;
}

function buildWindow(
  days: AdminFunnelWindowDays,
  events: FunnelReportEvent[],
  now: Date,
  sessionUsers: Map<string, string>,
): AdminFunnelWindow {
  const currentStart = new Date(now.getTime() - days * DAY_MS);
  const previousStart = new Date(now.getTime() - days * 2 * DAY_MS);
  const current = events.filter((event) => inRange(event, currentStart, now));
  const previous = events.filter((event) => inRange(event, previousStart, currentStart));
  const currentActors = actorsFor(current, sessionUsers);
  const identifiedActors = Array.from(currentActors).filter((actor) => actor.startsWith("user:")).length;
  return {
    days,
    stages: buildStages(current, previous, sessionUsers),
    sourceBreakdown: buildBreakdown(current, "source", SOURCE_LABELS, sessionUsers),
    toolBreakdown: buildBreakdown(current, "tool", TOOL_LABELS, sessionUsers),
    identifiedActors,
    anonymousActors: currentActors.size - identifiedActors,
  };
}

export function buildAdminFunnelDashboard({
  events,
  payments,
  now = new Date(),
}: {
  events: FunnelReportEvent[];
  payments: FunnelReportPayment[];
  now?: Date;
}): AdminFunnelDashboard {
  const sessionUsers = buildSessionUserMap(events);
  const staleBefore = new Date(now.getTime() - DAY_MS);
  const stalePayments = payments.filter((payment) => payment.status === "PENDING" && payment.createdAt < staleBefore);
  return {
    generatedAt: now,
    windows: {
      7: buildWindow(7, events, now, sessionUsers),
      28: buildWindow(28, events, now, sessionUsers),
    },
    stalePendingOrders: stalePayments.length,
    stalePendingAmountVnd: stalePayments.reduce((sum, payment) => sum + payment.amountVnd, 0),
  };
}
