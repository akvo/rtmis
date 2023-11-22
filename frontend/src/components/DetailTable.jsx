import React, { useCallback, useEffect, useState } from "react";
import { Col, Row, Table } from "antd";
import snakeCase from "lodash/snakeCase";
import { fakeDetailApi } from "../placeholders/detail";
import EditableCell from "./EditableCell";

const DetailTable = ({ record = {}, initialValues = [] }) => {
  const [records, setRecords] = useState(initialValues);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    if (initialValues.length) {
      setLoading(false);
      return;
    }
    setTimeout(() => {
      const data = fakeDetailApi(record.id);
      const _records = data.map((d) => ({
        ...d,
        field: d?.field || d?.attribute,
        type: d?.options?.length ? "option" : "number",
        option: d?.options || [],
        key: snakeCase(d?.field),
      }));
      setRecords(_records);
      setLoading(false);
    }, 2000);
  }, [record, initialValues]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      render: (_, record) => <EditableCell record={record} />,
    },
  ];
  return (
    <>
      <Row justify="center" key="top">
        <Col span={20}>
          <Table
            loading={loading}
            columns={columns}
            className="table-child"
            dataSource={records}
            pagination={false}
          />
        </Col>
      </Row>
    </>
  );
};

export default DetailTable;
