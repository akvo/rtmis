import React from "react";
import "./style.scss";
import { Space, Card, Divider, Row } from "antd";
import { store, config } from "../../lib";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { PanelApprovals, PanelDataUpload, ProfileTour } from "./components";
const descriptionData =
  " Lorem ipsum dolor sit, amet consectetur adipisicing elit. Velit amet omnis dolores. Ad eveniet ex beatae dolorum placeat impedit iure quaerat neque sit, quasi magni provident aliquam harum cupiditate iste?";
const Profile = () => {
  const { forms, user: authUser } = store.useState((s) => s);

  const pagePath = [
    {
      title: "Control Center",
      link: "/control-center",
    },
    {
      title: authUser?.name || "Profile",
    },
  ];

  return (
    <div id="profile">
      <Row justify="space-between">
        <Breadcrumbs pagePath={pagePath} />
        <ProfileTour />
      </Row>
      <DescriptionPanel description={descriptionData} />
      <Divider />
      <Card style={{ padding: 0, marginBottom: 12 }}>
        <h1>My Profile</h1>
        <ul className="profile-detail">
          <li>
            <Space size="large" align="center">
              <span>{authUser?.name}</span>
              <span>·</span>
              <span>{authUser?.administration?.name}</span>
            </Space>
          </li>
          <li>
            <h3>Organization</h3>
            <p>Ministry of Health - Kisumu Subcounty</p>
          </li>
          <li>
            <h3>Questionnaires</h3>
            <Space size="large" align="center">
              {forms.map((qi, qiI) => (
                <span key={qiI}>{qi.name}</span>
              ))}
            </Space>
          </li>
        </ul>
      </Card>
      {config.checkAccess(authUser?.role_detail, "form") && <PanelDataUpload />}
      {config.checkAccess(authUser?.role_detail, "approvals") && (
        <PanelApprovals />
      )}
    </div>
  );
};

export default React.memo(Profile);
