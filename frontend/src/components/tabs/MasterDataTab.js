import React, { useMemo } from "react";
import { Tabs } from "antd";
import { useNavigate } from "react-router-dom";
import { store, uiText } from "../../lib";

const { TabPane } = Tabs;

const MasterDataTab = ({ tabBarExtraContent }) => {
  const pathname = window.location.pathname;
  const navigate = useNavigate();

  const language = store.useState((s) => s.language);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  return (
    <Tabs
      size="large"
      activeKey={pathname}
      onChange={(key) => navigate(key)}
      tabBarExtraContent={tabBarExtraContent}
    >
      <TabPane tab={text.admTabTitle} key="/master-data">
        &nbsp;
      </TabPane>
      <TabPane tab={text.attrTabTitle} key="/master-data/attributes">
        &nbsp;
      </TabPane>
      <TabPane tab={text.entityTabTitle} key="/master-data/entities/">
        &nbsp;
      </TabPane>
      <TabPane tab={text.entityTypes} key="/master-data/entity-types/">
        &nbsp;
      </TabPane>
      <TabPane tab={text.orgTabTitle} key="/master-data/organisations">
        &nbsp;
      </TabPane>
    </Tabs>
  );
};

export default MasterDataTab;
