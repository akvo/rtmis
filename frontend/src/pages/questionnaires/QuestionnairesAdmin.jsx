import React from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Divider,
  Table,
  ConfigProvider,
  Empty,
  Checkbox,
} from "antd";
import { store } from "../../lib";
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
  const { forms } = store.useState((s) => s);

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
            dataSource={forms}
            loading={!forms.length}
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
