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
        original: sumBy(vals, "value"),
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
      bottom: 50,
      left: 10,
      right: 20,
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
      show: true,
      backgroundColor: "#ffffff",
      formatter: function (e) {
        let table =
          '<table border="0" style="width:100%;border-spacing: 60px;font-size:13px;"><thead>';
        table += `<tr><th style="font-size: 15px;color:#000;padding-bottom:8px;" colspan=${
          e?.length || 1
        }>${e[0]?.axisValueLabel || "-"}</th></tr></thead><tbody>`;
        e.map((eI) => {
          table += "<tr>";
          table += '<td style="width: 18px;">' + eI.marker + "</td>";
          table +=
            '<td><span style="font-weight:600;">' +
            upperFirst(eI.seriesName) +
            "</span></td>";
          table +=
            '<td style="width: 80px; text-align: right; font-weight: 500;">' +
            eI.value +
            "%" +
            (eI.data?.original ? ` (${eI.data.original})` : "") +
            "</td>";
          table += "</tr>";
        });
        table += "</tbody></table>";
        return (
          '<div style="display:flex;align-items:center;justify-content:center">' +
          table +
          "</div>"
        );
      },
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
          optionToContent: function ({ xAxis, yAxis, series }) {
            let axisVal = horizontal ? [...yAxis] : [...xAxis];
            axisVal = axisVal.map((x) => x.data)[0];
            series = series.map((x) => x.data);
            let table =
              '<table border="1" style="width:75%;text-align:center">';
            table += "<thead><tr><th></th>";
            for (let a = 0, b = axisVal.length; a < b; a++) {
              table += "<th>" + upperFirst(axisVal[a]) + "</th>";
            }
            table += "</tr></thead><tbody>";
            for (let i = 0, l = series.length; i < l; i++) {
              table += "<tr>";
              table += "<td><b>" + upperFirst(series[i][0].name) + "</b></td>";
              for (let x = 0, y = series[i].length; x < y; x++) {
                table += "<td>" + series[i][x].value + "%" + "</td>";
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
      axisLabel: {
        formatter: (e) => e + "%",
        ...TextStyle,
        color: "#9292ab",
      },
    },
    [horizontal ? "yAxis" : "xAxis"]: {
      data: xAxis,
      type: "category",
      name: xAxisTitle || "",
      nameTextStyle: { ...TextStyle },
      nameLocation: "middle",
      nameGap: 50,
      axisLabel: {
        width: 100,
        interval: 0,
        overflow: "break",
        ...TextStyle,
        color: "#4b4b4e",
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
