import React, { useState, useEffect } from "react";
import "./style.scss";
import { Row, Col, Divider } from "antd";
import { store } from "../../lib";
import {
  VisualisationFilters,
  Map,
  DataChart,
  AdministrationChart,
} from "../../components";
import { QuestionChart } from "./components";

const Visualisation = () => {
  const [current, setCurrent] = useState(null);
  const [nextCall, setNextCall] = useState(0);
  const { selectedForm, administration } = store.useState((state) => state);

  useEffect(() => {
    if (selectedForm && window.visualisation) {
      const configRes = window.visualisation.find((f) => f.id === selectedForm);
      if (configRes) {
        setCurrent(configRes);
        setNextCall(0);
      }
    }
  }, [selectedForm]);

  useEffect(() => {
    setNextCall(0);
  }, [administration]);

  return (
    <div id="visualisation">
      <VisualisationFilters />
      <Row gutter={12} className="main-wrap" justify="space-between">
        <Col span={current?.charts?.length ? 12 : 24}>
          {!!current && (
            <Map
              markerData={{ features: [] }}
              style={{ height: 600 }}
              current={current}
            />
          )}
        </Col>
        {!!current?.charts?.length && (
          <Col span={12}>
            <div className="charts-wrap">
              {!!current?.chartListTitle && (
                <Divider orientation="left" orientationMargin="0">
                  {current?.chartListTitle}
                </Divider>
              )}
              {current?.charts?.map((cc, ccI) =>
                cc.type === "ADMINISTRATION" || cc.type === "CRITERIA" ? (
                  <AdministrationChart
                    key={`chart-${current.id}-${ccI}`}
                    formId={current.id}
                    current={cc}
                    runNow={nextCall === ccI}
                    nextCall={() => setNextCall(ccI + 1)}
                  />
                ) : (
                  <DataChart
                    key={`chart-${current.id}-${ccI}`}
                    formId={current.id}
                    current={cc}
                    runNow={nextCall === ccI}
                    nextCall={() => setNextCall(ccI + 1)}
                  />
                )
              )}
            </div>
          </Col>
        )}
      </Row>
      <QuestionChart />
    </div>
  );
};

export default React.memo(Visualisation);
