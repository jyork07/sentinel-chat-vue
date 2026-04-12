export default function TypingIndicator() {
  return (
    <div className="flex gap-3 max-w-2xl message-enter">
      <div className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center mt-1 glass glow-primary">
        <div className="h-2 w-2 rounded-full bg-primary orb-pulse" />
      </div>
      <div className="glass rounded-2xl px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
            style={{
              animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
