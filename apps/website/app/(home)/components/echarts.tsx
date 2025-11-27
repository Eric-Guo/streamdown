import { Section } from "./section";

const echartsMarkdown = `Streamdown renders ECharts code fences into interactive charts with fullscreen, download, and copy controls built in.

## Cashflow Distribution

\`\`\`echarts
{
  "title": {
    "text": "各子公司2025年累计现金流分布",
    "left": "center"
  },
  "tooltip": {
    "trigger": "axis",
    "axisPointer": {
      "type": "shadow"
    }
  },
  "xAxis": {
    "type": "category",
    "data": ["上海天华", "重庆天华", "AICO SH", "武汉天华", "西北天华", "成都天华", "杭州天华", "规划景观", "天津天华", "青岛天华", "AICO SZ", "北京天华", "机电（沪浙）", "结构（沪苏）", "机电（沪苏）", "结构（沪浙）", "沈阳天华", "厦门天华", "机电（北方）", "上海医养", "深圳天华", "上海天华嘉易工程", "广州天华", "结构（南方）", "EID SH", "AICO室内", "南京天华", "易术家", "结构（北方）", "上海室内", "机电（南方）"],
    "axisLabel": {
      "rotate": 45
    }
  },
  "yAxis": {
    "type": "value",
    "name": "累计现金流（万元）"
  },
  "series": [
    {
      "name": "累计现金流",
      "type": "bar",
      "data": [23561.23, 9123.78, 13890.12, 24123.56, 1987.65, 7234.89, 4123.45, 1024.67, 890.34, 654.12, 512.78, 345.90, 1876.23, 2012.56, 3345.89, 1234.01, 156.78, -23.45, -78.90, -12.34, -987.65, -1123.45, -2134.56, -567.89, -1345.67, -765.43, -543.21, -456.78, -321.09, -876.54, -34.56],
      "itemStyle": {
        "color": function(params) {
          return params.value >= 0 ? '#91cc75' : '#ee6666';
        }
      }
    }
  ]
}
\`\`\``;

export const EChartsDemo = () => (
  <Section
    description="Render ECharts JSON directly from markdown while keeping charts responsive, themeable, and controllable."
    markdown={echartsMarkdown}
    speed={60}
    streamdownProps={{
      echarts: {
        renderer: "svg",
      },
      controls: true,
    }}
    streamdownLoadingFallback="Loading..."
    title="ECharts Code Blocks"
  />
);
