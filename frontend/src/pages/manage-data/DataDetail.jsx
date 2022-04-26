import React, { useEffect, useMemo, useState } from "react";
import { Table, Button, Space, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import EditableCell from "../../components/EditableCell";
import { api } from "../../lib";
import { flatten, isEqual } from "lodash";

const DataDetail = ({ questionGroups, record }) => {
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(false);
  const updateCell = (key, parentId, value) => {
    let prev = JSON.parse(JSON.stringify(dataset));
    prev = prev.map((qg) =>
      qg.id === parentId
        ? {
            ...qg,
            question: qg.question.map((qi) => {
              if (qi.id === key) {
                if (isEqual(qi.value, value) && qi.newValue) {
                  delete qi.newValue;
                } else {
                  qi.newValue = value;
                }
                return qi;
              }
              return qi;
            }),
          }
        : qg
    );
    setDataset(prev);
  };

  const resetCell = (key, parentId) => {
    let prev = JSON.parse(JSON.stringify(dataset));
    prev = prev.map((qg) =>
      qg.id === parentId
        ? {
            ...qg,
            question: qg.question.map((qi) => {
              if (qi.id === key) {
                delete qi.newValue;
              }
              return qi;
            }),
          }
        : qg
    );
    setDataset(prev);
  };

  useEffect(() => {
    if (record?.id && !dataset.length) {
      setLoading(true);
      api
        .get(`data/${record.id}`)
        .then((res) => {
          const data = questionGroups.map((qg) => ({
            ...qg,
            question: qg.question.map((q) => ({
              ...q,
              value: res.data.find((d) => d.question === q.id)?.value || null,
            })),
          }));
          setDataset(data);
          setLoading(false);
        })
        .catch((e) => {
          console.error(e);
          setLoading(false);
        });
    }
  }, [record, dataset.length, questionGroups]);
  const edited = useMemo(() => {
    return dataset.length
      ? flatten(dataset.map((qg) => qg.question)).findIndex(
          (fi) => fi.newValue
        ) > -1
      : false;
  }, [dataset]);
  return loading ? (
    <Space style={{ paddingTop: 18, color: "#9e9e9e" }} size="middle">
      <Spin indicator={<LoadingOutlined style={{ color: "#1b91ff" }} spin />} />
      <span>Loading..</span>
    </Space>
  ) : (
    <>
      <div className="data-detail">
        {dataset.map((r, rI) => (
          <div className="pending-data-wrapper" key={rI}>
            <h3>{r.name}</h3>
            <Table
              pagination={false}
              dataSource={r.question}
              rowClassName={(record) =>
                record.newValue && !isEqual(record.newValue, record.value)
                  ? "row-edited"
                  : "row-normal"
              }
              rowKey="id"
              columns={[
                {
                  title: "Question",
                  dataIndex: "name",
                },
                {
                  title: "Response",
                  render: (row) => (
                    <EditableCell
                      record={row}
                      parentId={row.question_group}
                      updateCell={updateCell}
                      resetCell={resetCell}
                    />
                  ),
                },
              ]}
            />
          </div>
        ))}
      </div>
      <div>
        <Button className="dev" disabled={!edited}>
          Save Edits
        </Button>
      </div>
    </>
  );
};

export default React.memo(DataDetail);
