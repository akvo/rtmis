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
            title: "Select an approver",
            description:
              "You can search for a specific approvers with this select dropdown.",
          },
          {
            image: "/assets/tour/manage-approver/2.png",
            title: "Save or reset",
            description:
              "The selected approver can be saved by clicking save button. You also can reset the filter dropdown",
          },
          {
            image: "/assets/tour/manage-approver/3.png",
            title: "Approvers",
            description: "You can see the approvers trees here.",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} title="Manage approvers" />;
};

export default React.memo(ApproversTreeTour);
