import React, { useMemo } from "react";
import { Tour } from "../../../components";
import { store, config, uiText } from "../../../lib";

const ProfileTour = () => {
  const { user: authUser } = store.useState((s) => s);
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const steps = [
    {
      image: "/assets/tour/profile/1.png",
      title: "Control Center",
      description: text.tourControlCenter,
    },
    ...(config.checkAccess(authUser?.role_detail, "form")
      ? [
          {
            image: "/assets/tour/profile/2.png",
            title: "Data Uploads",
            description: text.tourDataUploads,
          },
        ]
      : []),
    ...(config.checkAccess(authUser?.role_detail, "approvals")
      ? [
          {
            image: "/assets/tour/profile/3.png",
            title: "Manage Approvals",
            description: text.tourApprovals,
          },
          {
            image: "/assets/tour/profile/4.png",
            title: "Manage Approvers",
            description: text.tourApprovers,
          },
        ]
      : []),
  ];

  return <Tour steps={steps} title="Profile" />;
};

export default React.memo(ProfileTour);
