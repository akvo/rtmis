import React from "react";
import "./style.scss";
import { Row, Col, Card, Button } from "antd";
import { store, config } from "../../lib";
import { Link } from "react-router-dom";
import { PanelApprovals, PanelDataUpload } from "../profile/components";

const ControlCenter = () => {
  const { user: authUser } = store.useState((s) => s);

  const panels = [
    {
      title: "Manage Data",
      buttonLabel: "Manage Data",
      access: "data",
      description:
        "Open defecation free (ODF) is a term used to describe communities that have shifted to using toilets instead of open defecation. This can happen, for example, after community-led total sanitation programs have been implemented.",
      link: "/data/manage",
      image: "/assets/big-data.png",
    },
    {
      title: "Exports",
      buttonLabel: "Data Exports",
      access: "data",
      description:
        "Community-led total sanitation (CLTS) is an approach used mainly in developing countries to improve sanitation and hygiene practices in a community. The approach tries to achieve behavior change in mainly rural people by a process of “triggering”, leading to spontaneous and long-term abandonment of open defecation practices.",
      link: "/data/export",
      image: "/assets/import.png",
    },
    {
      title: "Data Uploads",
      buttonLabel: "Data Uploads",
      access: authUser?.role.id === 4 ? "" : "form",
      description:
        "WASH is an acronym that stands for “water, sanitation and hygiene”.Universal, affordable and sustainable access to WASH is a key public health issue within international development and is the focus of the first two targets of Sustainable Development Goal 6 (SDG 6).",
      link: "/data/upload",
      image: "/assets/upload.png",
    },
    {
      title: "User Management",
      buttonLabel: "Manage Users",
      access: "user",
      description:
        "WASH is an acronym that stands for “water, sanitation and hygiene”.Universal, affordable and sustainable access to WASH is a key public health issue within international development and is the focus of the first two targets of Sustainable Development Goal 6 (SDG 6).",
      link: "/users",
      image: "/assets/personal-information.png",
    },
  ];

  const selectedPanels = panels.filter((p) =>
    config.checkAccess(authUser?.role_detail, p.access)
  );

  return (
    <div id="control-center">
      <h1>Control Center</h1>
      <Row gutter={[16, 16]}>
        {selectedPanels.map((panel, index) => (
          <Col className="card-wrapper" span={12} key={index}>
            <Card bordered={false} hoverable>
              <div className="row">
                <div className="flex-1">
                  <h2>{panel.title}</h2>
                  <p>{panel.description}</p>
                  <Link to={panel.link} className="explore">
                    <Button
                      type={panel.dev ? "default" : "primary"}
                      className={panel?.dev ? "dev" : ""}
                    >
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
        {authUser.role_detail.page_access.includes("approvals") && (
          <Col span={24}>
            <PanelApprovals />
          </Col>
        )}
        {authUser.role_detail.page_access.includes("form") && (
          <Col span={24}>
            <PanelDataUpload />
          </Col>
        )}
      </Row>
    </div>
  );
};

export default React.memo(ControlCenter);
