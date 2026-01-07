export type SkildErrorCode =
  | 'INVALID_SOURCE'
  | 'NOT_A_DIRECTORY'
  | 'EMPTY_INSTALL_DIR'
  | 'ALREADY_INSTALLED'
  | 'SKILL_NOT_FOUND'
  | 'MISSING_METADATA'
  | 'INVALID_SKILL';

export class SkildError extends Error {
  readonly code: SkildErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: SkildErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

