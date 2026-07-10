export type CopyLinkResult = 'copied' | 'unsupported' | 'failed';
export type NativeShareResult = 'shared' | 'unsupported' | 'canceled' | 'failed';

type ClipboardNavigator = Pick<Navigator, 'clipboard'>;
type ShareNavigator = Pick<Navigator, 'share'>;

export function canUseClipboard(navigatorLike: ClipboardNavigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined) {
  return Boolean(navigatorLike?.clipboard?.writeText);
}

export async function copyTextToClipboard(text: string, navigatorLike: ClipboardNavigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined): Promise<CopyLinkResult> {
  if (!canUseClipboard(navigatorLike)) return 'unsupported';

  try {
    await navigatorLike?.clipboard?.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export function canUseNativeShare(navigatorLike: ShareNavigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined) {
  return Boolean(navigatorLike?.share);
}

export async function shareTableLink(payload: ShareData, navigatorLike: ShareNavigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined): Promise<NativeShareResult> {
  if (!canUseNativeShare(navigatorLike)) return 'unsupported';

  try {
    await navigatorLike?.share?.(payload);
    return 'shared';
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return 'canceled';
    return 'failed';
  }
}
