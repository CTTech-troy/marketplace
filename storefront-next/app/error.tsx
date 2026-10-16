"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="message-page"><p className="eyebrow">A SMALL INTERRUPTION</p><h1>We could not load this page.</h1><p>Please retry. If the issue continues, the catalogue service may be temporarily unavailable.</p><button type="button" onClick={reset} className="button">Try again</button></section>;
}