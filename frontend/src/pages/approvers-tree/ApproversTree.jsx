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
  const [adminNodes, setAdminNodes] = useState([]);
  const [adminNodesJson, setAdminNodesJson] = useState([]);
  const [scroll, setScroll] = useState(0);
  const [loading, setLoading] = useState(false);

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
      setLoading(true);
      api
        .get(
          `form/approver/?administration_id=${
            takeRight(administration, 1)[0].id
          }&form_id=${selectedForm}`
        )
        .then((res) => {
          const adminClone = administration.map((adminNode, anI) => ({
            ...adminNode,
            children: [...adminNode.children].map((cN, cnI) => ({
              ...cN,
              active: false,
              user:
                anI === administration.length - 1
                  ? res.data.find((d) => {
                      return (
                        d.administration.id ===
                        takeRight(administration, 1)[0]?.children[cnI].id
                      );
                    })?.user?.id || null
                  : null,
              users: cN.user_list || [],
            })),
          }));
          for (let i = 0; i < adminClone.length - 1; i++) {
            const pos = adminClone[i].children.findIndex(
              (c) => c.name === adminClone[i + 1].name
            );
            if (pos !== -1) {
              adminClone[i].children[pos].active = true;
            }
          }
          adminClone[adminClone.length - 1].children = adminClone[
            adminClone.length - 1
          ].children.map((el) => ({ ...el, active: true }));
          setAdminNodes(adminClone);
          setAdminNodesJson(JSON.stringify(takeRight(adminClone, 1)[0]));
          setLoading(false);
        })
        .catch((err) => {
          message.error("Could not fetch data");
          setLoading(false);
          console.error(err);
        });
    }
  }, [administration, selectedForm]);

  const isPristine = useMemo(() => {
    return JSON.stringify(takeRight(adminNodes, 1)[0]) === adminNodesJson;
  }, [adminNodes, adminNodesJson]);

  const resetForm = () => {
    const cloned = JSON.parse(adminNodesJson);
    setAdminNodes(cloned);
  };

  const handleSubmit = () => {
    const formData = takeRight(adminNodes, 1)[0]
      .children.filter((c) => c.user !== null)
      .map((c) => ({
        user_id: c.user,
        administration_id: takeRight(adminNodes, 1)[0].id,
      }));
    setLoading(true);
    api
      .post(`approval/form/${selectedForm}/`, formData)
      .then(() => {
        setAdminNodesJson(JSON.stringify(takeRight(adminNodes, 1)[0]));
        message.success("Approvers updated");
        setLoading(false);
      })
      .catch(() => {
        message.error("Could not update Approvers");
        setLoading(false);
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

  const renderNodes = useMemo(() => {
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
        .catch((err) => {
          message.error("Could not load filters");
          setLoading(false);
          console.error(err);
        });
    };
    return (
      <Row wrap={false} justify="left">
        {nodes.map((nodeItem, i) => (
          <Col key={i} span={6} className="tree-col-0" align="center">
            {nodeItem.children.map((childItem, j) => (
              <div
                className={`tree-block tree-form-block-${childItem.id}
                  ${
                    childItem.id === selectedForm ||
                    nodeItem.id === selectedForm
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
        ))}
        {selectedForm &&
          adminNodes.map(
            (adminItem, k) =>
              adminItem.children?.length > 0 && (
                <Col
                  onScroll={handleColScroll}
                  key={k}
                  span={6}
                  className={`tree-col-${k + 1}`}
                  align="center"
                >
                  {adminItem.children.map((childItem, l) => (
                    <div
                      className={`tree-block tree-block-${k}-${childItem.id}
                      ${childItem.active ? "active" : ""}`}
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
                        value={childItem.user}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onChange={(e) => {
                          if (!e) {
                            return;
                          }
                          const newNodes = JSON.parse(
                            JSON.stringify(adminNodes)
                          );
                          newNodes[k].children[l].user = e;
                          setAdminNodes(newNodes);
                        }}
                        onClear={() => {
                          const cleared = [...adminNodes];
                          cleared[k].children[l].user = null;
                          setAdminNodes(cleared);
                        }}
                      >
                        {childItem.users.map((user, userIndex) => (
                          <Option key={userIndex} value={user.id}>
                            {user.name}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  ))}
                </Col>
              )
          )}

        {selectedForm && (
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
        )}

        {selectedForm &&
          adminNodes.map((adminItem, m) => (
            <div key={m}>
              {adminItem.children.map((childItem) => {
                const isParent =
                  adminNodes[m + 1]?.children[0]?.parent === childItem.id ||
                  false;
                return (
                  <>
                    <SteppedLineTo
                      within={`tree-col-${m + 1}`}
                      key={`tree-line-${m + 1}-${childItem.id}`}
                      from={`tree-col-${m}`}
                      to={`tree-block-${m}-${childItem.id}`}
                      fromAnchor="right"
                      toAnchor="left"
                      delay={scroll ? 0 : 1}
                      orientation="h"
                      borderColor={
                        childItem.active || m >= adminNodes.length - 1
                          ? "#0058ff"
                          : "#dedede"
                      }
                      borderStyle={
                        childItem.active || m >= adminNodes.length - 1
                          ? "solid"
                          : "dotted"
                      }
                      borderWidth={
                        childItem.active || m >= adminNodes.length - 1 ? 1 : 1.5
                      }
                      zIndex={
                        childItem.active || m >= adminNodes.length - 1 ? 100 : 1
                      }
                    />
                    {isParent && (
                      <SteppedLineTo
                        within={`tree-col-${m + 1}`}
                        key={`tree-line-${m}-${childItem.id}`}
                        from={`tree-block-${m}-${childItem.id}`}
                        to={`tree-col-${m + 1}`}
                        fromAnchor="right"
                        toAnchor="right"
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
          ))}
      </Row>
    );
  }, [nodes, adminNodes, selectedForm, administration, scroll, loading]);

  return (
    <div id="approversTree">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
        </Col>
      </Row>
      <Divider />
      <ApproverFilters
        isPristine={isPristine}
        loading={false}
        reset={resetForm}
        save={handleSubmit}
      />
      <Divider />
      <Card style={{ padding: 0, minHeight: "40vh" }}>
        <Row wrap={false} className="tree-header" justify="left">
          <Col span={6} align="center">
            Questionnaire
          </Col>
          {selectedForm &&
            adminNodes.map(
              (aN, anI) =>
                aN.children.length > 0 && (
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
          {renderNodes}
        </div>
      </Card>
    </div>
  );
};

export default React.memo(ApproversTree);
