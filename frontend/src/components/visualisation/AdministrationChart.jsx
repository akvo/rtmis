import React, { useState, useEffect } from "react";
import "./style.scss";
import { Card, Spin, Row, Checkbox } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { api, store } from "../../lib";
import { useNotification } from "../../util/hooks";
import { max, takeRight, sumBy } from "lodash";
import { Chart } from "../../components";
import PropTypes from "prop-types";
import { Color } from "../../components/chart/options/common";

const AdministrationChart = ({ config, formId }) => {
  const [dataset, setDataset] = useState([]);
  const [chartColors, setChartColors] = useState([]);
  const [hideEmpty, setHideEmpty] = useState(false);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();
  const { id, title, type, stack, options, horizontal = true } = config;
  const { administration, loadingAdministration } = store.useState(
    (state) => state
  );
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
  const onAdminClick = (e) => {
    if (loadingAdministration || !e) {
      return;
    }
    const adminRes = takeRight(administration, 1)[0]?.children?.find(
      (c) => c.name.toLowerCase() === e.toLowerCase()
    );
    if (
      adminRes?.id &&
      takeRight(administration, 1)[0]?.level !== "Sub-County"
    ) {
      store.update((s) => {
        s.loadingAdministration = true;
      });
      api
        .get(`administration/${adminRes.id}`)
        .then((res) => {
          store.update((s) => {
            s.administration = [
              ...s.administration,
              {
                id: res.data.id,
                name: res.data.name,
                levelName: res.data.level_name,
                children: res.data.children,
                childLevelName: res.data.children_level_name,
              },
            ];
          });
        })
        .catch((err) => {
          notify({
            type: "error",
            message: "Could not load region",
          });
          console.error(err);
        })
        .finally(() => {
          store.update((s) => {
            s.loadingAdministration = false;
          });
        });
    }
  };
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
  }, [formId, id, notify, type, stack, options, selectedAdministration]);
  const filtered = hideEmpty
    ? dataset.filter((d) => sumBy(d.stack, "value") > 0)
    : dataset;
  return (
    <Card className="chart-wrap">
      <Row justify="space-between">
        <h3>{title}</h3>
        <Checkbox
          onChange={() => {
            setHideEmpty(!hideEmpty);
          }}
          checked={hideEmpty}
        >
          Hide empty values
        </Checkbox>
      </Row>
      <div className="chart-inner">
        {loading ? (
          <Spin
            indicator={<LoadingOutlined style={{ color: "#1b91ff" }} spin />}
          />
        ) : (
          <Chart
            height={max([
              70 * filtered.length + 50,
              filtered.length < 2 ? 230 : filtered.length < 3 ? 280 : 330,
            ])}
            type="BARSTACK"
            data={filtered}
            wrapper={false}
            horizontal={horizontal}
            extra={{ color: chartColors }}
            series={{ left: "10%" }}
            callbacks={{ onClick: onAdminClick }}
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
