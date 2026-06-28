export const SNAPSHOT_SCHEMA_VERSION = 1;

export const RETENTION_DAYS_OPTIONS = [30, 45, 60] as const;
export type RetentionDays = (typeof RETENTION_DAYS_OPTIONS)[number];
export const DEFAULT_RETENTION_DAYS: RetentionDays = 30;

export const DEFAULT_SORT_BY = 'createdAt';
export const DEFAULT_SORT_DIR = 'desc';
