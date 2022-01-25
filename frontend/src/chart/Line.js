import {
  Easing,
  Color,
  TextStyle,
  backgroundColor,
  Title,
  AxisLabelFormatter,
  NoData,
} from "./chart-style.js";
import { getDateRange } from "../util/date";
import sortBy from "lodash/sortBy";
import uniq from "lodash/uniq";
import isEmpty from "lodash/isEmpty";
import moment from "moment";

const dateFormat = "MMMM DD, YYYY";

const Line = (data, chartTitle, extra) => {
  if (isEmpty(data)) {
    return NoData;
  }
  let yAxisVal = [];
  let labels = [];
  let seriesData = [];
  data = !data ? [] : data;
  data = data.map((x) => ({
    ...x,
    moment: x?.date ? moment(x.date, dateFormat).toDate() : false,
  }));
  let yAxis = {
    type: "value",
  };
  if (data.length > 0) {
    yAxisVal = data?.map((x) => x.value || x.name);
    yAxisVal = uniq(sortBy(yAxisVal).filter((x) => x));
    data = sortBy(data, "moment").filter((d) => d?.moment);
    const hasNaN = data.map((x) => x.value || x.name).filter((x) => isNaN(x));
    if (hasNaN.length) {
      yAxis = {
        type: "category",
        data: yAxisVal,
      };
    }
    seriesData = data.map((x) => {
      const value = x.value || x.name;
      return [x.date, value || null];
    });
    labels = uniq(data.map((x) => x.date));
    const minDate = moment.min(labels.map((x) => moment(x, dateFormat)));
    labels = getDateRange({
      startDate: minDate.add(-1, "days"),
      endDate: moment().add(1, "days"),
      dateFormat: dateFormat,
      type: "days",
    });
  }
  let option = {
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
    series: [
      {
        data: seriesData,
        type: "line",
      },
    ],
    ...Color,
    ...backgroundColor,
    ...Easing,
    ...extra,
  };
  return option;
};

export default Line;
