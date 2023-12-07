import React, { useCallback, useEffect, useState } from "react";
import { Col, Row, Table } from "antd";
import snakeCase from "lodash/snakeCase";

import { api } from "../../lib";

const DetailAdministration = ({
  record = {},
  initialValues = [],
  attributes = [],
}) => {
  const [records, setRecords] = useState(initialValues);
  const [preload, setPreload] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (preload && initialValues.length) {
      setPreload(false);
      setLoading(false);
      return;
    }
    if (preload && !initialValues.length) {
      setPreload(false);
      const { data: apiData } = await api.get(`/administrations/${record?.id}`);
      const { attributes: attrValues } = apiData || {};

      const _records = attributes.map((a) => {
        const findValue = attrValues.find((av) => av?.attribute === a.id);
        return {
          id: a.id,
          key: snakeCase(a.name),
          field: a.name,
          attribute: a.id,
          value: findValue?.value || "",
          type: a.type,
          option: a.options.map((opt) => ({ name: opt })),
        };
      });
      setRecords(_records);
      setLoading(false);
    }
  }, [record, preload, attributes, initialValues]);

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
      render: (dataValue, record) => {
        return (
          <>
            {["value", "option"].includes(record.type) && <>{dataValue}</>}
            {record.type === "multiple_option" && (
              <>{dataValue?.length ? dataValue?.join(" | ") : ""}</>
            )}
            {record.type === "aggregate" && dataValue && (
              <ul style={{ paddingLeft: "12px" }}>
                {Object.keys(dataValue).map((dataKey, index) => {
                  return (
                    <li key={index}>
                      <strong>{`${dataKey}: `}</strong>
                      {dataValue[dataKey]}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        );
      },
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

export default DetailAdministration;
