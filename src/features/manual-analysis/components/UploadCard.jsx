import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { UploadCloud, X } from 'lucide-react';
import { useUploadManualRecordingsMutation } from '@/services';

// Mirrors api/routers/manual_analysis.py (ALLOWED_EXTENSIONS, MANUAL_ANALYSIS_MAX_MB).
const ALLOWED = ['.mp3', '.wav', '.m4a', '.ogg', '.oga', '.webm', '.aac', '.amr', '.mp4'];
const MAX_MB = 25;

const inputCls =
  'w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 ' +
  'placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/60';

function checkFile(file) {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED.includes(ext) && !file.type.startsWith('audio/')) return 'not an audio file';
  if (file.size > MAX_MB * 1024 * 1024) return `larger than ${MAX_MB} MB`;
  return null;
}

export default function UploadCard() {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [upload, { isLoading }] = useUploadManualRecordingsMutation();

  const addFiles = (list) => {
    const next = [];
    for (const f of Array.from(list || [])) {
      const problem = checkFile(f);
      if (problem) toast.error(`${f.name}: ${problem}`);
      else next.push(f);
    }
    setFiles((prev) => [...prev, ...next]);
  };

  const submit = async () => {
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    if (agentName.trim()) fd.append('agent_name', agentName.trim());
    if (clientName.trim()) fd.append('client_name', clientName.trim());
    if (notes.trim()) fd.append('notes', notes.trim());
    try {
      const res = await upload(fd).unwrap();
      toast.success(`${res.created.length} recording(s) uploaded — click Analyse to score them`);
      (res.rejected || []).forEach((r) => toast.error(`${r.file}: ${r.reason}`));
      setFiles([]);
      setNotes('');
    } catch (e) {
      toast.error(e?.data?.detail?.message || e?.data?.detail || 'Upload failed');
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 md:p-5 space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center transition-smooth
          ${dragging ? 'border-sky-400 bg-sky-500/10' : 'border-white/15 hover:border-sky-400/50 hover:bg-white/[0.03]'}`}
      >
        <UploadCloud className="mx-auto h-8 w-8 text-sky-400" />
        <p className="mt-2 text-sm text-slate-200">Drop call recordings here, or click to choose</p>
        <p className="mt-1 text-xs text-slate-500">MP3, WAV, M4A, OGG, WEBM, AAC, AMR · up to {MAX_MB} MB each</p>
        <input
          ref={inputRef} type="file" multiple accept={`audio/*,${ALLOWED.join(',')}`} className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-1.5 text-sm">
              <span className="truncate text-slate-200">{f.name}</span>
              <span className="flex items-center gap-3 shrink-0 text-xs text-slate-500">
                {(f.size / 1024 / 1024).toFixed(1)} MB
                <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-400">
                  <X className="h-4 w-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <input className={inputCls} placeholder="Agent name (optional)" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
        <input className={inputCls} placeholder="Client name (optional)" value={clientName} onChange={(e) => setClientName(e.target.value)} />
        <input className={inputCls} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <p className="text-xs text-slate-500">
        Names are used to label the transcript as “Name (Agent)” / “Name (Client)”. They apply to every file in this upload.
      </p>

      <div className="flex justify-end">
        <button
          onClick={submit} disabled={!files.length || isLoading}
          className="rounded-lg border border-sky-500/40 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-200
            hover:bg-sky-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-smooth"
        >
          {isLoading ? 'Uploading…' : `Upload ${files.length || ''} recording${files.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
}
