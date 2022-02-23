import React, { useState, useEffect } from "react";
import "./style.scss";
import { Row, Col, Card, Divider } from "antd";
import { Breadcrumbs, TreeRenderer } from "../../components";
import { api } from "../../lib";
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
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState([]);

  useEffect(() => {
    setLoading(true);
    const url = `forms`;
    api
      .get(url)
      .then((res) => {
        setDataset([
          {
            id: 0,
            name: "Questionnaire",
            children: res.data.map((dt) => ({
              ...dt,
              user: null,
              active: false,
            })),
          },
        ]);
        setLoading(false);
      })
      .catch(() => {
        setDataset([]);
        setLoading(false);
      });
  }, []);

  return (
    <div id="approversTree">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
        </Col>
      </Row>
      <Divider />
      <ApproverFilters loading={loading} />
      <Divider />
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 30 }}
      >
        <TreeRenderer nodes={dataset} />
      </Card>
    </div>
  );
};

export default React.memo(ApproversTree);
