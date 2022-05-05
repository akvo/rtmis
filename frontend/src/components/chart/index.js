import React from "react";
import { Col, Card } from "antd";
import ReactECharts from "echarts-for-react";
import { Bar, Line, BarStack, Pie } from "./options";

export const generateOptions = (
  { type, data, chartTitle },
  extra,
  series,
  legend
) => {
  switch (type) {
    case "LINE":
      return Line(data, chartTitle, extra);
    case "BARSTACK":
      return BarStack(data, chartTitle, extra);
    case "PIE":
      return Pie(data, chartTitle, extra, false, series, legend);
    case "DOUGHNUT":
      return Pie(data, chartTitle, extra, true);
    default:
      return Bar(data, chartTitle, extra);
  }
};

const Chart = ({
  type,
  title = "",
  subTitle = "",
  height = 450,
  span = 12,
  data,
  extra = {},
  wrapper = true,
  axis = null,
  styles = {},
  transform = true,
  series,
  legend,
}) => {
  if (transform) {
    data = data.map((x) => ({
      ...x,
      name: x.name,
      var: x.name,
    }));
  }
  const chartTitle = wrapper ? {} : { title: title, subTitle: subTitle };
  const option = generateOptions(
    { type: type, data: data, chartTitle: chartTitle },
    extra,
    series,
    legend,
    axis
  );
  if (wrapper) {
    return (
      <Col
        sm={24}
        md={span * 2}
        lg={span}
        style={{ height: height, ...styles }}
      >
        <Card title={title}>
          <ReactECharts
            option={option}
            notMerge={true}
            style={{ height: height - 50, width: "100%" }}
          />
        </Card>
      </Col>
    );
  }
  return (
    <ReactECharts
      option={option}
      notMerge={true}
      style={{ height: height - 50, width: "100%" }}
    />
  );
};

export default Chart;
