import React, { useMemo } from "react";
import "./style.scss";
import { Space, Card, Divider, Row, Tag } from "antd";
import { api, store, uiText } from "../../lib";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { ProfileTour } from "./components";
import moment from "moment";
import { useCallback } from "react";
import { useState } from "react";
import { useEffect } from "react";

const Profile = () => {
  const { forms, user: authUser } = store.useState((s) => s);
  const { trained } = authUser;

  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;

  const [userAdminstration, setUserAdminstration] = useState(null);

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const descriptionData = text.profileDes;

  const trainedBadge = useMemo(() => {
    if (trained) {
      return <Tag color="warning">Trained</Tag>;
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

  const fetchUserAdmin = useCallback(async () => {
    try {
      const { data: _userAdm } = await api.get(
        `administration/${authUser.administration.id}`
      );
      setUserAdminstration(_userAdm);
    } catch (error) {
      console.error(error);
    }
  }, [authUser]);

  useEffect(() => {
    fetchUserAdmin();
  }, [fetchUserAdmin]);

  const fullAdministrationName = userAdminstration?.full_name
    ?.split("|")
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
        <h1>{text.myProfile}</h1>
        <ul className="profile-detail">
          <li>
            <h3>{text.nameLabel}</h3>
            <Space size="large" align="center">
              <span>{authUser?.name}</span>
              <span style={{ fontStyle: "italic" }}>
                {authUser?.role?.value}
              </span>
            </Space>
          </li>
          <li>
            <h3>{text.userPhoneNumber}</h3>
            <Space size="large" align="center">
              <span>{authUser?.phone_number}</span>
            </Space>
          </li>
          <li>
            <h3>{text.roleLabel}</h3>
            <Space size="large" align="center">
              <span>{authUser?.role?.value}</span>
            </Space>
          </li>
          <li>
            <h3>{text.userOrganisation}</h3>
            <Space size="large" align="center">
              <span>{authUser?.organisation?.name}</span>
            </Space>
          </li>
          <li>
            <h3>{text.userDesignation}</h3>
            <Space size="large" align="center">
              <span>{authUser?.designation?.name}</span>
            </Space>
          </li>
          <li>
            <h3>{text.administrationLabel}</h3>
            <p>{fullAdministrationName || authUser?.administration?.name}</p>
          </li>
          <li>
            <h3>{text.questionnairesLabel}</h3>
            <Space size="large" align="center">
              {forms.map((qi, qiI) => (
                <span key={qiI}>{qi.name}</span>
              ))}
            </Space>
          </li>
          <li>
            <h3>{text.lastLoginLabel}</h3>
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
