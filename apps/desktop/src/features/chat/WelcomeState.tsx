import { Icon } from "../../components/shared/Icon";

const suggestions = ["Plan a focused workday", "Organize my project notes", "Explain how local mode protects privacy"];

export function WelcomeState({ onSuggestion }: { onSuggestion: (value: string) => void }) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-12 text-center" aria-labelledby="welcome-title">
      <div className="mb-5 grid size-12 place-items-center rounded-xl border border-line bg-panel shadow-sm"><Icon name="spark" className="size-6 text-accent" /></div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[.16em] text-accent">Local-first assistant</p>
      <h1 id="welcome-title" className="text-3xl font-semibold tracking-[-.035em] sm:text-4xl">How can I help today?</h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-ink-muted">Start a private conversation. Phase 2 responses are simulated locally while the assistant service is being connected.</p>
      <div className="mt-8 grid w-full gap-2 sm:grid-cols-3">
        {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => onSuggestion(suggestion)} className="rounded-xl border border-line bg-panel p-3 text-left text-sm leading-5 text-ink transition-colors hover:border-accent/50 hover:bg-panel-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{suggestion}</button>)}
      </div>
    </section>
  );
}
