import React, { useMemo } from "react";
import "./style.scss";
import { Space, Card, Divider, Row, Tag } from "antd";
import { store } from "../../lib";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { ProfileTour } from "./components";
import moment from "moment";

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      onchange: null,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () {},
    };
  };

const descriptionData =
  "This page shows your current user setup. It also shows the most important activities for your current user setup";

const Profile = () => {
  const { forms, user: authUser } = store.useState((s) => s);
  // const { trained } = authUser;

  const trainedBadge = useMemo(() => {
    if (authUser?.trained) {
      return (
        <Tag color="warning" style={{ marginBottom: 11 }}>
          Trained
        </Tag>
      );
    }
  }, [authUser?.trained]);

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
    .find((x) => x.id === 322)
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
          <li data-testid="name">
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
          <li data-testid="role">
            <h3>Role</h3>
            <Space size="large" align="center">
              <span>{authUser?.role?.value}</span>
            </Space>
          </li>
          <li data-testid="organisation">
            <h3>Organization</h3>
            <Space size="large" align="center">
              <span>{authUser?.organisation?.name}</span>
            </Space>
          </li>
          <li data-testid="designation">
            <h3>Designation</h3>
            <Space size="large" align="center">
              <span>{authUser?.designation?.name}</span>
            </Space>
          </li>
          <li data-testid="administration">
            <h3>Administration</h3>
            <p>{fullAdministrationName || authUser?.administration?.name}</p>
          </li>
          <li data-testid="questionnaire">
            <h3>Questionnaires</h3>
            <Space size="large" align="center">
              {forms.map((qi, qiI) => (
                <span key={qiI}>{qi.name}</span>
              ))}
            </Space>
          </li>
          <li data-testid="last-login">
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
