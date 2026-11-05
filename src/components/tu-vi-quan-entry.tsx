import TuViQuan from "@/components/tu-vi-quan";
import { getQuanGuest } from "@/lib/tu-vi-quan-guest";
import { quanEcosystemEnabled } from "@/lib/tu-vi-quan-ecosystem";
import { getFeaturePrice, getOperationSettings } from "@/lib/data/settings";
import { isPayOSEnabled } from "@/lib/env";
import { quanVoiceGameEnabled } from "@/lib/tu-vi-quan-encounter";
import { quanVoiceCapabilities } from "@/lib/tu-vi-quan-voice";

export default async function TuViQuanEntry() {
  const guest = await getQuanGuest();
  const ecosystemEnabled = quanEcosystemEnabled();
  const voiceEnabled = ecosystemEnabled && quanVoiceGameEnabled();
  const settings = ecosystemEnabled && !voiceEnabled && isPayOSEnabled() ? await getOperationSettings() : null;
  const readingPrice = settings?.paymentsEnabled && settings.paidReadingsEnabled ? (await getFeaturePrice("FULL")).priceCoins * 1000 : null;
  const bankImage = Boolean(process.env.TU_VI_QUAN_SUPPORT_QR_FILE?.trim());
  const qr = bankImage ? "/api/tu-vi-quan/support-qr" : process.env.TU_VI_QUAN_SUPPORT_QR?.trim();
  const recipient = process.env.TU_VI_QUAN_SUPPORT_RECIPIENT?.trim();
  const support = qr && recipient && (/^\/(?!\/)/.test(qr) || qr.startsWith("https://")) ? { qr, recipient, bankImage } : null;
  const voice = voiceEnabled ? await quanVoiceCapabilities() : null;
  const paymentsEnabled = process.env.TU_VI_QUAN_PAYMENTS_ENABLED === "true" && (!voiceEnabled || Boolean(voice?.tts && voice.stt));
  return <TuViQuan initialAlias={guest?.alias || ""} support={support} ecosystemEnabled={ecosystemEnabled} voiceEnabled={voiceEnabled} readingPrice={readingPrice} paymentsEnabled={paymentsEnabled} />;
}
