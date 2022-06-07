import React from "react";
import "./style.scss";
import { Divider, Button, Row } from "antd";
import { config } from "../../lib";
import {
  VisualisationFilters,
  DataChart,
  AdministrationChart,
} from "../../components";
import { useParams, Link } from "react-router-dom";
import IFrame from "./IFrame";

const Reports = () => {
  const { templateId } = useParams();
  const template = config?.templates?.find((t) => t.id === +templateId);

  const handlePrint = () => {
    const print = document.getElementById("print-iframe");
    const title = "RTMIS";
    print.contentDocument.title = title;
    print.focus();
    print.contentWindow.print();
  };

  if (!template) {
    return <h3 className="text-muted">Template not found</h3>;
  }

  return (
    <div id="report">
      <VisualisationFilters persist={true} hidden={true} />
      <div className="report-header">
        <Row justify="space-between" align="middle">
          <div className="toolbar">
            <Button className="light mx" onClick={handlePrint}>
              Print
            </Button>
            <Link to="/reports">
              <Button className="light">Back</Button>
            </Link>
          </div>
        </Row>
      </div>
      {!!template?.charts?.length && (
        <IFrame className="print-frame">
          <div id="report">
            <div className="report-header" style={{ fontSize: 15 }}>
              <Row justify="space-between" align="middle">
                <h2>{template?.title}</h2>
              </Row>
              <h3>{template?.description}</h3>
            </div>
            {!!template?.charts?.length && (
              <div className="charts-wrap">
                {!!template?.chartListTitle && (
                  <Divider orientation="left" orientationMargin="0">
                    {template?.chartListTitle}
                  </Divider>
                )}
                {template?.charts?.map((cc, ccI) =>
                  cc.type === "ADMINISTRATION" || cc.type === "CRITERIA" ? (
                    <AdministrationChart
                      key={`chart-${template.id}-${ccI}`}
                      formId={template.formId}
                      config={cc}
                    />
                  ) : (
                    <DataChart
                      key={`chart-${template.id}-${ccI}`}
                      formId={template.formId}
                      config={cc}
                    />
                  )
                )}
              </div>
            )}
            {template?.footer && (
              <div className="report-footer">
                <h2>{template?.footer.title}</h2>
                <h4>{template?.footer.description}</h4>
              </div>
            )}
          </div>
        </IFrame>
      )}
    </div>
  );
};

export default React.memo(Reports);
