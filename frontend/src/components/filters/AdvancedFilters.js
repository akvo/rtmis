import React, { useEffect, useMemo, useState } from "react";
import "./style.scss";
import { Card, Select, Checkbox, Row, Col, Tag, Popover } from "antd";
import { store } from "../../lib";
import { InfoCircleOutlined } from "@ant-design/icons";
import { first, flatten, intersection } from "lodash";

const { Option, OptGroup } = Select;
const attributes = ["advanced_filter"];

const AdvancedFilters = () => {
  const [optionGroups, setOptionGroups] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const loadingForm = store.useState((s) => s.loadingForm);
  const questionGroups = store.useState((s) => s.questionGroups);
  const showAdvancedFilters = store.useState((s) => s.showAdvancedFilters);
  const advancedFilters = store.useState((s) => s.advancedFilters);

  useEffect(() => {
    if (first(flatten(questionGroups.map((qg) => qg.question)))?.form) {
      setSelectedQuestion(null);
      setOptionGroups(
        questionGroups
          ?.map((d) => ({
            name: d.name,
            questions: d.question.filter(
              (q) =>
                intersection(q?.attributes || [], attributes).length ===
                attributes.length
            ),
          }))
          ?.filter((qg) => qg.questions.length > 0)
      );
    }
  }, [questionGroups]);

  const handleChange = (e) => {
    const questionRes = flatten(
      questionGroups.map((qg) => qg.question.filter((q) => q.type === "option"))
    ).find((q) => q.id === e);
    if (questionRes) {
      setSelectedQuestion(questionRes);
    }
  };

  const FilterOptions = useMemo(() => {
    const onOptionsChange = (e) => {
      const filtered = advancedFilters.filter(
        (f) => f.id !== selectedQuestion.id
      );
      const optionRes = flatten(questionGroups.map((qg) => qg.question))
        ?.find((qi) => qi.id === selectedQuestion.id)
        .option.filter((o) => e.includes(o.id));
      store.update((s) => {
        s.advancedFilters = [
          ...filtered,
          ...optionRes.map((o) => ({
            id: selectedQuestion.id,
            question: selectedQuestion.name,
            value: o.id,
            label: o.name,
          })),
        ];
      });
    };
    const selectedFilterOption = advancedFilters.filter(
      (f) => f.id === selectedQuestion?.id
    );
    if (selectedQuestion) {
      const optionsRes = flatten(questionGroups.map((qg) => qg.question))?.find(
        (qi) => qi.id === selectedQuestion.id
      );
      if (optionsRes?.option?.length) {
        return optionsRes.option.length < 5 ? (
          <Checkbox.Group
            style={{ width: "100%" }}
            value={selectedFilterOption.map((fo) => fo.value)}
            onChange={onOptionsChange}
            className="filter-options"
          >
            <Row>
              {optionsRes.option.map((oi) => (
                <Col span={8} key={oi.id}>
                  <Checkbox value={oi.id}>{oi.name}</Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        ) : (
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            value={selectedFilterOption.map((fo) => fo.value)}
            onChange={onOptionsChange}
            className="filter-options"
            placeholder="Select.."
          >
            {optionsRes.option.map((oi) => (
              <Option value={oi.id} key={oi.id}>
                {oi.name}
              </Option>
            ))}
          </Select>
        );
      }
    }
    return null;
  }, [selectedQuestion, questionGroups, advancedFilters]);

  const activeFilters = useMemo(() => {
    const handleCloseTag = (id, value) => {
      store.update((s) => {
        s.advancedFilters = s.advancedFilters.filter(
          (af) => af.id !== id || af.value !== value
        );
      });
    };
    if (advancedFilters.length) {
      return (
        <div className="filters-active">
          {advancedFilters.map((af) => (
            <Tag
              key={`${af.id}-${af.value}`}
              icon={
                <Popover title={af.question} placement="topRight">
                  <InfoCircleOutlined />
                </Popover>
              }
              closable
              onClose={() => {
                handleCloseTag(af.id, af.value);
              }}
            >
              {af.label}
            </Tag>
          ))}
        </div>
      );
    }
    return null;
  }, [advancedFilters]);

  return (
    showAdvancedFilters && (
      <div className="advanced-filters">
        <Card bodystyle={{ padding: 12 }} style={{ padding: 0 }}>
          <div>
            <Select
              style={{ width: "100%" }}
              value={selectedQuestion?.id}
              onChange={handleChange}
              disabled={loadingForm}
              placeholder="Search.."
              showSearch
              filterOption={(input, option) =>
                option.options?.[0]?.children
                  ?.toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0
              }
            >
              {optionGroups.map((og, ogI) => (
                <OptGroup label={og.name} key={ogI}>
                  {og.questions.map((gq) => (
                    <Option key={gq.id} value={gq.id}>
                      {gq.name}
                    </Option>
                  ))}
                </OptGroup>
              ))}
            </Select>
          </div>
          {FilterOptions}
        </Card>
        {activeFilters}
      </div>
    )
  );
};

export default React.memo(AdvancedFilters);
