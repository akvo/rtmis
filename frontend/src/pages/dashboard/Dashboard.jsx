import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import { useParams } from "react-router-dom";
import { Row, Col, Tabs, Affix } from "antd";
import { VisualisationFilters } from "../../components";
import { useNotification } from "../../util/hooks";
import { api, uiText, store } from "../../lib";
import { capitalize, takeRight } from "lodash";
import { Maps } from "../../components";
import {
  CardVisual,
  TableVisual,
  ChartVisual,
  ReportVisual,
} from "./components";
import { generateAdvanceFilterURL } from "../../util/filter";
import { useCallback } from "react";

const { TabPane } = Tabs;

const Dashboard = () => {
  const { formId } = useParams();
  const selectedForm = window?.forms?.find((x) => String(x.id) === formId);
  const current = window?.dashboard?.find((x) => String(x.form_id) === formId);
  const { notify } = useNotification();

  const [dataset, setDataset] = useState([]);
  const [dataPeriod, setDataPeriod] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const { active: activeLang } = store.useState((s) => s.language);
  const advancedFilters = store.useState((s) => s.advancedFilters);
  const administration = store.useState((s) => s.administration);
  const [wait, setWait] = useState(true);

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const currentAdministration = takeRight(administration)?.[0];
  const prefixText =
    currentAdministration?.level === 0
      ? currentAdministration?.levelName
      : currentAdministration?.name;
  const admLevelName = useMemo(() => {
    const { level } = currentAdministration;
    let name = { plural: "Counties", singular: "County" };
    if (level === 1) {
      name = { plural: "Sub-Counties", singular: "Sub-County" };
    }
    if (level === 2) {
      name = { plural: "Wards", singular: "Ward" };
    }
    if (level === 3) {
      name = { plural: "Ward", singular: "Ward" };
    }
    return name;
  }, [currentAdministration]);

  const fetchUserAdmin = useCallback(async () => {
    try {
      const { data: countyAdm } = await api.get(`administration/${1}`);
      store.update((s) => {
        s.administration = [countyAdm];
      });
      setWait(false);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchUserAdmin();
  }, [fetchUserAdmin]);

  useEffect(() => {
    if (selectedForm?.id) {
      store.update((s) => {
        s.questionGroups = selectedForm.content.question_group;
      });
      setActiveTab("overview");
      setActiveItem(current?.tabs?.["overview"]);
    }
  }, [selectedForm, current]);

  useEffect(() => {
    if (formId && !lastUpdate) {
      api
        .get(`last_update/${formId}`)
        .then((res) => setLastUpdate(res.data.last_update));
    }
  }, [formId, lastUpdate]);

  useEffect(() => {
    if (formId && !wait) {
      setLoading(true);
      setDataset([]);
      setDataPeriod([]);
      let url = `jmp/${formId}?administration=${currentAdministration?.id}`;
      if (advancedFilters && advancedFilters.length) {
        url = generateAdvanceFilterURL(advancedFilters, url);
      }
      if (current?.extra_params) {
        const params = Object.keys(current.extra_params).reduce(
          (prev, curr) => {
            const ids = current.extra_params[curr].map((x) => `${curr}=${x}`);
            return [...prev, ...ids];
          },
          []
        );
        url += `&${params.join("&")}`;
      }
      api
        .get(url)
        .then((res) => {
          setDataset(res.data);
          if (!current?.no_period) {
            const url = `submission/period/${formId}?administration=${currentAdministration?.id}`;
            api
              .get(url)
              .then((res) => {
                setDataPeriod(res.data);
              })
              .catch(() => {
                notify({
                  type: "error",
                  message: text.errorDataLoad,
                });
              });
          }
        })
        .catch(() => {
          notify({
            type: "error",
            message: text.errorDataLoad,
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [
    formId,
    current,
    currentAdministration,
    notify,
    text,
    advancedFilters,
    wait,
  ]);

  const changeTab = (tabKey) => {
    setActiveTab(tabKey);
    setActiveItem(current.tabs[tabKey]);
  };

  const renderColumn = (cfg, index) => {
    // filter data by total > 0
    const filteredDataByTotal = dataset.filter((d) => d.total > 0);
    switch (cfg.type) {
      case "maps":
        return (
          <Maps
            key={index}
            mapConfig={{
              ...cfg,
              data: filteredDataByTotal,
              index: index,
            }}
            loading={loading}
          />
        );
      case "chart":
        return (
          <ChartVisual
            key={index}
            chartConfig={{
              ...cfg,
              data: cfg.selector === "period" ? dataPeriod : dataset,
              index: index,
              admLevelName: admLevelName,
            }}
            loading={loading}
          />
        );
      case "table":
        return (
          <TableVisual
            key={index}
            tableConfig={{
              ...cfg,
              data: filteredDataByTotal,
              index: index,
              admLevelName: admLevelName,
            }}
            loading={loading}
          />
        );
      case "report":
        return <ReportVisual key={index} selectedForm={selectedForm} />;
      default:
        return (
          <CardVisual
            key={index}
            cardConfig={{
              ...cfg,
              data: dataset,
              index: index,
              lastUpdate: lastUpdate,
              admLevelName: admLevelName,
            }}
            loading={loading}
          />
        );
    }
  };

  return (
    <div id="dashboard">
      <Affix className="sticky-wrapper">
        <div>
          <div className="page-title-wrapper">
            <h1>{`${prefixText} ${selectedForm.name} Data`}</h1>
          </div>
          <VisualisationFilters showFormOptions={false} />
          <div className="tab-wrapper">
            {current?.tabs && (
              <Tabs
                activeKey={activeTab}
                onChange={changeTab}
                type="card"
                tabBarGutter={10}
              >
                {/* TODO:: For now we will hide the report tab */}
                {Object.keys(current.tabs)
                  .filter((x) => x.toLowerCase() !== "report")
                  .map((key) => {
                    let tabName = key;
                    if (
                      !["jmp", "glaas", "rush"].includes(
                        key.toLocaleLowerCase()
                      )
                    ) {
                      tabName = key
                        .split("_")
                        .map((x) => capitalize(x))
                        .join(" ");
                    } else {
                      tabName = key.toUpperCase();
                    }
                    return <TabPane tab={tabName} key={key}></TabPane>;
                  })}
              </Tabs>
            )}
          </div>
        </div>
      </Affix>
      <Row className="main-wrapper" align="center">
        <Col span={24} align="center">
          {current?.tabs && activeItem?.rows ? (
            activeItem.rows.map((row, index) => {
              return (
                <Row
                  key={`row-${index}`}
                  className="flexible-container row-wrapper"
                  gutter={[10, 10]}
                >
                  {row.map((r, ri) => renderColumn(r, ri))}
                </Row>
              );
            })
          ) : (
            <h4>No data</h4>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(Dashboard);
