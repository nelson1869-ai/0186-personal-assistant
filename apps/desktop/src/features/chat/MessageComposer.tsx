import { useEffect, useRef } from "react";
import { Button } from "../../components/shared/Button";
import { Icon } from "../../components/shared/Icon";

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isGenerating: boolean;
}

export function MessageComposer({ value, onChange, onSend, onStop, isGenerating }: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [value]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4 sm:px-8 sm:pb-6">
      <div className="flex items-end gap-2 rounded-2xl border border-line bg-panel p-2 shadow-[0_8px_28px_rgba(0,0,0,.06)] focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/15">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="Message 0186…"
          aria-label="Message 0186"
          className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-ink outline-none placeholder:text-ink-muted"
        />
        {isGenerating ? (
          <Button size="icon" variant="danger" onClick={onStop} aria-label="Stop generation"><Icon name="square" className="size-3.5" /></Button>
        ) : (
          <Button size="icon" variant="primary" onClick={onSend} disabled={!value.trim()} aria-label="Send message"><Icon name="send" className="size-4" /></Button>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-ink-muted">Enter to send · Shift+Enter for a new line · Mock responses stay local</p>
    </div>
  );
}
