/** Every lesson is assigned one deterministic, browser-only engineering exercise. */
export const AGENT_LAB_GROUPS = Object.freeze({
  loop:[1,5,18,21,40],
  memory:[2,16,19,20,48],
  permissions:[3,4,26,27,31,33,34,39,45,50,51],
  graph:[6,22,32,37,52,53],
  tools:[7,8,9,10,44,46,49],
  parallel:[11,12,15,23,38,47],
  protocol:[13,14,24,54],
  recovery:[17,30,35,36],
  evaluation:[25,28,41],
  cost:[29,42,43]
});
export const agentLabType = id => Object.entries(AGENT_LAB_GROUPS).find(([,ids])=>ids.includes(Number(id)))?.[0];
export const agentLessonHasLab = id => Boolean(agentLabType(id));
