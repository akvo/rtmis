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
import {
  PlusSquareOutlined,
  CloseSquareOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { api, store } from "../../lib";
import { DataFilters } from "../../components";

const { Title } = Typography;

const renderDetails = (record) => {
  return (
    <div>
      <div className="expand-wrap">
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {record.answer.map((answer, answerIdx) => (
              <tr key={answerIdx}>
                <td>{answer.question}</td>
                <td>{answer.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="expand-footer">
        <div>
          <Button danger>Delete</Button>
        </div>
        <div>
          <Button danger>Upload CSV</Button>
        </div>
      </div>
    </div>
  );
};

const ManageData = () => {
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState([]);
  const [query, setQuery] = useState("");

  const { administration, selectedForm } = store.useState((state) => state);

  const selectedAdministration =
    administration.length > 0
      ? administration[administration.length - 1]
      : null;

  const columns = [
    {
      title: "",
      dataIndex: "id",
      key: "id",
      render: () => <ExclamationCircleOutlined />,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      filtered: true,
      filteredValue: query.trim() === "" ? [] : [query],
      onFilter: (value, filters) =>
        filters.name.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: "Last Updated",
      dataIndex: "updated",
      render: (cell, row) => cell || row.created,
    },
    {
      title: "User",
      dataIndex: "created_by",
    },
    {
      title: "Region",
      dataIndex: "administration",
    },
    Table.EXPAND_COLUMN,
  ];

  const handleChange = () => {
    // setCurrentPage(e.current);
  };

  useEffect(() => {
    if (selectedForm) {
      setLoading(true);
      let url = `list/form-data/${selectedForm}/?page=1`;
      if (selectedAdministration?.id) {
        url += `&administration=${selectedAdministration.id}`;
      }
      api
        .get(url)
        .then((res) => {
          setDataset(res.data.data);
          setLoading(false);
        })
        .catch((err) => {
          message.error("Could not load forms");
          setLoading(false);
          console.error(err);
        });
    }
  }, [selectedForm, selectedAdministration]);

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
      <DataFilters query={query} setQuery={setQuery} loading={loading} />
      <Divider />
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 0 }}
      >
        <ConfigProvider
          renderEmpty={() => (
            <Empty
              description={selectedForm ? "No data" : "No form selected"}
            />
          )}
        >
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
