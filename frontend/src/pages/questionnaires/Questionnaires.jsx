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
  message,
  ConfigProvider,
  Empty,
  Checkbox,
} from "antd";
import { Link } from "react-router-dom";
import { api } from "../../lib";

const { Title } = Typography;

const Questionnaires = () => {
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
      title: "County",
      dataIndex: "county",
      render: () => <Checkbox />,
    },
    {
      title: "National",
      dataIndex: "national",
      render: () => <Checkbox />,
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

export default React.memo(Questionnaires);
