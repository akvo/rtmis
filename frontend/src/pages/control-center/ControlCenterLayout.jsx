import React from "react";
import "./style.scss";
import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/sidebar";

const ControlCenterLayout = () => {
  return (
    <div id="control-center">
      <Layout>
        <Sidebar />
        <Layout className="site-layout">
          <Outlet />
        </Layout>
      </Layout>
    </div>
  );
};

export default React.memo(ControlCenterLayout);
