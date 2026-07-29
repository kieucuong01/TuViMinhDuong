import {
  AGENT_RESOURCE_CACHE_CONTROL,
  buildAgentPricingResource,
} from "@/lib/agent-resources";
import { getFeaturePrices, getOperationSettings } from "@/lib/data";
import { COIN_PACKAGES } from "@/lib/pricing";

export async function GET() {
  const [operationSettings, featurePrices] = await Promise.all([
    getOperationSettings(),
    getFeaturePrices(),
  ]);
  const commercialEnabled =
    operationSettings.paymentsEnabled
    && operationSettings.coinTopupEnabled
    && operationSettings.paidReadingsEnabled;

  return Response.json(
    buildAgentPricingResource({
      featurePrices,
      coinPackages: COIN_PACKAGES,
      commercialEnabled,
    }),
    {
      headers: {
        "Cache-Control": AGENT_RESOURCE_CACHE_CONTROL,
      },
    },
  );
}
