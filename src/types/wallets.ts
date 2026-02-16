export type EIP6963ProviderInfo = {
  uuid: string;
  name: string;
  icon: string;
  rdns?: string;
  walletId?: string;
};

export type EIP1193RequestArguments = {
  method: string;
  params?: unknown[] | Record<string, unknown>;
};

export type EIP1193Provider = {
  request: (args: EIP1193RequestArguments) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

export type EIP6963ProviderDetail = {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
};

export type EIP6963AnnounceProviderEvent = CustomEvent<EIP6963ProviderDetail>;

export type WalletSource = "eip6963" | "window" | "provider-array";

export type WalletDescriptor = {
  id: string;
  source: WalletSource;
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
  detectedAt: number;
};
