import React, { useMemo } from "react";
import { Col, Table } from "antd";
import { get, capitalize, sumBy } from "lodash";
import millify from "millify";

const fontSize = 12;

const TableVisual = ({ tableConfig, loading }) => {
  const { title, type, columns, span, data, index, admLevelName } = tableConfig;

  const tableColumns = useMemo(() => {
    return columns.map((c) => {
      if (c?.children) {
        const obj = get(data?.[0], c.children_path);
        if (!obj) {
          return {
            title: c.title,
            children: [],
          };
        }
        const child = Object.keys(obj).map((key) => ({
          title: capitalize(key),
          dataIndex: key,
          key: key,
          width: key.length * fontSize,
          align: "center",
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
      tmp = c.path === "loc" ? { ...tmp, width: "200px" } : tmp;
      tmp = c.path === "total" ? { ...tmp, width: "100px" } : tmp;
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
        tmp = {
          ...tmp,
          [p]:
            typeof pathData === "number"
              ? pathData.toLocaleString("en-US")
              : pathData,
        };
        return tmp;
      });
      return obj.reduce((curr, next) => ({ ...curr, ...next }));
    });
    return transform;
  }, [data, columns]);

  const xScroll = useMemo(
    () =>
      sumBy(
        tableColumns
          .filter((t) => t?.children)
          .map((t) => t.children)
          .flatMap((t) => t)
          .map((t) => t.title.length * fontSize)
      ),
    [tableColumns]
  );

  return (
    <Col
      key={`col-${type}-${index}`}
      align="center"
      justify="space-between"
      span={span}
    >
      <Table
        title={() => (
          <h3>
            {title.replace(
              "##administration_level##",
              admLevelName?.singular
            ) || "Table"}
          </h3>
        )}
        columns={tableColumns}
        dataSource={tableDataSource}
        scroll={{ x: xScroll, y: 500 }}
        pagination={false}
        size="small"
        loading={loading}
        bordered
        rowKey={tableColumns?.[0]?.key || "id"}
      />
    </Col>
  );
};

export default TableVisual;
