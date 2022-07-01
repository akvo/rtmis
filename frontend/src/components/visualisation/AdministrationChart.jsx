import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import { Card, Row, Checkbox } from "antd";
import { api, store, uiText, queue } from "../../lib";
import { useNotification } from "../../util/hooks";
import { takeRight, sumBy, isNil, orderBy } from "lodash";
import { Chart } from "../../components";
import PropTypes from "prop-types";
import { Color } from "../../components/chart/options/common";

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
  source = source.map((d) => {
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
          total: !isNil(stackRes?.score) ? dc.value * stackRes.score : dc.value,
        };
      }),
    };
  });
  if (type === "CRITERIA") {
    source = orderBy(source, [
      function (e) {
        return sumBy(e.stack, "total");
      },
    ]);
  }
  return source;
};

const AdministrationChart = ({ current, index }) => {
  const [dataset, setDataset] = useState([]);
  const [showEmpty, setShowEmpty] = useState(false);
  const [parent, setParent] = useState(null);
  const { notify } = useNotification();
  const {
    selectedForm: formId,
    administration,
    language,
  } = store.useState((s) => s);

  const { next } = queue.useState((q) => q);
  const runCall = index === next;
  const loading = next <= index && administration.length < window.levels.length;

  const { id, title, stack, options, type, horizontal = true } = current;
  const selectedAdministration = takeRight(administration, 1)[0] || null;

  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  /*
  const onAdminClick = (e) => {
    queue.update((s) => {
      s.next = null;
    });
    const adminRes = (
      selectedAdministration?.levelName === takeRight(window.levels, 1)[0]?.name
        ? takeRight(administration, 2)[0]
        : takeRight(administration, 1)[0]
    ).children?.find((c) => c.name.toLowerCase() === e.toLowerCase());
    if (adminRes?.id) {
      store.update((s) => {
        if (
          selectedAdministration?.levelName ===
          takeRight(window.levels, 1)[0]?.name
        ) {
          s.administration.length = s.administration.length - 1;
        }
        s.administration = [
          ...s.administration,
          config.fn.administration(adminRes.id),
        ];
      });
    }
  };
  */
  useEffect(() => {
    let adminId = null;
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
      adminId = takeRight(administration, 1)[0]?.id;
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
        adminId = takeRight(administration, 2)[0]?.id;
      }
    }
    if (formId && adminId && (type === "CRITERIA" || id) && runCall) {
      const method = type === "CRITERIA" ? "post" : "get";
      const base = type.toLowerCase();
      const payload =
        type === "CRITERIA"
          ? options.map((o) => ({ name: o.name, options: o.options }))
          : {};

      let url = `chart/${base}/${formId}?`;
      url += `administration=${adminId}`;
      url += type === "ADMINISTRATION" ? `&question=${id}` : "";

      api[method](url, payload)
        .then((res) => {
          setDataset(
            transformDefaultData(res.data.data, type, stack?.options, options)
          );
        })
        .catch((e) => {
          console.error(e);
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
    stack,
    options,
    type,
    notify,
    text,
    administration,
    parent,
    runCall,
  ]);

  const filtered = useMemo(() => {
    return showEmpty
      ? dataset
      : dataset.filter((d) => sumBy(d.stack, "value") > 0);
  }, [dataset, showEmpty]);

  const highlighted = useMemo(() => {
    return selectedAdministration?.levelName ===
      takeRight(window.levels, 1)[0]?.name
      ? selectedAdministration.name
      : null;
  }, [selectedAdministration]);

  const chartTitleSuffix = useMemo(() => {
    const { name, levelName } = selectedAdministration;
    const level = levelName.toLowerCase();
    let plural = "";
    if (level === "national") {
      plural = "counties";
    }
    if (level === "county") {
      plural = "subcounties";
    }
    if (level === "sub-county") {
      plural = "wards";
    }
    if (level === "ward") {
      plural = "ward";
    }
    return (
      <>
        : {name} {plural}
      </>
    );
  }, [selectedAdministration]);

  return (
    <Card className="chart-wrap">
      <Row justify="space-between" align="middle">
        <h3>
          {title}
          {chartTitleSuffix}
        </h3>
        <Checkbox
          className="no-print"
          onChange={() => {
            setShowEmpty(!showEmpty);
          }}
          checked={showEmpty}
        >
          {text.showEmpty}
        </Checkbox>
      </Row>
      <div className="chart-inner">
        <Chart
          // callbacks={{ onClick: onAdminClick }}
          height={50 * filtered.length + 188}
          type="BARSTACK"
          data={filtered}
          wrapper={false}
          horizontal={horizontal}
          series={{ left: "10%" }}
          highlighted={highlighted}
          loading={loading}
          extra={{ animation: false }}
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
  current: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    stack: PropTypes.any,
    options: PropTypes.array,
  }),
};
export default React.memo(AdministrationChart);
