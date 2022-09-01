import {
  Color,
  Easing,
  TextStyle,
  backgroundColor,
  Icons,
  Title,
} from "./common";
import { isEmpty, sumBy } from "lodash";

const Pie = (data, chartTitle, extra = {}, series = {}) => {
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
      },
    },
    series: [
      {
        name: "main",
        type: "pie",
        left: "center",
        radius: ["0%", "90%"],
        label: {
          formatter: function (params) {
            if (params.value > 0) {
              return `${params.data.percentage} %`;
            }
            return "";
          },
          show: true,
          position: "inner",
          padding: 5,
          backgroundColor: "rgba(0,0,0,.5)",
          ...TextStyle,
          color: "#fff",
        },
        labelLine: {
          show: true,
        },
        data: data.map((v, vi) => ({
          ...v,
          itemStyle: { color: v.color || Color.color[vi] },
        })),
        ...series,
        ...rose,
      },
    ],
    legend: {
      data: labels,
      orient: "vertical",
      top: 30,
      left: 30,
      icon: "circle",
      textStyle: {
        fontWeight: "normal",
        fontSize: 12,
      },
    },
    ...Color,
    ...backgroundColor,
    ...Easing,
    ...extra,
  };
  return option;
};

export default Pie;
