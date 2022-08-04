import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const DataUploadsTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/view-data-uploads/1.png",
            title: "All uploads",
            description:
              "This shows you tabs with table where you can see pending submission, pending approval and approved data",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} title="View data uploads" />;
};

export default React.memo(DataUploadsTour);
