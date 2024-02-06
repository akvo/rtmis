import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Table, Button, Space, Spin, Alert } from "antd";
import { LoadingOutlined, HistoryOutlined } from "@ant-design/icons";
import { EditableCell } from "../../components";
import { api, config, store } from "../../lib";
import { useNotification } from "../../util/hooks";
import { flatten, isEqual } from "lodash";
import { HistoryTable } from "../../components";

const DataDetail = ({
  questionGroups,
  record,
  updater,
  updateRecord,
  setDeleteData,
  isPublic = false,
}) => {
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
                if (
                  isEqual(qi.value, value) &&
                  (qi.newValue || qi.newValue === 0)
                ) {
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
        if (rq.newValue || rq.newValue === 0) {
          let value = rq.newValue;
          if (rq.type === "number") {
            value =
              parseFloat(value) % 1 !== 0 ? parseFloat(value) : parseInt(value);
          }
          data.push({
            question: rq.id,
            value: value,
          });
        }
      });
    });
    setSaving(true);
    api
      .put(`form-data/${formId}?data_id=${record.id}`, data)
      .then(() => {
        notify({
          type: "success",
          message:
            authUser?.role?.id === 4 ||
            (authUser?.role?.id === 2 && formRes.type === 2)
              ? "Created New Pending Submission. Please go to your Profile to send this data for approval"
              : "Data updated successfully",
        });
        updater(
          updateRecord === record.id
            ? false
            : updateRecord === null
            ? false
            : record.id
        );
        fetchData(record.id);
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
          const data = questionGroups.map((qg) => {
            const question = qg.question
              .filter((item) => !item?.display_only)
              .map((q) => {
                const findData = res.data.find((d) => d.question === q.id);
                return {
                  ...q,
                  value:
                    findData?.value || findData?.value === 0
                      ? findData.value
                      : null,
                  history: findData?.history || false,
                };
              });
            return {
              ...qg,
              question: question,
            };
          });
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

  const deleteData = useMemo(() => {
    const currentUser = config.roles.find(
      (role) => role.name === authUser?.role_detail?.name
    );
    return currentUser?.delete_data;
  }, [authUser]);

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
                (record.newValue || record.newValue === 0) &&
                !isEqual(record.newValue, record.value)
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
                      isPublic={isPublic}
                    />
                  ),
                },
                Table.EXPAND_COLUMN,
              ]}
              expandable={{
                expandIcon: ({ onExpand, record }) => {
                  if (!record?.history) {
                    return "";
                  }
                  return (
                    <HistoryOutlined
                      className="expand-icon"
                      onClick={(e) => onExpand(record, e)}
                    />
                  );
                },
                expandedRowRender: (record) => <HistoryTable record={record} />,
                rowExpandable: (record) => record?.history,
              }}
            />
          </div>
        ))}
      </div>
      {!isPublic && (
        <div className="button-save">
          <Space>
            <Button
              type="primary"
              onClick={handleSave}
              disabled={!edited || saving}
              loading={saving}
              shape="round"
            >
              Save Edits
            </Button>
            {deleteData && (
              <Button
                type="danger"
                onClick={() => setDeleteData(record)}
                shape="round"
              >
                Delete
              </Button>
            )}
          </Space>
        </div>
      )}
    </>
  );
};

export default React.memo(DataDetail);
