// A small floating placeholder pinned to the bottom-right corner. The student
// drags their 1:1 Zoom video window over this box so it sits alongside the now
// full-width lesson canvas — replacing the old full-height Zoom sidebar stage.
export default function ZoomPip() {
  return (
    <aside className="zoom-pip" aria-label="Zoom video area">
      <div className="zoom-pip-icon">🎥</div>
      <div className="zoom-pip-title">Place your Zoom window here</div>
      <div className="zoom-pip-sub">Drag your 1:1 video into this corner.</div>
    </aside>
  );
}
