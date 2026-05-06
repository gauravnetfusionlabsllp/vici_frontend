import { memo } from 'react';
import { Phone } from 'lucide-react';

const CallCellRenderer = memo((props) => {
  const number = props.data?.phone_number;
  const { activeNumber, handleRowCall } = props.context || {};
  const isActive   = activeNumber === number;
  const isDisabled = !!activeNumber && !isActive;

  return (
    <button
      disabled={isDisabled}
      onClick={() => handleRowCall(number)}
      className={`px-2 py-1 rounded flex items-center gap-1 text-xs
        ${isActive ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'}
        ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80'}
      `}
    >
      <Phone size={14} />
      {isActive ? 'Disconnect' : 'Call'}
    </button>
  );
});

CallCellRenderer.displayName = 'CallCellRenderer';
export default CallCellRenderer;
