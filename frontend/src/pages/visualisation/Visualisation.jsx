import React, { useState, useEffect } from "react";
import "./style.scss";
import { Row, Col, Card, Divider, Collapse } from "antd";
import { PlusSquareOutlined, CloseSquareOutlined } from "@ant-design/icons";
import { store } from "../../lib";
import { VisualisationFilters, Map } from "../../components";
const { Panel } = Collapse;

const Visualisation = () => {
  const [dataset, setDataset] = useState([]);
  const { selectedForm, forms, questionGroups } = store.useState(
    (state) => state
  );
  useEffect(() => {
    setDataset(() => {
      return questionGroups.map((q) => ({
        title: q.name,
        content: "Lorem ipsum dolor sit amet.",
      }));
    });
  }, [questionGroups]);

  return (
    <div id="visualisation">
      <VisualisationFilters />
      <Divider />
      <Card style={{ padding: 0, minHeight: "40vh", textAlign: "left" }}>
        <Row>
          <Col span={14} padding={20}>
            <h2>{forms?.find((f) => f.id === selectedForm)?.name}</h2>
            <Collapse
              onChange={() => {}}
              expandIcon={({ isActive }) =>
                isActive ? (
                  <CloseSquareOutlined
                    style={{ color: "#E00000B3", fontSize: "16px" }}
                  />
                ) : (
                  <PlusSquareOutlined
                    style={{ color: "#707070B3", fontSize: "16px" }}
                  />
                )
              }
              expandIconPosition="right"
            >
              {dataset.map((d, dI) => (
                <Panel key={dI} header={d.title}>
                  <p>{d.content}</p>
                </Panel>
              ))}
            </Collapse>
          </Col>
          <Col span={8} offset={2}>
            <Map markerData={{ features: [] }} style={{ height: 400 }} />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default React.memo(Visualisation);
