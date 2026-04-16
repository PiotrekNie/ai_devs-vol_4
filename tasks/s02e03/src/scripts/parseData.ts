import type { DataItem, FilteredData, ParsedData } from "../types";

export const parseData = async (data: string): Promise<ParsedData> => {
  const lines = data.split("\n");
  const parsedData = lines.map((line) => {
    const m = line.match(/^\[([^\]]+)\]\s+\[([A-Z]+)\]\s+(.*)$/);

    if (m) {
      const [, date, status, message] = m;

      return {
        date,
        status: status as "INFO" | "WARN" | "CRIT",
        message,
      };
    }
  }) as ParsedData;
  return parsedData;
};

export const filterParsedDataByStatus = (
  data: ParsedData,
  status: "INFO" | "WARN" | "CRIT",
): DataItem[] => {
  return data.filter((row) => row.status === status);
};

export const removeDuplicateLines = (data: ParsedData): ParsedData => {
  return data.filter(
    (line, index, self) =>
      self.findIndex(
        (t) =>
          t.date === line.date &&
          t.status === line.status &&
          t.message === line.message,
      ) === index,
  ) as ParsedData;
};

export const filterDataByStatus = async (
  data: ParsedData,
  status: "INFO" | "WARN" | "CRIT",
) => {
  return data.filter(
    (item) => item.status === status,
  ) as unknown as FilteredData;
};
