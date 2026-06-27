import type { DataStore } from './store-interface';
import { googleSheetsStore } from './google-sheets-store';
import { localJsonStore } from './local-json-store';
import { withSanitizedReads } from './sanitized-data-store';

function hasGoogleSheetsRuntimeEnv() {
  return Boolean(process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
}

export function getDataStore(): DataStore {
  const shouldUseGoogleSheets = process.env.DATA_STORE === 'google_sheets' || (process.env.DATA_STORE !== 'local' && hasGoogleSheetsRuntimeEnv());
  const baseStore = shouldUseGoogleSheets ? googleSheetsStore : localJsonStore;
  return withSanitizedReads(baseStore);
}
