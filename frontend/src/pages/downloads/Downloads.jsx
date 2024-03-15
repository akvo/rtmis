import React from "react";
import "./style.scss";
import { Layout } from "antd";
import Sidebar from "../../components/sidebar";
import ExportData from "./ExportData";

const Downloads = () => {
  return (
    <div id="downloads">
      <Layout>
        <Sidebar />
        <Layout className="site-layout">
          <ExportData />
        </Layout>
      </Layout>
    </div>
  );
};

export default React.memo(Downloads);
