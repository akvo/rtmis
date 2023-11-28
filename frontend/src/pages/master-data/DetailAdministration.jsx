import React, { useCallback, useEffect, useState } from "react";
import { Button, Col, Row, Space, Table } from "antd";
import snakeCase from "lodash/snakeCase";

import { api, store } from "../../lib";
import { useNavigate } from "react-router-dom";

const DetailAdministration = ({
  record = {},
  initialValues = [],
  attributes = [],
  onDelete,
}) => {
  const [records, setRecords] = useState(initialValues);
  const [preload, setPreload] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      store.update((s) => {
        s.masterData.administration = {
          ...apiData,
          level_id: apiData?.level?.id - 1,
        };
      });

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
            {record.type === "value" && <>{dataValue}</>}
            {["option", "multiple_option"].includes(record.type) &&
              dataValue && <>{dataValue?.join(" | ")}</>}
            {record.type === "aggregate" && dataValue && (
              <ul>
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
      <div>
        <Space>
          <Button
            type="primary"
            onClick={() => navigate(`/master-data/${record?.id}/edit`)}
          >
            Edit
          </Button>
          {onDelete && (
            <Button type="danger" onClick={() => onDelete(record)}>
              Delete
            </Button>
          )}
        </Space>
      </div>
    </>
  );
};

export default DetailAdministration;
