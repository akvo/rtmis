import React, { useMemo } from "react";
import "./style.scss";
import { Row, Col, Card, Button } from "antd";
import { store, config, uiText } from "../../lib";
import { Link } from "react-router-dom";
import { PanelApprovals, PanelSubmissions } from "./components";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { ControlCenterTour } from "./components";

const ControlCenter = () => {
  const { user: authUser } = store.useState((s) => s);
  const { language } = store.useState((s) => s);

  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const { roles, checkAccess } = config;

  const panels = useMemo(() => {
    return [
      {
        key: "approvals",
        access: "approvals",
        render: (
          <Col key="approvals-panel" span={24}>
            <PanelApprovals />
          </Col>
        ),
      },
      {
        key: "submission",
        access: "form",
        render: (
          <Col key="submission-panel" span={24}>
            <PanelSubmissions />
          </Col>
        ),
      },
    ];
  }, []);

  const selectedPanels = useMemo(() => {
    if (!authUser?.role_detail) {
      return [];
    }

    const panelOrder = roles.find(
      (r) => r.id === authUser.role_detail.id
    )?.control_center_order;

    if (!panelOrder) {
      return [];
    }

    const filteredAndOrderedPanels = panelOrder
      .map((orderKey) =>
        panels.find(
          (panel) =>
            panel.key === orderKey &&
            checkAccess(authUser.role_detail, panel.access)
        )
      )
      .filter((panel) => panel);

    return filteredAndOrderedPanels;
  }, [panels, roles, checkAccess, authUser]);

  return (
    <>
      <div className="description-container">
        <Row justify="space-between">
          <Breadcrumbs
            pagePath={[
              {
                title: "Control Center",
                link: "/control-center",
              },
            ]}
          />
          <ControlCenterTour />
        </Row>
        <DescriptionPanel description={text.ccDescriptionPanel} />

        <div className="profile-container">
          <h2>RTMIS Control Center</h2>
          <div className="profle-wrapper">
            <img src="/assets/profile.png" />
            <div>
              <h2>Hello {authUser?.name || ""},</h2>
              <p>
                {authUser?.role?.value} | {authUser.designation?.name}
                {authUser.organisation?.name &&
                  `- ${authUser.organisation?.name}`}
              </p>
              <p>
                Last Login:{" "}
                {new Date(authUser?.last_login * 1000)
                  .toISOString()
                  .replace("T", " ")
                  .slice(0, 19)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="table-section">
        <div className="table-wrapper">
          <Row gutter={[16, 16]}>
            {selectedPanels.map((panel, index) => {
              if (panel?.render) {
                return panel.render;
              }
              const cardOnly = selectedPanels.filter((x) => !x?.render);
              const isFullWidth =
                cardOnly.length === 1 ||
                (selectedPanels.length % 2 === 1 &&
                  selectedPanels.length - 1 === index);
              return (
                <Col
                  className="card-wrapper"
                  span={isFullWidth ? 24 : 12}
                  key={index}
                >
                  <div bordered={false} hoverable>
                    <div className="row">
                      <div className="flex-1">
                        <h2>{panel?.title}</h2>
                        <span>{panel?.description}</span>
                        <Link to={panel?.link} className="explore">
                          <Button type="primary" shape="round">
                            {panel?.buttonLabel}
                          </Button>
                        </Link>
                      </div>
                      <div>
                        <img src={panel?.image} width={100} height={100} />
                      </div>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>
      </div>
    </>
  );
};

export default ControlCenter;
