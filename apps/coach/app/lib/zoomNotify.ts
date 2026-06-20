/** Fire-and-forget: posts a message to the Zoom notify API route. */
export function notifyZoom(message: string): void {
  fetch("/api/zoom-notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  }).catch((e) => console.warn("[zoomNotify]", e));
}
