import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import { Card, Spin } from "antd";
import { LoadingOutlined, SwapOutlined } from "@ant-design/icons";
import { api, store, uiText, queue } from "../../lib";
import { useNotification } from "../../util/hooks";
import { Chart } from "../../components";
import PropTypes from "prop-types";
import { Color } from "../../components/chart/options/common";
import { generateAdvanceFilterURL } from "../../util/filter";

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

const transformDefaultData = (source, type, stack, options) => {
  const colors = [];
  const data = source.map((d, dI) => {
    if (type === "BARSTACK" && stack) {
      const optRes = stack?.options?.find(
        (op) => op.name.toLowerCase() === d.group.toLowerCase()
      );
      colors.push(optRes?.color || getOptionColor(d.group, dI));
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
          };
        }),
      };
    }
    if (options?.length) {
      const optRes =
        options?.find((op) => op.name.toLowerCase() === d.name.toLowerCase()) ||
        null;
      colors.push(optRes?.color || getOptionColor(d.name, dI));
      return {
        name: optRes?.title || optRes?.name || d.name,
        value: d.value,
      };
    }
    colors.push(getOptionColor(d.name, dI));
    return d;
  });
  return { colors: colors, data: data };
};

const DataChart = ({ current, index }) => {
  const [dataset, setDataset] = useState(null);
  const { notify } = useNotification();
  const {
    selectedForm: formId,
    language,
    advancedFilters,
  } = store.useState((s) => s);

  const { next, wait } = queue.useState((q) => q);
  const runCall = index === next && !wait;
  const loading = next <= index;

  const { id, title, type, stack, options, horizontal = true } = current;

  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  useEffect(() => {
    if (formId && id && runCall) {
      let url =
        type === "BARSTACK" && stack?.id
          ? `chart/data/${formId}?question=${id}&stack=${stack.id}`
          : `chart/data/${formId}?question=${id}`;
      if (advancedFilters && advancedFilters.length) {
        url += generateAdvanceFilterURL(advancedFilters);
      }
      api
        .get(url)
        .then((res) => {
          setDataset(transformDefaultData(res.data.data, type, options));
        })
        .catch(() => {
          notify({
            type: "error",
            message: text.errorDataLoad,
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
    notify,
    type,
    stack,
    options,
    runCall,
    text.errorDataLoad,
  ]);

  const chartTitle =
    type === "BARSTACK" ? (
      <h3>
        {title}
        <SwapOutlined />
        {stack.title}
      </h3>
    ) : (
      <h3>{title}</h3>
    );

  return (
    <Card className="chart-wrap">
      {chartTitle}
      <div className="chart-inner">
        {loading ? (
          <Spin
            indicator={<LoadingOutlined style={{ color: "#1b91ff" }} spin />}
          />
        ) : (
          <Chart
            height={type === "PIE" ? 290 : 50 * dataset.length + 188}
            type={type}
            data={dataset?.data || []}
            wrapper={false}
            horizontal={horizontal}
            extra={{ color: dataset?.colors || [], animation: false }}
            series={
              type === "PIE"
                ? {
                    left: "5%",
                    right: "27%",
                    top: "middle",
                    radius: "85",
                  }
                : {
                    left: "10%",
                  }
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
          />
        )}
      </div>
    </Card>
  );
};

DataChart.propTypes = {
  current: PropTypes.shape({
    id: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    title: PropTypes.string,
    stack: PropTypes.any,
    options: PropTypes.array,
  }),
};
export default React.memo(DataChart);
