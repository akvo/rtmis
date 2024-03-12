import React from "react";
import { Row, Col, Table, Divider, Typography } from "antd";

const { Text } = Typography;

const DetailAssignment = ({ record }) => {
  const columns = [
    {
      title: "Field",
      dataIndex: "field",
      key: "field",
      width: "50%",
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
    },
  ];

  return (
    <>
      <Row justify="center" key="top">
        <Col span={20}>
          <Table
            columns={columns}
            className="table-child"
            dataSource={[
              {
                key: "name",
                field: "Name",
                value: record?.name || "",
              },
              {
                key: "passcode",
                field: "Passcode",
                value: (
                  <Text strong copyable>
                    {record?.passcode || ""}
                  </Text>
                ),
              },
              {
                key: "administrations",
                field: "Villages",
                value: (
                  <>{record.administrations.map((a) => a.name).join(" | ")}</>
                ),
              },
              {
                key: "forms",
                field: "Forms",
                value: <>{record.forms.map((f) => f.name).join(" | ")}</>,
              },
            ]}
            pagination={false}
          />
        </Col>
        <Divider />
      </Row>
    </>
  );
};

export default DetailAssignment;
