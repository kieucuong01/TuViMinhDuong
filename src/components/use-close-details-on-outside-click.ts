"use client";

import { type RefObject, useEffect } from "react";

export function useCloseDetailsOnOutsideClick(detailsRef: RefObject<HTMLDetailsElement | null>) {
  useEffect(() => {
    function closeIfOutside(event: PointerEvent) {
      const details = detailsRef.current;
      if (!details?.open) return;

      const target = event.target;
      if (target instanceof Node && details.contains(target)) return;

      details.open = false;
    }

    function closeOnEscape(event: KeyboardEvent) {
      const details = detailsRef.current;
      if (event.key !== "Escape" || !details?.open) return;

      details.open = false;
      details.querySelector("summary")?.focus();
    }

    document.addEventListener("pointerdown", closeIfOutside, true);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeIfOutside, true);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [detailsRef]);
}
