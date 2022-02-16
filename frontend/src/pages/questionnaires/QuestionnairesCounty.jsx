import React, { useState, useEffect } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Breadcrumb,
  Divider,
  Typography,
  Table,
  ConfigProvider,
  Empty,
  Checkbox,
} from "antd";
import { Link } from "react-router-dom";

const { Title } = Typography;

const QuestionnairesCounty = () => {
  const [loading] = useState(false);
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
    setDataset([
      {
        id: 952774024,
        name: "G1-1 Households V1",
        description: "Lorem ipsum dolor sit amet",
        community: false,
        ward: false,
        subcounty: false,
      },
      {
        id: 952774025,
        name: "G2-2 Households V1",
        description: "Lorem ipsum dolor sit amet",
        community: true,
        ward: true,
        subcounty: true,
      },
      {
        id: 952774026,
        name: "G3-2 Households V2",
        description: "Lorem ipsum dolor sit amet",
        community: false,
        ward: false,
        subcounty: false,
      },
      {
        id: 952774027,
        name: "G3-1 Households V1",
        description: "Lorem ipsum dolor sit amet",
        community: false,
        ward: false,
        subcounty: false,
      },
      {
        id: 952774028,
        name: "G4-2 Households V1",
        description: "Lorem ipsum dolor sit amet",
        community: true,
        ward: true,
        subcounty: true,
      },
      {
        id: 952774029,
        name: "G2-1 Households V2",
        description: "Lorem ipsum dolor sit amet",
        community: false,
        ward: false,
        subcounty: false,
      },
      {
        id: 952774030,
        name: "G1-3 Households V1",
        description: "Lorem ipsum dolor sit amet",
        community: false,
        ward: false,
        subcounty: false,
      },
      {
        id: 952774031,
        name: "G1-2 Households V1",
        description: "Lorem ipsum dolor sit amet",
        community: true,
        ward: true,
        subcounty: true,
      },
      {
        id: 952774032,
        name: "G22-2 Households V2",
        description: "Lorem ipsum dolor sit amet",
        community: false,
        ward: false,
        subcounty: false,
      },
      {
        id: 952774033,
        name: "G1-11 Households V1",
        description: "Lorem ipsum dolor sit amet",
        community: false,
        ward: false,
        subcounty: false,
      },
    ]);
  }, []);

  return (
    <div id="questionnaires">
      <Row justify="space-between">
        <Col>
          <Breadcrumb
            separator={
              <h2 className="ant-typography" style={{ display: "inline" }}>
                {">"}
              </h2>
            }
          >
            <Breadcrumb.Item>
              <Link to="/control-center">
                <Title style={{ display: "inline" }} level={2}>
                  Control Center
                </Title>
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Title style={{ display: "inline" }} level={2}>
                Approvals
              </Title>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Title style={{ display: "inline" }} level={2}>
                Manage Questionnaires Approvals
              </Title>
            </Breadcrumb.Item>
          </Breadcrumb>
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

export default React.memo(QuestionnairesCounty);
