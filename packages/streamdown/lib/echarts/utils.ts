import type { EChartsOption } from "echarts";

let echartsPromise: Promise<typeof import("echarts")> | null = null;

export const loadECharts = async () => {
  if (!echartsPromise) {
    echartsPromise = import("echarts");
  }

  return echartsPromise;
};

export const parseEChartsOption = (option: string): EChartsOption => {
  const trimmed = option.trim();

  if (!trimmed) {
    throw new Error("ECharts option is empty");
  }

  try {
    return JSON.parse(trimmed) as EChartsOption;
  } catch (jsonError) {
    try {
      // Allow function values inside the configuration object
      // biome-ignore lint/security/noGlobalEval: Required to evaluate user-provided chart option with functions
      const parsed = new Function(`return (${trimmed});`)() as unknown;

      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("ECharts option must be an object");
      }

      return parsed as EChartsOption;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : jsonError instanceof Error
            ? jsonError.message
            : "Invalid ECharts option";
      throw new Error(message);
    }
  }
};

export const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  return response.blob();
};
