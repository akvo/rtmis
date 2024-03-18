import React, { useMemo } from "react";
import "./style.scss";
import { Row, Col } from "antd";
import { Layout } from "antd";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { DownloadTable } from "./components";
import Sidebar from "../../components/sidebar";
import { store, uiText } from "../../lib";

const Downloads = () => {
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const pagePath = [
    {
      title: text.downloadTitle,
      link: "/downloads",
    },
  ];

  return (
    <div id="downloads">
      <Layout>
        <Sidebar />
        <Layout className="site-layout">
          <div id="exportData">
            <div className="description-container">
              <Row justify="space-between">
                <Col>
                  <Breadcrumbs pagePath={pagePath} />
                  <DescriptionPanel description={text.exportPanelText} />
                </Col>
              </Row>
            </div>
            <div className="table-section">
              <div className="table-wrapper">
                <div
                  style={{ padding: 0, minHeight: "40vh" }}
                  bodystyle={{ padding: 0 }}
                >
                  <DownloadTable type={null} />
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </Layout>
    </div>
  );
};

export default React.memo(Downloads);
