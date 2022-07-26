import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import { useParams } from "react-router-dom";
import { Row, Col, Tabs, Affix, Select } from "antd";
import { uiText, store, config, api } from "../../lib";
import { capitalize } from "lodash";
import {
  CardVisual,
  TableVisual,
  ChartVisual,
  ReportVisual,
} from "./components";
import { Maps } from "../../components";
import { useNotification } from "../../util/hooks";
import moment from "moment";

const { TabPane } = Tabs;

const Dashboard = () => {
  const { formId } = useParams();
  const selectedForm = window?.forms?.find((x) => String(x.id) === formId);
  const current = window?.dashboard?.find((x) => String(x.form_id) === formId);

  const [dataset, setDataset] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [wait, setWait] = useState(true);
  const { notify } = useNotification();

  const { active: activeLang } = store.useState((s) => s.language);
  const countiesAdm = window.dbadm.filter((d) => d.parent === 1);
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [allData, setAllData] = useState([]);

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  useEffect(() => {
    store.update((s) => {
      s.administration = [config.fn.administration(1)];
    });
    setWait(false);
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
    if (formId && !wait) {
      setDataset({});
      setLoading(true);
      const { counties_questions, national_questions } = current.params;
      // generate URL
      const countiesURL = counties_questions.join("&counties_questions=");
      const nationalURL = national_questions.join("&national_questions=");
      const url = `glaas/${formId}?counties_questions=${countiesURL}&national_questions=${nationalURL}`;
      api
        .get(url)
        .then((res) => {
          setDataset(res.data);
          setAllData(res.data);
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
      setLoading(false);
    }
  }, [formId, text, wait, current, notify]);

  useEffect(() => {
    if (!selectedCounty && !Object.keys(dataset).length) {
      setDataset(allData);
    }
    if (selectedCounty && !Object.keys(dataset).length) {
      const countyName = window.dbadm
        .find((d) => d.id === selectedCounty)
        ?.name?.toLowerCase();
      const filterCounties = allData.counties.filter(
        (c) => c.loc.toLowerCase() === countyName
      );
      setDataset({ ...allData, counties: filterCounties });
    }
  }, [allData, selectedCounty, dataset]);

  const changeTab = (tabKey) => {
    setActiveTab(tabKey);
    setActiveItem(current.tabs[tabKey]);
  };

  const renderColumn = (cfg, index) => {
    switch (cfg.type) {
      case "chart":
        return (
          <ChartVisual
            key={index}
            chartConfig={{
              ...cfg,
              data: dataset[cfg.from] || [],
              index: index,
            }}
            loading={loading}
          />
        );
      case "maps":
        return (
          <Maps
            key={index}
            mapConfig={{
              ...cfg,
              data: dataset?.[cfg.from] || [],
              index: index,
            }}
            loading={loading}
            national
          />
        );
      case "table":
        return (
          <TableVisual
            key={index}
            tableConfig={{
              ...cfg,
              data: dataset?.[cfg.from] || [],
              index: index,
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
              data: dataset?.[cfg.from] || [],
              index: index,
              lastUpdate: moment().format("L"),
            }}
            customTotal={window.dbadm.filter((d) => d.level === 2).length}
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
            <h1>{`${selectedForm.name} Data`}</h1>
          </div>
          <div className="county-filter-wrapper">
            <Select
              placeholder="Select County"
              style={{ width: 200 }}
              onChange={(e) => {
                setDataset({});
                setSelectedCounty(e);
              }}
              onClear={() => {
                setDataset({});
                setSelectedCounty(null);
              }}
              getPopupContainer={(trigger) => trigger.parentNode}
              dropdownMatchSelectWidth={false}
              value={selectedCounty || []}
              disabled={!countiesAdm.length}
              allowClear
              showSearch
              filterOption={true}
              optionFilterProp="children"
            >
              {countiesAdm.map((optionValue, optionIdx) => (
                <Select.Option key={optionIdx} value={optionValue.id}>
                  {optionValue.name}
                </Select.Option>
              ))}
            </Select>
          </div>
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
                  className="row-wrapper"
                  justify="space-between"
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
