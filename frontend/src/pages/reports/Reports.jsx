import React, { useMemo } from "react";
import "./style.scss";
import { Row, Col, Card, Button } from "antd";
import { store, config, uiText } from "../../lib";
import { VisualisationFilters } from "../../components";
import { Link } from "react-router-dom";

const Reports = () => {
  const { selectedForm } = store.useState((state) => state);

  const filtered = config?.templates.filter((t) => t.formId === selectedForm);

  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  return (
    <div id="reports">
      <VisualisationFilters persist={true} />
      <h2>{text.chooseTemplate}</h2>
      {filtered.length ? (
        <Row gutter={[16, 16]}>
          {filtered.map((t, tI) => (
            <Col span={12} key={tI}>
              <Card>
                <h3>{t.name}</h3>
                <h4>{t.title}</h4>
                <Link to={`/report/${t.id}`}>
                  <Button type="primary">{text.selectText}</Button>
                </Link>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <p className="text-muted">{text.noTemplate}</p>
      )}
    </div>
  );
};

export default React.memo(Reports);
