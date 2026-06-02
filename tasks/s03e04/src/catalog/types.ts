export type Item = {
  code: string;
  name: string;
  normalizedName: string;
};

export type City = {
  code: string;
  name: string;
};

export type CatalogIndex = {
  items: Item[];
  itemsByCode: Map<string, Item>;
  citiesByCode: Map<string, City>;
  cityCodesByItem: Map<string, Set<string>>;
};
