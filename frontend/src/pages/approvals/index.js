import { Row, Col, Tag } from "antd";
import {
  FileTextFilled,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

export const columnsApproval = [
  {
    title: "Submission",
    dataIndex: "name",
    key: "name",
    render: (filename, row) => (
      <Row align="middle">
        <Col style={{ marginRight: 20 }}>
          <FileTextFilled style={{ color: "#666666", fontSize: 28 }} />
        </Col>
        <Col>
          <div>{filename}</div>
          <div>{row.created}</div>
        </Col>
      </Row>
    ),
    width: "30%",
  },
  {
    title: "Form",
    dataIndex: "form",
    key: "form",
    render: (form) => form.name,
  },
  {
    title: "Submitter",
    dataIndex: "created_by",
    key: "created_by",
  },
  {
    title: "Location",
    dataIndex: "administration",
    key: "administration",
    render: (administration) => administration.name,
  },
  {
    title: "Status",
    align: "center",
    dataIndex: "approver",
    key: "approver",
    width: 60,
    render: ({ status_text }) => (
      <span>
        <Tag
          icon={
            status_text === "Pending" ? (
              <ClockCircleOutlined />
            ) : status_text === "Rejected" ? (
              <CloseCircleOutlined />
            ) : (
              <CheckCircleOutlined />
            )
          }
          color={
            status_text === "Pending"
              ? "default"
              : status_text === "Rejected"
              ? "error"
              : "success"
          }
        >
          {status_text}
        </Tag>
      </span>
    ),
  },
  {
    title: "Waiting on",
    align: "center",
    dataIndex: "waiting_on",
    key: "waiting_on",
    render: (_, row) => row.approver.name,
  },
  {
    title: "Total Data",
    align: "center",
    dataIndex: "total_data",
    key: "total_data",
    width: 120,
  },
];
