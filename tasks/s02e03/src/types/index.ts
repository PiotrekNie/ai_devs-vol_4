export interface DataItem {
  date: string;
  status: "INFO" | "WARN" | "CRIT";
  message: string;
}

export type ParsedData = DataItem[];

export type FilteredData = DataItem[] | null;

export type CategorizedData = DataItem & {
  category: "power_plant" | "non_power_plant";
  reasoning: string;
};
