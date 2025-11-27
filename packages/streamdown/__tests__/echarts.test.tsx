import { fireEvent, render, waitFor } from "@testing-library/react";
import { act } from "react";
import type { ReactElement } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { StreamdownContext } from "../index";
import { ECharts } from "../lib/echarts";
import { EChartsDownloadDropdown } from "../lib/echarts/download-button";
import { EChartsFullscreenButton } from "../lib/echarts/fullscreen-button";

let clientWidth = 800;
let clientHeight = 600;

const { saveMock } = vi.hoisted(() => ({
  saveMock: vi.fn(),
}));

const { chartMock, initMock, loadEChartsMock } = vi.hoisted(() => {
  const chart = {
    dispose: vi.fn(),
    getDataURL: vi.fn().mockReturnValue("data:image/svg+xml,<svg></svg>"),
    resize: vi.fn(),
    setOption: vi.fn(),
  };
  const init = vi.fn(() => chart);

  return {
    chartMock: chart,
    initMock: init,
    loadEChartsMock: vi.fn().mockResolvedValue({ init }),
  };
});

vi.mock("echarts", () => ({
  init: initMock,
}));

vi.mock("../lib/utils", async () => {
  const actual =
    await vi.importActual<typeof import("../lib/utils")>("../lib/utils");
  return { ...actual, save: saveMock };
});

const { blobMock } = vi.hoisted(() => ({
  blobMock: new Blob(["image"], { type: "image/png" }),
}));

vi.mock("../lib/echarts/utils", () => ({
  __esModule: true,
  parseEChartsOption: (option: string) => {
    const trimmed = option.trim();
    if (!trimmed) {
      throw new Error("ECharts option is empty");
    }
    try {
      return JSON.parse(trimmed);
    } catch {
      // biome-ignore lint/security/noGlobalEval: test helper to support function parsing
      return new Function(`return (${trimmed});`)();
    }
  },
  loadECharts: loadEChartsMock,
  dataUrlToBlob: vi.fn().mockResolvedValue(blobMock),
}));

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get() {
      return clientWidth;
    },
  });

  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get() {
      return clientHeight;
    },
  });

  // @ts-expect-error - JSDOM doesn't include ResizeObserver by default
  global.ResizeObserver = class {
    disconnect() {}
    observe() {}
  };
});

beforeEach(() => {
  initMock.mockClear();
  chartMock.setOption.mockClear();
  chartMock.resize.mockClear();
  chartMock.dispose.mockClear();
  chartMock.getDataURL.mockClear();
  saveMock.mockClear();
  loadEChartsMock.mockClear();
  document.body.style.overflow = "";
  clientWidth = 800;
  clientHeight = 600;
});

describe("ECharts", () => {
  const defaultContext = {
    shikiTheme: ["github-light", "github-dark"] as [string, string],
    controls: true,
    isAnimating: false,
    mode: "streaming" as const,
  };

  const renderWithContext = (ui: ReactElement) =>
    render(
      <StreamdownContext.Provider value={defaultContext}>
        {ui}
      </StreamdownContext.Provider>
    );

  it("renders and initializes chart", async () => {
    let container!: HTMLElement;

    await act(async () => {
      const result = renderWithContext(
        <ECharts option='{"series":[],"xAxis":{}}' />
      );
      container = result.container;
    });

    const { loadECharts } = await import("../lib/echarts/utils");
    expect(loadECharts).toBe(loadEChartsMock);

    await waitFor(() => {
      expect(loadEChartsMock).toHaveBeenCalled();
      expect(initMock).toHaveBeenCalled();
      expect(chartMock.setOption).toHaveBeenCalled();
    });

    const chartContainer = container.querySelector(
      '[aria-label="ECharts chart"]'
    );
    expect(chartContainer).toBeTruthy();
  });

  it("waits for container dimensions before initializing chart", async () => {
    clientWidth = 0;
    clientHeight = 0;

    await act(async () => {
      renderWithContext(<ECharts option='{"series":[{}]}' />);
    });

    expect(loadEChartsMock).not.toHaveBeenCalled();

    clientWidth = 640;
    clientHeight = 480;

    await act(async () => {
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      expect(loadEChartsMock).toHaveBeenCalledTimes(1);
      expect(initMock).toHaveBeenCalledTimes(1);
      expect(chartMock.setOption).toHaveBeenCalledTimes(1);
    });
  });

  it("applies a fallback min-height when the container starts at zero height", async () => {
    const originalClientHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "clientHeight"
    );

    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get(this: HTMLElement) {
        const parsed = Number.parseInt(this.style.minHeight || "0", 10);
        return Number.isNaN(parsed) ? 0 : parsed;
      },
    });

    clientHeight = 0;

    try {
      let container!: HTMLElement;

      await act(async () => {
        const result = renderWithContext(<ECharts option='{"series":[{}]}' />);
        container = result.container;
      });

      const chartContainer = container.querySelector(
        '[aria-label="ECharts chart"]'
      ) as HTMLElement;

      await waitFor(() => {
        expect(chartContainer.style.minHeight).toBe("320px");
        expect(loadEChartsMock).toHaveBeenCalled();
        expect(initMock).toHaveBeenCalled();
        expect(chartMock.setOption).toHaveBeenCalled();
      });
    } finally {
      if (originalClientHeight) {
        Object.defineProperty(HTMLElement.prototype, "clientHeight", originalClientHeight);
      }
    }
  });

  it("accepts function values in option string", async () => {
    const option = `{ series: [{ itemStyle: { color: function () { return "#000"; } } }] }`;
    await act(async () => {
      renderWithContext(<ECharts option={option} />);
    });

    const { loadECharts } = await import("../lib/echarts/utils");
    expect(loadECharts).toBe(loadEChartsMock);

    await waitFor(() => {
      expect(loadEChartsMock).toHaveBeenCalled();
      expect(chartMock.setOption).toHaveBeenCalled();
    });

    const [parsed] = chartMock.setOption.mock.calls[0];
    expect(typeof parsed.series?.[0]?.itemStyle?.color).toBe("function");
  });

  it("shows error when option is invalid", async () => {
    const { container } = renderWithContext(<ECharts option="not valid {" />);

    await waitFor(() => {
      expect(container.textContent).toContain("ECharts Error");
    });
  });
});

describe("EChartsDownloadDropdown", () => {
  it("downloads chart as PNG", async () => {
    chartMock.getDataURL.mockReturnValueOnce(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB"
    );

    const { getByText, getByRole, getByTitle, queryByText } = render(
      <EChartsDownloadDropdown
        getChart={() => chartMock as any}
        option="{}"
      />
    );

    const toggleButton = getByTitle("Download chart");
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    const pngButton = await waitFor(() =>
      getByRole("button", { name: "PNG" })
    );

    await act(async () => {
      fireEvent.click(pngButton);
    });

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith("chart.png", blobMock, "image/png");
    });

    // Dropdown should close
    await waitFor(() => {
      expect(queryByText("PNG")).toBeNull();
    });
  });

  it("saves JSON when requested", async () => {
    const { getByRole, getByTitle, queryByText } = render(
      <EChartsDownloadDropdown
        getChart={() => chartMock as any}
        option='{"series":[]}'
      />
    );

    const toggleButton = getByTitle("Download chart");
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    const jsonButton = await waitFor(() =>
      getByRole("button", { name: "JSON" })
    );

    await act(async () => {
      fireEvent.click(jsonButton);
    });

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith(
        "chart.json",
        '{"series":[]}',
        "application/json"
      );
    });

    await waitFor(() => {
      expect(queryByText("JSON")).toBeNull();
    });
  });
});

describe("EChartsFullscreenButton", () => {
  it("opens fullscreen modal", async () => {
    const { container } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <EChartsFullscreenButton option='{"series":[]}' />
      </StreamdownContext.Provider>
    );

    const fullscreenButton = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;

    await act(async () => {
      fireEvent.click(fullscreenButton);
    });

    await waitFor(() => {
      const modal = document.querySelector(".fixed.inset-0.z-50");
      expect(modal).toBeTruthy();
    });
  });
});
