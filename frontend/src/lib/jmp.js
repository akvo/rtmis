const jmpColorScore = {
  519630048: {
    "sanitation service level": {
      "safely managed": { color: "#368541", score: 15 },
      basic: { color: "#79BE7D", score: 10 },
      limited: { color: "#FDF177", score: -1 },
      unimproved: { color: "#FBD256", score: -2 },
      "open defecation": { color: "#F1AC2A", score: -3 },
    },
    "hygiene service level": {
      basic: { score: 10, color: "#753780" },
      limited: { score: -1, color: "#FDF177" },
      "no facility": { score: -2, color: "#F1AC2A" },
    },
    "menstrual hygiene service level": {
      awareness: { color: "#368541", score: 15 },
      "use of menstrual materials": { score: 10, color: "#79BE7D" },
      access: { score: -1, color: "#FDF177" },
      participation: { score: -2, color: "#FBD256" },
    },
  },
  533560002: {
    "sanitation service level": {
      basic: { color: "#368541", score: 15 },
      limited: { score: 10, color: "#79BE7D" },
      "no service": { score: -1, color: "#FDF177" },
    },
    "hygiene (hand washing) service level": {
      basic: { color: "#368541", score: 15 },
      limited: { score: 10, color: "#79BE7D" },
      "no service": { score: -1, color: "#FDF177" },
    },
    "health care waste management service level": {
      basic: { color: "#368541", score: 15 },
      limited: { score: 10, color: "#79BE7D" },
      "no service": { score: -1, color: "#FDF177" },
    },
    "environmental cleaning service level": {
      basic: { color: "#368541", score: 15 },
      limited: { score: 10, color: "#79BE7D" },
      "no service": { score: -1, color: "#FDF177" },
    },
  },
  563350033: {
    "drinking water service level": {
      basic: { score: 10, color: "#753780" },
      limited: { score: -1, color: "#FDF177" },
      "no service": { score: -2, color: "#F1AC2A" },
    },
    "sanitation service level": {
      basic: { score: 10, color: "#753780" },
      limited: { score: -1, color: "#FDF177" },
      "no service": { score: -2, color: "#F1AC2A" },
    },
    "hygiene (handwashing) service level": {
      basic: { score: 10, color: "#753780" },
      limited: { score: -1, color: "#FDF177" },
      "no service": { score: -2, color: "#F1AC2A" },
    },
    "hygiene (mhm) service level": {
      awareness: { score: 10, color: "#753780" },
      "use of menstrual materials": { score: -1, color: "#FDF177" },
      access: { score: -2, color: "#F1AC2A" },
      participation: { score: -2, color: "#368541" },
    },
    "enviromental cleaning service level": {
      basic: { score: 10, color: "#753780" },
      limited: { score: -1, color: "#FDF177" },
      "no service": { score: -2, color: "#F1AC2A" },
    },
  },
};

export default jmpColorScore;
