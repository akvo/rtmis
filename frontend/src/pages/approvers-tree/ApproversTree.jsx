import React, { useState, useEffect } from "react";
import "./style.scss";
import { Row, Col, Card, Divider } from "antd";
import { Breadcrumbs, TreeRenderer } from "../../components";
import { store } from "../../lib";
import ApproverFilters from "../../components/filters/ApproverFilters";

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Manage Approvers",
  },
];
const ApproversTree = () => {
  const [dataset, setDataset] = useState([]);
  const { forms } = store.useState((s) => s);

  useEffect(() => {
    setDataset([
      {
        id: 0,
        name: "Questionnaire",
        children: forms.map((dt) => ({
          ...dt,
          user: null,
          active: false,
        })),
      },
    ]);
  }, [forms]);

  return (
    <div id="approversTree">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
        </Col>
      </Row>
      <Divider />
      <ApproverFilters loading={false} />
      <Divider />
      <Card style={{ padding: 0, minHeight: "40vh" }}>
        <TreeRenderer nodes={dataset} />
      </Card>
    </div>
  );
};

export default React.memo(ApproversTree);
