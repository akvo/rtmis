import React from "react";
import "./style.scss";
import { Space, Card, Divider, Row } from "antd";
import { store, config } from "../../lib";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { PanelApprovals, PanelDataUpload, ProfileTour } from "./components";
const descriptionData =
  "This page shows your current user setup. It also shows the most important activities for your current user setup";
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
            <h3>Name</h3>
            <Space size="large" align="center">
              <span>{authUser?.name}</span>
            </Space>
          </li>
          <li>
            <h3>Role</h3>
            <Space size="large" align="center">
              <span>{authUser?.role?.value}</span>
            </Space>
          </li>
          <li>
            <h3>Designation</h3>
            <Space size="large" align="center">
              <span>{authUser?.designation?.name}</span>
            </Space>
          </li>
          <li>
            <h3>Administration</h3>
            <p>{authUser?.administration?.name}</p>
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
