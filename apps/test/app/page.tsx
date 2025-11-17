import { gateway } from "@ai-sdk/gateway";
import { Chat } from "./components/chat";

const FALLBACK_MODELS = [
  { label: "gpt-4o-mini", value: "gpt-4o-mini" },
  { label: "gpt-4.1-mini", value: "gpt-4.1-mini" },
  { label: "o3-mini", value: "o3-mini" },
];

export default async function Page() {
  let list = FALLBACK_MODELS;

  try {
    const { models } = await gateway.getAvailableModels();
    const filteredModels = models
      .filter((model) => !model.name.includes("embed"))
      .map((model) => ({
        label: model.name,
        value: model.id,
      }));

    if (filteredModels.length) {
      list = filteredModels;
    }
  } catch (error) {
    console.warn(
      "Falling back to default models because the AI Gateway is unavailable:",
      error instanceof Error ? error.message : String(error)
    );
  }

  return <Chat models={list} />;
}
