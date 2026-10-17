import { getAgentsGuide } from './agents-path.js';
const escapeHtml = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
/** Preserve the provided B/E/F technical sections and expand to five applied A questions. */
export function enrichAgentsInterviewSections(lesson) {
  const guide=getAgentsGuide(lesson.id);
  if(!guide||lesson.sections?.length!==6)return lesson;
  const added=[guide.interview,`A trace shows: ${guide.views[1].steps[0][1]} What evidence distinguishes a model decision error from a missing runtime guard, and how would you validate the repair?`];
  return {...lesson,sections:lesson.sections.map(section=>{
    if(section.letter==='A'){
      // Original A already has four questions. Preserve the first three distinct questions
      // and replace its generic last 'prove the improvement' item with two topic-specific ones.
      const html=section.html.replace(/<li>How would you prove the improvement on a reproducible evaluation suite without inventing benchmark gains\?<\/li>/,'');
      const insert=added.map(s=>`<li>${escapeHtml(s)}</li>`).join('');
      return {...section,html:html.replace('</ol>',insert+'</ol>'),text:section.text+' '+added.join(' ')};
    }
    if(section.letter==='D'){
      const rubric=`Explain the responsibilities of ${guide.concepts.map(([name])=>name).join(', ')}; trace the actual control and data boundaries. Diagnose this failure: ${guide.views[1].steps[0][1]} Identify a simpler alternative, prove permissions and irreversible effects are enforced outside the model, specify cost/latency and a reproducible acceptance test. ${guide.engineering}`;
      return {...section,html:section.html+`<div class="pressure-rubric"><h4>A strong response must include</h4><p>${escapeHtml(rubric)}</p></div>`,text:section.text+' A strong response must include: '+rubric};
    }
    return section;
  })};
}
