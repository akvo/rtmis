import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const QuestionnaireTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/questionnaires/1.png",
            title: "Manage Questionnaires Approvals",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} />;
};

export default React.memo(QuestionnaireTour);
