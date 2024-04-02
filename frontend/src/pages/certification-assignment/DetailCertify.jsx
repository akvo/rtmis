import React from "react";
import { Row, Col, Table } from "antd";

const DetailCertify = ({ record }) => {
  const columns = [
    {
      title: "#",
      dataIndex: "id",
      key: "id",
      render: (_row, _record, index) => index + 1,
      width: 50,
    },
    {
      title: "Village",
      dataIndex: "full_name",
      key: "full_name",
    },
  ];
  return (
    <Row justify="center" key="top">
      <Col span={20}>
        <Table
          columns={columns}
          className="table-child"
          dataSource={record?.administrations}
          pagination={false}
          rowKey="id"
        />
      </Col>
    </Row>
  );
};

export default DetailCertify;
