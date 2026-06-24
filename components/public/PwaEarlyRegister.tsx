import Script from "next/script";
import { PWA_SW_PATH } from "@/lib/pwa";

/** Register SW as early as possible — required for reliable iOS PWA + push. */
export function PwaEarlyRegister() {
  return (
    <Script id="pwa-early-register" strategy="beforeInteractive">
      {`
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('${PWA_SW_PATH}', { scope: '/', updateViaCache: 'none' }).catch(function () {});
  });
}
      `.trim()}
    </Script>
  );
}
