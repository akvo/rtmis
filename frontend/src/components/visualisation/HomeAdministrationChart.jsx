import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import { Card, Row, Checkbox, Switch, Space } from "antd";
import { api, queue } from "../../lib";
import { useNotification } from "../../util/hooks";
import { sumBy, isNil, orderBy } from "lodash";
import _ from "lodash";
import { Chart } from "../../components";
import PropTypes from "prop-types";
import { Color } from "../../components/chart/options/common";

const HomeAdministrationChart = ({
  setup,
  formId,
  index,
  setMapValues,
  identifier = "",
}) => {
  const [dataset, setDataset] = useState([]);
  const [showEmpty, setShowEmpty] = useState(false);
  const [isStack, setIsStack] = useState(false);
  const [chartColors, setChartColors] = useState([]);

  const { notify } = useNotification();
  const { id, title, stack, options, type, horizontal = true } = setup;

  const { next, wait } = queue.useState((q) => q);

  const showAsMap = setup?.show_as_map;
  const runCall = index === next && !wait;
  const loading = next <= index;

  const getOptionColor = (name, index) => {
    return (
      Color.option.find((c) => {
        const lookUp = name?.toLowerCase();
        return lookUp
          ? c.keys?.some((keyStr) => keyStr.toLowerCase() === lookUp)
          : false;
      })?.color || Color.color[index]
    );
  };

  useEffect(() => {
    if (formId && (type === "CRITERIA" || id) && runCall) {
      const cacheName = `home-page-${identifier}-${title}`
        .replace(/ /g, "-")
        .toLowerCase();
      const url =
        (type === "CRITERIA" ? "chart/criteria/" : "chart/administration/") +
        `${formId}?` +
        (type === "ADMINISTRATION" ? `question=${id}&` : "") +
        (type === "CRITERIA" ? `cache=${cacheName}` : "");
      api[type === "CRITERIA" ? "post" : "get"](
        url,
        type === "CRITERIA"
          ? options.map((o) => ({
              name: o.name,
              options: o.options,
            }))
          : {}
      )
        .then((res) => {
          let temp = res.data?.data?.map((d) => {
            const optRes = stack?.options?.find(
              (op) => op.name.toLowerCase() === d.group.toLowerCase()
            );
            return {
              name: d.group,
              title: optRes?.title || d.group,
              stack: d.child.map((dc, dcI) => {
                const stackRes = options?.find(
                  (sO) => sO.name.toLowerCase() === dc.name.toLowerCase()
                );
                return {
                  name: dc.name,
                  title: stackRes?.title || dc.name,
                  value: dc.value,
                  color: stackRes?.color || getOptionColor(dc.name, dcI),
                  total: !isNil(stackRes?.score)
                    ? dc.value * stackRes.score
                    : dc.value,
                };
              }),
            };
          });
          if (type === "CRITERIA") {
            temp = orderBy(temp, [
              function (e) {
                return sumBy(e.stack, "total");
              },
            ]);
          }
          if (showAsMap) {
            setMapValues(temp);
          }
          setDataset(temp);
        })
        .catch(() => {
          notify({
            type: "error",
            message: "Could not load data",
          });
        })
        .finally(() => {
          queue.update((q) => {
            q.next = index + 1;
          });
        });
    }
  }, [
    formId,
    id,
    index,
    title,
    identifier,
    notify,
    options,
    stack,
    type,
    runCall,
    showAsMap,
    setMapValues,
  ]);

  const transformDataset = useMemo(() => {
    if (isStack) {
      return showEmpty
        ? dataset
        : dataset.filter((d) => sumBy(d.stack, "value") > 0);
    }
    // transform stack value
    let data = dataset.length ? dataset.flatMap((d) => d.stack) : [];
    data = _.chain(data)
      .groupBy("name")
      .map((g, gi) => ({
        name: gi,
        title: g[0]?.title,
        color: g[0]?.color,
        value: sumBy(g, "value"),
        total: sumBy(g, "total"),
      }))
      .value();
    data = orderBy(data, ["value"], ["asc"]);
    const colors = data.map((d) => d.color);
    setChartColors(colors);
    return data;
  }, [isStack, dataset, showEmpty]);

  return (
    <Card className="chart-wrap">
      <Row justify="space-between" align="middle">
        <h3>
          {isStack ? "County" : "National"} {title}
        </h3>
        {isStack && (
          <Checkbox
            onChange={() => {
              setShowEmpty(!showEmpty);
            }}
            checked={showEmpty}
          >
            Show empty values
          </Checkbox>
        )}
        <Space align="center">
          <span>Show By County</span>
          <Switch checked={isStack} onChange={setIsStack} />
        </Space>
      </Row>
      <div className="chart-inner">
        {isStack ? (
          <Chart
            height={50 * transformDataset.length + 188}
            type="BARSTACK"
            data={transformDataset}
            wrapper={false}
            horizontal={horizontal}
            series={{ left: "10%" }}
            loading={loading}
          />
        ) : (
          <Chart
            height={50 * transformDataset.length + 188}
            type="BAR"
            data={transformDataset}
            wrapper={false}
            horizontal={horizontal}
            loading={loading}
            extra={{ color: chartColors, animation: next === index + 1 }}
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
              top: 90,
              left: 120,
            }}
          />
        )}
      </div>
    </Card>
  );
};

HomeAdministrationChart.propTypes = {
  formId: PropTypes.number.isRequired,
  setup: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    stack: PropTypes.any,
    options: PropTypes.array,
  }),
};
export default React.memo(HomeAdministrationChart);
