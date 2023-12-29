import { Row, Col, Tag } from "antd";
import {
  FileTextFilled,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

export const columnsApproval = [
  {
    title: "",
    dataIndex: "id",
    key: "id",
    width: "40px",
    render: () => <InfoCircleOutlined />,
  },
  {
    title: "Submission",
    dataIndex: "name",
    key: "name",
    width: "20%",
    render: (filename) => (
      <Row>
        <Col span={4}>
          <FileTextFilled style={{ color: "#666666", fontSize: 28 }} />
        </Col>
        <Col span={12}>{filename}</Col>
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
    title: "Date",
    dataIndex: "created",
    key: "created",
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
  },
  {
    title: "Waiting on",
    dataIndex: "waiting_on",
    key: "waiting_on",
    render: (_, row) => row.approver.name,
  },
  {
    title: "Total Data",
    dataIndex: "total_data",
    key: "total_data",
  },
];
