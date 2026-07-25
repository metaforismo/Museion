"use client";

import { useEffect } from "react";

/**
 * Strips `?completed=` from the URL after the course trail has read it once,
 * so a refresh — or a copied link — does not replay the arrival animation.
 * Native history.replaceState keeps Next's router state in sync without the
 * server round-trip a router.replace would cost, which would re-render the
 * trail mid-animation.
 */
export default function TrailArrivalCleanup() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("completed")) return;
    url.searchParams.delete("completed");
    window.history.replaceState(null, "", url.toString());
  }, []);
  return null;
}
