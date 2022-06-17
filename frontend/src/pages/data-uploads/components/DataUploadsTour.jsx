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
              "Lorem ipsum dolor sit, amet consectetur adipisicing elit",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} />;
};

export default React.memo(DataUploadsTour);
