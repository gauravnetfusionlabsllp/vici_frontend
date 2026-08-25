import { Download, Loader2 } from 'lucide-react';

import { useDownloadRecordingMutation } from '@/services';
import { useToast } from '@/shared/hooks/useToast';

import RecordingPlayer from './RecordingPlayer';

// Strips characters that aren't safe in a filename, collapsing runs to a single underscore.
function fileSafe(value) {
  return String(value ?? '').trim().replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '');
}

// Saves a download from an object-URL string under `fileName` with no page navigation or flash (a
// blob object URL is same-origin, so the browser honors the `download` filename), then releases it.
function saveObjectUrl(objectUrl, fileName) {
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

/**
 * Grid cell for one call recording: inline player + download button.
 *
 * Shared by the hot-leads grid and the lead-management grid — the two carry the phone and
 * agent under different keys, so the caller passes them in rather than this reading the row.
 */
export default function RecordingCell({ link, filename, lengthSec, agentName, phone }) {
  const { error: toastError } = useToast();
  const [triggerDownload, { isLoading }] = useDownloadRecordingMutation();

  // The raw recording link is cross-origin (CORS blocks fetch), so we pull the file through our own
  // reporting proxy — which carries the Bearer token and is same-host (no CORS) — then save it as
  // <agent>_<phone>.mp3. The mutation returns a ready-made object-URL string.
  const handleDownload = async () => {
    if (!link || isLoading) return;
    try {
      const objectUrl = await triggerDownload({
        recordingLink: link,
        agentName,
        phone,
      }).unwrap();
      saveObjectUrl(objectUrl, `${fileSafe(agentName) || 'recording'}_${fileSafe(phone)}.mp3`);
    } catch {
      toastError('Could not download the recording. Please try again.');
    }
  };

  if (!link) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className="flex items-center gap-2 w-full">
      <RecordingPlayer src={link} title={filename || 'Call recording'} lengthSec={lengthSec} />
      <button
        type="button"
        onClick={handleDownload}
        disabled={isLoading}
        className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth shrink-0 disabled:opacity-50"
        title="Download recording"
      >
        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
