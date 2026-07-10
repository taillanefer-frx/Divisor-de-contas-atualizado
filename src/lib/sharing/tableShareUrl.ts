export type ShareTokenValidationResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

const shareTokenPattern = /^[a-f0-9]{48}$/i;

type BuildTableShareUrlOptions = {
  appUrl?: string | null;
  windowOrigin?: string | null;
};

export function validateShareToken(token: unknown): ShareTokenValidationResult {
  if (typeof token !== 'string') {
    return { ok: false, error: 'Token da mesa ausente.' };
  }

  const trimmedToken = token.trim();

  if (!trimmedToken) {
    return { ok: false, error: 'Token da mesa vazio.' };
  }

  if (!shareTokenPattern.test(trimmedToken)) {
    return { ok: false, error: 'Token da mesa invalido.' };
  }

  return { ok: true, token: trimmedToken };
}

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/+$/g, '');
}

export function getAppOrigin(options: BuildTableShareUrlOptions = {}) {
  const configuredUrl = options.appUrl ?? import.meta.env.VITE_APP_URL;

  if (configuredUrl && configuredUrl.trim()) {
    return normalizeOrigin(configuredUrl);
  }

  if (options.windowOrigin && options.windowOrigin.trim()) {
    return normalizeOrigin(options.windowOrigin);
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeOrigin(window.location.origin);
  }

  return '';
}

export function buildTablePath(shareToken: string) {
  const validation = validateShareToken(shareToken);
  if (!validation.ok) throw new Error(validation.error);
  return '/mesa/' + encodeURIComponent(validation.token);
}

export function buildTableShareUrl(shareToken: unknown, options: BuildTableShareUrlOptions = {}) {
  const validation = validateShareToken(shareToken);
  if (!validation.ok) throw new Error(validation.error);

  const origin = getAppOrigin(options);
  if (!origin) throw new Error('Origem do aplicativo indisponivel.');

  return origin + buildTablePath(validation.token);
}
