import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Table, Space, Spin, Alert } from "antd";
import { LoadingOutlined, HistoryOutlined } from "@ant-design/icons";
import { EditableCell } from "../../components";
import { api, store, uiText } from "../../lib";
import { isEqual } from "lodash";
import { HistoryTable } from "../../components";

const DataClaimDetail = ({ questionGroups, record }) => {
  const [dataset, setDataset] = useState([]);
  const [loading, setLoading] = useState(false);
  const pendingData = record?.pending_data?.created_by || false;
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

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
              rowClassName={(record) => {
                const rowEdited =
                  (record.newValue || record.newValue === 0) &&
                  !isEqual(record.newValue, record.value)
                    ? "row-edited"
                    : "row-normal";
                return `expandable-row ${rowEdited}`;
              }}
              rowKey="id"
              columns={[
                {
                  title: text?.questionCol,
                  dataIndex: null,
                  width: "50%",
                  render: (_, row) =>
                    row.short_label ? row.short_label : row.label,
                  className: "table-col-question",
                },
                {
                  title: "Response",
                  render: (row) => (
                    <EditableCell
                      record={row}
                      parentId={row.question_group}
                      pendingData={pendingData}
                      readonly
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
    </>
  );
};

export default React.memo(DataClaimDetail);
