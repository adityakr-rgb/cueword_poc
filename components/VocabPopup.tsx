"use client";

/** Shared vocab definition popup (tap a glowing word). */
export default function VocabPopup({
  word,
  def,
  onClose,
}: {
  word: string | null;
  def: string;
  onClose: () => void;
}) {
  if (!word) return null;
  return (
    <div
      className="vocab-popup"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="vocab-popup-card">
        <div className="vocab-popup-word">{word}</div>
        <div className="vocab-popup-def">{def}</div>
        <button className="btn-primary btn-small" onClick={onClose}>
          Got it 🧠
        </button>
      </div>
    </div>
  );
}
