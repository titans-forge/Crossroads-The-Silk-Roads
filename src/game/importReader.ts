import { parseCampaign, type CampaignImportResult } from './save';
import { MAX_SAVE_BYTES } from './validation';

/** Only the latest selection may offer a replacement for the active journey. */
export function createImportReader() {
  let revision = 0;
  return {
    cancel() { revision++; },
    async read(file: Pick<File, 'size' | 'text'>): Promise<CampaignImportResult | null> {
      const current = ++revision;
      try {
        if (file.size > MAX_SAVE_BYTES) return { ok: false, error: 'This file is too large. Choose a campaign smaller than 1 MB.' };
        const text = await file.text();
        if (current !== revision) return null;
        return parseCampaign(text);
      } catch {
        return current === revision ? { ok: false, error: 'This file could not be read. Your current journey is unchanged.' } : null;
      }
    },
  };
}
