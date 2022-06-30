import React, { useMemo } from "react";
import "./style.scss";
import { Row, Col, Card, Button, Divider } from "antd";
import { store, config, uiText } from "../../lib";
import { Link } from "react-router-dom";
import { PanelApprovals, PanelSubmissions } from "../control-center/components";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { ControlCenterTour } from "./components";

const ControlCenter = () => {
  const { user: authUser } = store.useState((s) => s);
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const panels = [
    {
      key: "manage-data",
      title: text.manageDataTitle,
      buttonLabel: text.manageDataButton,
      access: "data",
      description: <div>{text.manageDataText}</div>,
      link: "/data/manage",
      image: "/assets/big-data.png",
    },
    {
      key: "data-download",
      title: text.dataDownloadTitle,
      buttonLabel: text.dataDownloadButton,
      access: "data",
      description: <div>{text.dataDownloadText}</div>,
      link: "/data/export",
      image: "/assets/import.png",
    },
    {
      key: "data-upload",
      title: text.dataUploadTitle,
      buttonLabel: text.dataUploadButton,
      access: authUser?.role.id === 4 ? "" : "form",
      description: <div>{text.dataUploadText}</div>,
      link: "/data/upload",
      image: "/assets/upload.png",
    },
    {
      key: "manage-user",
      title: text.manageUserTitle,
      buttonLabel: text.manageUserButton,
      access: "user",
      description: <div>{text.manageUserText}</div>,
      link: "/users",
      image: "/assets/personal-information.png",
    },
    {
      title: text.orgPanelTitle,
      buttonLabel: text.orgPanelButton,
      access: "organisation",
      description: <div>{text.orgPanelText}</div>,
      link: "/organisations",
      image: "/assets/personal-information.png",
    },
  ];

  const selectedPanels = panels.filter((p) =>
    config.checkAccess(authUser?.role_detail, p.access)
  );

  return (
    <div id="control-center">
      <Row justify="space-between">
        <Breadcrumbs
          pagePath={[
            {
              title: "Control Center",
              link: "/control-center",
            },
          ]}
        />
        <ControlCenterTour />
      </Row>
      <DescriptionPanel description={text.ccDescriptionPanel} />
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
                    <Button type="primary">{panel.buttonLabel}</Button>
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
            <PanelSubmissions />
          </Col>
        )}
      </Row>
    </div>
  );
};

export default React.memo(ControlCenter);
