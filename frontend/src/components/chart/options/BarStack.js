import {
  Easing,
  Color,
  TextStyle,
  backgroundColor,
  Icons,
  AxisLabelFormatter,
  AxisShortLabelFormatter,
  Legend,
  DataView,
  Title,
  axisTitle,
  NoData,
} from "./common";
import { uniq, flatten, uniqBy, isEmpty, upperFirst, sumBy } from "lodash";

const BarStack = (data, chartTitle, extra, horizontal = false) => {
  if (isEmpty(data) || !data) {
    return NoData;
  }
  // Custom Axis Title
  const { xAxisTitle, yAxisTitle } = axisTitle(extra);

  const stacked = uniqBy(flatten(data.map((d) => d.stack)), "title") || []; // TODO: Conditional for administration mode

  const legends = stacked.map((s, si) => ({
    name: s.title || s.name,
    itemStyle: { color: s.color || Color.color[si] },
  }));
  const xAxis = uniq(data.map((x) => x.title || x.name));
  const series = stacked.map((s, si) => {
    const temp = data.map((d) => {
      const vals = d.stack?.filter((c) => c.title === s.title);
      const stackSum = sumBy(d.stack, "value");
      return {
        name: s.title || s.name,
        value: vals?.length
          ? ((sumBy(vals, "value") / stackSum) * 100)?.toFixed(0) || 0
          : 0,
        itemStyle: { color: vals[0]?.color || s.color },
      };
    });
    return {
      name: s.title || s.name,
      type: "bar",
      stack: "count",
      label: {
        colorBy: "data",
        position:
          si % 2 === 0
            ? horizontal
              ? "insideRight"
              : "left"
            : horizontal
            ? "insideRight"
            : "right",
        show: false,
        padding: 5,
        formatter: (e) => e?.data?.value + "%" || "-",
        backgroundColor: "rgba(0,0,0,.3)",
        ...TextStyle,
        color: "#fff",
      },
      barMaxWidth: 30,
      barMaxHeight: 22,
      emphasis: {
        focus: "series",
      },
      data: temp,
    };
  });
  const option = {
    ...Color,
    title: {
      ...Title,
      show: !isEmpty(chartTitle),
      text: chartTitle?.title,
      subtext: chartTitle?.subTitle,
    },
    legend: {
      ...Legend,
      data: legends,
      top: "bottom",
      left: "center",
    },
    grid: {
      top: 15,
      bottom: 60,
      left: 0,
      right: 0,
      show: true,
      containLabel: true,
      label: {
        color: "#222",
        ...TextStyle,
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      backgroundColor: "#ffffff",
      ...TextStyle,
    },
    toolbox: {
      show: true,
      orient: "vertical",
      right: 15,
      top: "top",
      feature: {
        saveAsImage: {
          type: "jpg",
          icon: Icons.saveAsImage,
          backgroundColor: "#EAF5FB",
        },
        dataView: {
          ...DataView,
          optionToContent: function ({ xAxis, series }) {
            xAxis = xAxis.map((x) => x.data)[0];
            series = series.map((x) => x.data);
            let table =
              '<table border="1" style="width:90%;text-align:center">';
            table += "<thead><tr><th></th>";
            for (let a = 0, b = xAxis.length; a < b; a++) {
              table += "<th>" + upperFirst(xAxis[a]) + "</th>";
            }
            table += "</tr></thead><tbody>";
            for (let i = 0, l = series.length; i < l; i++) {
              table += "<tr>";
              table += "<td><b>" + upperFirst(series[i][0].name) + "</b></td>";
              for (let x = 0, y = series[i].length; x < y; x++) {
                table += "<td>" + series[i][x].value + "</td>";
              }
              table += "</tr>";
            }
            table += "</tbody></table>";
            return (
              '<div style="display:flex;align-items:center;justify-content:center">' +
              table +
              "</div>"
            );
          },
        },
      },
    },
    [horizontal ? "xAxis" : "yAxis"]: {
      type: "value",
      name: yAxisTitle || "",
      nameTextStyle: { ...TextStyle },
      nameLocation: "middle",
      nameGap: 50,
    },
    [horizontal ? "yAxis" : "xAxis"]: {
      data: xAxis,
      type: "category",
      name: xAxisTitle || "",
      nameTextStyle: { ...TextStyle },
      nameLocation: "middle",
      nameGap: 50,
      axisLabel: {
        color: "#222",
        width: 90,
        interval: 0,
        overflow: "truncate",
        ...TextStyle,
        formatter: horizontal
          ? AxisShortLabelFormatter?.formatter
          : AxisLabelFormatter?.formatter,
      },
      axisTick: {
        alignWithLabel: true,
      },
    },
    series: series,
    ...Color,
    ...backgroundColor,
    ...Easing,
    ...extra,
  };
  return option;
};

export default BarStack;
