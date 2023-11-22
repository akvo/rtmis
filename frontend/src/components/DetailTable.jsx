import React, { useCallback, useEffect, useState } from "react";
import { Button, Col, Row, Space, Table } from "antd";
import snakeCase from "lodash/snakeCase";
import { fakeDetailApi } from "../placeholders/detail";
import EditableCell from "./EditableCell";
import axios from "axios";

const DetailTable = ({ record = {}, initialValues = [], onDelete }) => {
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
      await new Promise((r) => setTimeout(r, 2000));
      // TODO
      // replace with real data
      const data = fakeDetailApi(record.id);
      const _records = data.map((d, dx) => ({
        ...d,
        id: dx + 1,
        field: d?.field || d?.attribute,
        type: d?.options?.length ? "option" : "number",
        option: d?.options || [],
        key: snakeCase(d?.field),
      }));
      setRecords(_records);
      setLoading(false);
    }
  }, [record, preload, initialValues]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateCell = (recordID, parentId, value) => {
    // TODO
    const _records = records.map((r) => {
      if (r.id === recordID) {
        return { ...r, value };
      }
      return r;
    });
    setRecords(_records);
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO
    const endpoints = records.map((r) => {
      const payload = {
        administration_id: r.administration_attribute_id,
        administration_attribute_id: r.administration_attribute_id,
        value: r.value,
        options: r.options,
      };
      return axios.put("https://httpbin.org/status/200", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
    });
    await Promise.allSettled(endpoints);
    setSaving(false);
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
        <EditableCell record={record} updateCell={updateCell} parentId={1} />
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

export default DetailTable;
