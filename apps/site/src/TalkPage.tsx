import { Link, Navigate, useParams } from "react-router-dom";
import { talkBySlug } from "./talks/registry";

export function TalkPage() {
  const { slug = "" } = useParams();
  const talk = talkBySlug(slug);

  if (!talk) {
    return <Navigate to="/" replace />;
  }

  const Deck = talk.component;

  return (
    <div className="relative h-screen w-screen">
      <Link
        to="/"
        className="absolute left-3 top-3 z-50 px-2 py-1 text-xs text-muted no-underline opacity-40 transition hover:bg-surface hover:text-fg hover:opacity-100"
      >
        All talks
      </Link>
      <Deck />
    </div>
  );
}
