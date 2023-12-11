import React from "react";
import { Tabs } from "antd";
import { useNavigate } from "react-router-dom";

const { TabPane } = Tabs;

const EntityTab = ({ tabBarExtraContent }) => {
  const pathname = window.location.pathname;
  const navigate = useNavigate();

  return (
    <Tabs
      size="large"
      activeKey={pathname}
      onChange={(key) => navigate(key)}
      tabBarExtraContent={tabBarExtraContent}
    >
      <TabPane tab="Manage Entity" key="/master-data/entities/">
        &nbsp;
      </TabPane>
      <TabPane tab="Entity Data" key="/master-data/entities/data">
        &nbsp;
      </TabPane>
    </Tabs>
  );
};

export default EntityTab;
