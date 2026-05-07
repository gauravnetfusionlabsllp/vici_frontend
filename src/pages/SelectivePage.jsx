import TotalDialsToday from '@/shared/components/TotalDialsToday';
import { AgentsTable } from '@/features/dashboard/components/AgentsTable';

export default function SelectivePage() {
  return (
    <div className="flex flex-col gap-4 items-center h-[calc(100vh-6rem)] stagger-children">
      <div className="w-full max-w-7xl">
        <TotalDialsToday />
      </div>

      <div className="w-full max-w-7xl h-full">
        <AgentsTable />
      </div>
    </div>
  );
}
