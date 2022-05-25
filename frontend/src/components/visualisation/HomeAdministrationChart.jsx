import React, { useState, useEffect } from "react";
import "./style.scss";
import { Card, Row, Checkbox } from "antd";
import { api } from "../../lib";
import { useNotification } from "../../util/hooks";
import { sumBy, isNil, orderBy } from "lodash";
import { Chart } from "../../components";
import PropTypes from "prop-types";
import { Color } from "../../components/chart/options/common";

const HomeAdministrationChart = ({ config, formId }) => {
  const [dataset, setDataset] = useState([]);
  const [showEmpty, setShowEmpty] = useState(false);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();
  const { id, title, stack, options, type, horizontal = true } = config;
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
    if (formId && (type === "CRITERIA" || id)) {
      setLoading(true);
      const url =
        (type === "CRITERIA"
          ? "chart/overview/criteria/"
          : "chart/administration/") +
        `${formId}?` +
        (type === "ADMINISTRATION" ? `question=${id}&` : "");
      api[type === "CRITERIA" ? "post" : "get"](
        url,
        type === "CRITERIA"
          ? options.map((o) => ({ name: o.name, options: o.options }))
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
          setDataset(temp);
        })
        .catch(() => {
          notify({
            type: "error",
            message: "Could not load data",
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [formId, id, notify, options, stack?.options, type]);
  const filtered = showEmpty
    ? dataset
    : dataset.filter((d) => sumBy(d.stack, "value") > 0);

  return (
    <Card className="chart-wrap">
      <Row justify="space-between" align="middle">
        <h3>{title}</h3>
        <Checkbox
          onChange={() => {
            setShowEmpty(!showEmpty);
          }}
          checked={showEmpty}
        >
          Show empty values
        </Checkbox>
      </Row>
      <div className="chart-inner">
        <Chart
          height={50 * filtered.length + 188}
          type="BARSTACK"
          data={filtered}
          wrapper={false}
          horizontal={horizontal}
          series={{ left: "10%" }}
          loading={loading}
          loadingOption={{
            text: "",
            color: "#1b91ff",
            lineWidth: 1,
          }}
        />
      </div>
    </Card>
  );
};

HomeAdministrationChart.propTypes = {
  formId: PropTypes.number.isRequired,
  config: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    stack: PropTypes.any,
    options: PropTypes.array,
  }),
};
export default React.memo(HomeAdministrationChart);
