import { memo } from 'react';
import { Trash2 } from 'lucide-react';

const DeleteCellRenderer = memo((props) => {
  const { onDeleteLead, deletingId } = props.context || {};
  const phone      = props.data?.phone_number;
  const isDeleting = deletingId === phone;

  return (
    <button
      onClick={() => onDeleteLead(props.data)}
      disabled={isDeleting}
      className="px-2 py-1 rounded flex items-center gap-1 text-xs
        bg-rose-600/20 text-rose-300 hover:opacity-80
        disabled:opacity-50 disabled:cursor-not-allowed"
      title="Delete lead"
    >
      <Trash2 size={14} />
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
});

DeleteCellRenderer.displayName = 'DeleteCellRenderer';
export default DeleteCellRenderer;
