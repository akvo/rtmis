import React from "react";
import "./style.scss";
import { Space, Card, Divider, Row } from "antd";
import { store, config } from "../../lib";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { PanelApprovals, PanelDataUpload } from "./components";
import { Tour } from "../../components";
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
  const steps = [
    {
      image: "/assets/tour/profile/1.png",
      title: "Control Center",
      description: "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
    },
    ...(config.checkAccess(authUser?.role_detail, "form")
      ? [
          {
            image: "/assets/tour/profile/2.png",
            title: "Data Uploads",
            description:
              "Velit amet omnis dolores. Ad eveniet ex beatae dolorum",
          },
        ]
      : []),
    ...(config.checkAccess(authUser?.role_detail, "approvals")
      ? [
          {
            image: "/assets/tour/profile/3.png",
            title: "Manage Approvals",
            description: "Placeat impedit iure quaerat neque sit quasi",
          },
          {
            image: "/assets/tour/profile/4.png",
            title: "Manage Approvers",
            description: "Magni provident aliquam harum cupiditate iste",
          },
        ]
      : []),
  ];

  return (
    <div id="profile">
      <Row justify="space-between">
        <Breadcrumbs pagePath={pagePath} />
        <Tour steps={steps} />
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
