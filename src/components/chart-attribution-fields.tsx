"use client";

import { useEffect, useRef } from "react";

type AttributionFields = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  source: string;
  referrer: string;
  landing_path: string;
};

const EMPTY_FIELDS: AttributionFields = {
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_content: "",
  utm_term: "",
  source: "",
  referrer: "",
  landing_path: "",
};

const STORAGE_KEY = "lsth-chart-attribution";

function clean(value: string | null, max = 220) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function fieldsFromLocation() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: clean(params.get("utm_source"), 120),
    utm_medium: clean(params.get("utm_medium"), 120),
    utm_campaign: clean(params.get("utm_campaign"), 160),
    utm_content: clean(params.get("utm_content"), 160),
    utm_term: clean(params.get("utm_term"), 160),
    source: clean(params.get("source"), 120),
    referrer: clean(document.referrer, 500),
    landing_path: clean(`${window.location.pathname}${window.location.search}`, 500),
  };
}

function hasSignal(fields: AttributionFields) {
  return Boolean(fields.utm_source || fields.utm_medium || fields.source || fields.referrer || fields.landing_path);
}

export function ChartAttributionFields() {
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const current = fieldsFromLocation();
    let firstTouch = current;
    try {
      const stored = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "null") as AttributionFields | null;
      if (stored && hasSignal(stored)) firstTouch = { ...EMPTY_FIELDS, ...stored };
      else window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      firstTouch = current;
    }
    Object.entries(firstTouch).forEach(([name, value]) => {
      const input = inputs.current[name];
      if (input) input.value = value;
    });
  }, []);

  return (
    <>
      {Object.keys(EMPTY_FIELDS).map((name) => (
        <input
          key={name}
          ref={(element) => {
            inputs.current[name] = element;
          }}
          type="hidden"
          name={name}
          defaultValue=""
        />
      ))}
    </>
  );
}
