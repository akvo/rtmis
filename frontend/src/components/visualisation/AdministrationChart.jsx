import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./style.scss";
import { Card, Row, Checkbox } from "antd";
import { api, store } from "../../lib";
import { useNotification } from "../../util/hooks";
import { takeRight, sumBy, isNil, orderBy } from "lodash";
import { Chart } from "../../components";
import PropTypes from "prop-types";
import { Color } from "../../components/chart/options/common";

const AdministrationChart = ({ config, formId }) => {
  const [dataset, setDataset] = useState([]);
  const [hideEmpty, setHideEmpty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parent, setParent] = useState(null);
  const { notify } = useNotification();
  const { id, title, stack, options, type, horizontal = true } = config;
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
              parent: res.data.parent,
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
    (adminId) => {
      if (formId && adminId && (type === "CRITERIA" || id)) {
        setLoading(true);
        const url =
          (type === "CRITERIA" ? "chart/criteria/" : "chart/administration/") +
          `${formId}?` +
          (type === "ADMINISTRATION" ? `question=${id}&` : "") +
          `administration=${adminId}`;
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
    },
    [formId, id, stack?.options, options, type, notify]
  );
  useEffect(() => {
    if (administration.length && !loadingAdministration) {
      if (
        administration.length === 1 ||
        (takeRight(administration, 1)[0]?.levelName !==
          takeRight(window.levels, 1)[0]?.name &&
          (parent === null ||
            (!!parent && !!takeRight(administration, 1)[0]?.parent)))
      ) {
        if (administration.length === 1) {
          setParent(null);
        } else if (takeRight(administration, 2)[0]?.id) {
          setParent(takeRight(administration, 2)[0].id);
        }
        fetchData(takeRight(administration, 1)[0]?.id);
      } else {
        if (
          parent === null ||
          (!!parent &&
            !!takeRight(administration, 1)[0]?.parent &&
            takeRight(administration, 1)[0]?.parent !== parent)
        ) {
          if (takeRight(administration, 2)[0]?.id) {
            setParent(takeRight(administration, 2)[0].id);
          }
          fetchData(takeRight(administration, 2)[0]?.id);
        }
      }
    }
  }, [administration, loadingAdministration, fetchData, parent]);
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
          height={50 * filtered.length + 188}
          type="BARSTACK"
          data={filtered}
          wrapper={false}
          horizontal={horizontal}
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
    id: PropTypes.number,
    title: PropTypes.string,
    stack: PropTypes.any,
    options: PropTypes.array,
  }),
};
export default React.memo(AdministrationChart);
