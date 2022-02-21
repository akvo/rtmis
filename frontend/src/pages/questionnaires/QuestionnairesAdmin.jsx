import React, { useState, useEffect } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Divider,
  Table,
  message,
  ConfigProvider,
  Empty,
  Checkbox,
} from "antd";
import { api } from "../../lib";
import { Breadcrumbs } from "../../components";

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Approvals",
  },
  {
    title: "Manage Questionnaires Approvals",
  },
];

const QuestionnairesAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState([]);

  const columns = [
    {
      title: "Questionnaire",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Questionnaire Description",
      dataIndex: "description",
      render: (cell) => cell || <span>-</span>,
    },
    {
      title: "Community",
      dataIndex: "community",
      render: (cell) => <Checkbox checked={cell} />,
    },
    {
      title: "Ward",
      dataIndex: "ward",
      render: (cell) => <Checkbox checked={cell} />,
    },
    {
      title: "Sub-County",
      dataIndex: "subcounty",
      render: (cell) => <Checkbox checked={cell} />,
    },
  ];

  const handleChange = () => {
    // setCurrentPage(e.current);
  };

  useEffect(() => {
    setLoading(true);
    api
      .get(`forms`)
      .then((res) => {
        setDataset(res.data);
        setLoading(false);
      })
      .catch((err) => {
        message.error("Could not load questionnaires");
        setLoading(false);
        console.error(err);
      });
  }, []);

  return (
    <div id="questionnaires">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
        </Col>
      </Row>
      <Divider />
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 30 }}
      >
        <ConfigProvider renderEmpty={() => <Empty description="No data" />}>
          <Table
            columns={columns}
            dataSource={dataset}
            loading={loading}
            onChange={handleChange}
            // pagination={{
            //   total: totalCount,
            //   pageSize: 10,
            // }}
            rowKey="id"
          />
        </ConfigProvider>
      </Card>
    </div>
  );
};

export default React.memo(QuestionnairesAdmin);
