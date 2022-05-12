import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Table, Button, Space, Spin, Alert } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { EditableCell } from "../../components";
import { api, store } from "../../lib";
import { useNotification } from "../../util/hooks";
import { flatten, isEqual } from "lodash";

const DataDetail = ({ questionGroups, record }) => {
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const pendingData = record?.pending_data?.created_by || false;
  const { user: authUser, forms } = store.useState((state) => state);
  const { notify } = useNotification();

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

  const handleSave = () => {
    const data = [];
    const formId = flatten(dataset.map((qg) => qg.question))[0].form;
    const formRes = forms.find((f) => f.id === formId);
    dataset.map((rd) => {
      rd.question.map((rq) => {
        if (rq.newValue) {
          data.push({ id: rd.id, question: rq.id, value: rq.newValue });
        }
      });
    });
    setSaving(true);
    api
      .put(`form-data/${formId}?data_id=${record.id}`, data)
      .then(() => {
        if (
          authUser?.role?.id === 4 ||
          (authUser?.role?.id === 2 && formRes.type === 2)
        ) {
          notify({
            type: "success",
            message:
              "Created New Pending Submission. Please go to your Profile to send this data for approval",
          });
        } else {
          notify({
            type: "success",
            message: "Data updated successfully",
          });
          fetchData(record.id);
        }
      })
      .catch((e) => {
        console.error(e);
        notify({
          type: "error",
          message: "Could not update data",
        });
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const fetchData = useCallback(
    (id) => {
      setLoading(true);
      api
        .get(`data/${id}`)
        .then((res) => {
          const data = questionGroups.map((qg) => ({
            ...qg,
            question: qg.question.map((q) => ({
              ...q,
              value: res.data.find((d) => d.question === q.id)?.value || null,
            })),
          }));
          setDataset(data);
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [questionGroups]
  );

  useEffect(() => {
    if (record?.id && !dataset.length) {
      fetchData(record.id);
    }
  }, [record, dataset.length, fetchData]);

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
        {pendingData && (
          <Alert
            message={`Can't edit/update this data, because data in pending data by ${pendingData}`}
            type="warning"
          />
        )}
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
                      pendingData={pendingData}
                    />
                  ),
                },
              ]}
            />
          </div>
        ))}
      </div>
      <div>
        <Button
          type="primary"
          onClick={handleSave}
          disabled={!edited || saving}
          loading={saving}
        >
          Save Edits
        </Button>
      </div>
    </>
  );
};

export default React.memo(DataDetail);
