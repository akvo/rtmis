import React from "react";
import "./style.scss";
import { Row, Col, Card, Button } from "antd";
import { store, config } from "../../lib";
import { VisualisationFilters } from "../../components";
import { Link } from "react-router-dom";

const Reports = () => {
  const { selectedForm } = store.useState((state) => state);

  const filtered = config?.templates.filter((t) => t.formId === selectedForm);

  return (
    <div id="reports">
      <VisualisationFilters persist={true} />
      <h2>Choose a template</h2>
      {filtered.length ? (
        <Row gutter={[16, 16]}>
          {filtered.map((t, tI) => (
            <Col span={12} key={tI}>
              <Card>
                <h3>{t.name}</h3>
                <h4>{t.title}</h4>
                <Link to={`/report/${t.id}`}>
                  <Button type="primary">Select</Button>
                </Link>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <p className="text-muted">No templates found</p>
      )}
    </div>
  );
};

export default React.memo(Reports);
