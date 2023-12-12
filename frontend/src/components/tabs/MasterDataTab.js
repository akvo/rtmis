import React from "react";
import { Tabs } from "antd";
import { useNavigate } from "react-router-dom";

const { TabPane } = Tabs;

const MasterDataTab = ({ tabBarExtraContent }) => {
  const pathname = window.location.pathname;
  const navigate = useNavigate();

  return (
    <Tabs
      size="large"
      activeKey={pathname}
      onChange={(key) => navigate(key)}
      tabBarExtraContent={tabBarExtraContent}
    >
      <TabPane tab="Administrative List" key="/master-data">
        &nbsp;
      </TabPane>
      <TabPane tab="Attributes" key="/master-data/attributes">
        &nbsp;
      </TabPane>
      <TabPane tab="Entities" key="/master-data/entities/">
        &nbsp;
      </TabPane>
      <TabPane tab="Entity Types" key="/master-data/entity-types/">
        &nbsp;
      </TabPane>
      <TabPane tab="Organisations" key="/master-data/organisations">
        &nbsp;
      </TabPane>
    </Tabs>
  );
};

export default MasterDataTab;
