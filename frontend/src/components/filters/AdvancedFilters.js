import React, { useEffect, useMemo, useState } from "react";
import "./style.scss";
import { Card, Select, Radio, Row, Col, Tag, Popover } from "antd";
import { store } from "../../lib";
import { InfoCircleOutlined } from "@ant-design/icons";
import { first, flatten } from "lodash";

const { Option, OptGroup } = Select;

const AdvancedFilters = () => {
  const [optionGroups, setOptionGroups] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const { selectedForm, loadingForm, questionGroups, advancedFilters } =
    store.useState((s) => s);

  useEffect(() => {
    if (first(flatten(questionGroups.map((qg) => qg.question)))?.form) {
      store.update((s) => {
        s.advancedFilters = [];
      });
      setSelectedQuestion(null);
      setOptionGroups(
        questionGroups
          ?.map((d) => ({
            name: d.name,
            questions: d.question.filter((q) => q.type === "option"),
          }))
          ?.filter((qg) => qg.questions.length > 0) || []
      );
    }
  }, [selectedForm, questionGroups]);

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
        .option.find((o) => o.id === e.target.value);
      store.update((s) => {
        s.advancedFilters = [
          ...filtered,
          {
            id: selectedQuestion.id,
            question: selectedQuestion.name,
            value: e.target.value,
            label: optionRes.name,
          },
        ];
      });
    };
    const selectedFilterOption = advancedFilters.find(
      (f) => f.id === selectedQuestion?.id
    );
    if (selectedQuestion) {
      const optionsRes = flatten(questionGroups.map((qg) => qg.question))?.find(
        (qi) => qi.id === selectedQuestion.id
      );
      if (optionsRes?.option?.length) {
        return (
          <Radio.Group
            value={selectedFilterOption?.value}
            style={{ width: "100%" }}
            onChange={onOptionsChange}
            className="filter-options"
          >
            <Row>
              {optionsRes.option.map((oi) => (
                <Col span={8} key={oi.id}>
                  <Radio value={oi.id}>{oi.name}</Radio>
                </Col>
              ))}
            </Row>
          </Radio.Group>
        );
      }
    }
    return null;
  }, [selectedQuestion, questionGroups, advancedFilters]);
  const activeFilters = useMemo(() => {
    const handleCloseTag = (id) => {
      store.update((s) => {
        s.advancedFilters = advancedFilters.filter((af) => af.id !== id);
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
              onClose={() => handleCloseTag(af.id)}
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
    <div className="advanced-filters">
      <Card bodyStyle={{ padding: 12 }} style={{ padding: 0 }}>
        <div>
          <Select
            style={{ width: "100%" }}
            value={selectedQuestion?.id}
            onChange={handleChange}
            disabled={loadingForm}
            placeholder="Search.."
            showSearch
            filterOption={(input, option) =>
              option.options[0]?.children
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
  );
};

export default React.memo(AdvancedFilters);
