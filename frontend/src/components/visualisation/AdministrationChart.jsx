import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./style.scss";
import { Card, Row, Checkbox } from "antd";
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
  const [prevForm, setPrevForm] = useState(null);
  const { notify } = useNotification();
  const { id, title, stack, options, horizontal = true } = config;
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
  const selectedAdministration = takeRight(administration, 1)[0] || null;
  const fetchAdministration = (adminId) => {
    store.update((s) => {
      s.loadingAdministration = true;
    });
    api
      .get(`administration/${adminId}`)
      .then((res) => {
        store.update((s) => {
          if (
            selectedAdministration?.levelName ===
            takeRight(window.levels, 1)[0]?.name
          ) {
            s.administration.length = s.administration.length - 1;
          }
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
  };
  const onAdminClick = (e) => {
    if (loadingAdministration || !e) {
      return;
    }
    const adminRes = (
      selectedAdministration?.levelName === takeRight(window.levels, 1)[0]?.name
        ? takeRight(administration, 2)[0]
        : takeRight(administration, 1)[0]
    ).children?.find((c) => c.name.toLowerCase() === e.toLowerCase());
    if (adminRes?.id) {
      fetchAdministration(adminRes.id);
    }
  };
  const fetchData = useCallback(
    (form, question, adminId) => {
      setLoading(true);
      const url = `chart/administration/${form}?question=${question}&administration=${adminId}`;
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
          setPrevForm(formId);
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
    },
    [formId, stack?.options, options, notify]
  );
  useEffect(() => {
    if (formId && id && administration.length) {
      if (
        takeRight(administration, 1)[0]?.levelName !==
        takeRight(window.levels, 1)[0]?.name
      ) {
        fetchData(formId, id, takeRight(administration, 1)[0]?.id);
      } else {
        if (formId !== prevForm) {
          fetchData(formId, id, takeRight(administration, 2)[0]?.id);
        }
      }
    }
  }, [formId, id, administration, prevForm, fetchData]);
  const filtered = hideEmpty
    ? dataset.filter((d) => sumBy(d.stack, "value") > 0)
    : dataset;
  const highlighted = useMemo(() => {
    return selectedAdministration?.levelName ===
      takeRight(window.levels, 1)[0]?.name
      ? selectedAdministration.name
      : null;
  }, [selectedAdministration]);

  return (
    <Card className="chart-wrap">
      <Row justify="space-between" align="middle">
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
          highlighted={highlighted}
          loading={loadingAdministration || loading}
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

AdministrationChart.propTypes = {
  formId: PropTypes.number.isRequired,
  config: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string,
    stack: PropTypes.any,
    options: PropTypes.array,
  }),
};
export default React.memo(AdministrationChart);
