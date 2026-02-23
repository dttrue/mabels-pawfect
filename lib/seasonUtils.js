// lib/seasonUtils.js
function md(now, m, d, endOfDay = false) {
  const y = now.getFullYear();
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * forceSeason:
 * "summer" | "fall" | "halloween" | "thanksgiving"
 * | "christmas" | "valentines" | "stpatricks" | ""
 */
export function getSeasonFlags(forceSeason = "") {
  const now = new Date();
  const m = now.getMonth() + 1; // 1..12

  const forced = String(forceSeason || "")
    .trim()
    .toLowerCase();

  // Date windows
  const summerStart = md(now, 5, 12);
  const summerEnd = md(now, 8, 31, true);

  const fallStart = md(now, 9, 1);
  const fallEnd = md(now, 11, 30, true);

  const halloweenStart = md(now, 10, 1);
  const halloweenEnd = md(now, 10, 31, true);

  const thanksgivingStart = md(now, 11, 1);
  const thanksgivingEnd = md(now, 11, 30, true);

  const christmasStart = md(now, 12, 1);
  const christmasEnd = md(now, 12, 31, true);

  // ❤️ Valentines (Feb 1 - Feb 28)
  const valentinesStart = md(now, 2, 1);
  const valentinesEnd = md(now, 2, 28, true);

  // ☘️ St. Patrick’s (March 1 - March 31)
  const stPatricksStart = md(now, 3, 1);
  const stPatricksEnd = md(now, 3, 31, true);

  // Base flags
  let isSummer =
    (!forced && now >= summerStart && now <= summerEnd) || forced === "summer";

  let isHalloween =
    (!forced && now >= halloweenStart && now <= halloweenEnd) ||
    forced === "halloween";

  let isThanksgiving =
    (!forced && now >= thanksgivingStart && now <= thanksgivingEnd) ||
    forced === "thanksgiving";

  let isChristmas =
    (!forced && now >= christmasStart && now <= christmasEnd) ||
    forced === "christmas";

  let isValentines =
    (!forced && now >= valentinesStart && now <= valentinesEnd) ||
    forced === "valentines";

  let isStPatricks =
    (!forced && now >= stPatricksStart && now <= stPatricksEnd) ||
    forced === "stpatricks";

  let isFall =
    (!forced && now >= fallStart && now <= fallEnd) ||
    forced === "fall" ||
    forced === "halloween" ||
    forced === "thanksgiving";

  // Month sanity checks (only confirm, never override forced)
  if (!forced) {
    if (m !== 11) isThanksgiving = false;
    if (m !== 12) isChristmas = false;
    if (m !== 10) isHalloween = false;
    if (m !== 2) isValentines = false;
    if (m !== 3) isStPatricks = false;
  }

  const isOffSeason =
    !isSummer &&
    !isFall &&
    !isHalloween &&
    !isThanksgiving &&
    !isChristmas &&
    !isValentines &&
    !isStPatricks;

  return {
    isSummer,
    isFall,
    isHalloween,
    isThanksgiving,
    isChristmas,
    isValentines,
    isStPatricks,
    isOffSeason,
  };
}
