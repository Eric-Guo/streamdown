import { describe, expect, it } from "vitest";
import { parseEChartsOption } from "../lib/echarts/utils";

describe("parseEChartsOption", () => {
  it("parses JSON options that end with a semicolon", () => {
    const parsed = parseEChartsOption('{"series":[{}]};');
    expect(parsed).toEqual({ series: [{}] });
  });

  it("parses function-based options with a trailing semicolon", () => {
    const parsed = parseEChartsOption(
      `{ series: [{ itemStyle: { color: function () { return "#000"; } } }] };`
    );

    expect(typeof parsed.series?.[0]?.itemStyle?.color).toBe("function");
  });
});
