import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import { Row, Col, Card, Divider, Select, message } from "antd";
import { Breadcrumbs } from "../../components";
import { api, store } from "../../lib";
import ApproverFilters from "../../components/filters/ApproverFilters";
import { SteppedLineTo } from "react-lineto";
import { take, takeRight } from "lodash";
const { Option } = Select;
const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Manage Approvers",
  },
];
const ApproversTree = () => {
  const { administration, forms, selectedForm } = store.useState((s) => s);
  const [nodes, setNodes] = useState([]);
  const [dataset, setDataset] = useState([]);
  const [datasetJson, setDatasetJson] = useState("[]");
  const [scroll, setScroll] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNodes([
      {
        id: 0,
        name: "Questionnaire",
        children: forms.map((dt) => ({
          ...dt,
          user: null,
          active: false,
        })),
      },
    ]);
  }, [forms]);

  useEffect(() => {
    if (administration.length && selectedForm) {
      const selectedAdministration = takeRight(administration, 1)[0];
      setLoading(true);
      api
        .get(
          `form/approver/?administration_id=${selectedAdministration.id}&form_id=${selectedForm}`
        )
        .then((res) => {
          setDataset((prev) => {
            let adminClone = JSON.parse(JSON.stringify(prev));
            adminClone.length = administration.length - 1;
            adminClone = [
              ...adminClone,
              {
                id: selectedAdministration.id,
                childLevelName: selectedAdministration.childLevelName,
                children: res.data.map((cI) => ({
                  ...cI,
                  user: cI.user?.id,
                })),
              },
            ];
            setDatasetJson(JSON.stringify(adminClone));
            return adminClone;
          });
          setLoading(false);
        })
        .catch(() => {
          message.error("Could not fetch data");
          setLoading(false);
        });
    }
  }, [administration, selectedForm]);

  const isPristine = useMemo(() => {
    return JSON.stringify(dataset) === datasetJson;
  }, [dataset, datasetJson]);

  const resetForm = () => {
    if (administration.length === 1) {
      setDataset(JSON.parse(datasetJson));
    } else {
      store.update((s) => {
        s.administration.length = 1;
      });
    }
  };

  const handleSubmit = () => {
    const formData = dataset.reduce((arr, adminData) => {
      adminData.children
        .filter((c) => c.user)
        .map((childData) => {
          arr.push({
            user_id: childData.user,
            administration_id: childData.administration.id,
          });
        });
      return arr;
    }, []);
    setSaving(true);
    api
      .post(`approval/form/${selectedForm}/`, formData)
      .then(() => {
        setDatasetJson(JSON.stringify(dataset));
        message.success("Approvers updated");
        setSaving(false);
      })
      .catch(() => {
        message.error("Could not update Approvers");
        setSaving(false);
      });
  };

  const handleColScroll = ({ target }) => {
    setScroll(target.scrollTop);
    const shade = takeRight(target.className.split(" "))[0];
    const shadeComponent = document.getElementById(`shade-for-${shade}`);

    if (target.scrollTop > 0) {
      shadeComponent.classList.add("on");
    } else {
      shadeComponent.classList.remove("on");
    }
  };

  const renderFormNodes = useMemo(() => {
    return nodes.map((nodeItem, i) => (
      <Col key={i} span={6} className="tree-col-0" align="center">
        {nodeItem.children.map((childItem, j) => (
          <div
            className={`tree-block tree-form-block-${childItem.id}
              ${
                childItem.id === selectedForm || nodeItem.id === selectedForm
                  ? "active"
                  : ""
              }`}
            key={j}
            onClick={() => {
              store.update((s) => {
                s.selectedForm = childItem.id;
                s.administration = take(administration);
              });
            }}
          >
            {childItem.name}
          </div>
        ))}
      </Col>
    ));
  }, [nodes, selectedForm, administration]);

  const renderAdminNodes = useMemo(() => {
    const handleClick = (e, index) => {
      if (!e || loading) {
        return;
      }
      setLoading(true);
      api
        .get(`administration/${e}/`)
        .then((res) => {
          store.update((s) => {
            s.administration.length = index + 1;
            s.administration = [
              ...s.administration,
              {
                id: res.data.id,
                name: res.data.name,
                levelName: res.data.level_name,
                children: res.data.children,
                childLevelName: res.data.children_level_name,
              },
            ];
          });
          setLoading(false);
        })
        .catch(() => {
          message.error("Could not load filters");
          setLoading(false);
        });
    };
    return selectedForm
      ? administration.map(
          (adminItem, k) =>
            adminItem.children?.length > 0 && (
              <Col
                onScroll={handleColScroll}
                key={k}
                span={6}
                className={`tree-col-${k + 1}`}
                align="center"
              >
                {adminItem.children?.map((childItem, l) => (
                  <div
                    className={`tree-block tree-block-${k + 1}-${childItem.id}
                      ${
                        k >= administration.length - 1 ||
                        administration[k + 1]?.children[0]?.parent ===
                          childItem.id
                          ? "active"
                          : ""
                      }
                    `}
                    key={l}
                    onClick={() => {
                      handleClick(childItem.id, k);
                    }}
                  >
                    <div>{childItem.name}</div>
                    <Select
                      key={`user-dropdown-${childItem.id}`}
                      allowClear
                      placeholder="Not assigned"
                      value={
                        dataset[k]?.children?.find(
                          (c) => c.administration.id === childItem.id
                        )?.user
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      onChange={(e) => {
                        if (!e) {
                          return;
                        }
                        const newNodes = JSON.parse(JSON.stringify(dataset));
                        newNodes[k].children[l].user = e;
                        setDataset(newNodes);
                      }}
                      onClear={() => {
                        const cleared = [...dataset];
                        cleared[k].children[l].user = null;
                        setDataset(cleared);
                      }}
                      disabled={loading}
                    >
                      {(
                        dataset[k]?.children?.find(
                          (c) => c.administration?.id === childItem.id
                        )?.user_list || []
                      ).map((user, userIndex) => (
                        <Option key={userIndex} value={user.id}>
                          {user.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                ))}
              </Col>
            )
        )
      : "";
  }, [administration, dataset, selectedForm, loading]);

  const renderFormLine = useMemo(() => {
    return (
      selectedForm &&
      administration.length && (
        <SteppedLineTo
          within="tree-col-0"
          key={`tree-line-${selectedForm}`}
          from={`tree-form-block-${selectedForm}`}
          to={`tree-col-0`}
          fromAnchor="right"
          toAnchor="right"
          delay={scroll ? 0 : 1}
          orientation="h"
          borderColor="#0058ff"
          borderStyle="solid"
        />
      )
    );
  }, [administration, selectedForm, scroll]);

  const renderAdminLines = useMemo(() => {
    return (
      selectedForm &&
      administration.map((adminItem, m) => (
        <div key={m}>
          {adminItem.children.map((childItem) => {
            const isParent =
              administration[m + 1]?.children[0]?.parent === childItem.id;
            return (
              <>
                <SteppedLineTo
                  within={`tree-col-${m + 1}`}
                  key={`tree-line-${m + 1}-${childItem.id}`}
                  from={`tree-col-${m}`}
                  to={`tree-block-${m + 1}-${childItem.id}`}
                  fromAnchor="right"
                  toAnchor="left"
                  delay={scroll ? 0 : 1}
                  orientation="h"
                  borderColor={
                    m >= administration.length - 1 || isParent
                      ? "#0058ff"
                      : "#dedede"
                  }
                  borderStyle={
                    m >= administration.length - 1 || isParent
                      ? "solid"
                      : "dotted"
                  }
                  borderWidth={
                    m >= administration.length - 1 || isParent ? 1 : 1.5
                  }
                  zIndex={m >= administration.length - 1 || isParent ? 100 : 1}
                />
                {isParent && (
                  <SteppedLineTo
                    within={`tree-col-${m + 1}`}
                    key={`tree-line-p-${m}-${childItem.id}`}
                    from={`tree-block-${m + 1}-${childItem.id}`}
                    to={`tree-col-${m + 2}`}
                    fromAnchor="right"
                    toAnchor="left"
                    delay={scroll ? 0 : 1}
                    orientation="h"
                    borderColor="#0058ff"
                    borderStyle="solid"
                    zIndex={100}
                  />
                )}
              </>
            );
          })}
        </div>
      ))
    );
  }, [administration, selectedForm, scroll]);

  return (
    <div id="approversTree">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
        </Col>
      </Row>
      <Divider />
      <ApproverFilters
        loading={saving}
        disabled={isPristine || loading}
        visible={dataset.length}
        reset={resetForm}
        save={handleSubmit}
      />
      <Divider />
      <Card style={{ padding: 0, minHeight: "40vh" }}>
        <Row
          wrap={false}
          className={`tree-header ${loading ? "loading" : ""}`}
          justify="left"
        >
          <Col span={6} align="center">
            Questionnaire
          </Col>
          {selectedForm &&
            dataset.map(
              (aN, anI) =>
                !!aN.children?.length && (
                  <Col key={anI} span={6} align="center">
                    {aN.childLevelName}
                    <div
                      className="shade"
                      id={`shade-for-tree-col-${anI + 1}`}
                    />
                  </Col>
                )
            )}
        </Row>
        <div className="tree-wrap" id="tree-wrap">
          <Row wrap={false} justify="left">
            {renderFormNodes}
            {renderAdminNodes}
            {renderFormLine}
            {renderAdminLines}
          </Row>
        </div>
      </Card>
    </div>
  );
};

export default React.memo(ApproversTree);
