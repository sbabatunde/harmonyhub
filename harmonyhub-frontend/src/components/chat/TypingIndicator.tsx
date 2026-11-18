interface TypingIndicatorProps {
  name?: string;
}

export function TypingIndicator({ name }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-loft-plum-500">
      <span className="font-medium text-loft-plum-700">
        {name ?? "Someone"}
      </span>
      <span>is typing</span>
      <span className="flex items-center gap-1">
        <span
          className="h-1.5 w-1.5 rounded-full bg-loft-plum-400 animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-loft-plum-400 animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-loft-plum-400 animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </span>
    </div>
  );
}
