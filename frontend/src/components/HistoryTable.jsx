import React from "react";
import { Table } from "antd";

const HistoryTable = ({ record }) => {
  const { history, id } = record;
  return (
    <div className="history-table-wrapper">
      <Table
        size="small"
        rowKey={`history-${id}-${Math.random}`}
        columns={[
          {
            title: "History",
            dataIndex: "value",
            key: "value",
            ellipsis: true,
          },
          {
            title: "Updated at",
            dataIndex: "created",
            key: "created",
            align: "center",
            ellipsis: true,
          },
          {
            title: "Updated by",
            dataIndex: "created_by",
            key: "created_by",
            align: "center",
            ellipsis: true,
          },
        ]}
        loading={!history.length}
        pagination={false}
        dataSource={history}
      />
    </div>
  );
};

export default React.memo(HistoryTable);
