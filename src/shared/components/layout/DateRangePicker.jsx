import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { selectDateRange, setDateRange } from "@/features/dashboard/slices/dateFilterSlice";
import { dashboardApi } from "@/services";

function toYMD(date) {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromYMD(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/**
 * Global From/To filter. Writes to `dateFilterSlice` and invalidates the
 * DATE_FILTERED tag so every date-scoped query refetches.
 */
export default function DateRangePicker({ inputWidth = "w-24", className = "" }) {
  const dispatch = useDispatch();
  const dateRange = useSelector(selectDateRange);
  const today = useMemo(() => new Date(), []);

  // The store is the single source of truth — every change dispatches
  // immediately, so there's no local mirror to keep in sync.
  const startDate = useMemo(() => fromYMD(dateRange.from), [dateRange.from]);
  const endDate = useMemo(() => fromYMD(dateRange.to), [dateRange.to]);

  const applyDateRange = useCallback(
    (s, e) => {
      dispatch(setDateRange({ from: toYMD(s), to: toYMD(e) }));
      dispatch(dashboardApi.util.invalidateTags(["DATE_FILTERED"]));
    },
    [dispatch]
  );

  const inputClass = `bg-input border border-border text-foreground text-sm rounded px-2 py-1 ${inputWidth}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground">From:</span>
      <DatePicker
        selected={startDate}
        onChange={(date) => {
          // Clear an end date that now precedes the new start.
          const fixedEnd = endDate && date && endDate < date ? null : endDate;
          applyDateRange(date, fixedEnd);
        }}
        selectsStart
        startDate={startDate}
        endDate={endDate}
        maxDate={endDate || today}
        className={inputClass}
        popperClassName="z-50 dark-datepicker"
      />

      <span className="text-sm text-muted-foreground">To:</span>
      <DatePicker
        selected={endDate}
        onChange={(date) => applyDateRange(startDate, date)}
        selectsEnd
        startDate={startDate}
        endDate={endDate}
        minDate={startDate}
        maxDate={today}
        popperPlacement="bottom-start"
        popperClassName="z-50 dark-datepicker"
        className={inputClass}
      />
    </div>
  );
}
