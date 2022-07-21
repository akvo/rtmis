import {
  Easing,
  Color,
  TextStyle,
  backgroundColor,
  Title,
  Icons,
  AxisLabelFormatter,
  optionToContent,
  downloadToExcel,
  NoData,
} from "./common";
import { isEmpty, get } from "lodash";

const Line = (
  data,
  chartTitle,
  excelFile,
  cumulative = false,
  extra = {},
  colorConfig = {}
) => {
  if (isEmpty(data)) {
    return NoData;
  }
  const seriesName = Object.keys(data?.[0]?.value || {});
  const seriesData = seriesName.map((s) => {
    let dataSeries = data.map((v) => get(v.value, s));
    if (cumulative) {
      dataSeries = dataSeries.reduce(
        (a, x, i) => [...a, a.length > 0 ? x + a[i - 1] : x],
        []
      );
    }
    let res = {
      data: dataSeries,
      name: s,
      type: "line",
    };
    const color = colorConfig?.[s]?.color;
    if (color) {
      res = {
        ...res,
        itemStyle: {
          color: color,
        },
      };
    }
    return res;
  });
  const labels = data.map((x) => x.name);
  const option = {
    title: {
      ...Title,
      show: !isEmpty(chartTitle),
      text: chartTitle?.title,
      subtext: chartTitle?.subTitle,
    },
    legend: {
      show: true,
    },
    tooltip: {
      trigger: "axis",
    },
    grid: {
      left: "20px",
      right: "20px",
      bottom: "50px",
      containLabel: true,
      label: {
        color: "#000",
        ...TextStyle,
      },
    },
    dataZoom: [
      {
        type: "inside",
      },
      {
        type: "slider",
      },
    ],
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: labels,
      axisTick: {
        alignWithLabel: true,
      },
    },
    yAxis: {
      type: "value",
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
        dataView: {
          ...DataView,
          optionToContent: optionToContent,
        },
        myDownload: {
          show: true,
          title: "Download Excel",
          icon: Icons.download,
          onclick: (e) => {
            downloadToExcel(e, excelFile);
          },
        },
      },
    },
    series: seriesData,
    ...Color,
    ...backgroundColor,
    ...Easing,
    ...extra,
  };
  return option;
};

export default Line;
