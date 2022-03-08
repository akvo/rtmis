import { Row, Col, Tag } from "antd";
import { FileTextFilled, InfoCircleOutlined } from "@ant-design/icons";

export const columnsApproval = [
  {
    title: "",
    dataIndex: "key",
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
    render: (approver) => (
      <span>
        <Tag
          color={
            approver.status_text.toLowerCase() === "pending" ? "red" : "green"
          }
        >
          {approver.status_text}
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
];
