import React, { useMemo } from "react";
import { Tour } from "../../../components";
import { store, config, uiText } from "../../../lib";

const ControlCenterTour = () => {
  const { user: authUser } = store.useState((s) => s);
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const steps = [
    ...(config.checkAccess(authUser?.role_detail, "data")
      ? [
          {
            image: "/assets/tour/control-center/1.png",
            title: "Manage Data",
            description: text.tourManageData,
          },
        ]
      : []),
    ...(authUser?.role_id !== 4 &&
    config.checkAccess(authUser?.role_detail, "form")
      ? [
          {
            image: "/assets/tour/control-center/3.png",
            title: "Data Uploads",
            description: text.tourDataUploads,
          },
        ]
      : []),
    ...(config.checkAccess(authUser?.role_detail, "user")
      ? [
          {
            image: "/assets/tour/control-center/4.png",
            title: "User Management",
            description: text.tourUserManagement,
          },
        ]
      : []),
  ];

  return <Tour steps={steps} />;
};

export default React.memo(ControlCenterTour);
