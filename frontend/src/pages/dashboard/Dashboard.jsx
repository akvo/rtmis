import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import { useParams } from "react-router-dom";
import { Row, Col, Tabs } from "antd";
import { VisualisationFilters } from "../../components";
import { useNotification } from "../../util/hooks";
import { api, uiText, store, config } from "../../lib";
import { capitalize, takeRight } from "lodash";
import { Maps } from "../../components";
import { CardVisual, TableVisual, ChartVisual } from "./components";
import { generateAdvanceFilterURL } from "../../util/filter";

const { TabPane } = Tabs;

const Dashboard = () => {
  const { formId } = useParams();
  const selectedForm = window?.forms?.find((x) => String(x.id) === formId);
  const current = window?.dashboard?.find((x) => String(x.form_id) === formId);
  const { notify } = useNotification();

  const { language, administration, advancedFilters } = store.useState(
    (s) => s
  );
  const { active: activeLang } = language;
  const [dataset, setDataset] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  useEffect(() => {
    store.update((s) => {
      s.administration = [config.fn.administration(1)];
    });
  }, []);

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
    const currentAdministration = takeRight(administration)?.[0]?.id;
    if (formId) {
      setDataset([]);
      setLoading(true);
      let url = `jmp/${formId}?administration=${currentAdministration}`;
      if (advancedFilters && advancedFilters.length) {
        url = generateAdvanceFilterURL(advancedFilters, url);
      }
      api
        .get(url)
        .then((res) => {
          setDataset(res.data);
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
  }, [formId, administration, notify, text, advancedFilters]);

  const changeTab = (tabKey) => {
    setActiveTab(tabKey);
    setActiveItem(current.tabs[tabKey]);
  };

  const renderColumn = (cfg, index) => {
    switch (cfg.type) {
      case "maps":
        return (
          <Maps
            key={index}
            mapConfig={{ ...cfg, data: dataset, index: index }}
            loading={loading}
          />
        );
      case "chart":
        return (
          <ChartVisual
            key={index}
            chartConfig={{ ...cfg, data: dataset, index: index }}
            loading={loading}
          />
        );
      case "table":
        return (
          <TableVisual
            key={index}
            tableConfig={{ ...cfg, data: dataset, index: index }}
            loading={loading}
          />
        );
      default:
        return (
          <CardVisual
            key={index}
            cardConfig={{
              ...cfg,
              data: dataset,
              index: index,
              lastUpdate: lastUpdate,
            }}
            loading={loading}
          />
        );
    }
  };

  return (
    <div id="dashboard">
      <div className="page-title-wrapper">
        <h1>{`${selectedForm.name} Data`}</h1>
      </div>
      <VisualisationFilters showFormOptions={false} />
      <Row className="main-wrapper" align="center">
        <Col span={24} align="center">
          {current?.tabs && (
            <>
              <Tabs activeKey={activeTab} onChange={changeTab}>
                {Object.keys(current.tabs).map((key) => {
                  const tabName = key
                    .split("_")
                    .map((x) => capitalize(x))
                    .join(" ");
                  return <TabPane tab={tabName} key={key}></TabPane>;
                })}
              </Tabs>
              {activeItem?.rows ? (
                activeItem.rows.map((row, index) => {
                  return (
                    <Row
                      key={`row-${index}`}
                      className="row-wrapper"
                      gutter={[10, 10]}
                    >
                      {row.map((r, ri) => renderColumn(r, ri))}
                    </Row>
                  );
                })
              ) : (
                <h4>No data</h4>
              )}
            </>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(Dashboard);
