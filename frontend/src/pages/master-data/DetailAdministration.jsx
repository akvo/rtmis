import React, { useCallback, useEffect, useState } from "react";
import { Button, Col, Row, Space, Table } from "antd";
import snakeCase from "lodash/snakeCase";

import { api } from "../../lib";
import { EditableCell } from "../../components";

const DetailAdministration = ({
  record = {},
  initialValues = [],
  attributes = [],
  onDelete,
  onUpdate,
}) => {
  const [records, setRecords] = useState(initialValues);
  const [preload, setPreload] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        const recordValue = a.options?.length
          ? [findValue?.value]
          : findValue?.value || "";
        const recordType = a.options?.length ? "option" : "number";
        return {
          id: a.id,
          key: snakeCase(a.name),
          field: a.name,
          attribute: a.id,
          value: recordValue,
          type: recordType,
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

  const updateCell = (recordID, parentId, value) => {
    const _records = records.map((r) => {
      if (r.id === recordID) {
        return { ...r, value };
      }
      return r;
    });
    setRecords(_records);
  };

  const resetCell = () => {
    return;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const _attributes = records.map((r) => {
        const attrValue = Array.isArray(r?.value) ? r.value?.[0] : r.value;
        const attrOptions = Array.isArray(r?.value)
          ? r.value.map((val) => ({ [r.field]: val }))
          : {};
        return {
          attribute: r?.attribute,
          value: attrValue,
          options: attrOptions,
        };
      });
      const { data: _record } = await api.put(
        `/administrations/${record?.id}`,
        {
          name: record.name,
          parent: record.parent?.id,
          attributes: _attributes,
        }
      );
      onUpdate(_record);
      setSaving(false);
    } catch {
      setSaving(false);
    }
  };

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
      render: (_, record) => (
        <EditableCell
          record={record}
          updateCell={updateCell}
          resetCell={resetCell}
          parentId={1}
        />
      ),
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
            onClick={handleSave}
            disabled={saving}
            loading={saving}
          >
            Save Edits
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
