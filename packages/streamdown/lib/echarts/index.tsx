import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import type { EChartsType, SetOptionOpts } from "echarts";
import type { EChartsErrorComponentProps } from "../../index";
import { cn } from "../utils";
import { loadECharts, parseEChartsOption } from "./utils";

type EChartsProps = {
  option: string;
  className?: string;
  renderer?: "canvas" | "svg";
  theme?: string | Record<string, unknown>;
  fullscreen?: boolean;
  setOptionOpts?: SetOptionOpts;
  errorComponent?: ComponentType<EChartsErrorComponentProps>;
  onReady?: (chart: EChartsType | null) => void;
};

export const ECharts = ({
  option,
  className,
  renderer = "svg",
  theme,
  fullscreen = false,
  setOptionOpts,
  errorComponent: ErrorComponent,
  onReady,
}: EChartsProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<EChartsType | null>(null);
  const rendererRef = useRef<"canvas" | "svg" | undefined>(renderer);
  const themeRef = useRef<typeof theme>(theme);
  const hasRenderedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasDimensions, setHasDimensions] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let disposed = false;

    if (!hasDimensions) {
      return;
    }

    const renderChart = async () => {
      setError(null);

      if (!hasRenderedRef.current) {
        setIsLoading(true);
      }

      try {
        const parsedOption = parseEChartsOption(option);
        const echarts = await loadECharts();
        const container = containerRef.current;

        if (!container) {
          return;
        }

        const shouldRecreate =
          chartRef.current &&
          (rendererRef.current !== renderer || themeRef.current !== theme);

        if (shouldRecreate) {
          chartRef.current?.dispose();
          chartRef.current = null;
        }

        let chart = chartRef.current;

        if (!chart) {
          chart = echarts.init(container, theme, {
            renderer,
            useDirtyRect: true,
          });
          chartRef.current = chart;
        }

        chart.setOption(parsedOption, setOptionOpts ?? { notMerge: true, lazyUpdate: false });
        chart.resize();

        rendererRef.current = renderer;
        themeRef.current = theme;
        hasRenderedRef.current = true;
        onReady?.(chart);
      } catch (err) {
        if (!hasRenderedRef.current && !disposed) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to render ECharts chart";
          setError(message);
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    };

    renderChart();

    return () => {
      disposed = true;
      chartRef.current?.dispose();
      chartRef.current = null;
      onReady?.(null);
    };
  }, [option, renderer, theme, setOptionOpts, onReady, retryCount, hasDimensions]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const updateDimensions = () => {
      const containerWidth = container.clientWidth;
      let containerHeight = container.clientHeight;

      // Provide a fallback height when no styles are loaded so the chart can mount
      if (containerHeight === 0 && !container.style.minHeight) {
        container.style.minHeight = "320px";
        containerHeight = container.clientHeight;
      }

      const hasSize = containerWidth > 0 && containerHeight > 0;

      setHasDimensions(hasSize);

      if (hasSize) {
        chartRef.current?.resize();
      }
    };

    updateDimensions();

    let observer: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(updateDimensions);
      observer.observe(container);
    }

    window.addEventListener("resize", updateDimensions);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  if (error && !hasRenderedRef.current) {
    const retry = () => {
      setRetryCount((count) => count + 1);
    };

    if (ErrorComponent) {
      return <ErrorComponent error={error} option={option} retry={retry} />;
    }

    return (
      <div
        className={cn(
          "rounded-lg border border-red-200 bg-red-50 p-4",
          className
        )}
      >
        <p className="font-mono text-red-700 text-sm">ECharts Error: {error}</p>
        <details className="mt-2">
          <summary className="cursor-pointer text-red-600 text-xs">
            Show Option
          </summary>
          <pre className="mt-2 overflow-x-auto rounded bg-red-100 p-2 text-red-800 text-xs">
            {option}
          </pre>
        </details>
      </div>
    );
  }

  const showLoading = isLoading && !hasRenderedRef.current;

  return (
    <div
      aria-label="ECharts chart"
      className={cn(
        "relative w-full min-h-[320px]",
        fullscreen ? "h-full" : "max-h-[70vh]",
        className
      )}
      ref={containerRef}
      role="img"
    >
      {showLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-current border-b-2" />
            <span className="text-sm">Loading chart...</span>
          </div>
        </div>
      )}
    </div>
  );
};
