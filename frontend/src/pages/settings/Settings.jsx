/* TODO: DELETE COMPLETELY */
import React, { useMemo } from "react";
import "./style.scss";
import { Row, Col, Card, Button, Divider } from "antd";
import { store, config, uiText } from "../../lib";
import { Link } from "react-router-dom";
import { Breadcrumbs, DescriptionPanel } from "../../components";

const Settings = () => {
  const { user: authUser } = store.useState((s) => s);
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const panels = [
    {
      title: text.orgPanelTitle,
      buttonLabel: text.orgPanelButton,
      access: "organisation",
      description: <div>{text.orgPanelText}</div>,
      link: "/control-center/master-data/organisations",
      image: "/assets/personal-information.png",
    },
  ];

  const selectedPanels = panels.filter((p) =>
    config.checkAccess(authUser?.role_detail, p.access)
  );

  return (
    <div id="settings">
      <Row justify="space-between">
        <Breadcrumbs
          pagePath={[
            {
              title: text.settings,
              link: "/settings",
            },
          ]}
        />
      </Row>
      <DescriptionPanel
        description={text.settingsDescriptionPanel}
        title={text.settings}
      />
      <Divider />
      <Row gutter={[16, 16]}>
        {selectedPanels.map((panel, index) => (
          <Col className="card-wrapper" span={12} key={index}>
            <Card bordered={false} hoverable>
              <div className="row">
                <div className="flex-1">
                  <h2>{panel.title}</h2>
                  <span>{panel.description}</span>
                  <Link to={panel.link} className="explore">
                    <Button type="primary" shape="round">
                      {panel.buttonLabel}
                    </Button>
                  </Link>
                </div>
                <div>
                  <img src={panel.image} width={100} height={100} />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default React.memo(Settings);
