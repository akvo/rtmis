import React, { useMemo } from "react";
import "./style.scss";
import { Space, Card, Divider, Row, Tag } from "antd";
import { store, uiText } from "../../lib";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { ProfileTour } from "./components";
import moment from "moment";

const descriptionData =
  "This page shows your current user setup. It also shows the most important activities for your current user setup";

const Profile = () => {
  const { forms, user: authUser } = store.useState((s) => s);
  const { trained } = authUser;

  const { language } = store.useState((s) => s);
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
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title:
        (
          <Space align="center" size={15}>
            {authUser?.name}
            {trainedBadge}
          </Space>
        ) || text.profileLabel,
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
      <DescriptionPanel
        description={descriptionData}
        title={text.profileLabel}
      />
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
