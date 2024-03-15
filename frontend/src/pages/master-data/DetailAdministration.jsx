import React, { useCallback, useEffect, useState } from "react";
import { Col, Row, Table } from "antd";

import { api } from "../../lib";

const AdministratioAttributeValues = ({ attribute, attributeValue }) => {
  if (!attributeValue) {
    return "-";
  }
  if (attribute.type === "value" || attribute.type === "option") {
    return attributeValue.value;
  }
  if (attribute.type === "multiple_option") {
    return (
      <ul className="attribute-value">
        {attributeValue.value.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  }
  if (attribute.type === "aggregate") {
    return (
      <ul className="attribute-value">
        {Object.keys(attributeValue.value).map((key) => (
          <li key={key}>
            <b>{key}</b>: {attributeValue.value[key]}
          </li>
        ))}
      </ul>
    );
  }
  return null;
};

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
      setRecords(apiData);
      setLoading(false);
    }
  }, [record, preload, initialValues]);

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
            loading={loading}
            columns={columns}
            className="table-child"
            dataSource={[
              {
                key: "code",
                field: "Code",
                value: records?.code || "-",
              },
              {
                key: "name",
                field: "Name",
                value: records?.name || "",
              },
              {
                key: "parent",
                field: "Parent",
                value: records?.parent?.name || "",
              },
              {
                key: "level",
                field: "Level",
                value: records?.level?.name || "",
              },
              ...attributes.map((attribute) => ({
                key: attribute.name,
                field: attribute.name,
                value: (
                  <AdministratioAttributeValues
                    attribute={attribute}
                    attributeValue={records?.attributes?.find(
                      (item) => item.attribute === attribute.id
                    )}
                  />
                ),
              })),
            ]}
            pagination={false}
          />
        </Col>
      </Row>
    </>
  );
};

export default DetailAdministration;
