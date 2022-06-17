import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const QuestionnaireTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/view-approver/2.png",
            title: "Manage questionnaire button",
            description:
              "This button brings you to a page where you can manage questionnaires approvals.",
          },
          {
            image: "/assets/tour/view-approver/1.png",
            title: "Approvals",
            description:
              "This shows tabs with a table to see pending, subordinates and approved",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} title="View approvers" />;
};

export default React.memo(QuestionnaireTour);
