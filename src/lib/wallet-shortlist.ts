export type WalletShortcut = {
  id: string;
  label: string;
  shortLabel: string;
  aliases: string[];
};

export const MOBILE_WALLET_SHORTLIST: WalletShortcut[] = [
  {
    id: "metamask",
    label: "metamask",
    shortLabel: "mm",
    aliases: ["metamask", "io.metamask"],
  },
  {
    id: "base",
    label: "base",
    shortLabel: "bs",
    aliases: ["base", "coinbase", "com.coinbase.wallet"],
  },
  {
    id: "rabby",
    label: "rabby",
    shortLabel: "rb",
    aliases: ["rabby", "io.rabby"],
  },
  {
    id: "rainbow",
    label: "rainbow",
    shortLabel: "rbw",
    aliases: ["rainbow", "me.rainbow"],
  },
  {
    id: "phantom",
    label: "phantom",
    shortLabel: "ph",
    aliases: ["phantom", "app.phantom"],
  },
];

function normalize(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  return value.trim().toLowerCase();
}

export function isShortcutInstalled(options: {
  shortcut: WalletShortcut;
  walletName: string | null | undefined;
  walletId: string | null | undefined;
  walletRdns: string | null | undefined;
}) {
  const haystack = [
    normalize(options.walletName),
    normalize(options.walletId),
    normalize(options.walletRdns),
  ].filter(Boolean);

  if (haystack.length === 0) {
    return false;
  }

  return options.shortcut.aliases.some((alias) => {
    const needle = normalize(alias);
    return haystack.some((item) => item.includes(needle));
  });
}
