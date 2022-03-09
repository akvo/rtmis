import React from "react";
import "./style.scss";
import { Space, Card, Divider } from "antd";
import { store } from "../../lib";
import { Breadcrumbs } from "../../components";
import { PanelDataUpload } from "./components";

const Profile = () => {
  const { forms, user: authUser } = store.useState((s) => s);

  const pagePath = [
    {
      title: "Control Center",
      link: authUser?.role?.value === "User" ? false : "/control-center",
    },
    {
      title: authUser?.name || "Profile",
    },
  ];

  return (
    <div id="profile">
      <Space>
        <Breadcrumbs pagePath={pagePath} />
      </Space>
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
      <PanelDataUpload />
    </div>
  );
};

export default React.memo(Profile);
