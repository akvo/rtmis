import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Row, Col, Card, Switch, Space, Checkbox } from "antd";
import { get, capitalize, chain, groupBy, sumBy, orderBy, isNil } from "lodash";
import { Chart } from "../../../components";
import { jmpColorScore } from "../../../lib";

const ChartVisual = ({ chartConfig, loading }) => {
  const { formId } = useParams();
  const {
    title,
    type,
    chartType,
    span,
    data,
    index,
    path,
    selector,
    calc,
    admLevelName,
  } = chartConfig;
  const colorPath =
    selector !== "period"
      ? String(path).replace("data", formId)
      : String(path).replace("jmp", formId);
  const [isStack, setIsStack] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const showSwitcher =
    calc?.toLowerCase() === "jmp" && chartType?.toLowerCase() !== "pie";

  const chartData = useMemo(() => {
    let jmpServiceLevelOrder = get(jmpColorScore, colorPath);
    if (jmpServiceLevelOrder) {
      jmpServiceLevelOrder = Object.keys(jmpServiceLevelOrder);
    }
    if (selector === "period") {
      const period = data.map((x) => ({
        name: x.name,
        value: get(x, path),
      }));
      return period;
    }
    if (!isStack) {
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
    }
    if (isStack) {
      let temp = data.map((d) => {
        const serviceLevel = get(d, path);
        const stack = Object.keys(serviceLevel).map((key) => {
          const findJMPConfig = get(jmpColorScore, `${colorPath}.${key}`);
          let obj = {
            name: capitalize(key),
            title: capitalize(key),
            value: serviceLevel[key],
            total: !isNil(findJMPConfig?.score)
              ? serviceLevel[key] * findJMPConfig.score
              : serviceLevel[key],
          };
          if (findJMPConfig) {
            obj = {
              ...obj,
              color: findJMPConfig.color,
            };
          }
          if (jmpServiceLevelOrder) {
            obj = { ...obj, order: jmpServiceLevelOrder.indexOf(key) + 1 };
          }
          return obj;
        });
        return {
          name: d.loc,
          title: d.loc,
          stack: orderBy(stack, "order"),
        };
      });
      // order by score
      temp = orderBy(temp, [
        function (e) {
          return sumBy(e.stack, "total");
        },
      ]);
      let transform = temp.filter((d) => sumBy(d.stack, "value") > 0);
      if (showEmpty) {
        transform = temp;
      }
      return transform;
    }
  }, [data, path, selector, colorPath, isStack, showEmpty]);

  return (
    <Col key={`col-${type}-${index}`} span={span} className="chart-card">
      <Card>
        <Row className="chart-header" justify="space-between" align="middle">
          <h3>{title}</h3>
          {showSwitcher && isStack && (
            <Checkbox
              onChange={() => {
                setShowEmpty(!showEmpty);
              }}
              checked={showEmpty}
            >
              Show empty values
            </Checkbox>
          )}
          {showSwitcher && (
            <Space align="center">
              <span>Show By {admLevelName.singular}</span>
              <Switch size="small" checked={isStack} onChange={setIsStack} />
            </Space>
          )}
        </Row>
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
        ) : isStack ? (
          <Chart
            height={50 * chartData.length + 188}
            type="BARSTACK"
            data={chartData}
            wrapper={false}
            horizontal={true}
            series={{ left: "10%" }}
            loading={loading}
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
