import {
  AGENT_RESOURCE_CACHE_CONTROL,
  buildAgentSiteResource,
} from "@/lib/agent-resources";

export const dynamic = "force-static";

export async function GET() {
  return Response.json(buildAgentSiteResource(), {
    headers: {
      "Cache-Control": AGENT_RESOURCE_CACHE_CONTROL,
    },
  });
}
