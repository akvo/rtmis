import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Col, Card } from "antd";
import { get, capitalize, chain, groupBy, sumBy, orderBy } from "lodash";
import { Chart } from "../../../components";
import { jmpColorScore } from "../../../lib";

const ChartVisual = ({ chartConfig, loading }) => {
  const { formId } = useParams();
  const { title, type, chartType, span, data, index, path, selector } =
    chartConfig;
  const colorPath =
    selector !== "period"
      ? String(path).replace("data", formId)
      : String(path).replace("jmp", formId);
  // const [isStack, setIsStack] = useState(false);
  // const [showEmpty, setShowEmpty] = useState(false);
  // const showSwitcher =
  //   calc?.toLowerCase() === "jmp" && chartType?.toLowerCase() !== "pie";

  const chartData = useMemo(() => {
    if (selector === "period") {
      const period = data.map((x) => ({
        name: x.name,
        value: get(x, path),
      }));
      return period;
    }
    const transform = data
      .map((d) => {
        const obj = get(d, path);
        if (!obj) {
          return false;
        }
        return Object.keys(obj).map((key) => ({
          name: key,
          value: obj[key],
        }));
      })
      .filter((x) => x)
      .flatMap((x) => x);
    const results = chain(groupBy(transform, "name"))
      .map((g, gi) => {
        const findJMPConfig = get(jmpColorScore, `${colorPath}.${gi}`);
        const val = {
          name: capitalize(gi),
          value: sumBy(g, "value"),
        };
        if (!findJMPConfig) {
          return val;
        }
        return {
          ...val,
          color: findJMPConfig.color,
        };
      })
      .value();
    return orderBy(results, ["value"], ["asc"]);
  }, [data, path, selector, colorPath]);

  return (
    <Col key={`col-${type}-${index}`} span={span} className="chart-card">
      <Card>
        <h3>{title}</h3>
        {selector === "period" ? (
          <Chart
            excelFile={title}
            type={path === "total" ? "LINEAREA" : "LINE"}
            data={chartData}
            wrapper={false}
            horizontal={true}
            loading={!chartData.length}
            series={{
              left: "10%",
            }}
            legend={{
              top: "middle",
              left: "65%",
              right: "right",
              orient: "vertical",
              itemGap: 12,
              textStyle: {
                fontWeight: "normal",
                fontSize: 12,
              },
            }}
            grid={{
              top: 0,
              left: 120,
            }}
            colorConfig={get(jmpColorScore, colorPath)}
            cumulative
          />
        ) : (
          <Chart
            height={chartType === "PIE" ? 420 : 50 * chartData.length + 188}
            excelFile={title}
            type={chartType || "BAR"}
            data={chartData}
            wrapper={false}
            horizontal={true}
            loading={loading}
            series={
              chartType === "BAR"
                ? {
                    left: "10%",
                  }
                : {}
            }
            legend={{
              top: "middle",
              left: "65%",
              right: "right",
              orient: "vertical",
              itemGap: 12,
              textStyle: {
                fontWeight: "normal",
                fontSize: 12,
              },
            }}
            grid={{
              top: 70,
              left: 120,
            }}
          />
        )}
      </Card>
    </Col>
  );
};

export default ChartVisual;
