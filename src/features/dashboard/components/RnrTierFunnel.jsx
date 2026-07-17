import React from "react"

import { useGetRnrTiersQuery } from "@/services"

/**
 * RNR Tiers funnel — mirrors LeadFunnel visually.
 *
 * STEP 1 (this commit): endpoint + card shell wired to the hook.
 * STEP 2 (after the real /rnrtiers response is confirmed): build the
 * funnel-stage rendering logic here (normalizeTiers + stages), matching
 * LeadFunnel's trapezoid clip-path layout.
 */
export function RnrTierFunnel() {
  const { data: RnrData, isLoading } = useGetRnrTiersQuery(undefined, {
    pollingInterval: 30000,
    skipPollingIfUnfocused: true,
  })

  const payload = RnrData?.data ?? {}
  const hasData = Array.isArray(payload)
    ? payload.length > 0
    : Object.keys(payload).length > 0

  return (
    <div className="p-2 border border-border rounded-lg bg-card/60 transition-smooth animate-fade-in-up">
      <div className="flex flex-col justify-between m-2 lg:mb-2">
        <div className="flex justify-between">
          <h3 className="text-xl font-semibold text-white">RNR Tiers</h3>
        </div>
        <p className="text-sm text-slate-500">
          Ring-no-response leads by tier
        </p>
      </div>

      {/* Funnel stages render here in STEP 2 (see normalizeTiers plan). */}
      <div className="relative flex flex-col items-center gap-0 mt-2 px-4 min-h-[8rem] justify-center">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : hasData ? (
          <p className="text-sm text-slate-500">
            Funnel visualization coming next (awaiting response mapping).
          </p>
        ) : (
          <p className="text-sm text-slate-500">No RNR tier data available</p>
        )}
      </div>
    </div>
  )
}
