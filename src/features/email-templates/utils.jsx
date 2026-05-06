import { File, Image, FileText } from 'lucide-react';

export function getFileIcon(att) {
  if (!att) return <File className="w-4 h-4 text-slate-400" />;
  const type = att.file_type ?? '';
  const name = att.original_name ?? '';
  const ext  = name.split('.').pop()?.toLowerCase();

  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext))
    return <Image className="w-4 h-4 text-sky-400" />;
  if (type === 'application/pdf' || ext === 'pdf')
    return <FileText className="w-4 h-4 text-rose-400" />;
  if (type.includes('spreadsheet') || type.includes('excel') || ['xlsx', 'xls', 'csv'].includes(ext))
    return <FileText className="w-4 h-4 text-emerald-400" />;
  return <File className="w-4 h-4 text-slate-400" />;
}

export const inputCls =
  'w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 ' +
  'placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition';
