import {
  AllergyOption,
  RateTypeOption,
  SelectionOption,
  SeverityOption,
} from "@/types/selection-option";
import { PaginationParams } from "@/types/pagination-params";

export const DIAGNOSIS_SEVERITY_ARRAY = ["Mild", "Moderate", "Severe"] as const;
export const ALLERGY_TYPE_ARRAY = [
  "Voedsel",
  "Medicijn",
  "Insect",
  "Latex",
  "Schimmel",
  "Huisdier",
  "Pollen",
  "Overig",
] as const;
export const RATE_TYPE_ARRAY = ["day", "minute", "hour", "week"] as const;

export const APPOINTMENT_TYPE_ARRAY = ["meeting", "other", "work"] as const;

export const APPOINTMENT_TYPE_OPTIONS: SelectionOption[] = [
  { label: "Selecteer Type", value: "" },
  { label: "Werk", value: "work" },
  { label: "Afspraak", value: "meeting" },
  { label: "Anders", value: "other" },
];

export const SOURCE_OPTIONS = [
  { label: "Selecteer Bron", value: "" },
  { label: "BRP", value: "BRP" },
];

export const EMERGENCY_RELATION_OPTIONS: SelectionOption[] = [
  { label: "Selecteer Relatie", value: "" },
  { label: "Vader", value: "Vader" },
  { label: "Moeder", value: "Moeder" },
  { label: "Broer/Zus", value: "Broer/Zus" },
  { label: "Ander familielid", value: "Ander familielid" },
  { label: "Niet verwant", value: "Niet verwant" },
];

export const EMERGENCY_DISTANCE_OPTIONS: SelectionOption[] = [
  { label: "Selecteer Afstand", value: "" },
  { label: "Primaire Relatie", value: "Primary Relationship" },
  { label: "Secundaire Relatie", value: "Secondary Relationship" },
];

export const ALLERGY_TYPE_OPTIONS: AllergyOption[] = [
  { label: "Selecteer Allergietype", value: "" },
  { label: "Voedsel", value: "Voedsel" },
  { label: "Medicijn", value: "Medicijn" },
  { label: "Insect", value: "Insect" },
  { label: "Latex", value: "Latex" },
  { label: "Schimmel", value: "Schimmel" },
  { label: "Huisdier", value: "Huisdier" },
  { label: "Pollen", value: "Pollen" },
  { label: "Overig", value: "Overig" },
];

export const CARE_TYPE_OPTIONS: RateTypeOption[] = [
  { label: "Selecteer Zorgtype", value: "" },
  { label: "Per uur", value: "hour" },
  { label: "Dagelijks", value: "day" },
  { label: "Per minuut", value: "minute" },
  { label: "Per week", value: "week" },
];

export const GENDER_OPTIONS: SelectionOption[] = [
  {
    label: "Standard",
    value: "standard",
  },
];

export const PLANS_OPTIONS: SelectionOption[] = [
  {
    label: "Standard",
    value: "standard",
  },
  {
    label: "Premium",
    value: "premium",
  },
  {
    label: "Vip",
    value: "vip",
  },
  {
    label: "None",
    value: "none",
  },
];

export const TOOL_MODE_OPTIONS: SelectionOption[] = [
  {
    label: "Cookies",
    value: "electron-cookies",
  },
  {
    label: "Electron (Login)",
    value: "electron-login",
  },
  {
    label: "Local Storage",
    value: "selenium-chrome-cookies",
  },
  {
    label: "Cloud/Web",
    value: "cloud",
  },
];

// TODO: this is assumed to be 10, it should come from the backend
export const PAGE_SIZE = 10;

export const DEFAULT_PAGINATION_PARAMS: PaginationParams = {
  page: 1,
  page_size: PAGE_SIZE,
};

export const BUTTON_CLASS_NAMES = {
  Primary: "bg-primary text-white",
  Secondary: "bg-secondary text-white",
  Danger: "bg-danger text-white",
  Success: "bg-success text-white",
  DarkBlue:"bg-[#190237] "
};