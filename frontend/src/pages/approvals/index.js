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
    width: 140,
  },
  {
    title: "Total Data",
    align: "center",
    dataIndex: "total_data",
    key: "total_data",
    width: 140,
  },
  {
    title: "Location",
    dataIndex: "administration",
    key: "administration",
    render: (administration) => administration.name,
    width: 140,
  },
  {
    title: "Waiting on",
    align: "center",
    dataIndex: "waiting_on",
    key: "waiting_on",
    render: (_, row) => row.approver.name,
    width: 180,
  },
  {
    title: "Status",
    align: "center",
    dataIndex: "approver",
    key: "approver",
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
    width: 180,
  },
];
