import data from '../data/courses.json' with { type: 'json' };

export const courses = data;
export const totalLessons = courses.reduce((sum, course) => sum + course.lessons.length, 0);
export function getCourse(slug) { return courses.find((course) => course.slug === slug); }
export function getLesson(courseSlug, lessonId) {
  return getCourse(courseSlug)?.lessons.find((item) => String(item.id) === String(lessonId));
}
export function lessonUrl(course, lesson) { return `/learn/${course.slug}/${lesson.id}/`; }

function tokens(text) {
  return (String(text).toLowerCase().match(/[a-z0-9]{3,}/g) || []).filter((token) => !STOP_WORDS.has(token));
}
const STOP_WORDS = new Set(['the','and','how','for','you','your','what','with','are','does','from','when','why','that','this','into','can','was','which','their','have','has','not','but','our','use','its','all','one','per','then','them','than']);

// Small bounded lexical search for a grounded tutorial assistant, not a vector index.
export function retrieveLessons(query, currentCourse = '', currentId = '', maxResults = 3) {
  const terms = [...new Set(tokens(query))].slice(0, 18);
  const scored = [];
  for (const course of courses) for (const lesson of course.lessons) {
    const name = `${lesson.title} ${course.title}`.toLowerCase();
    const content = `${lesson.subtitle} ${lesson.sections.find((s) => s.letter === 'B')?.text || ''}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (name.includes(term)) score += 6;
      if (content.includes(term)) score += 1;
    }
    if (currentCourse === course.slug && String(currentId) === String(lesson.id)) score += 5;
    if (score > 0) scored.push({ course, lesson, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, maxResults);
}
