import React, { useMemo } from "react";
import "./style.scss";
import { Row, Col } from "antd";
import { Breadcrumbs, DescriptionPanel, DownloadTable } from "../../components";
import { store, uiText } from "../../lib";

const ExportData = () => {
  const { forms } = store.useState((state) => state);
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.dataDownloadTitle,
    },
  ];

  return (
    <div id="exportData">
      <div className="description-container">
        <Row justify="space-between">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={text.exportPanelText}
              title={text.dataDownloadTitle}
            />
          </Col>
        </Row>
      </div>
      <div className="table-section">
        <div className="table-wrapper">
          <div
            style={{ padding: 0, minHeight: "40vh" }}
            bodystyle={{ padding: 0 }}
          >
            <DownloadTable
              infoCallback={(info) => {
                return forms.find((f) => f.id === info?.form_id)?.name || "-";
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ExportData);
