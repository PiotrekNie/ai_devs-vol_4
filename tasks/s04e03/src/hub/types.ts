/** Hub JSON body for domatowo verify calls. */
export type DomatowoAnswer = Record<string, unknown> & { action: string };

export type DomatowoHubResponse = {
  code?: number;
  message?: string;
  action_points_left?: number;
  action_points_used?: number;
  [key: string]: unknown;
};
