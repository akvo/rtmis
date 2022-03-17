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
import { FileTextFilled } from "@ant-design/icons";
import { Breadcrumbs } from "../../components";

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
            <strong>{row.name}</strong> - From {row.from} to {row.to}
          </div>
          <div>{row.survey}</div>
        </div>
      ),
    },
    {
      dataIndex: "date",
    },
    {
      render: () => (
        <Row>
          <Button ghost className="dev">
            Download
          </Button>
          <Button ghost className="dev">
            Delete
          </Button>
        </Row>
      ),
    },
  ];

  useEffect(() => {
    const temp = new Array(10);
    for (let i = 0; i < 20; i++) {
      temp[i] = {
        id: i + 1,
        name:
          i % 2 ? `Form template ${i + 1}` : `Data analysis export ${i + 1}`,
        from: "2018-06-01",
        to: "2018-07-05 02:00",
        survey: "AECOM rock and roll > Demo Survey",
        date: "2021-11-08 17:18",
        type: i % 2,
      };
    }
    setDataset(temp);
  }, []);

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
            className="dev"
            columns={columns}
            dataSource={dataset}
            showHeader={false}
            rowClassName={(record) => (record.type === 1 ? "template" : "")}
            rowKey="id"
          />
        </ConfigProvider>
      </Card>
    </div>
  );
};

export default React.memo(ExportData);
