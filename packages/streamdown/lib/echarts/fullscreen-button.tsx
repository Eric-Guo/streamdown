import { Maximize2Icon, XIcon } from "lucide-react";
import type { ComponentProps, ComponentType } from "react";
import { useContext, useEffect, useState } from "react";
import type { SetOptionOpts } from "echarts";
import type { EChartsErrorComponentProps } from "../../index";
import { StreamdownContext } from "../../index";
import { cn } from "../utils";
import { ECharts } from ".";

let activeFullscreenCount = 0;

const lockBodyScroll = () => {
  activeFullscreenCount += 1;
  if (activeFullscreenCount === 1) {
    document.body.style.overflow = "hidden";
  }
};

const unlockBodyScroll = () => {
  activeFullscreenCount = Math.max(0, activeFullscreenCount - 1);
  if (activeFullscreenCount === 0) {
    document.body.style.overflow = "";
  }
};

type EChartsFullscreenButtonProps = ComponentProps<"button"> & {
  option: string;
  renderer?: "canvas" | "svg";
  theme?: string | Record<string, unknown>;
  setOptionOpts?: SetOptionOpts;
  errorComponent?: ComponentType<EChartsErrorComponentProps>;
  onFullscreen?: () => void;
  onExit?: () => void;
};

export const EChartsFullscreenButton = ({
  option,
  renderer,
  theme,
  setOptionOpts,
  errorComponent,
  onFullscreen,
  onExit,
  className,
  ...props
}: EChartsFullscreenButtonProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isAnimating } = useContext(StreamdownContext);

  const handleToggle = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    if (isFullscreen) {
      lockBodyScroll();

      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsFullscreen(false);
        }
      };

      document.addEventListener("keydown", handleEsc);
      return () => {
        document.removeEventListener("keydown", handleEsc);
        unlockBodyScroll();
      };
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      onFullscreen?.();
    } else if (onExit) {
      onExit();
    }
  }, [isFullscreen, onExit, onFullscreen]);

  return (
    <>
      <button
        className={cn(
          "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={isAnimating}
        onClick={handleToggle}
        title="View fullscreen"
        type="button"
        {...props}
      >
        <Maximize2Icon size={14} />
      </button>

      {isFullscreen && (
        // biome-ignore lint/a11y/useSemanticElements: "div is used as a backdrop overlay, not a button"
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
          onClick={handleToggle}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleToggle();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <button
            className="absolute top-4 right-4 z-10 rounded-md p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            onClick={handleToggle}
            title="Exit fullscreen"
            type="button"
          >
            <XIcon size={20} />
          </button>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: "div with role=presentation is used for event propagation control" */}
          <div
            className="flex h-full w-full items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <ECharts
              className="h-full w-full"
              errorComponent={errorComponent}
              fullscreen={true}
              option={option}
              renderer={renderer}
              setOptionOpts={setOptionOpts}
              theme={theme}
            />
          </div>
        </div>
      )}
    </>
  );
};
