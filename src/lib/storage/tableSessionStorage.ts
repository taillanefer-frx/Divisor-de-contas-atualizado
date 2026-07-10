const latestTableKey = 'divisor.latestTable.v1';
const entryProfilesKey = 'divisor.tableEntryProfiles.v1';

export type LocalTableEntryProfile = {
  shareToken: string;
  participantId: string;
  displayName: string;
  arrivalAt: string;
  updatedAt: string;
};

type EntryProfiles = Record<string, LocalTableEntryProfile>;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function rememberLatestTable(shareToken: string) {
  writeJson(latestTableKey, { shareToken, updatedAt: new Date().toISOString() });
}

export function getLatestTableShareToken() {
  return readJson<{ shareToken?: string } | null>(latestTableKey, null)?.shareToken ?? null;
}

export function getLocalTableEntryProfile(shareToken: string) {
  return readJson<EntryProfiles>(entryProfilesKey, {})[shareToken] ?? null;
}

export function saveLocalTableEntryProfile(profile: Omit<LocalTableEntryProfile, 'updatedAt'>) {
  const profiles = readJson<EntryProfiles>(entryProfilesKey, {});
  profiles[profile.shareToken] = { ...profile, updatedAt: new Date().toISOString() };
  writeJson(entryProfilesKey, profiles);
}

