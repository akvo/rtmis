import {
  Easing,
  Color,
  TextStyle,
  backgroundColor,
  Icons,
  AxisLabelFormatter,
  Title,
  axisTitle,
  NoData,
} from "./common";
import sortBy from "lodash/sortBy";
import isEmpty from "lodash/isEmpty";
import sumBy from "lodash/sumBy";

const Bar = (data, chartTitle, extra) => {
  if (isEmpty(data) || !data) {
    return NoData;
  }

  // Custom Axis Title
  const { xAxisTitle, yAxisTitle } = axisTitle(extra);
  const total = sumBy(data, "value");
  data = sortBy(data, "order");
  data = data.map((x) => ({ ...x, percentage: (x.value / total) * 100 }));
  const labels = data.map((x) => x.name);
  const option = {
    ...Color,
    title: {
      ...Title,
      show: !isEmpty(chartTitle),
      text: chartTitle?.title,
      subtext: chartTitle?.subTitle,
    },
    grid: {
      top: "25%",
      show: true,
      label: {
        color: "#222",
        ...TextStyle,
      },
    },
    tooltip: {
      show: true,
      trigger: "item",
      formatter: "{b}",
      padding: 5,
      backgroundColor: "#f2f2f2",
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
      },
    },
    yAxis: {
      type: "value",
      name: yAxisTitle || "",
      nameTextStyle: { ...TextStyle },
      nameLocation: "middle",
      nameGap: 50,
    },
    xAxis: {
      type: "category",
      data: labels,
      name: xAxisTitle || "",
      nameTextStyle: { ...TextStyle },
      nameLocation: "middle",
      nameGap: 50,
      axisLabel: {
        color: "#222",
        ...TextStyle,
        ...AxisLabelFormatter,
      },
      axisTick: {
        alignWithLabel: true,
      },
    },
    series: [
      {
        data: data.map((v, vi) => ({
          name: v.name,
          value: v.percentage?.toFixed(2),
          count: v.value,
          itemStyle: { color: v.color || Color.color[vi] },
        })),
        type: "bar",
        barMaxWidth: 50,
        label: {
          colorBy: "data",
          position: "top",
          show: true,
          padding: 5,
          backgroundColor: "rgba(0,0,0,.3)",
          ...TextStyle,
          color: "#fff",
          formatter: (s) => {
            return `${s.data.count} (${s.value} %)`;
          },
        },
      },
    ],
    ...Color,
    ...backgroundColor,
    ...Easing,
    ...extra,
  };
  return option;
};

export default Bar;
