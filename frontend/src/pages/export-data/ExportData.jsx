import React, { useState, useEffect } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Divider,
  Table,
  ConfigProvider,
  Empty,
  Button,
} from "antd";
import { FileTextFilled, LoadingOutlined } from "@ant-design/icons";
import { Breadcrumbs } from "../../components";
import { api, store } from "../../lib";
import { useNotification } from "../../util/hooks";

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Export Data",
  },
];

const ExportData = () => {
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();
  const { forms } = store.useState((state) => state);
  const handleDownload = () => {};

  const columns = [
    {
      render: (row) =>
        row.type === 1 ? (
          <img src="/assets/formtemplate.svg" />
        ) : (
          <FileTextFilled />
        ),
      width: 40,
    },
    {
      render: (row) => (
        <div>
          <div>
            <strong>{row.result}</strong> - From 2018-06-01 to 2018-07-05 02:00
          </div>
          <div>
            {forms.find((f) => f.id === row.info?.form_id)?.name || "-"}
          </div>
        </div>
      ),
    },
    {
      dataIndex: "created",
    },
    {
      render: (row) => (
        <Row>
          <Button
            icon={row.status === "on_progress" ? <LoadingOutlined /> : false}
            disabled={row.status !== "done"}
            onClick={() => {
              handleDownload(row.id);
            }}
          >
            {row.status === "on_progress" ? "Generating" : "Download"}
          </Button>
          <Button ghost className="dev">
            Delete
          </Button>
        </Row>
      ),
    },
  ];

  useEffect(() => {
    api
      .get("download/list")
      .then((res) => {
        setDataset(res.data.filter((d) => d.status !== "failed"));
        setLoading(false);
      })
      .catch((e) => {
        setLoading(false);
        notify({
          type: "error",
          message: "Could not fetch File list",
        });
        console.error(e);
      });
  }, [notify]);

  return (
    <div id="exportData">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
        </Col>
      </Row>
      <Divider />
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 0 }}
      >
        <ConfigProvider renderEmpty={() => <Empty description="No data" />}>
          <Table
            columns={columns}
            dataSource={dataset}
            showHeader={false}
            rowClassName={(record) => (record.type === 1 ? "template" : "")}
            rowKey="id"
            loading={loading}
          />
        </ConfigProvider>
      </Card>
    </div>
  );
};

export default React.memo(ExportData);
