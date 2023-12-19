import React, { useMemo } from "react";
import { Table, Button, Space, Spin } from "antd";
import { LoadingOutlined, HistoryOutlined } from "@ant-design/icons";
import { isEqual } from "lodash";
import { EditableCell, HistoryTable } from "../../components";
import { store, uiText } from "../../lib";

const SubmissionEditing = ({
  expanded,
  updateCell,
  resetCell,
  handleSave,
  saving,
  dataLoading,
  isEdited,
  isEditable,
}) => {
  const language = store.useState((s) => s.language);
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  if (expanded.loading) {
    return (
      <Space style={{ paddingTop: 18, color: "#9e9e9e" }} size="middle">
        <Spin
          indicator={<LoadingOutlined style={{ color: "#1b91ff" }} spin />}
        />
        <span>{text.loading}</span>
      </Space>
    );
  }
  return (
    <>
      <div className={`pending-data-outer`}>
        {expanded.data?.map((r, rI) => (
          <div className="pending-data-wrapper" key={rI}>
            <h3>{r.name}</h3>
            <Table
              pagination={false}
              dataSource={r.question}
              rowClassName={(row) =>
                (row.newValue || row.newValue === 0) &&
                !isEqual(row.newValue, row.value)
                  ? "row-edited"
                  : "row-normal"
              }
              rowKey="id"
              columns={[
                {
                  title: text?.QuestionCol,
                  dataIndex: "name",
                },
                {
                  title: text?.responseCol,
                  render: (row) => (
                    <EditableCell
                      record={row}
                      parentId={expanded.id}
                      updateCell={updateCell}
                      resetCell={resetCell}
                      disabled={!!dataLoading}
                      readonly={!isEditable}
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
      {isEditable && !expanded.loading && (
        <div className="pending-data-actions">
          <Button
            type="primary"
            shape="round"
            onClick={() => handleSave(expanded)}
            loading={expanded.id === saving}
            disabled={
              expanded.id === dataLoading || isEdited(expanded.id) === false
            }
          >
            {text.saveEditButton}
          </Button>
        </div>
      )}
    </>
  );
};

export default SubmissionEditing;
