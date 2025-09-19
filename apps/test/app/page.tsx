import { Chat } from "./components/chat";

export const dynamic = "force-dynamic";

export default function Page() {
  // Use a static list at build time to avoid dynamic require issues in Turbopack.
  const fallbackModels = [
    { label: "gpt-4o-mini", value: "openai:gpt-4o-mini" },
    { label: "llama-3.1-8b-instruct", value: "groq:llama-3.1-8b-instruct" },
  ];

  return <Chat models={fallbackModels} />;
}
