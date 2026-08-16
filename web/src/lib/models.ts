export interface ChatModel {
  id: string;
  providerID: string;
  modelID: string;
  name: string;
  provider: string;
  free: boolean;
}

export const MODELS: ChatModel[] = [
  {
    id: "opencode/deepseek-v4-flash-free",
    providerID: "opencode",
    modelID: "deepseek-v4-flash-free",
    name: "DeepSeek V4 Flash Free",
    provider: "Zen",
    free: true,
  },
  {
    id: "opencode/hy3-free",
    providerID: "opencode",
    modelID: "hy3-free",
    name: "Hy3 Free",
    provider: "Zen",
    free: true,
  },
  {
    id: "opencode/nemotron-3.5-lightning-free",
    providerID: "opencode",
    modelID: "nemotron-3.5-lightning-free",
    name: "Nemotron 3.5 Lightning Free",
    provider: "Zen",
    free: true,
  },
  {
    id: "opencode-go/mimo-v2.5",
    providerID: "opencode-go",
    modelID: "mimo-v2.5",
    name: "MiMo V2.5",
    provider: "Go",
    free: false,
  },
];

export const DEFAULT_MODEL = MODELS[0];