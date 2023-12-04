import React, { useMemo, useState } from "react";
import "./style.scss";
import { Space, Card, Divider, Row, Tag, Typography } from "antd";
import { store, uiText } from "../../lib";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { ProfileTour } from "./components";
import moment from "moment";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";

const descriptionData =
  "This page shows your current user setup. It also shows the most important activities for your current user setup";

const { Text } = Typography;

const Profile = () => {
  const [showPasscode, setShowPasscode] = useState(false);
  const { forms, user: authUser, language } = store.useState((s) => s);
  const { trained } = authUser;
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const trainedBadge = useMemo(() => {
    if (trained) {
      return (
        <Tag color="warning" style={{ marginBottom: 11 }}>
          Trained
        </Tag>
      );
    }
  }, [trained]);

  const pagePath = [
    {
      title: "Control Center",
      link: "/control-center",
    },
    {
      title:
        (
          <Space align="center" size={15}>
            {authUser?.name}
            {trainedBadge}
          </Space>
        ) || "Profile",
    },
  ];

  const fullAdministrationName = window.dbadm
    .find((x) => x.id === authUser.administration.id)
    ?.full_name?.split("|")
    .join(" - ");

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
              <span style={{ fontStyle: "italic" }}>
                {authUser?.role?.value}
              </span>
            </Space>
          </li>
          <li>
            <h3>Phone Number</h3>
            <Space size="large" align="center">
              <span>{authUser?.phone_number}</span>
            </Space>
          </li>
          <li>
            <h3>Role</h3>
            <Space size="large" align="center">
              <span>{authUser?.role?.value}</span>
            </Space>
          </li>
          <li>
            <h3>Organization</h3>
            <Space size="large" align="center">
              <span>{authUser?.organisation?.name}</span>
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
            <p>{fullAdministrationName || authUser?.administration?.name}</p>
          </li>
          <li>
            <h3>Questionnaires</h3>
            <Space size="large" align="center">
              {forms.map((qi, qiI) => (
                <span key={qiI}>{qi.name}</span>
              ))}
            </Space>
          </li>
          <li>
            <h3>{text.formPasscode}</h3>
            <Space size="large" align="center">
              <span
                onClick={() => setShowPasscode(!showPasscode)}
                style={{ cursor: "pointer" }}
              >
                {showPasscode ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </span>
              <Text
                style={{ fontSize: "18px" }}
                copyable={{ text: authUser?.passcode }}
                strong
              >
                {authUser?.passcode
                  ? showPasscode
                    ? authUser.passcode
                    : "********"
                  : "-"}
              </Text>
            </Space>
          </li>
          <li>
            <h3>Last login</h3>
            <Space size="large" align="center">
              <span>
                {authUser?.last_login
                  ? moment
                      .unix(authUser.last_login)
                      .format("MMMM Do YYYY, h:mm:ss a")
                  : "-"}
              </span>
            </Space>
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default React.memo(Profile);
