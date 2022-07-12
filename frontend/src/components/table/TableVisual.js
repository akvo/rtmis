import React, { useMemo } from "react";
import { Col, Table } from "antd";
import { get, capitalize } from "lodash";

const TableVisual = ({ tableConfig }) => {
  const { title, type, columns, span, data, index } = tableConfig;

  const tableColumns = useMemo(() => {
    return columns.map((c) => {
      if (c?.children) {
        const child = Object.keys(get(data[0], c.children_path)).map((key) => ({
          title: capitalize(key),
          dataIndex: key,
          key: key,
        }));
        return {
          title: c.title,
          children: child,
        };
      }
      let tmp = {
        title: c.title,
        dataIndex: c.path,
        key: c.path,
      };
      if (c?.fixed) {
        tmp = {
          ...tmp,
          fixed: c.fixed,
        };
      }
      return tmp;
    });
  }, [columns, data]);

  const tableDataSource = useMemo(() => {
    const paths = columns.map((x) => {
      if (x?.children) {
        return x.children_path;
      }
      return x.path;
    });
    const transform = data.map((d) => {
      const obj = paths.map((p) => {
        let tmp = {};
        const pathData = get(d, p);
        if (typeof pathData === "object" && !Array.isArray(pathData)) {
          Object.keys(pathData).forEach((pd) => {
            tmp = { ...tmp, [pd]: pathData[pd] };
          });
        }
        tmp = { ...tmp, [p]: pathData };
        return tmp;
      });
      return obj.reduce((curr, next) => ({ ...curr, ...next }));
    });
    return transform;
  }, [data, columns]);

  return (
    <Col
      key={`col-${type}-${index}`}
      align="center"
      justify="space-between"
      span={span}
    >
      <Table
        title={() => title || "Table"}
        columns={tableColumns}
        dataSource={tableDataSource}
      />
    </Col>
  );
};

export default TableVisual;
