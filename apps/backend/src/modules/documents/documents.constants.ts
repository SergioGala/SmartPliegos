export const ALLOWED_MIME_TYPES = new Set<string>([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'image/png',
  'image/jpeg',
  'text/plain',
]);

/** Cuota por usuario (bytes). Integrable con PLAN_LIMITS en el futuro. */
export const DEFAULT_USER_QUOTA_BYTES = Number(
  process.env.DOCUMENTS_MAX_BYTES_PER_USER ?? 104_857_600, // 100 MB
);

export const MAX_UPLOAD_BYTES = Number(process.env.MAX_FILE_SIZE ?? 5_242_880); // 5 MB