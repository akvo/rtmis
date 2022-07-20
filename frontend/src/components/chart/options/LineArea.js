import {
  Easing,
  Color,
  Icons,
  TextStyle,
  backgroundColor,
  Title,
  AxisLabelFormatter,
  NoData,
} from "./common";
import uniq from "lodash/uniq";
import isEmpty from "lodash/isEmpty";

const LineArea = (data, chartTitle, extra = {}) => {
  if (isEmpty(data)) {
    return NoData;
  }
  data = !data ? [] : data;
  let labels = [];
  let seriesData = [];
  const yAxis = {
    type: "value",
  };
  if (data.length > 0) {
    seriesData = data.map((x) => {
      return x.value;
    });
    labels = uniq(data.map((x) => x.name));
  }
  const option = {
    title: {
      ...Title,
      show: !isEmpty(chartTitle),
      text: chartTitle?.title,
      subtext: chartTitle?.subTitle,
    },
    tooltip: {
      trigger: "axis",
    },
    grid: {
      left: "20px",
      right: "20px",
      bottom: "20px",
      containLabel: true,
      label: {
        color: "#000",
        ...TextStyle,
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: labels,
      axisTick: {
        alignWithLabel: true,
      },
    },
    yAxis: {
      ...yAxis,
      axisLabel: {
        ...AxisLabelFormatter,
        inside: true,
        color: "rgba(0, 0, 0, 0.85)",
        fontWeight: "normal",
        fontSize: "12px",
      },
      splitLine: {
        show: true,
      },
      axisLine: {
        show: true,
      },
      axisTick: {
        alignWithLabel: true,
      },
    },
    toolbox: {
      show: true,
      orient: "horizontal",
      right: 30,
      top: 20,
      feature: {
        saveAsImage: {
          type: "jpg",
          icon: Icons.saveAsImage,
          backgroundColor: "#EAF5FB",
        },
      },
    },
    series: [
      {
        data: seriesData,
        type: "line",
        areaStyle: {},
      },
    ],
    ...Color,
    ...backgroundColor,
    ...Easing,
    ...extra,
  };
  return option;
};

export default LineArea;
