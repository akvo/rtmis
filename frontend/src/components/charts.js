import ReactECharts from "echarts-for-react";
import Line from "./line";
import Bar from "./bar";

const generateOptions = ({ type, data }) => {
  console.log("type", type);
  switch (type) {
    case "LINE":
      return Line(data);
    case "BAR":
      return Bar(data);
    default:
      return Bar(data);
  }
};

const Chart = ({ data, type, height, width }) => {
  const chartOption = generateOptions({ type: type, data: data });
  return (
    <div>
      <ReactECharts
        option={chartOption}
        style={{ height: height, width: width }}
      />
    </div>
  );
};

export default Chart;
