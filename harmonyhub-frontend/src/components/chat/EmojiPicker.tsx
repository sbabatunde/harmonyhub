import { useState } from "react";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

type Category = {
  id: string;
  label: string;
  emoji: string;
  items: { char: string; name: string }[];
};

const CATEGORIES: Category[] = [
  {
    id: "smileys",
    label: "Smileys",
    emoji: "😀",
    items: [
      { char: "😀", name: "grinning" },
      { char: "😃", name: "smiley" },
      { char: "😄", name: "smile" },
      { char: "😁", name: "grin" },
      { char: "😆", name: "laughing" },
      { char: "😅", name: "sweat smile" },
      { char: "😂", name: "joy" },
      { char: "🤣", name: "rofl" },
      { char: "😊", name: "blush" },
      { char: "😇", name: "innocent" },
      { char: "🙂", name: "slight smile" },
      { char: "🙃", name: "upside down" },
      { char: "😉", name: "wink" },
      { char: "😌", name: "relieved" },
      { char: "😍", name: "heart eyes" },
      { char: "🥰", name: "love" },
      { char: "😘", name: "kiss" },
      { char: "😗", name: "kissing" },
      { char: "😙", name: "kiss smile" },
      { char: "😚", name: "kiss closed eyes" },
      { char: "😋", name: "yum" },
      { char: "😛", name: "tongue" },
      { char: "😝", name: "squint tongue" },
      { char: "😜", name: "wink tongue" },
      { char: "🤪", name: "zany" },
      { char: "🤨", name: "raised eyebrow" },
      { char: "🧐", name: "monocle" },
      { char: "🤓", name: "nerd" },
      { char: "😎", name: "cool" },
      { char: "🤩", name: "star eyes" },
      { char: "🥳", name: "party" },
      { char: "😏", name: "smirk" },
      { char: "😒", name: "unamused" },
      { char: "😞", name: "disappointed" },
      { char: "😔", name: "pensive" },
      { char: "😟", name: "worried" },
      { char: "😕", name: "confused" },
      { char: "🙁", name: "slight frown" },
      { char: "😣", name: "persevere" },
      { char: "😖", name: "confounded" },
      { char: "😫", name: "tired" },
      { char: "😩", name: "weary" },
      { char: "🥺", name: "pleading" },
      { char: "😢", name: "cry" },
      { char: "😭", name: "sob" },
      { char: "😤", name: "triumph" },
      { char: "😠", name: "angry" },
      { char: "😡", name: "rage" },
      { char: "🤯", name: "explode" },
      { char: "😳", name: "flushed" },
      { char: "🥵", name: "hot" },
      { char: "🥶", name: "cold" },
      { char: "😱", name: "scream" },
      { char: "😨", name: "fearful" },
      { char: "😰", name: "anxious" },
      { char: "😥", name: "sad relieved" },
      { char: "😓", name: "sweat" },
      { char: "🤗", name: "hug" },
      { char: "🤔", name: "thinking" },
      { char: "🤭", name: "hand over mouth" },
      { char: "🤫", name: "shush" },
      { char: "🤥", name: "liar" },
      { char: "😶", name: "no mouth" },
      { char: "😐", name: "neutral" },
      { char: "😑", name: "expressionless" },
      { char: "😬", name: "grimace" },
      { char: "🙄", name: "eye roll" },
      { char: "😯", name: "hushed" },
      { char: "😦", name: "frowning" },
      { char: "😧", name: "anguished" },
      { char: "😮", name: "open mouth" },
      { char: "😲", name: "astonished" },
      { char: "🥱", name: "yawn" },
      { char: "😴", name: "sleeping" },
      { char: "🤤", name: "drool" },
      { char: "😪", name: "sleepy" },
      { char: "😵", name: "dizzy" },
      { char: "🤐", name: "zipper" },
      { char: "🥴", name: "woozy" },
      { char: "🤢", name: "nauseated" },
      { char: "🤮", name: "vomit" },
      { char: "🤧", name: "sneeze" },
      { char: "😷", name: "mask" },
      { char: "🤒", name: "thermometer" },
      { char: "🤕", name: "bandage" },
    ],
  },
  {
    id: "gestures",
    label: "Gestures",
    emoji: "👍",
    items: [
      { char: "👍", name: "thumbs up" },
      { char: "👎", name: "thumbs down" },
      { char: "👌", name: "ok" },
      { char: "✌️", name: "peace" },
      { char: "🤞", name: "crossed fingers" },
      { char: "🤟", name: "love you" },
      { char: "🤘", name: "rock" },
      { char: "🤙", name: "call me" },
      { char: "👈", name: "point left" },
      { char: "👉", name: "point right" },
      { char: "👆", name: "point up" },
      { char: "👇", name: "point down" },
      { char: "☝️", name: "index up" },
      { char: "✋", name: "hand" },
      { char: "🤚", name: "raised back" },
      { char: "🖐️", name: "splayed" },
      { char: "🖖", name: "vulcan" },
      { char: "👋", name: "wave" },
      { char: "🤝", name: "handshake" },
      { char: "🙏", name: "pray" },
      { char: "✍️", name: "writing" },
      { char: "💪", name: "muscle" },
      { char: "👏", name: "clap" },
      { char: "🙌", name: "raise hands" },
      { char: "👐", name: "open hands" },
      { char: "🤲", name: "palms up" },
      { char: "🤜", name: "fist right" },
      { char: "🤛", name: "fist left" },
      { char: "✊", name: "fist" },
      { char: "👊", name: "punch" },
      { char: "🫶", name: "heart hands" },
    ],
  },
  {
    id: "hearts",
    label: "Hearts",
    emoji: "❤️",
    items: [
      { char: "❤️", name: "red heart" },
      { char: "🧡", name: "orange heart" },
      { char: "💛", name: "yellow heart" },
      { char: "💚", name: "green heart" },
      { char: "💙", name: "blue heart" },
      { char: "💜", name: "purple heart" },
      { char: "🖤", name: "black heart" },
      { char: "🤍", name: "white heart" },
      { char: "🤎", name: "brown heart" },
      { char: "💔", name: "broken heart" },
      { char: "❣️", name: "heart exclamation" },
      { char: "💕", name: "two hearts" },
      { char: "💞", name: "revolving hearts" },
      { char: "💓", name: "beating heart" },
      { char: "💗", name: "growing heart" },
      { char: "💖", name: "sparkling heart" },
      { char: "💘", name: "cupid" },
      { char: "💝", name: "gift heart" },
      { char: "💟", name: "heart decoration" },
    ],
  },
  {
    id: "music",
    label: "Music",
    emoji: "🎵",
    items: [
      { char: "🎵", name: "note" },
      { char: "🎶", name: "notes" },
      { char: "🎤", name: "microphone" },
      { char: "🎧", name: "headphones" },
      { char: "🎼", name: "score" },
      { char: "🎹", name: "piano" },
      { char: "🥁", name: "drum" },
      { char: "🎸", name: "guitar" },
      { char: "🎺", name: "trumpet" },
      { char: "🎷", name: "sax" },
      { char: "🎻", name: "violin" },
      { char: "🪕", name: "banjo" },
      { char: "🪗", name: "accordion" },
      { char: "🔔", name: "bell" },
      { char: "🎙️", name: "studio mic" },
      { char: "🎚️", name: "level slider" },
      { char: "🎛️", name: "control knobs" },
    ],
  },
  {
    id: "sparkles",
    label: "Sparkles",
    emoji: "✨",
    items: [
      { char: "✨", name: "sparkles" },
      { char: "⭐", name: "star" },
      { char: "🌟", name: "glowing star" },
      { char: "💫", name: "dizzy" },
      { char: "⚡", name: "zap" },
      { char: "🔥", name: "fire" },
      { char: "🎉", name: "party popper" },
      { char: "🎊", name: "confetti" },
      { char: "🎈", name: "balloon" },
      { char: "🎁", name: "gift" },
      { char: "🏆", name: "trophy" },
      { char: "🥇", name: "gold" },
      { char: "💯", name: "100" },
      { char: "✅", name: "check" },
      { char: "❌", name: "x" },
      { char: "❗", name: "exclamation" },
      { char: "❓", name: "question" },
      { char: "💡", name: "idea" },
    ],
  },
  {
    id: "food",
    label: "Food",
    emoji: "🍕",
    items: [
      { char: "🍕", name: "pizza" },
      { char: "🍔", name: "burger" },
      { char: "🍟", name: "fries" },
      { char: "🌭", name: "hot dog" },
      { char: "🍿", name: "popcorn" },
      { char: "🍩", name: "donut" },
      { char: "🍪", name: "cookie" },
      { char: "🎂", name: "cake" },
      { char: "🍰", name: "cake slice" },
      { char: "☕", name: "coffee" },
      { char: "🍵", name: "tea" },
      { char: "🍺", name: "beer" },
      { char: "🍷", name: "wine" },
      { char: "🍎", name: "apple" },
      { char: "🍇", name: "grapes" },
      { char: "🍓", name: "strawberry" },
    ],
  },
];

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [query, setQuery] = useState("");

  const filteredItems = (() => {
    if (!query.trim()) {
      return CATEGORIES.find((c) => c.id === activeCategory)?.items ?? [];
    }
    const q = query.toLowerCase();
    return CATEGORIES.flatMap((c) => c.items).filter((i) => i.name.includes(q));
  })();

  return (
    <div className="absolute bottom-full mb-2 right-0 z-30 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-loft-plum-100 bg-white shadow-2xl animate-[fadeIn_120ms_ease-out]">
      {/* Header */}
      <div className="p-2 border-b border-loft-plum-100">
        <div className="relative">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-loft-plum-400"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emoji…"
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-loft-plum-200 focus:outline-none focus:ring-1 focus:ring-loft-plum-400"
            autoFocus
          />
        </div>
      </div>

      {/* Category tabs */}
      {!query && (
        <div className="flex items-center border-b border-loft-plum-100 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategory(c.id)}
              title={c.label}
              className={`shrink-0 h-10 w-10 flex items-center justify-center text-lg transition-colors ${
                activeCategory === c.id
                  ? "bg-loft-plum-50 border-b-2 border-loft-plum-600"
                  : "hover:bg-loft-plum-50 border-b-2 border-transparent"
              }`}
            >
              {c.emoji}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-9 gap-0.5 p-2 max-h-64 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <p className="col-span-9 py-6 text-center text-xs text-loft-plum-500">
            No emoji found.
          </p>
        ) : (
          filteredItems.map((item) => (
            <button
              key={item.char}
              type="button"
              onClick={() => {
                onSelect(item.char);
                onClose();
              }}
              title={item.name}
              className="h-9 w-9 rounded-lg hover:bg-loft-plum-50 flex items-center justify-center text-xl transition-colors"
            >
              {item.char}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
