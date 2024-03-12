import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Table, Button, Space, Spin, Alert } from "antd";
import { LoadingOutlined, HistoryOutlined } from "@ant-design/icons";
import { EditableCell } from "../../components";
import { api, config, store, uiText } from "../../lib";
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
  editedRecord,
  setEditedRecord,
}) => {
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetButton, setresetButton] = useState({});
  const pendingData = record?.pending_data?.created_by || false;
  const { user: authUser, forms } = store.useState((state) => state);
  const { notify } = useNotification();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const updateCell = (key, parentId, value) => {
    setresetButton({ ...resetButton, [key]: true });
    let prev = JSON.parse(JSON.stringify(dataset));
    let hasEdits = false;
    prev = prev.map((qg) =>
      qg.id === parentId
        ? {
            ...qg,
            question: qg.question.map((qi) => {
              if (qi.id === key) {
                if (isEqual(qi.value, value)) {
                  if (qi.newValue) {
                    delete qi.newValue;
                  }
                } else {
                  qi.newValue = value;
                }
                const edited = !isEqual(qi.value, value);
                if (edited && !hasEdits) {
                  hasEdits = true;
                }
                return qi;
              }
              return qi;
            }),
          }
        : qg
    );
    const hasNewValue = prev
      .find((p) => p.id === parentId)
      ?.question?.some((q) => typeof q.newValue !== "undefined");
    setEditedRecord({ ...editedRecord, [record.id]: hasNewValue });
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
    /**
     * Check whether it still has newValue or not
     * in all groups of questions
     */
    const hasNewValue = prev
      ?.flatMap((p) => p?.question)
      ?.find((q) => q?.newValue);
    setEditedRecord({ ...editedRecord, [record.id]: hasNewValue });
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
        const resetObj = {};
        data.map((d) => {
          resetObj[d.question] = false;
        });
        setresetButton({ ...resetButton, ...resetObj });
        setEditedRecord({ ...editedRecord, [record.id]: false });
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
            <h3>{r.label}</h3>
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
                  title: text?.questionCol,
                  dataIndex: null,
                  width: "50%",
                  render: (_, row) =>
                    row.short_label ? row.short_label : row.label,
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
                      resetButton={resetButton}
                    />
                  ),
                  width: "50%",
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
              {text.saveEditButton}
            </Button>
            {deleteData && (
              <Button
                type="danger"
                onClick={() => setDeleteData(record)}
                shape="round"
              >
                {text.deleteText}
              </Button>
            )}
          </Space>
        </div>
      )}
    </>
  );
};

export default React.memo(DataDetail);
