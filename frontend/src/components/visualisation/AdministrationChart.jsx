import React, { useState, useEffect } from "react";
import "./style.scss";
import { Card, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { api, store } from "../../lib";
import { useNotification } from "../../util/hooks";
import { takeRight } from "lodash";
import { Chart } from "../../components";
import PropTypes from "prop-types";
import { Color } from "../../components/chart/options/common";

const AdministrationChart = ({ config, formId }) => {
  const [dataset, setDataset] = useState([]);
  const [chartColors, setChartColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();
  const { id, title, type, stack, options, horizontal = true } = config;
  const { administration } = store.useState((state) => state);
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

  const selectedAdministration = takeRight(administration, 1)[0]?.id || null;
  useEffect(() => {
    if (formId && id && selectedAdministration) {
      setLoading(true);
      const url = `chart/administration/${formId}?question=${id}&administration=${selectedAdministration}`;
      api
        .get(url)
        .then((res) => {
          const colors = [];
          const temp = res.data?.data?.map((d, dI) => {
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
          });
          setChartColors(colors);
          setDataset(temp);
          setLoading(false);
        })
        .catch(() => {
          notify({
            type: "error",
            message: "Could not load data",
          });
          setLoading(false);
        });
    }
  }, [formId, id, notify, type, stack, options, selectedAdministration]);
  return (
    <Card className="chart-wrap">
      <h3>{title}</h3>
      <div className="chart-inner">
        {loading ? (
          <Spin
            indicator={<LoadingOutlined style={{ color: "#1b91ff" }} spin />}
          />
        ) : (
          <Chart
            height={80 * dataset.length}
            type="BARSTACK"
            data={dataset}
            wrapper={false}
            horizontal={horizontal}
            extra={{ color: chartColors }}
            series={{ left: "10%" }}
          />
        )}
      </div>
    </Card>
  );
};

AdministrationChart.propTypes = {
  formId: PropTypes.number.isRequired,
  config: PropTypes.shape({
    id: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    title: PropTypes.string,
    stack: PropTypes.any,
    options: PropTypes.array,
  }),
};
export default React.memo(AdministrationChart);
