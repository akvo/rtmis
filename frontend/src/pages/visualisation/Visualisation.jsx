import React, { useState, useEffect } from "react";
import "./style.scss";
import { Row, Col, Divider } from "antd";
import { store, queue } from "../../lib";
import {
  VisualisationFilters,
  Map,
  DataChart,
  AdministrationChart,
} from "../../components";
import { QuestionChart } from "./components";

const Visualisation = () => {
  const [current, setCurrent] = useState(null);
  const { selectedForm: formId, administration } = store.useState((s) => s);

  useEffect(() => {
    if (formId && administration.length) {
      setCurrent(window.visualisation.find((f) => f.id === formId));
      queue.update((s) => {
        s.next = 1;
      });
    }
  }, [formId, administration]);

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
                    current={cc}
                    index={ccI + 1}
                  />
                ) : (
                  <DataChart
                    key={`chart-${current.id}-${ccI}`}
                    current={cc}
                    index={ccI + 1}
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
