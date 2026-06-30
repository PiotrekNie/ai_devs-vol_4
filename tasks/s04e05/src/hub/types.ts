export type FoodwarehouseHubResponse = {
  code?: number;
  message?: string;
  tool?: string;
  action?: string;
  orders?: unknown[];
  missing?: Array<{
    city?: string;
    destination?: number;
    items?: Record<string, number>;
  }>;
  hash?: string;
  tables?: string[];
  rows?: unknown[];
  [key: string]: unknown;
};

/** Hub answer object — passed as `answer` in verify payload. */
export type FoodwarehouseAnswer = Record<string, unknown>;
