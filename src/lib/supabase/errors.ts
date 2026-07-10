import type { PostgrestError } from '@supabase/supabase-js';

export type AppErrorCode =
  | 'duplicate_participant_name'
  | 'not_found'
  | 'connection_failed'
  | 'invalid_data'
  | 'permission_denied'
  | 'setup_required'
  | 'unknown';

export type AppError = {
  code: AppErrorCode;
  userMessage: string;
  technicalMessage?: string;
  technicalCode?: string;
};

function sanitizeTechnicalMessage(message?: string) {
  if (!message) return undefined;
  return message.replace(/Bearers+[A-Za-z0-9._-]+/g, 'Bearer [redacted]').replace(/apikey=([^&s]+)/g, 'apikey=[redacted]');
}

export function mapSupabaseError(error: PostgrestError | Error | null): AppError | null {
  if (!error) return null;

  const technicalCode = 'code' in error ? error.code : undefined;
  const technicalMessage = sanitizeTechnicalMessage(error.message);
  const message = error.message.toLowerCase();

  if (technicalCode === '23505' && message.includes('idx_participants_unique_name_per_table')) {
    return {
      code: 'duplicate_participant_name',
      userMessage: 'Ja existe uma pessoa com esse nome nesta mesa.',
      technicalCode,
      technicalMessage,
    };
  }

  if (technicalCode === 'PGRST202' || message.includes('create_table_with_consent') || message.includes('join_table_by_share_token') || message.includes('upsert_manual_item_with_participants') || message.includes('void_manual_item') || message.includes('confirm_receipt_scan_import')) {
    return {
      code: 'setup_required',
      userMessage: 'Uma rotina segura ainda precisa ser ativada no Supabase antes desta acao.',
      technicalCode,
      technicalMessage,
    };
  }

  if (technicalCode === 'PGRST116') {
    return {
      code: 'not_found',
      userMessage: 'Registro nao encontrado.',
      technicalCode,
      technicalMessage,
    };
  }

  if (technicalCode === '23514' || technicalCode === '23502' || technicalCode === '22P02' || technicalCode === '22023') {
    return {
      code: 'invalid_data',
      userMessage: 'Algum dado informado nao e valido.',
      technicalCode,
      technicalMessage,
    };
  }

  if (technicalCode === '42501' || message.includes('permission denied')) {
    return {
      code: 'permission_denied',
      userMessage: 'Voce nao tem permissao para realizar esta acao.',
      technicalCode,
      technicalMessage,
    };
  }

  if (message.includes('failed to fetch') || message.includes('network')) {
    return {
      code: 'connection_failed',
      userMessage: 'Nao foi possivel conectar ao servidor. Verifique sua conexao.',
      technicalCode,
      technicalMessage,
    };
  }

  if (technicalCode === 'P0002' || message.includes('not found')) {
    return {
      code: 'not_found',
      userMessage: 'Registro nao encontrado.',
      technicalCode,
      technicalMessage,
    };
  }

  return {
    code: 'unknown',
    userMessage: 'Algo deu errado. Tente novamente.',
    technicalCode,
    technicalMessage,
  };
}

export class AppServiceError extends Error {
  appError: AppError;

  constructor(appError: AppError) {
    super(appError.userMessage);
    this.name = 'AppServiceError';
    this.appError = appError;
  }
}

export function throwIfSupabaseError(error: PostgrestError | null) {
  const appError = mapSupabaseError(error);

  if (appError) {
    throw new AppServiceError(appError);
  }
}
