import { AllergyType } from "@/types/allergyType";
import { RateType } from "@/types/rate-type";
import { ReactNode } from "react";

export type GenericSelectionOption<L extends ReactNode, V> = {
  label: L;
  value: V;
};

export type SelectionOption = GenericSelectionOption<string, string>;

export type AllergyOption = SelectionOption & {
  value: AllergyType | "";
};

export type SeverityOption = SelectionOption & {
  value: "";
};

export type RateTypeOption = SelectionOption & {
  value: RateType | "";
};

export type ButtonOption = {
  label: ReactNode;
  value: string;
};

export type LinkOption = {
  label: ReactNode;
  href: string;
  getIsActive?: (pathname: string, href: string) => boolean;
};

export type ComboboxOption<TData> = GenericSelectionOption<ReactNode, TData>;
