import React, { useMemo, useEffect, useCallback, useState } from "react";
import "./style.scss";
import { Row, Col } from "antd";
import { Breadcrumbs, DescriptionPanel, DownloadTable } from "../../components";
import { api, store, uiText } from "../../lib";

const DownloadAdmData = () => {
  const [attributes, setAttributes] = useState([]);
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
      title: text.mdPanelTitle,
      link: "/control-center/master-data",
    },
    {
      title: text.prefilledDownloadTitle,
    },
  ];

  const fetchAttributes = useCallback(async () => {
    try {
      const { data: _attributes } = await api.get("/administration-attributes");
      setAttributes(_attributes);
    } catch {
      setAttributes([]);
    }
  }, []);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  return (
    <div id="exportData">
      <div className="description-container">
        <Row justify="space-between">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={text.prefilledPanelText}
              title={text.prefilledDownloadTitle}
            />
          </Col>
        </Row>
      </div>
      <div className="table-section">
        <div className="table-wrapper">
          <div
            style={{ padding: 0, minHeight: "40vh" }}
            bodyStyle={{ padding: 0 }}
          >
            <DownloadTable
              type="download_administration"
              infoCallback={(info) => {
                return attributes
                  .filter((a) =>
                    info?.attributes
                      ?.map((attr) => parseInt(attr, 10))
                      ?.includes(a.id)
                  )
                  ?.map((a) => a.name)
                  .join(", ");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DownloadAdmData);
