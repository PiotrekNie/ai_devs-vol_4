/**
 * Optional tracing callbacks for Observational Memory — no Langfuse imports.
 */

export type OmTokenUsage = {
  inputTokens?: number;
  outputTokens?: number;
};

export type OmObserverStartContext = {
  messagesSealed: number;
  pendingTokensRaw: number;
  threshold: number;
  generation: number;
};

export type OmObserverEndContext = OmObserverStartContext & {
  tailKept: number;
  observationLines: number;
  obsTokensRaw: number;
  obsTokensCalibrated: number;
  usage?: OmTokenUsage;
};

export type OmReflectorStartContext = {
  obsTokensBefore: number;
  threshold: number;
  targetTokens: number;
  generation: number;
};

export type OmReflectorEndContext = OmReflectorStartContext & {
  obsTokensAfter: number;
  compressionLevel: number;
  usage?: OmTokenUsage;
};

export type OmTracingCallbacks = {
  onObserverStart?(ctx: OmObserverStartContext): void | Promise<void>;
  onObserverEnd?(ctx: OmObserverEndContext): void | Promise<void>;
  onReflectorStart?(ctx: OmReflectorStartContext): void | Promise<void>;
  onReflectorEnd?(ctx: OmReflectorEndContext): void | Promise<void>;
};
