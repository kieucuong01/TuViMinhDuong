import { generateTuViChart, type CalendarType, type Gender, type TuViChart } from "@/lib/chart";

export type BirthHourComparisonInput = {
  gender: Gender;
  calendarType: CalendarType;
  day: number;
  month: number;
  year: number;
  viewYear: number;
};

export type BirthHourComparisonField = {
  key: string;
  label: string;
  value?: string;
  values?: string[];
};

export type BirthHourCandidate = {
  birthHour: number;
  hourRange: string;
  hourBranch: string;
  canChiHour: string;
  menh: string;
  than: string;
  cuc: string;
  banMenh: string;
  boneWeight: string;
  mainStarPlacements: string[];
  highlights: string[];
  summary: string;
};

export type BirthHourComparisonResult = {
  stableFields: BirthHourComparisonField[];
  variableFields: BirthHourComparisonField[];
  candidates: BirthHourCandidate[];
};

const HOUR_OPTIONS = [
  { birthHour: 0, hourRange: "23h - 1h" },
  { birthHour: 2, hourRange: "1h - 3h" },
  { birthHour: 4, hourRange: "3h - 5h" },
  { birthHour: 6, hourRange: "5h - 7h" },
  { birthHour: 8, hourRange: "7h - 9h" },
  { birthHour: 10, hourRange: "9h - 11h" },
  { birthHour: 12, hourRange: "11h - 13h" },
  { birthHour: 14, hourRange: "13h - 15h" },
  { birthHour: 16, hourRange: "15h - 17h" },
  { birthHour: 18, hourRange: "17h - 19h" },
  { birthHour: 20, hourRange: "19h - 21h" },
  { birthHour: 22, hourRange: "21h - 23h" },
];

const FIELD_LABELS: Record<string, string> = {
  solarDate: "Ngày dương lịch",
  lunarDate: "Ngày âm lịch",
  canChiYear: "Can chi năm",
  banMenh: "Bản mệnh",
  menh: "Cung Mệnh",
  than: "Cung Thân",
  cuc: "Cục",
  canChiHour: "Can chi giờ",
  boneWeight: "Cân lượng",
  mainStarPlacements: "Vị trí chính tinh",
};

function assertValidInput(input: BirthHourComparisonInput) {
  if (input.gender !== "male" && input.gender !== "female") throw new Error("INVALID_GENDER");
  if (input.calendarType !== "solar" && input.calendarType !== "lunar") throw new Error("INVALID_CALENDAR_TYPE");
  if (!Number.isInteger(input.year) || input.year < 1900 || input.year > 2100) throw new Error("INVALID_BIRTH_YEAR");
  if (!Number.isInteger(input.viewYear) || input.viewYear < 1900 || input.viewYear > 2100) throw new Error("INVALID_VIEW_YEAR");
  if (!Number.isInteger(input.month) || input.month < 1 || input.month > 12) throw new Error("INVALID_BIRTH_DATE");
  if (!Number.isInteger(input.day) || input.day < 1 || input.day > 31) throw new Error("INVALID_BIRTH_DATE");

  if (input.calendarType === "solar") {
    const date = new Date(Date.UTC(input.year, input.month - 1, input.day));
    const valid =
      date.getUTCFullYear() === input.year &&
      date.getUTCMonth() === input.month - 1 &&
      date.getUTCDate() === input.day;
    if (!valid) throw new Error("INVALID_BIRTH_DATE");
  } else if (input.day > 30) {
    throw new Error("INVALID_BIRTH_DATE");
  }
}

function hourBranchFromCanChi(value: string) {
  return value.trim().split(/\s+/).at(-1) || value;
}

function lunarDateLabel(chart: TuViChart) {
  return `${chart.lunar.day}/${chart.lunar.month}/${chart.lunar.year}${chart.lunar.leap ? " nhuận" : ""}`;
}

function solarDateLabel(chart: TuViChart) {
  return `${chart.solar.day}/${chart.solar.month}/${chart.solar.year}`;
}

function mainStarPlacements(chart: TuViChart) {
  return chart.palaces.flatMap((palace) => palace.mainStars.map((star) => `${star}: ${palace.name} ${palace.branch}`));
}

function menhThanStars(chart: TuViChart) {
  const menh = chart.palaces.find((palace) => palace.isMenh);
  const than = chart.palaces.find((palace) => palace.isThan);
  return [
    ...(menh?.mainStars.slice(0, 2).map((star) => `${star} ở Mệnh`) || []),
    ...(than?.mainStars.slice(0, 2).map((star) => `${star} ở Thân`) || []),
  ];
}

function candidateFromChart(chart: TuViChart, hourRange: string): BirthHourCandidate {
  const placements = mainStarPlacements(chart);
  const highlights = menhThanStars(chart);
  return {
    birthHour: chart.input.birthHour,
    hourRange,
    hourBranch: hourBranchFromCanChi(chart.canChi.hour),
    canChiHour: chart.canChi.hour,
    menh: chart.menh,
    than: chart.than,
    cuc: chart.cuc,
    banMenh: chart.banMenh,
    boneWeight: chart.boneWeight.label,
    mainStarPlacements: placements,
    highlights,
    summary: `Mệnh ${chart.menh}, Thân ${chart.than}, ${chart.cuc}, cân lượng ${chart.boneWeight.label}.`,
  };
}

function fieldValueMap(chart: TuViChart) {
  return {
    solarDate: solarDateLabel(chart),
    lunarDate: lunarDateLabel(chart),
    canChiYear: chart.canChi.year,
    banMenh: chart.banMenh,
    menh: chart.menh,
    than: chart.than,
    cuc: chart.cuc,
    canChiHour: chart.canChi.hour,
    boneWeight: chart.boneWeight.label,
    mainStarPlacements: mainStarPlacements(chart).join(" | "),
  };
}

export function compareBirthHours(input: BirthHourComparisonInput): BirthHourComparisonResult {
  assertValidInput(input);

  const charts = HOUR_OPTIONS.map((option) => ({
    option,
    chart: generateTuViChart({
      ...input,
      fullName: "Người xem",
      birthHour: option.birthHour,
      birthMinute: 0,
      timezone: "Asia/Bangkok",
    }),
  }));
  const fieldMaps = charts.map(({ chart }) => fieldValueMap(chart));
  const keys = Object.keys(FIELD_LABELS) as (keyof ReturnType<typeof fieldValueMap>)[];
  const stableFields: BirthHourComparisonField[] = [];
  const variableFields: BirthHourComparisonField[] = [];

  keys.forEach((key) => {
    const values = fieldMaps.map((map) => map[key]);
    const uniqueValues = Array.from(new Set(values));
    if (uniqueValues.length === 1) {
      stableFields.push({ key, label: FIELD_LABELS[key], value: uniqueValues[0] });
      return;
    }
    variableFields.push({ key, label: FIELD_LABELS[key], values: uniqueValues });
  });

  return {
    stableFields,
    variableFields,
    candidates: charts.map(({ option, chart }) => candidateFromChart(chart, option.hourRange)),
  };
}
