import React from "react";
import "./style.scss";
import { Layout } from "antd";
import Sidebar from "../../components/sidebar";
import ExportData from "./ExportData";

const AdministrationDownload = () => {
  return (
    <div id="administration-download">
      <Layout>
        <Sidebar />
        <Layout className="site-layout">
          <ExportData />
        </Layout>
      </Layout>
    </div>
  );
};

export default React.memo(AdministrationDownload);
