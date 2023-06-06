const jmpColorScore = {
  // HH
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
  // HCF
  533560002: {
    "sanitation service level": {
      basic: { color: "#368541", score: 15 },
      limited: { score: 10, color: "#79BE7D" },
      "no service": { score: -1, color: "#FDF177" },
    },
    "hygiene service level": {
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
  // WASH SCH
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
    "hygiene service level": {
      basic: { score: 10, color: "#753780" },
      limited: { score: -1, color: "#FDF177" },
      "no service": { score: -2, color: "#F1AC2A" },
    },
    "menstrual hygiene service level": {
      awareness: { score: 10, color: "#753780" },
      "use of menstrual materials": { score: -1, color: "#FDF177" },
      access: { score: -2, color: "#F1AC2A" },
      participation: { score: -2, color: "#368541" },
    },
    "environmental cleaning service level": {
      basic: { score: 10, color: "#753780" },
      limited: { score: -1, color: "#FDF177" },
      "no service": { score: -2, color: "#F1AC2A" },
    },
  },
  // Urban Sanitation
  603050002: {
    "main type of sanitation": {
      "onsite sanitation": { score: 1, color: "#36AE7B" },
      "off site sanitation": { score: -1, color: "#EB5353" },
    },
    "sludge transported": {
      yes: { score: 1, color: "#36AE7B" },
      no: { score: -1, color: "#EB5353" },
    },
  },
};

export const negativeIndicator = [
  "no service",
  "limited",
  "unimproved",
  "no facility",
  "open defecation",
];

export default jmpColorScore;
