import React, { useCallback, useEffect, useState } from "react";
import { Col, Row, Table } from "antd";
import snakeCase from "lodash/snakeCase";
import { fakeDetailApi } from "../placeholders/detail";

const DetailTable = ({ record = {} }) => {
  const [records, setRecords] = useState([]);

  const fetchData = useCallback(() => {
    setTimeout(() => {
      const data = fakeDetailApi(record.id);
      const _records = data.map((d) => ({
        ...d,
        key: snakeCase(d?.field),
        value: d?.option || d?.value || "",
      }));
      setRecords(_records);
    }, 2000);
  }, [record]);

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
    },
  ];
  return (
    <>
      <Row justify="center" key="top">
        <Col span={20}>
          <Table
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
