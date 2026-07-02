"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// Integra el widget hospedado de Fintoc (https://docs.fintoc.com). El nombre
// exacto del script/objeto global puede variar entre versiones de su SDK;
// conviene verificarlo contra la documentación vigente antes de conectar
// credenciales reales de producción.
declare global {
  interface Window {
    FintocWidget?: {
      open: (opts: { widgetToken: string; onSuccess: (linkToken: string) => void }) => void;
    };
  }
}

const SCRIPT_SRC = "https://js.fintoc.com/v1/";

function loadFintocScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.FintocWidget) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar el widget de Fintoc"));
    document.body.appendChild(script);
  });
}

export function FintocConnectButton({
  institution,
  label,
}: {
  institution: "BANCO_ESTADO" | "BANCO_DE_CHILE";
  label: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const response = await fetch("/api/integrations/fintoc/widget-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institution }),
      });
      const { widgetToken } = await response.json();

      await loadFintocScript();
      window.FintocWidget?.open({
        widgetToken,
        onSuccess: async (linkToken: string) => {
          await fetch("/api/integrations/fintoc/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ linkToken, institution }),
          });
          window.location.href = "/accounts";
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleConnect} disabled={loading} variant="secondary">
      {loading ? "Abriendo..." : label}
    </Button>
  );
}
