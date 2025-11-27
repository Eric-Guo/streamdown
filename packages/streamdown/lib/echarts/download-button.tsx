import { DownloadIcon } from "lucide-react";
import type { EChartsType } from "echarts";
import { useContext, useEffect, useRef, useState } from "react";
import { StreamdownContext } from "../../index";
import { cn, save } from "../utils";
import { dataUrlToBlob } from "./utils";

type EChartsDownloadDropdownProps = {
  option: string;
  getChart: () => EChartsType | null;
  children?: React.ReactNode;
  className?: string;
  onDownload?: (format: "json" | "png" | "svg") => void;
  onError?: (error: Error) => void;
};

export const EChartsDownloadDropdown = ({
  option,
  getChart,
  children,
  className,
  onDownload,
  onError,
}: EChartsDownloadDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAnimating } = useContext(StreamdownContext);

  const downloadChart = async (format: "json" | "png" | "svg") => {
    try {
      if (format === "json") {
        save("chart.json", option, "application/json");
        setIsOpen(false);
        onDownload?.(format);
        return;
      }

      const chart = getChart();

      if (!chart) {
        throw new Error("Chart is not ready yet. Please wait for it to render.");
      }

      const dataUrl = chart.getDataURL({
        type: format === "png" ? "png" : "svg",
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const blob = await dataUrlToBlob(dataUrl);
      const filename = format === "png" ? "chart.png" : "chart.svg";
      const mimeType = format === "png" ? "image/png" : "image/svg+xml";

      save(filename, blob, mimeType);
      onDownload?.(format);
      setIsOpen(false);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={cn(
          "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={isAnimating}
        onClick={() => setIsOpen(!isOpen)}
        title="Download chart"
        type="button"
      >
        {children ?? <DownloadIcon size={14} />}
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 z-10 mt-1 min-w-[140px] overflow-hidden rounded-md border border-border bg-background shadow-lg">
          <button
            className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            onClick={() => downloadChart("svg")}
            title="Download chart as SVG"
            type="button"
          >
            SVG
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            onClick={() => downloadChart("png")}
            title="Download chart as PNG"
            type="button"
          >
            PNG
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            onClick={() => downloadChart("json")}
            title="Download chart configuration"
            type="button"
          >
            JSON
          </button>
        </div>
      )}
    </div>
  );
};
