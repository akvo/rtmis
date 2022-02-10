import {
  Color,
  Easing,
  Legend,
  TextStyle,
  backgroundColor,
  Title,
} from "./common";
import isEmpty from "lodash/isEmpty";

const Pie = (data, chartTitle, extra, Doughnut = false) => {
  data = !data ? [] : data;
  let labels = [];
  if (data.length > 0) {
    // filter value < 0
    data = data.filter((x) => x.value >= 0);
    labels = data.map((x) => x.name);
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
            if (params.value >= 0) {
              return Math.round(params.value) + "%";
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
        ...rose,
      },
    ],
    legend: {
      data: labels,
      ...Legend,
      top: "top",
      left: "center",
    },
    ...Color,
    ...backgroundColor,
    ...Easing,
    ...extra,
  };
  return option;
};

export default Pie;
