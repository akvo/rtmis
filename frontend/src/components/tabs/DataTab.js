import React from "react";
import { Tabs } from "antd";
import { useNavigate } from "react-router-dom";

const { TabPane } = Tabs;

const UserTab = ({ tabBarExtraContent }) => {
  const pathname = window.location.pathname;
  const navigate = useNavigate();

  return (
    <Tabs
      size="large"
      activeKey={pathname}
      onChange={(key) => navigate(key)}
      tabBarExtraContent={tabBarExtraContent}
    >
      <TabPane tab="Manage Routine Data" key="/data/manage">
        &nbsp;
      </TabPane>
      <TabPane tab="Downloaded Data" key="/data/export">
        &nbsp;
      </TabPane>
    </Tabs>
  );
};

export default UserTab;
