/**
 * Courses that ship a beginner-first foundations layer above their A–F
 * interview sections.
 *
 * A course appears here once it has a `<course>-path.js` exporting a getter
 * with the same shape as `getFoundationGuide`: question, plain, goals,
 * concepts [[name, simple, advanced]], example, views, precision,
 * engineering, interview, checkpoint.
 */
import { getFoundationGuide } from '../data/llm-foundations-path.js';
import { getTokenizationGuide } from '../data/tokenization-path.js';
import { getTransformerGuide } from '../data/transformer-path.js';
import { getGenerationGuide } from '../data/generation-path.js';
import { getTrainingGuide } from '../data/training-path.js';
import { getAdvancedGuide } from '../data/advanced-path.js';
import { getInferenceGuide } from '../data/inference-path.js';

const GUIDES = {
  'llm-foundations': getFoundationGuide,
  'tokenization-embeddings': getTokenizationGuide,
  'transformer-architecture': getTransformerGuide,
  'decoding-context': getGenerationGuide,
  'training-alignment': getTrainingGuide,
  'advanced-transformers': getAdvancedGuide,
  'inference-infrastructure': getInferenceGuide,
};

/** Returns the foundations guide for a lesson, or undefined if the course has none. */
export function foundationsGuideFor(courseSlug, lessonId) {
  return GUIDES[courseSlug]?.(lessonId);
}

export function courseHasFoundations(courseSlug) {
  return Object.hasOwn(GUIDES, courseSlug);
}
