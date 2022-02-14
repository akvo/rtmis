import React, { useState, useEffect } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Button,
  Breadcrumb,
  Divider,
  Typography,
  Table,
  message,
  ConfigProvider,
  Empty,
} from "antd";
import { Link } from "react-router-dom";
import { PlusSquareOutlined, CloseSquareOutlined } from "@ant-design/icons";
import { api } from "../../lib";
import { DataFilters } from "../../components";

const { Title } = Typography;

const renderDetails = (record) => {
  return (
    <div>
      <div className="expand-wrap">Details View</div>
      <div className="expand-footer">
        <div>
          <Link to={"/user/edit/" + record.id}>
            <Button type="secondary">Delete</Button>
          </Link>{" "}
          <Button danger>Upload CSV</Button>
        </div>
      </div>
    </div>
  );
};

const ManageData = () => {
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [dataset, setDataset] = useState([]);
  const [form, setForm] = useState(null);
  const [forms, setForms] = useState([]);
  const [query, setQuery] = useState("");

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Last Updated",
      dataIndex: "updated_at",
      render: () => "Saturday 17 November 2021",
    },
    {
      title: "User",
      dataIndex: "user",
      render: () => "Ouma Odhiambo",
    },
    {
      title: "Region",
      dataIndex: "administration",
      render: (administration) => administration?.name || "-",
    },
    Table.EXPAND_COLUMN,
  ];

  const handleChange = () => {
    // setCurrentPage(e.current);
  };

  useEffect(() => {
    setInitializing(true);
    api
      .get("forms/")
      .then((res) => {
        setForms(res.data);
        setInitializing(false);
      })
      .catch((err) => {
        message.error("Could not load forms");
        setInitializing(false);
        console.error(err);
      });
  }, []);

  useEffect(() => {
    if (form) {
      setLoading(true);
      api
        .get(`web/form/${form}/`)
        .then((res) => {
          setDataset(res.data);
          setLoading(false);
        })
        .catch((err) => {
          message.error("Could not load forms");
          setLoading(false);
          console.error(err);
        });
    }
  }, [form]);

  return (
    <div id="manageData">
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
                Manage Data
              </Title>
            </Breadcrumb.Item>
          </Breadcrumb>
        </Col>
      </Row>
      <Divider />
      <DataFilters
        query={query}
        setQuery={setQuery}
        form={form}
        setForm={setForm}
        forms={forms}
        loading={loading || initializing}
      />
      <Divider />
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 0 }}
      >
        <ConfigProvider
          renderEmpty={() => (
            <Empty description={form ? "No data" : "No form selected"} />
          )}
        >
          <Table
            columns={columns}
            dataSource={dataset.question_group}
            loading={loading || initializing}
            onChange={handleChange}
            // pagination={{
            //   total: totalCount,
            //   pageSize: 10,
            // }}
            rowKey="name"
            expandable={{
              expandedRowRender: renderDetails,
              expandIcon: ({ expanded, onExpand, record }) =>
                expanded ? (
                  <CloseSquareOutlined
                    onClick={(e) => onExpand(record, e)}
                    style={{ color: "#e94b4c" }}
                  />
                ) : (
                  <PlusSquareOutlined
                    onClick={(e) => onExpand(record, e)}
                    style={{ color: "#7d7d7d" }}
                  />
                ),
            }}
          />
        </ConfigProvider>
      </Card>
    </div>
  );
};

export default React.memo(ManageData);
