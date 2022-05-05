import {
  Color,
  Easing,
  Legend,
  TextStyle,
  backgroundColor,
  Title,
} from "./common";
import { isEmpty, sumBy } from "lodash";

const Pie = (
  data,
  chartTitle,
  extra,
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
    series: [
      {
        name: "main",
        type: "pie",
        left: "center",
        radius: !Doughnut ? ["0%", "100%"] : ["50%", "100%"],
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
      itemGap: 10,
      textStyle: {
        fontWeight: "normal",
        fontSize: 12,
        marginLeft: 20,
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
