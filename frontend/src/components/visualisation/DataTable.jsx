import React, { useEffect, useState } from "react";
import "./style.scss";
import { Table } from "antd";

const DataTable = () => {
  const [dataset, setDataset] = useState([]);
  useEffect(() => {
    const temp = [];
    for (let index = 0; index < 15; index++) {
      temp.push({
        key: `locality-${index + 1}`,
        name: `Locality ${index + 1}`,
        water: "Safely Managed",
        sanitation: "Basic",
        hygiene: "No Facility",
      });
    }
    setDataset(temp);
  }, []);
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Water",
      dataIndex: "water",
      key: "water",
    },
    {
      title: "Sanitation",
      dataIndex: "sanitation",
      key: "sanitation",
    },
    {
      title: "Hygiene",
      dataIndex: "hygiene",
      key: "hygiene",
    },
    Table.EXPAND_COLUMN,
  ];
  return (
    <div className="widget-wrap" id="widget-data-table">
      <Table
        columns={columns}
        dataSource={dataset}
        height={535}
        pagination={{ pageSize: 10 }}
        scroll={{ y: 433 }}
        style={{ height: 535 }}
        size="middle"
        className="dev"
      />
    </div>
  );
};

export default React.memo(DataTable);
