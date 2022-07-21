import React from "react";
import { Col, Card } from "antd";
import ReactECharts from "echarts-for-react";
import { Bar, Line, BarStack, Pie, LineArea } from "./options";

export const generateOptions = (
  { type, data, chartTitle, excelFile, cumulative, colorConfig },
  extra,
  series,
  legend,
  horizontal,
  highlighted,
  axis,
  grid
) => {
  switch (type) {
    case "LINE":
      return Line(data, chartTitle, excelFile, cumulative, extra, colorConfig);
    case "LINEAREA":
      return LineArea(data, chartTitle, extra, axis);
    case "BARSTACK":
      return BarStack(
        data,
        chartTitle,
        extra,
        excelFile,
        horizontal,
        highlighted
      );
    case "PIE":
      return Pie(data, chartTitle, excelFile, extra, false, series, legend);
    case "DOUGHNUT":
      return Pie(data, chartTitle, excelFile, extra, true);
    default:
      return Bar(data, chartTitle, excelFile, extra, horizontal, grid);
  }
};

const loadingStyle = {
  text: "Loading",
  color: "#1890ff",
  textColor: "rgba(0,0,0,.85)",
  maskColor: "rgba(255, 255, 255, 1)",
  zlevel: 0,
  fontSize: "1.17em",
  showSpinner: true,
  spinnerRadius: 10,
  lineWidth: 5,
  fontWeight: "500",
  fontStyle: "normal",
  fontFamily: "Poppins",
};

const Chart = ({
  type,
  title = "",
  subTitle = "",
  excelFile = "",
  height = 450,
  span = 12,
  data,
  extra = {},
  wrapper = true,
  axis = null,
  horizontal = false,
  styles = {},
  transform = true,
  series,
  legend,
  callbacks = null,
  highlighted,
  loading = false,
  loadingOption = loadingStyle,
  grid = {},
  cumulative = false,
  colorConfig = {},
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
    {
      type: type,
      data: data,
      chartTitle: chartTitle,
      excelFile: excelFile,
      cumulative: cumulative,
      colorConfig: colorConfig,
    },
    extra,
    series,
    legend,
    horizontal,
    highlighted,
    axis,
    grid
  );
  const onEvents = {
    click: (e) => {
      if (callbacks?.onClick) {
        callbacks.onClick(e.data?.cbParam);
      }
    },
  };
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
            onEvents={onEvents}
            showLoading={loading}
            loadingOption={loadingOption}
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
      onEvents={onEvents}
      showLoading={loading}
      loadingOption={loadingOption}
    />
  );
};

export default Chart;
