import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Col, Table, Button } from "antd";
import { get, capitalize, sumBy, orderBy } from "lodash";
import { DownloadOutlined } from "@ant-design/icons";
import { Excel } from "antd-table-saveas-excel";
import { jmpColorScore } from "../../../lib";

const fontSize = 12;

const TableVisual = ({ tableConfig, loading }) => {
  const { formId } = useParams();
  const { title, type, columns, span, data, index, admLevelName } = tableConfig;

  const tableColumns = useMemo(() => {
    return columns.map((c) => {
      const showPercent = c?.show_percent;
      const percentPath = c?.percent_path;
      if (c?.children) {
        const obj = get(data?.[0], c.children_path);
        if (!obj) {
          return {
            title: c.title,
            render: () => "No data",
          };
        }
        const jmpConfigPath = String(c.children_path).replace("data", formId);
        const jmpServiceLevelOrder = get(jmpColorScore, jmpConfigPath);
        const child = Object.keys(obj).map((key) => {
          let col = {
            title: capitalize(key),
            dataIndex: key,
            key: key,
            width: key.length * fontSize,
            align: "center",
          };
          if (jmpServiceLevelOrder) {
            col = {
              ...col,
              order: Object.keys(jmpServiceLevelOrder).indexOf(key) + 1,
            };
          }
          if (showPercent && percentPath) {
            col = {
              ...col,
              render: (val, record) => {
                const percentDivider = Number(get(record, percentPath));
                const percent = (val / percentDivider) * 100;
                return `${val} (${percent.toFixed()}%)`;
              },
            };
          }
          return col;
        });
        return {
          title: c.title,
          children: orderBy(child, "order"),
        };
      }
      let tmp = {
        title: c.title,
        dataIndex: c.path,
        key: c.path,
      };
      tmp = c.path === "loc" ? { ...tmp, width: "200px" } : tmp;
      tmp = c.path === "total" ? { ...tmp, width: "100px" } : tmp;
      tmp = c.path === "year" ? { ...tmp, width: "100px" } : tmp;
      if (c?.fixed) {
        tmp = {
          ...tmp,
          fixed: c.fixed,
        };
      }
      return tmp;
    });
  }, [columns, data, formId]);

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
            typeof pathData === "number" && p !== "year"
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

  const titlePage =
    title.replace("##administration_level##", admLevelName?.singular) ||
    "Table";

  const handleExport = (e) => {
    e.preventDefault();
    const excel = new Excel();
    excel
      .addSheet("data")
      .addColumns(tableColumns)
      .addDataSource(tableDataSource)
      .saveAs(`${titlePage}.xlsx`);
  };

  return (
    <Col
      key={`col-${type}-${index}`}
      align="center"
      justify="space-between"
      span={span}
      className="table-card"
    >
      <Table
        title={() => (
          <div className="table-title">
            <h3>{titlePage}</h3>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              className="download"
              shape="round"
              size="small"
            >
              Download
            </Button>
          </div>
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
