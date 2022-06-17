import React from "react";
import { Tour } from "../../../components";
import { store, config } from "../../../lib";

const UploadDataTour = () => {
  const { user: authUser } = store.useState((s) => s);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/upload-data/1.png",
            title: "Download",
            description: "An item you can download.",
          },
          {
            image: "/assets/tour/upload-data/2.png",
            title: "Upload",
            description: "Upload / Browsing to your computer.",
          },
        ]
      : []),
  ];

  return <Tour steps={steps} title="Upload data" />;
};

export default React.memo(UploadDataTour);
