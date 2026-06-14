"use client";
import { useEffect } from "react";

/** Adds a class to <body> while mounted (the live views use the dark shell). */
export default function BodyClass({ name }: { name: string }) {
  useEffect(() => {
    document.body.classList.add(name);
    return () => document.body.classList.remove(name);
  }, [name]);
  return null;
}
