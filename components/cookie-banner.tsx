"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

const CONSENT_KEY = "tsuky-cookie-consent";

type Consent = "accepted" | "refused";

function getConsent(): Consent | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(CONSENT_KEY) as Consent | null;
}

function setConsent(value: Consent) {
  localStorage.setItem(CONSENT_KEY, value);
}

/** Load GA script dynamically after consent */
function loadGA() {
  const id = process.env.NEXT_PUBLIC_GA_ID;

  if (!id || document.querySelector(`script[src*="googletagmanager"]`)) return;

  const script = document.createElement("script");

  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }
  gtag("js", new Date());
  gtag("config", id);
}

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

export function CookieBanner() {
  const t = useTranslations("cookies");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getConsent();

    if (consent === "accepted") {
      loadGA();
    } else if (consent === null) {
      setVisible(true);
    }
  }, []);

  function accept() {
    setConsent("accepted");
    loadGA();
    setVisible(false);
  }

  function refuse() {
    setConsent("refused");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-[fadeInUp_0.4s_ease-out]">
      <div className="glass rounded-2xl p-5 shadow-lg">
        <p className="text-sm text-text-brand leading-relaxed">
          {t.rich("message", {
            privacy: (chunks) => (
              <Link
                className="underline underline-offset-2 text-primary hover:text-primary-light transition-colors"
                href="/privacy"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>

        <div className="flex gap-2 mt-4">
          <button
            className="flex-1 py-2 px-4 text-xs font-semibold uppercase tracking-wide rounded-xl bg-primary text-white cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
            onClick={accept}
          >
            {t("accept")}
          </button>
          <button
            className="flex-1 py-2 px-4 text-xs font-semibold uppercase tracking-wide rounded-xl bg-transparent text-primary ring-1 ring-primary cursor-pointer transition-all hover:bg-primary hover:text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
            onClick={refuse}
          >
            {t("refuse")}
          </button>
        </div>
      </div>
    </div>
  );
}
