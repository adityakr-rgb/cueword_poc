"use client";
import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { fetchStoryContent } from "../lib/session";
import type { Story, StoryKey } from "../lib/types";

/**
 * Resolve the synced `story_key` to its full content from the DB. Re-fetches
 * whenever the key changes (e.g. the student opens a story mid-class — the new
 * key arrives via Realtime, this loads the matching content on both screens).
 *
 * Pass `null` when no story is open yet; the hook stays idle and returns null.
 * All state updates happen in async callbacks (never synchronously in the
 * effect body), matching the codebase's effect conventions.
 */
export function useStoryContent(storyKey: StoryKey | null): { story: Story | null } {
  const [story, setStory] = useState<Story | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!storyKey || !isSupabaseConfigured) {
      // Clear any previously-loaded story when the key goes away (e.g. class
      // ends). Deferred to a microtask so we don't setState synchronously.
      void Promise.resolve().then(() => {
        if (!cancelled) setStory(null);
      });
      return () => {
        cancelled = true;
      };
    }
    fetchStoryContent(storyKey)
      .then((s) => {
        if (!cancelled) setStory(s);
      })
      .catch(() => {
        if (!cancelled) setStory(null);
      });
    return () => {
      cancelled = true;
    };
  }, [storyKey]);

  return { story };
}
