import { getRagGuide } from './rag-path.js';

const escapeHtml = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

/** Enrich the existing substantive A–F course content, never discard B/E scenarios. */
export function enrichRagInterviewSections(lesson) {
  const guide = getRagGuide(lesson.id);
  if (!guide || lesson.sections?.length !== 6) return lesson;
  const failure = guide.views[1].steps[1][1];
  const extraQuestions = [
    guide.interview,
    `A production trace shows: ${failure} How would you isolate the first failing pipeline boundary, quantify its cost, and prove the repair on a held-out test?`
  ];
  return { ...lesson, sections: lesson.sections.map(section => {
    if (section.letter === 'A') {
      const added = extraQuestions.map(question => `<li>${escapeHtml(question)}</li>`).join('');
      return { ...section, html:section.html.replace('</ol>', `${added}</ol>`), text:`${section.text} ${extraQuestions.join(' ')}` };
    }
    if (section.letter === 'C') {
      const [mechanism] = guide.concepts;
      const spoken = `“${mechanism[1]} ${guide.views[0].steps.map(([,detail]) => detail).join(' ')} The important limitation is this: ${guide.precision} I would verify the design with ${guide.engineering.toLowerCase()}”`;
      return { ...section, html:`<p>${escapeHtml(spoken)}</p>`, text:spoken };
    }
    if (section.letter === 'D') {
      const rubric = `Describe ${guide.concepts.map(item => item[0]).join(', ')}, including the relevant data flow and a credible alternative. Explain the failure boundary without confusing retrieved similarity with correct evidence. State assumptions, version/permission scope, latency or memory cost, and a paired experiment. ${guide.engineering}`;
      return { ...section, html:`${section.html}<div class="pressure-rubric"><h4>A strong response must include</h4><p>${escapeHtml(rubric)}</p></div>`, text:`${section.text} A strong response must include: ${rubric}` };
    }
    return section;
  }) };
}
