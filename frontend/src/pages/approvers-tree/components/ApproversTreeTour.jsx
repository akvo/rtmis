import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const ApproversTreeTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/manage-approver/1.png",
            title: "Filter approvers",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
          {
            image: "/assets/tour/manage-approver/2.png",
            title: "Save or reset",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
          {
            image: "/assets/tour/manage-approver/3.png",
            title: "List of approvers",
            description:
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} />;
};

export default React.memo(ApproversTreeTour);
