import React from "react";
import "./style.scss";
import { Row, Col, Card, Button, Divider } from "antd";
import { store, config } from "../../lib";
import { Link } from "react-router-dom";
import { PanelApprovals, PanelDataUpload } from "../profile/components";
import { Breadcrumbs, DescriptionPanel } from "../../components";

const ControlCenter = () => {
  const { user: authUser } = store.useState((s) => s);

  const panels = [
    {
      title: "Manage Data",
      buttonLabel: "Manage Data",
      access: "data",
      description: (
        <div>
          This is where you :
          <ul>
            <li>Add new data using webforms</li>
            <li>Bulk upload data using spreadsheets</li>
            <li>Export data</li>
          </ul>
        </div>
      ),
      link: "/data/manage",
      image: "/assets/big-data.png",
    },
    {
      title: "Exports",
      buttonLabel: "Data Exports",
      access: "data",
      description: (
        <div>
          This is where you :
          <ul>
            <li>Access exported data</li>
          </ul>
        </div>
      ),
      link: "/data/export",
      image: "/assets/import.png",
    },
    {
      title: "Data Uploads",
      buttonLabel: "Data Uploads",
      access: authUser?.role.id === 4 ? "" : "form",
      description: (
        <div>
          This is where you :
          <ul>
            <li>Download upload template</li>
            <li>Bulk upload new data</li>
            <li>Bulk upload existing data</li>
          </ul>
        </div>
      ),
      link: "/data/upload",
      image: "/assets/upload.png",
    },
    {
      title: "User Management",
      buttonLabel: "Manage Users",
      access: "user",
      description: (
        <div>
          This where you manage users based on their roles , regions and
          questionnaire access . You can :
          <ul>
            <li>Add new user</li>
            <li>Modify existing user</li>
            <li>Delete existing user</li>
          </ul>
        </div>
      ),
      link: "/users",
      image: "/assets/personal-information.png",
    },
  ];

  const selectedPanels = panels.filter((p) =>
    config.checkAccess(authUser?.role_detail, p.access)
  );

  return (
    <div id="control-center">
      <Breadcrumbs
        pagePath={[
          {
            title: "Control Center",
            link: "/control-center",
          },
        ]}
      />
      <DescriptionPanel description="Instant access to the all the administration pages and overview panels for data approvals." />
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
