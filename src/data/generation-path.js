/**
 * Beginner → engineering bridge for Mentora's fourteen Generation & Context
 * lessons. Diagrams are conceptual teaching illustrations, not benchmarks.
 * Keep interview A–F sections in courses.json as the next stage of study.
 */
export const generationGuides = {
  1: {
    question: 'How does a hidden vector become a word?',
    plain: 'The model ends each forward pass with a vector describing what should come next. A linear layer turns that vector into one score per vocabulary entry — the logits. The largest logit is the model’s favourite token. Nothing here knows anything about words yet; it is arithmetic until the scores are interpreted.',
    goals: ['Trace a hidden state to vocabulary scores', 'Explain what a logit is and is not', 'Identify where sampling enters the process'],
    concepts: [
      ['Logits', 'One raw score per vocabulary entry.', 'The output projection maps the final hidden state to a vector of width vocab_size. Scores are unbounded and comparable only to each other — they are not probabilities.'],
      ['Output projection', 'A linear layer, sometimes tied to the input embedding.', 'The final position’s hidden state is multiplied by a matrix of shape [d_model, vocab_size]. Tying weights with the embedding table reduces parameters and couples the two directions.'],
      ['Next-token only', 'The model scores one position at a time.', 'Although every position is computed during prefill, only the last position’s scores are needed to choose what comes next.'],
      ['Scores become choices', 'Logits must be converted before selecting.', 'Softmax turns scores into probabilities, then a decoding rule picks a token. Logits alone never decide anything.']
    ],
    example: { title: 'Explain why "the model chose this word" is imprecise', steps: ['Say the model produced scores, not a decision.', 'Point out that a decoding rule turned those scores into the chosen token.', 'Show that the same scores can yield different tokens under different settings.', 'Conclude that quality is partly model and partly decoding configuration.'], takeaway: 'The model scores; the decoder decides. Both are part of the system you are evaluating.' },
    views: [
      { name: 'Hidden state to logits', note: 'A single matrix multiply produces vocabulary scores.', steps: [['Final hidden state', 'One vector for the last position.'], ['Output projection', 'Multiply by [d_model, vocab_size].'], ['Logits', 'One unbounded score per token.'], ['Compare', 'Relative magnitudes are what matter.']] },
      { name: 'Logits to a chosen token', note: 'Two separate steps, both configurable.', steps: [['Logits', 'Raw scores.'], ['Softmax or temperature', 'Converts to a probability distribution.'], ['Decoding rule', 'Greedy, top-k, top-p, or beam.'], ['Token', 'The ID appended to the sequence.']] }
    ],
    precision: 'A logit has no absolute meaning. Only differences between logits matter, and they matter only after a transformation.',
    engineering: 'When debugging generation, log the top-k logits and the post-softmax distribution separately. They answer different questions.',
    interview: 'If logits are not probabilities, why can you compare them directly?',
    checkpoint: { question: 'What does the output projection actually produce?', options: ['A probability distribution over tokens', 'One raw score per vocabulary entry', 'The next token ID', 'A confidence estimate'], correct: 1, why: 'It is a linear layer producing unbounded scores. Softmax and the decoding rule come afterwards and are separate decisions.' }
  },
  2: {
    question: 'What does softmax actually do to the logits?',
    plain: 'It turns a list of arbitrary scores into a valid probability distribution: everything becomes positive and everything sums to one. The largest logit gets the largest share, and the gaps between logits determine how confident the result is.',
    goals: ['Explain softmax as exponentiate-and-normalize', 'Describe how logit gaps control peakiness', 'Explain numerical stability techniques'],
    concepts: [
      ['Exponentiate and normalize', 'Two steps that guarantee a valid distribution.', 'Each logit is exponentiated, then every value is divided by the sum. Positivity comes from the exponential; the sum-to-one comes from the division.'],
      ['Max subtraction for stability', 'The standard numerical safety measure.', 'Subtracting the largest logit before exponentiating changes no probabilities but prevents overflow. This is why stable implementations never call exp on raw logits.'],
      ['Gaps control peakiness', 'Differences, not magnitudes, set the distribution.', 'A uniform gap keeps the distribution flat; large gaps make it sharp. Doubling all logits’ differences sharpens the result, which is exactly what temperature does.'],
      ['Unit-shape invariance', 'Softmax of a constant-shifted vector is unchanged.', 'Adding the same value to every logit cancels in the normalization, confirming that only relative differences carry information.']
    ],
    example: { title: 'Diagnose a model that always answers with one phrase', steps: ['Plot the post-softmax distribution, not just the argmax.', 'Check whether the top token holds nearly all the mass.', 'Compare the logit gap against typical values for that model.', 'Test whether temperature or top-p is set unusually low before blaming the model.'], takeaway: 'Repetition is often a decoding configuration problem, not a model failure.' },
    views: [
      { name: 'Inside softmax', note: 'Stability requires subtracting the maximum.', steps: [['Logits', 'Raw, possibly very large or negative.'], ['Subtract max', 'Shifts everything so the largest is zero.'], ['Exponentiate', 'All values become positive and bounded.'], ['Normalize', 'Divide by the sum to get probabilities.']] },
      { name: 'Gap and peakiness', note: 'The same shape with different gaps behaves differently.', steps: [['Small gaps', 'Probabilities spread roughly evenly.'], ['Medium gaps', 'A clear favourite, tail still meaningful.'], ['Large gaps', 'Near one-hot; tail collapses.'], ['Effect', 'Deterministic-looking generation.']] }
    ],
    precision: 'Softmax probabilities express the model’s relative preference, not calibrated confidence in the factuality of the answer.',
    engineering: 'Never compare confidence across models by raw softmax peakiness. Calibration differs by model, temperature, and prompt.',
    checkpoint: { question: 'Why is the maximum logit subtracted before exponentiating?', options: ['To change the probabilities', 'To prevent overflow while leaving probabilities unchanged', 'To make the distribution sharper', 'To enforce a temperature of one'], correct: 1, why: 'Softmax is invariant to a constant shift, so subtracting the max is purely a numerical safety measure with no effect on the result.' }
  },
  3: {
    question: 'When does greedy decoding beat beam search, and when does it fail?',
    plain: 'Greedy picks the top token at every step — fast, simple, and locally optimal. Beam search keeps several candidate sequences to find a better overall sequence. Greedy is fast and can loop; beam search often produces bland, high-likelihood text that misses the best answer.',
    goals: ['Describe how beam search maintains candidates', 'Explain why local optimality is not global optimality', 'Match each method to a task type'],
    concepts: [
      ['Greedy decoding', 'Take the argmax at every step.', 'It runs in one pass and is cheap, but a locally optimal token can lead to a sequence that is worse overall. This is where repetition loops come from.'],
      ['Beam search', 'Keep the top-k partial sequences by total log-probability.', 'At each step every beam is extended and the best beams retained. It searches for a high-probability sequence rather than the locally best token.'],
      ['Length bias', 'Longer sequences accumulate more negative log-probability.', 'Without length normalization, beam search favours short outputs because every added token reduces the total. This must be corrected explicitly.'],
      ['Degenerate output', 'Higher likelihood often means less interesting text.', 'Optimizing likelihood tends to produce generic, safe sequences. For open-ended generation this is a known failure, which is why sampling is preferred.']
    ],
    example: { title: 'Choose a decoding method for a task', steps: ['Ask whether the output must be exact — extraction and labels favour greedy.', 'Ask whether multiple near-best answers exist — beam suits structured search.', 'Check whether the text must be varied and natural — use sampling.', 'For any beam configuration, enable length normalization and re-test.'], takeaway: 'Match the decoder to the output contract, not to habit.' },
    views: [
      { name: 'Greedy step by step', note: 'One candidate, chosen locally at each step.', steps: [['Score all tokens', 'Produce the next-token distribution.'], ['Take argmax', 'Commit to the single best token.'], ['Append', 'Repeat from the new prefix.'], ['Risk', 'No way to revisit a bad early choice.']] },
      { name: 'Beam search breadth', note: 'Several candidates survive to be compared.', steps: [['Keep k beams', 'Store the best partial sequences.'], ['Expand each', 'Score every possible next token.'], ['Re-rank', 'Keep the top k by total score.'], ['Normalize', 'Correct for the short-output bias.']] }
    ],
    precision: 'Beam search maximizes sequence likelihood under a length correction, not answer quality. The two diverge sharply for open-ended text.',
    engineering: 'If beam search produces repetitive or short answers, check length normalization before reducing beam width.',
    checkpoint: { question: 'Why does unnormalized beam search prefer short outputs?', options: ['Shorter sequences are scored more accurately', 'Each added token contributes negative log-probability, lowering the total', 'The beam width shrinks over time', 'Softmax biases against long sequences'], correct: 1, why: 'Log-probabilities are negative and accumulate, so a shorter sequence can outscore a better longer one unless the score is normalized by length.' }
  },
  4: {
    question: 'What does temperature actually change?',
    plain: 'Temperature divides the logits before softmax. Lower it and the distribution sharpens toward the top choice; raise it and it flattens toward uniform. Rankings never change — only how much of the probability mass flows to the runner-up.',
    goals: ['Describe temperature as logit scaling', 'Explain why rankings are preserved', 'Choose a temperature by task and risk'],
    concepts: [
      ['Divide before softmax', 'Temperature is a scaling factor on logits.', 'At T = 1 nothing changes. Below 1 the gaps shrink after division and the distribution concentrates; above 1 it spreads out.'],
      ['Rankings never change', 'Scaling preserves order.', 'Dividing every logit by a positive constant cannot reorder them. The argmax is identical at any temperature, so greedy decoding is unaffected by temperature.'],
      ['T approaches zero', 'The limit is deterministic.', 'As temperature falls toward zero the distribution approaches one-hot, which is greedy decoding. This is why low temperature plus greedy sampling is redundant.'],
      ['T rises toward infinity', 'The limit is uniform.', 'Very high temperature makes every token nearly equally likely, producing text that is varied and largely incoherent.']
    ],
    example: { title: 'Set temperature for a support bot', steps: ['Start at a low value where answers must be consistent and factual.', 'Verify the top token still has room to change when context differs.', 'Raise it only for creative tasks where variety is the goal.', 'Log the temperature alongside every evaluation so results stay comparable.'], takeaway: 'Temperature is a product decision about variation, not a quality dial.' },
    views: [
      { name: 'Scaling the logits', note: 'One division, before the softmax.', steps: [['Logits', 'Raw scores with some spread.'], ['Divide by T', 'Scales the spread.'], ['Softmax', 'Converts the scaled scores.'], ['Distribution', 'Sharper below 1, flatter above.']] },
      { name: 'Temperature and ranking', note: 'Order is preserved at every temperature.', steps: [['Argmax at T=1', 'The top token.'], ['Argmax at T=0.3', 'The same token.'], ['Argmax at T=1.8', 'Still the same token.'], ['What changes', 'Only the probability given to the tail.']] }
    ],
    precision: 'Temperature changes the probability distribution, not the model’s preferences. The ranking of tokens is invariant to it.',
    engineering: 'Record temperature with every evaluation result. Comparing outputs across runs with different temperatures is meaningless.',
    interview: 'Why does temperature have no effect on greedy decoding?',
    checkpoint: { question: 'What happens to the token ranking as temperature increases?', options: ['The ranking changes', 'The ranking is preserved; only the probabilities change', 'The ranking inverts', 'New tokens enter the top position'], correct: 1, why: 'Dividing all logits by the same positive constant preserves order, so the argmax is identical at any temperature.' }
  },
  5: {
    question: 'How do top-k and top-p sampling differ?',
    plain: 'Both truncate the tail of the distribution before sampling. Top-k keeps a fixed number of candidates regardless of how confident the model is. Top-p keeps the smallest set of candidates whose probabilities sum past a threshold — so the pool adapts to how peaked the distribution already is.',
    goals: ['Explain the truncation rule each method applies', 'Describe why a dynamic cutoff can be preferable', 'Choose between them for a given task'],
    concepts: [
      ['Top-k truncation', 'Keep the k highest-probability tokens, then renormalize.', 'The pool size is constant. In a confident distribution it may cut nothing useful; in a flat one it may still allow a bad token through simply because k is fixed.'],
      ['Top-p truncation', 'Keep the smallest set reaching cumulative probability p.', 'The pool adapts. When the model is confident, few tokens suffice; when it is uncertain, the pool widens automatically.'],
      ['Renormalization', 'Truncated mass must be redistributed.', 'After cutting the tail, the remaining probabilities are rescaled to sum to one. Without this, the sampler would draw from an invalid distribution.'],
      ['Combined use', 'The two are usually applied together.', 'Practical pipelines set top-p first, then top-k as a hard ceiling, so neither a very flat distribution nor a pathological outlier can dominate.']
    ],
    example: { title: 'Tune sampling for a factual assistant', steps: ['Set a low top-p so only genuinely plausible continuations remain.', 'Add a small top-k as a safety ceiling against tail outliers.', 'Verify that factual accuracy does not drop as you raise top-p.', 'Test on unanswerable inputs, where a wide pool produces fabrication.'], takeaway: 'Widening the sample pool buys variety and costs factual safety.' },
    views: [
      { name: 'Top-k', note: 'A fixed-width window over the ranked list.', steps: [['Rank tokens', 'Order by probability.'], ['Keep k', 'Fixed count, always the same size.'], ['Renormalize', 'Redistribute the cut mass.'], ['Sample', 'Draw from the reduced set.']] },
      { name: 'Top-p', note: 'A window whose width adapts to confidence.', steps: [['Rank tokens', 'Order by probability.'], ['Accumulate', 'Walk down adding probability.'], ['Cut at p', 'Stop once the threshold is crossed.'], ['Renormalize', 'Rescale and sample.']] }
    ],
    precision: 'Top-p adapts to the model’s confidence; top-k does not. Neither guarantees a good answer — they only limit how bad a draw can be.',
    engineering: 'Tune on held-out examples rather than by convention. Defaults copied between models rarely transfer.',
    checkpoint: { question: 'What is the key difference between top-k and top-p?', options: ['Top-k uses probabilities and top-p does not', 'Top-k keeps a fixed count; top-p keeps a confidence-dependent set', 'Top-p requires renormalization and top-k does not', 'Top-k applies only during prefill'], correct: 1, why: 'Top-k always retains k tokens regardless of the distribution. Top-p retains the smallest set whose cumulative probability reaches p, so the pool size varies with confidence.' }
  },
  6: {
    question: 'Why does a long generation start repeating itself?',
    plain: 'The model learns that familiar, high-probability phrases are safe. Once one repeats, the surrounding context makes the next repetition even more likely — a feedback loop. Repetition penalties and other decoders interrupt that loop, but each fix distorts the distribution and can hurt quality.',
    goals: ['Describe the feedback loop behind repetition', 'Explain what repetition penalties actually change', 'Identify when repetition signals a deeper problem'],
    concepts: [
      ['Positive feedback', 'Repetition makes further repetition more likely.', 'Once a phrase appears twice, the context strongly predicts it a third time. The distribution sharpens around the repeated token and the loop locks in.'],
      ['Repetition penalty', 'Downweight tokens that already appeared.', 'A multiplicative or additive penalty reduces the logit of previously generated tokens. It breaks loops but also penalizes legitimate reuse of common words.'],
      ['Presence and frequency penalties', 'Two separable effects.', 'Presence penalizes whether a token appeared at all; frequency penalizes how often. Separating them lets you control loops without suppressing necessary reuse.'],
      ['Symptom versus cause', 'Sometimes repetition is a degenerate model.', 'Extremely low temperature, a truncated context, or a poorly trained model all produce repetition that no penalty fixes. Diagnose before medicating.']
    ],
    example: { title: 'A summarizer loops on one sentence', steps: ['Check whether the source is repetitive — the model may be faithfully copying.', 'Inspect temperature and top-p for an over-constrained setting.', 'Look for a stop condition that never fires, allowing unbounded generation.', 'Apply a mild frequency penalty only after the above are ruled out.'], takeaway: 'Repetition is a signal. Read it before you suppress it.' },
    views: [
      { name: 'The loop', note: 'Context makes repetition self-reinforcing.', steps: [['Phrase appears', 'First occurrence is unremarkable.'], ['Context shifts', 'The phrase is now more predictable.'], ['Repeats', 'Second occurrence strengthens the pattern.'], ['Locks in', 'Distribution collapses onto the loop.']] },
      { name: 'Breaking it', note: 'Penalties alter the distribution after generation.', steps: [['Detect repeats', 'Track token counts so far.'], ['Penalize', 'Lower logits of repeated tokens.'], ['Re-sample', 'Draw from the adjusted distribution.'], ['Trade-off', 'Legitimate reuse is suppressed too.']] }
    ],
    precision: 'Repetition penalties modify the decoding distribution only. They do not change what the model knows or believes.',
    engineering: 'Set a hard maximum output length regardless of penalties. An unbounded loop with no stop condition will eventually consume the whole budget.',
    checkpoint: { question: 'What is the main risk of an aggressive repetition penalty?', options: ['It increases latency', 'It suppresses legitimate reuse of common words and distorts the distribution', 'It changes the model weights', 'It breaks the KV cache'], correct: 1, why: 'Penalties are applied to the decoding distribution, so heavy use penalizes tokens that are genuinely appropriate to repeat, harming fluency.' }
  },
  7: {
    question: 'How does the model know when to stop?',
    plain: 'It does not decide. The application does. During training a special end-of-sequence token was taught as the signal that generation is complete. At runtime the sampler checks for it, and the application separately checks for stop sequences, length limits, and its own cancellation.',
    goals: ['Distinguish EOS tokens from stop sequences', 'Explain where stopping is actually enforced', 'Design reliable stop conditions'],
    concepts: [
      ['End-of-sequence token', 'A learned signal that generation is finished.', 'EOS was part of training, so the model can emit it naturally. Once sampled, generation halts and the token is usually stripped from the returned text.'],
      ['Stop sequences', 'Application-defined strings that end generation.', 'These are arbitrary — a marker like "###" or a line prefix. They are enforced outside the model, which is why they work even when the model would continue.'],
      ['Why they differ', 'One is learned, one is imposed.', 'EOS depends on the model behaving as trained. Stop sequences depend on the application, so they are predictable and testable regardless of model behaviour.'],
      ['Max length as backstop', 'A budget, not a stopping condition.', 'Every generation needs a hard token cap. It protects against loops and runaway cost, but hitting it usually means something upstream failed.']
    ],
    example: { title: 'Generation never terminates for one input', steps: ['Check whether EOS is being emitted at all for that prompt shape.', 'Verify stop sequences are configured and correctly escaped.', 'Confirm the client enforces a maximum and the server honours it.', 'Add a timeout so a stalled stream fails visibly instead of hanging.'], takeaway: 'Termination is a system property, not a model property.' },
    views: [
      { name: 'Stop conditions', note: 'Several independent checks can end generation.', steps: [['EOS sampled', 'The model signals completion.'], ['Stop sequence matched', 'Application check on emitted text.'], ['Max tokens', 'Hard budget, always enforced.'], ['Client cancel', 'The caller aborts the stream.']] },
      { name: 'EOS versus stop sequence', note: 'Learned signal versus imposed rule.', steps: [['EOS', 'Trained behaviour of the model.'], ['Optional', 'May not fire for some models.'], ['Stop sequence', 'Configured by the application.'], ['Reliable', 'Enforced regardless of model behaviour.']] }
    ],
    precision: 'The model does not "know" it should stop in any deliberate sense. It emits a token; your code decides that this token means stop.',
    engineering: 'Always set three limits: a stop sequence where appropriate, a maximum token count, and a wall-clock timeout. Any one alone has a failure mode.',
    checkpoint: { question: 'Where is a stop sequence enforced?', options: ['In the model weights', 'In the application, after text is generated', 'Inside the attention mask', 'By the tokenizer'], correct: 1, why: 'Stop sequences are application-level rules matched against generated text. The model has no knowledge of them.' }
  },
  8: {
    question: 'What is the context window, and why can\'t we just make it bigger?',
    plain: 'The context window is how many tokens the model can consider at once. It is fixed by the architecture and training, not by a setting. Bigger windows cost memory quadratically in attention and are usually trained only on shorter text, so a model that claims a long window may still perform badly at its far end.',
    goals: ['Separate architectural limits from configured limits', 'Explain why long context is expensive', 'Recognize degradation before the hard limit'],
    concepts: [
      ['Architectural limit', 'The maximum the model can accept at all.', 'Set by positional encoding, attention implementation, and training configuration. Exceeding it is an error, not a degradation.'],
      ['Practical limit', 'Where quality actually falls off.', 'Long context often degrades well before the hard cap — recall of early content weakens and instruction adherence drops. The usable window is shorter than the stated one.'],
      ['Quadratic attention cost', 'Long context is expensive in memory.', 'Attention scores grow with the square of length, so doubling the window roughly quadruples the attention work and grows KV cache linearly.'],
      ['Budget competition', 'Prompt, history, and output share one pool.', 'System prompt, retrieved documents, conversation history, and generated tokens all consume the same budget. Unmanaged, the prompt crowds out what matters.']
    ],
    example: { title: 'A long-document QA system misses early facts', steps: ['Measure recall at varying document positions, not just overall accuracy.', 'Compare against the stated window to find the real usable length.', 'Check whether the prompt plus retrieval already approaches the cap.', 'Move to retrieval over chunks rather than widening the window.'], takeaway: 'Prove usable length empirically; never assume the stated window delivers it.' },
    views: [
      { name: 'Architectural vs practical', note: 'Two different ceilings.', steps: [['Hard cap', 'What the architecture accepts.'], ['Stated window', 'What the vendor advertises.'], ['Usable length', 'Where quality holds up.'], ['Reality', 'Usable is shortest of the three.']] },
      { name: 'Who consumes the budget', note: 'Everything shares one pool.', steps: [['System prompt', 'Fixed overhead on every request.'], ['Retrieved context', 'Grows with retrieval depth.'], ['Conversation history', 'Grows with turn count.'], ['Output reserve', 'Must be set aside first.']] }
    ],
    precision: 'A model supporting 128k tokens does not reliably use all 128k. Position-dependent degradation is measured, not assumed away.',
    engineering: 'Reserve output tokens before filling the context. Running out of room because the prompt consumed the budget is a design bug.',
    interview: 'Why is doubling the context window far more than twice as expensive?',
    checkpoint: { question: 'Which limit is a hard failure rather than a quality degradation?', options: ['Recall dropping on early text', 'Exceeding the architectural maximum token count', 'Slightly lower faithfulness at 90k tokens', 'Higher latency on long prompts'], correct: 1, why: 'Quality issues are gradual degradation. Exceeding the architectural limit is an outright error the API rejects.' }
  },
  9: {
    question: 'What is lost when you truncate a long document?',
    plain: 'Truncation is a bet. Keeping the head assumes the answer is early; keeping the tail assumes it is late. Either way you discard evidence without looking at it. Sliding windows and summarization soften this, but all three are heuristics for a retrieval problem that chunking would solve properly.',
    goals: ['Identify what each truncation strategy assumes', 'Explain why summarization adds failure modes', 'Choose retrieval over truncation when appropriate'],
    concepts: [
      ['Head truncation', 'Keep the start, drop the end.', 'Assumes importance correlates with position. Works for well-structured documents where the thesis comes first, and fails badly on reference-style text.'],
      ['Sliding windows', 'Multiple overlapping passes over the content.', 'Covers more ground but multiplies cost and can produce answers stitched from inconsistent windows. Overlap reduces boundary loss without eliminating it.'],
      ['Summarization as compression', 'Replace content with a derived account.', 'Costs a second model call and introduces an intermediate failure: the summary may omit or distort the evidence you needed. It is lossy by construction.'],
      ['Retrieval instead', 'Select relevant passages rather than fitting a prefix.', 'Chunk the document, index it, and retrieve what the query needs. This converts an unbounded problem into a bounded one and keeps the evidence traceable.']
    ],
    example: { title: 'Answers to a 200-page manual are wrong', steps: ['Test whether the failure moves when truncation strategy changes — if it does, it is truncation.', 'Check whether the needed passage sits outside the retained window.', 'Compare retrieval over chunks against whole-document compression.', 'Require citations so the retained evidence is verifiable.'], takeaway: 'If the failure moves with your truncation strategy, the problem is truncation.' },
    views: [
      { name: 'Truncation strategies', note: 'Each encodes a different assumption about position.', steps: [['Head only', 'Assumes the answer is early.'], ['Tail only', 'Assumes the answer is recent.'], ['Sliding windows', 'Covers more, at multiplicative cost.'], ['Assumption', 'None of them look at relevance.']] },
      { name: 'Truncation vs retrieval', note: 'Fitting a prefix versus selecting evidence.', steps: [['Chunk', 'Split the document into retrievable units.'], ['Index', 'Make each unit searchable by meaning.'], ['Retrieve', 'Select only what the query needs.'], ['Cite', 'Evidence stays traceable to a source.']] }
    ],
    precision: 'Summarization does not preserve evidence. It preserves a model’s account of the evidence, which is a weaker guarantee.',
    engineering: 'If your answer must be grounded, retrieve and cite. Compression pipelines lose provenance exactly when you need it most.',
    checkpoint: { question: 'What assumption does head truncation make?', options: ['The answer is at the end of the document', 'The most important content appears earliest', 'All positions are equally relevant', 'The document fits in one window'], correct: 1, why: 'Head truncation keeps the opening, so it presumes importance correlates with position — an assumption that fails on reference material.' }
  },
  10: {
    question: 'What does "lost in the middle" mean?',
    plain: 'Long-context models recall information near the start and end of their input far better than information in the middle. It is a measured positional effect, not a metaphor. Placing critical evidence at the boundaries of the context helps; burying it in a long middle hurts.',
    goals: ['Describe the positional recall effect', 'Explain why prompt structure matters', 'Apply placement as a design tool'],
    concepts: [
      ['Positional recall', 'Accuracy varies with where evidence sits.', 'Retrieval of facts from the middle of a long input is measurably worse than from the beginning or end. The effect grows with context length.'],
      ['Primacy and recency', 'Ends are attended to more reliably.', 'The first and last parts of a sequence tend to receive more attention, which is consistent with how positional encoding and attention distributions behave.'],
      ['Placement as an intervention', 'You control where evidence lands.', 'Moving the question to the end, putting critical constraints early, and keeping retrieved evidence adjacent to the instruction are all free fixes.'],
      ['Long-context ≠ uniform context', 'A window is not equally usable throughout.', 'This is the single strongest argument against solving every document problem by widening the window.']
    ],
    example: { title: 'Retrieval returns the right passage but the answer ignores it', steps: ['Check where the passage sat in the prompt relative to the instruction.', 'Move the question to the end and the critical constraints to the start.', 'Re-run the same test with identical retrieval to isolate placement.', 'If it improves, encode placement rules rather than tuning temperature.'], takeaway: 'Same evidence, different position, different answer — fix placement first.' },
    views: [
      { name: 'Recall by position', note: 'A U-shaped curve over input position.', steps: [['Start', 'High recall.'], ['Middle', 'Measurably worse.'], ['End', 'High recall again.'], ['Shape', 'U-shaped, worsening with length.']] },
      { name: 'Placement strategy', note: 'Put each element where it will be read.', steps: [['Constraints early', 'Critical rules at the start.'], ['Evidence adjacent', 'Retrieved passages next to the question.'], ['Question last', 'Position the query at the end.'], ['Verify', 'Measure, do not assume.']] }
    ],
    precision: 'The effect is empirical and model-dependent. Measure your own model before encoding placement rules as universal truth.',
    engineering: 'Placement is a free lever. Test it before adding retrieval depth, prompt length, or a stronger model.',
    checkpoint: { question: 'Where should critical retrieved evidence sit in a long prompt?', options: ['Randomly', 'Near the beginning or end rather than the middle', 'Only in the middle, to avoid distracting the model', 'Position is irrelevant'], correct: 1, why: 'Long-context recall is U-shaped across position, so boundaries reliably outperform the middle.' }
  },
  11: {
    question: 'How does a chatbot keep context over many turns?',
    plain: 'It does not remember. Every turn is a fresh request with prior turns re-sent as text. Conversation history therefore grows until it collides with the context window, forcing a decision: trim it, summarize it, or move older turns into retrievable storage.',
    goals: ['Explain that conversation state is client- or server-held', 'Compare trimming, summarization, and retrieval for history', 'Identify the failure modes of each'],
    concepts: [
      ['Re-sent history', 'Each request carries prior turns.', 'The model is stateless. What appears to be memory is the application prepending earlier messages, which makes cost and context growth linear in turns.'],
      ['Trimming', 'Keep the most recent turns.', 'Cheap and preserves recency, but discards early commitments, stated preferences, and facts established early in the conversation.'],
      ['Summarization', 'Compress older turns into a running summary.', 'Bounded cost, but the summary is lossy and can drift. Errors introduced early persist and compound through later summaries.'],
      ['Retrieval over history', 'Store turns and retrieve what matters.', 'Scales well and keeps provenance, but adds a retrieval system, an index, and a latency hop to what was a simple call.']
    ],
    example: { title: 'The bot forgets instructions given ten turns ago', steps: ['Confirm whether the instruction is inside the retained window.', 'Check whether trimming dropped it or summarization distorted it.', 'Move durable instructions into a system prompt that is never trimmed.', 'Only then consider retrieval over history for conversational facts.'], takeaway: 'Durable constraints belong in fixed prompt structure, not in turn history.' },
    views: [
      { name: 'Stateless by default', note: 'The model has no memory between requests.', steps: [['Turn N', 'Client sends a request.'], ['Prepend history', 'Earlier turns become text.'], ['Model responds', 'No state is retained.'], ['Store', 'The application persists the new turn.']] },
      { name: 'Handling growth', note: 'Three strategies, three trade-offs.', steps: [['Trim', 'Cheap; loses early facts.'], ['Summarize', 'Bounded; lossy and compounding.'], ['Retrieve', 'Scales; adds a system.'], ['Choose', 'Depends on what history must survive.']] }
    ],
    precision: 'A chatbot has no memory. It has a growing prompt assembled by software, and every memory problem is really a prompt-budget problem.',
    engineering: 'Keep durable instructions in the system prompt and trim only conversational turns. Separating the two prevents accidental loss of constraints.',
    checkpoint: { question: 'Where is conversation history actually stored?', options: ['In the model weights between requests', 'In the application, then re-sent as text each turn', 'In the KV cache permanently', 'In the tokenizer vocabulary'], correct: 1, why: 'The model is stateless across requests. The application persists turns and prepends them, which is why history grows the prompt.' }
  },
  12: {
    question: 'How do you make a model produce valid structured output?',
    plain: 'You constrain it rather than ask nicely. Schema-constrained decoding restricts which tokens are legal at each step, so invalid JSON cannot be produced. Where that is unavailable, you validate, repair, and retry — which works but costs latency and can fail under load.',
    goals: ['Explain constrained decoding versus prompting', 'Describe validate-repair-retry trade-offs', 'Choose a mechanism by failure cost'],
    concepts: [
      ['Constrained decoding', 'Mask illegal tokens during generation.', 'The schema is converted into a token-level grammar. At each step, tokens that would break the structure are excluded before sampling, making invalid output unreachable.'],
      ['Schema as prompt', 'Ask for JSON and hope.', 'Cheapest to implement and most fragile. Models comply most of the time, and "most" is not a contract when a downstream parser is strict.'],
      ['Validate, repair, retry', 'Generate, check, and fix.', 'A parser rejects bad output, a repair step or a second call fixes it, and the loop repeats with a bounded budget. Correct, but adds latency and cost on every failure.'],
      ['Failure cost decides', 'Match the mechanism to the consequence.', 'A display-only field tolerates a repair loop. A transaction payload does not. The stricter the downstream consumer, the stricter the generation mechanism must be.']
    ],
    example: { title: 'Schema failures rise after a model update', steps: ['Measure failure rate by field rather than in aggregate.', 'Check whether the schema drifted from the model’s training format.', 'Add constrained decoding if available for this model.', 'Keep a repair loop with a bounded retry count as a fallback.'], takeaway: 'Structural validity is a generation-time property, not a post-hoc hope.' },
    views: [
      { name: 'Constrained decoding', note: 'The parser becomes a generator constraint.', steps: [['Schema', 'Compiled to a token grammar.'], ['At each step', 'Exclude tokens that break structure.'], ['Sample', 'Only legal continuations remain.'], ['Result', 'Invalid output is unreachable.']] },
      { name: 'Validate and repair', note: 'A loop with a bounded budget.', steps: [['Generate', 'Produce candidate output.'], ['Validate', 'Parse against the schema.'], ['Repair or retry', 'Fix or regenerate on failure.'], ['Give up', 'Bounded retries prevent runaway cost.']] }
    ],
    precision: 'A model that produces valid JSON most of the time has not satisfied a contract. Most is a rate, and rates fail under load.',
    engineering: 'Always validate on the receiving side regardless of generation strategy. Constrained decoding reduces failures; it does not remove the need to check.',
    checkpoint: { question: 'Why is schema-constrained decoding stronger than prompting for JSON?', options: ['It is faster', 'Illegal tokens are masked during generation, so invalid structure cannot be produced', 'It requires no schema', 'It improves reasoning quality'], correct: 1, why: 'Prompting only encourages correct output. Constraining decoding makes structurally invalid continuations unreachable at the token level.' }
  },
  13: {
    question: 'How do you make a model admit it does not know?',
    plain: 'You cannot prompt your way to reliable abstention. You give the model evidence, ask it to answer only from that evidence, require citations, and then check externally whether the cited support actually entails the claim. Abstention works when it is measured and enforced, not when it is requested.',
    goals: ['Explain why prompting alone fails at abstention', 'Describe evidence-linked generation and verification', 'Design metrics that catch confident fabrication'],
    concepts: [
      ['Unanswerable inputs', 'Questions with no support in the context.', 'A well-posed retrieval system must return "no answer" sometimes. Systems that always generate will invent one, because generation is what they do.'],
      ['Evidence-linked claims', 'Every assertion tied to a cited span.', 'Requiring citations converts an unverifiable fluent answer into a checkable one. The citation can then be verified independently of the answer text.'],
      ['External entailment checking', 'Verify support, do not trust the citation.', 'A cited passage may exist and still fail to entail the claim. An NLI-style check or a strict reviewer tests whether the evidence actually supports the statement.'],
      ['Risk–coverage trade-off', 'Abstaining more raises precision.', 'Tune a confidence or evidence threshold: accept fewer answers to improve accuracy on the ones accepted. Report both numbers together or the metric is meaningless.']
    ],
    example: { title: 'Support assistant invents policy details', steps: ['Measure factual-support rate on cases with known unanswerable inputs.', 'Require citations and verify each citation entails its claim.', 'Introduce an explicit abstention path with a clear user-facing message.', 'Report abstention recall alongside answer accuracy, never alone.'], takeaway: 'Accuracy without an abstention rate hides fabrication on hard inputs.' },
    views: [
      { name: 'Evidence-linked answering', note: 'Make every claim checkable.', steps: [['Retrieve', 'Fetch candidate passages.'], ['Generate with citations', 'Bind each claim to a span.'], ['Verify entailment', 'Does the span support the claim?'], ['Accept or abstain', 'Threshold decides the outcome.']] },
      { name: 'Risk and coverage', note: 'Two numbers that must move together.', steps: [['Set threshold', 'How much evidence is required.'], ['Reject weak answers', 'Coverage falls.'], ['Accepted answers', 'Accuracy rises.'], ['Report both', 'Otherwise the metric is gameable.']] }
    ],
    precision: 'Asking a model to say "I don\'t know" changes tone, not reliability. Verification is what makes abstention trustworthy.',
    engineering: 'Never report answer accuracy without abstention recall on the same set. Optimizing one alone is how confident fabrication survives review.',
    checkpoint: { question: 'Why is a cited source not sufficient evidence that an answer is grounded?', options: ['Citations are slow to check', 'The cited passage may exist yet fail to entail the claim', 'Citations are always hallucinated', 'Retrieval cannot return citations'], correct: 1, why: 'Citation correctness and claim support are separate. A real passage can still not say what the answer asserts, so entailment must be checked independently.' }
  },
  14: {
    question: 'How do you control answer length without hurting quality?',
    plain: 'Length is a contract, not a preference. State the format and budget explicitly, reserve output tokens accordingly, and then measure whether longer answers actually improve task completion. Verbosity is usually a prompt-structure problem or a token budget that was never enforced.',
    goals: ['Explain why models default to verbose answers', 'Distinguish prompt control from hard limits', 'Measure whether length changes help or hurt'],
    concepts: [
      ['Why verbosity happens', 'Training rewards completeness.', 'Instruction-tuned models learn that thorough answers score better, so hedging, restating, and covering every branch become defaults even when the question is narrow.'],
      ['Prompt-level control', 'Specify format, audience, and budget.', 'Stating a target length, an audience, and a required structure removes ambiguity. It works well but is a soft constraint the model can drift from.'],
      ['Hard limits', 'Max tokens and truncation as enforcement.', 'Output token caps and stop sequences bound length mechanically. They guarantee a ceiling but can cut an answer mid-sentence if set too tight.'],
      ['Length versus quality', 'Longer is not better, and must be measured.', 'On tasks with a verifiable answer, extra prose often adds no value and obscures it. Compare task success at matched length budgets before concluding.']
    ],
    example: { title: 'Users complain answers are too long', steps: ['Measure task success at several length budgets on the same inputs.', 'Check whether the prompt specifies audience and format at all.', 'Add an explicit structure requirement before reducing max tokens.', 'Watch for truncation once a cap is set, and raise it if answers are being cut.'], takeaway: 'Set the budget from measured task success, not from taste.' },
    views: [
      { name: 'Control levers', note: 'Soft and hard constraints do different jobs.', steps: [['Specify format', 'Tell it what shape the answer takes.'], ['State audience', 'Expertise sets the depth.'], ['Cap tokens', 'Enforce a mechanical ceiling.'], ['Add stop rules', 'End at a structural boundary.']] },
      { name: 'Does length help?', note: 'Measure rather than assume.', steps: [['Same inputs', 'Hold the test set constant.'], ['Vary budget', 'Run at several output limits.'], ['Measure task success', 'Not preference, but correctness.'], ['Choose', 'The shortest budget that succeeds.']] }
    ],
    precision: 'A shorter answer is not automatically better. The claim to test is whether task success changes with length, not whether the text feels tidy.',
    engineering: 'Pair every max-token setting with a truncation metric. A cap that silently cuts answers converts a verbosity complaint into a correctness bug.',
    checkpoint: { question: 'What is the main risk of setting max tokens too low?', options: ['Higher cost', 'Answers are cut off mid-sentence, converting a length issue into a correctness issue', 'The model refuses to respond', 'Latency increases'], correct: 1, why: 'A hard cap enforces mechanically. If set below the needed length it truncates mid-answer, which is worse than the verbosity it was meant to solve.' }
  }
};

export function getGenerationGuide(id) {
  return generationGuides[id];
}
