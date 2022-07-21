import {
  Color,
  Easing,
  Legend,
  TextStyle,
  backgroundColor,
  Icons,
  Title,
  DataView,
  optionToContent,
  downloadToExcel,
} from "./common";
import { isEmpty, sumBy } from "lodash";

const Pie = (
  data,
  chartTitle,
  excelFile,
  extra = {},
  Doughnut = false,
  series = {},
  legend = {}
) => {
  data = !data ? [] : data;
  let labels = [];
  if (data.length > 0) {
    labels = data.map((x) => x.name);
    data = data.filter((x) => x.value >= 0);
    const total = sumBy(data, "value");
    data = data.map((x) => ({
      ...x,
      percentage: ((x.value / total) * 100)?.toFixed(0) || 0,
    }));
  }
  const { textStyle } = TextStyle;
  const rose = {};

  const option = {
    title: {
      ...Title,
      show: !isEmpty(chartTitle),
      text: chartTitle?.title,
      subtext: chartTitle?.subTitle,
    },
    tooltip: {
      show: true,
      trigger: "item",
      formatter: "{b}",
      padding: 5,
      backgroundColor: "#f2f2f2",
      textStyle: {
        ...textStyle,
        fontSize: 12,
      },
    },
    grid: {
      top: 0,
      bottom: 0,
    },
    toolbox: {
      show: true,
      showTitle: true,
      orient: "horizontal",
      right: 30,
      top: 20,
      feature: {
        saveAsImage: {
          type: "jpg",
          title: "Save Image",
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
    series: [
      {
        name: "main",
        type: "pie",
        left: "center",
        radius: !Doughnut ? ["0%", "85%"] : ["42%", "85%"],
        top: "30px",
        label: {
          formatter: function (params) {
            if (params.value > 0) {
              return `${params.data.percentage} % (${params.value})`;
            }
            return "";
          },
          show: true,
          position: !Doughnut ? "inner" : "outside",
          padding: 5,
          borderRadius: 100,
          backgroundColor: !Doughnut ? "rgba(0,0,0,.5)" : "rgba(0,0,0,.3)",
          ...textStyle,
          color: "#fff",
        },
        labelLine: {
          show: true,
        },
        data: data,
        ...series,
        ...rose,
      },
    ],
    legend: {
      data: labels,
      ...Legend,
      top: "top",
      left: "center",
      icon: "circle",
      align: "left",
      orient: "horizontal",
      itemGap: 12,
      textStyle: {
        fontWeight: "normal",
        fontSize: 12,
      },
      ...legend,
    },
    ...Color,
    ...backgroundColor,
    ...Easing,
    ...extra,
  };
  return option;
};

export default Pie;
