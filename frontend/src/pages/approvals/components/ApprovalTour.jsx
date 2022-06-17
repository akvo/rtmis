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
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
          {
            image: "/assets/tour/view-approver/1.png",
            title: "Approvals",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} />;
};

export default React.memo(QuestionnaireTour);
