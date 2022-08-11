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
      <TabPane tab="Manage Users" key="/users" data-testid="manage-users">
        &nbsp;
      </TabPane>
      <TabPane
        tab="Data Validation Tree"
        key="/approvers/tree"
        data-testid="manage-data-validation"
      >
        &nbsp;
      </TabPane>
    </Tabs>
  );
};

export default UserTab;
