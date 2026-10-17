/**
 * Beginner → engineering bridge for Mentora's ten Tokenization & Embeddings
 * lessons. Diagrams are conceptual teaching illustrations, not benchmarks.
 * Keep interview A–F sections in courses.json as the next stage of study.
 */
export const tokenizationGuides = {
  1: {
    question: 'What is a token, and why can’t a model just read text?',
    plain: 'A model is a matrix computation, and matrices hold numbers, not letters. A tokenizer sits in front of the model and turns text into a list of integer IDs drawn from a fixed vocabulary. The model never sees the characters you typed — it sees indices into that table.',
    goals: ['Explain why text must become numbers before a model can process it', 'Trace text → tokens → IDs → embedding lookup', 'Identify what information the text-to-ID interface can lose'],
    concepts: [
      ['Token', 'One unit of text the model treats as indivisible.', 'A token is a vocabulary entry. It may be a whole word, a subword fragment, punctuation, whitespace, a single byte, or a special control token such as an end-of-sequence marker.'],
      ['Vocabulary', 'The fixed list of tokens the tokenizer can emit.', 'A vocabulary V is a finite set, usually 32k to 256k entries. Every input must be expressible as a sequence over V, which is why segmentation strategy and vocabulary size are engineering decisions.'],
      ['Token ID', 'The integer index of a token in the vocabulary.', 'IDs are identifiers, not quantities. ID 823 is not larger than ID 822 in any meaningful sense. The embedding table maps each ID to a learned vector; nothing about the ID itself carries meaning.'],
      ['Tokenizer contract', 'The versioned pairing between a model and its encoder.', 'IDs, special tokens, normalization rules, and the chat template are all trained together. Swapping a tokenizer without retraining the model silently corrupts every embedding lookup.']
    ],
    example: { title: 'Find out why a request got expensive', steps: ['Log the raw byte length and the token count separately — they move differently.', 'Compare the chat template version alongside the tokenizer version.', 'Check whether whitespace-preserving splits inflated the count for one language.', 'Re-measure prompt cost after fixing segmentation, not after shortening the prompt.'], takeaway: 'Cost is a token-count property, so tokenization is a cost surface, not a formatting detail.' },
    views: [
      { name: 'Text to IDs', note: 'Segmentation happens before any neural computation.', steps: [['Raw text', 'Bytes arrive from the client.'], ['Normalization', 'Unicode form is fixed; some characters are folded.'], ['Pre-tokenization', 'Text is split on whitespace and punctuation boundaries.'], ['Vocabulary lookup', 'Each piece becomes an integer ID.']] },
      { name: 'IDs to vectors', note: 'The model consumes vectors, never the original string.', steps: [['Token IDs', 'A sequence of integers indexes the embedding table.'], ['Embedding lookup', 'Each ID selects one row of a trained matrix.'], ['Position signal', 'Order must be re-introduced separately.'], ['Transformer', 'Attention and MLP layers operate on the resulting vectors.']] }
    ],
    precision: 'A token is not a word, a character, or a Unicode code point. It is whatever the tokenizer’s vocabulary happens to contain.',
    engineering: 'Treat tokenizer version, special tokens, and chat template as one deployable artifact. Record the triple with every model release so a regression can be bisected.',
    interview: 'Why can two visually identical strings produce different token counts?',
    checkpoint: { question: 'The model receives the integer 4096. What does that number mean on its own?', options: ['A magnitude or ranking', 'An index into a learned table', 'A character encoding value', 'A position in the sequence'], correct: 1, why: 'IDs are indices. The embedding table supplies the vector; the integer carries no magnitude or ordering information.' }
  },
  2: {
    question: 'How does Byte Pair Encoding decide what a token should be?',
    plain: 'BPE learns its vocabulary from data instead of being hand-designed. Start with characters, find the most frequent adjacent pair, merge it into a new symbol, and repeat. Common fragments grow into long tokens; rare words stay broken into pieces.',
    goals: ['Describe the BPE training loop and stopping condition', 'Explain why frequent substrings become tokens', 'Predict token counts for a new word from merge rules'],
    concepts: [
      ['Merge rule', 'One learned production that combines two symbols into one.', 'A merge is ordered. Applying rules in a different order yields different segments, so the rule list is part of the model and must ship with it.'],
      ['Frequency-driven growth', 'Common pairs merge first, so common text stays compact.', 'BPE allocates capacity where the corpus puts mass. The 50k most frequent fragments cover most text, which is why everyday English uses few tokens per word.'],
      ['Subword fallback', 'Rare words decompose into pieces the vocabulary already knows.', 'This is BPE’s answer to out-of-vocabulary words. There is no unknown token for ordinary text — there is only a longer sequence of known pieces.'],
      ['Greedy application', 'Encoding applies the learned merges in training order.', 'Encoding is deterministic given the rule list. It is not a search for the best segmentation; it is a replay of the order in which the merges were learned.']
    ],
    example: { title: 'Explain a sudden token-count jump', steps: ['Take the new term and apply merges in order to see the produced pieces.', 'Compare its piece count against a common word of similar length.', 'Check whether the term contains characters the corpus rarely saw.', 'Estimate the cost delta before deciding whether to add domain terms to a custom vocabulary.'], takeaway: 'Unusual spellings cost more tokens, so domain vocabulary is a cost decision.' },
    views: [
      { name: 'Training the merges', note: 'The vocabulary is grown from the corpus, not specified up front.', steps: [['Count pairs', 'Find the most frequent adjacent symbol pair.'], ['Merge', 'Replace every occurrence with a new symbol.'], ['Repeat', 'Continue until the vocabulary reaches its target size.'], ['Freeze', 'The ordered merge list becomes the encoder.']] },
      { name: 'Encoding new text', note: 'Encoding replays the learned merges rather than searching.', steps: [['Pre-tokenize', 'Split on whitespace and punctuation.'], ['Initial symbols', 'Represent each piece as single characters.'], ['Apply merges', 'Replay rules in the order they were learned.'], ['Emit IDs', 'Map the final symbols to vocabulary indices.']] }
    ],
    precision: 'BPE merges are learned on training text. Unusual characters or scripts that were rare in that text receive few merges and therefore fragment heavily.',
    engineering: 'If a domain term fragments badly, the fix is not prompt wording — it is vocabulary extension, a custom tokenizer, or accepting the cost and budgeting for it.',
    interview: 'Why does BPE prefer frequent fragments over complete words?',
    checkpoint: { question: 'Two runs use different merge orders on the same corpus. What changes?', options: ['Nothing; merges are order-independent', 'The resulting segmentation of the same input', 'Only the training speed', 'The embedding dimension'], correct: 1, why: 'Merges are applied greedily in learned order, so a different order produces different segmentations for identical text.' }
  },
  3: {
    question: 'What actually differs between BPE, WordPiece, and SentencePiece?',
    plain: 'They all grow subword vocabularies, but they disagree on the scoring rule and on whether text must be pre-split. WordPiece scores merges by likelihood rather than raw frequency. SentencePiece treats the input as raw text, so whitespace becomes a character and no language-specific pre-tokenizer is required.',
    goals: ['Compare merge-scoring rules across the three algorithms', 'Explain why a whitespace-aware tokenizer changes token counts', 'Choose a tokenizer for a multilingual or code-heavy workload'],
    concepts: [
      ['WordPiece scoring', 'Merge by log-likelihood of the pair, not raw count.', 'A rare but highly informative pair can outrank a common one. This favors pieces that predict their neighbours well, which changes fragmentation relative to plain BPE.'],
      ['SentencePiece raw text', 'No pre-tokenizer; whitespace is a real character.', 'Words are never separated in advance, so a leading-space marker becomes part of the token. This makes the tokenizer language-agnostic and is why the same sentence encodes differently across libraries.'],
      ['Byte-level fallback', 'Every byte is representable, so nothing is truly out of vocabulary.', 'Mapping bytes to 256 base symbols guarantees any byte string encodes. Unicode sequences that were rare in training still cost many tokens, but they never fail to encode.'],
      ['Unigram alternative', 'A probabilistic model that samples or optimizes a segmentation.', 'Unigram tokenizers score whole segmentations and can select the most likely one, which gives different — sometimes more stable — behaviour at the same vocabulary size.']
    ],
    example: { title: 'Pick a tokenizer for a multilingual support bot', steps: ['Measure tokens per character across every supported language on real tickets.', 'Check whether whitespace is encoded consistently for languages without spaces.', 'Confirm byte-level coverage so mixed-script input never fails to encode.', 'Budget context and cost per language, not just the English average.'], takeaway: 'Tokenizer choice is measured per language; an English average hides the failure.' },
    views: [
      { name: 'Scoring rules', note: 'Same idea, different objective for what counts as a good merge.', steps: [['BPE', 'Merge the most frequent pair.'], ['WordPiece', 'Merge the pair with highest likelihood gain.'], ['Unigram', 'Score whole segmentations and prune.'], ['Result', 'Different fragmentation at equal vocabulary size.']] },
      { name: 'Pre-tokenization boundary', note: 'Whether whitespace is a character changes every downstream count.', steps: [['BPE/WordPiece', 'Split on whitespace first; spaces are discarded.'], ['SentencePiece', 'Keep raw text; encode whitespace as a symbol.'], ['Consequence', 'Leading spaces change token identity.'], ['Consequence', 'Language-agnostic, no per-language rules.']] }
    ],
    precision: 'Byte-level BPE guarantees encodability, not efficiency. Rare scripts still consume many tokens per character.',
    engineering: 'Do not compare tokenizers on English perplexity alone. Measure tokens-per-character on your actual traffic before choosing.',
    interview: 'Why does SentencePiece need no language-specific pre-tokenizer?',
    checkpoint: { question: 'Which property makes SentencePiece workable for languages it was never explicitly configured for?', options: ['A larger vocabulary', 'Treating whitespace as a character rather than pre-splitting', 'Higher merge frequency', 'Using WordPiece scoring'], correct: 1, why: 'Operating on raw text removes the need for language-specific word segmentation rules, so unseen languages still encode.' }
  },
  4: {
    question: 'How big should the vocabulary be, and what does an unknown token really cost?',
    plain: 'A larger vocabulary means fewer tokens per document — cheaper and roomier — but a bigger embedding table and harder training. Small vocabularies fragment common words. Unknown tokens were the old failure mode; byte-level schemes largely removed them, replacing hard failures with high token costs.',
    goals: ['Trade vocabulary size against embedding memory', 'Explain the unknown-token failure mode and its modern replacement', 'Estimate the memory cost of growing the vocabulary'],
    concepts: [
      ['Embedding memory', 'Vocabulary size multiplies directly into parameter count.', 'An embedding matrix is roughly vocabulary × d_model parameters. Growing V from 32k to 128k at d_model 4096 adds about 400M parameters before tying the output head changes anything.'],
      ['Compression trade-off', 'More tokens per byte means more compute per document.', 'A small vocabulary lowers memory but lengthens every sequence, which raises prefill cost, grows the KV cache, and shortens the usable context.'],
      ['Unknown tokens', 'The legacy failure: unrepresentable text collapses to one ID.', 'Older schemes mapped unseen words to a single unknown token, destroying information irrecoverably. Byte-level fallback replaced that hard failure with a longer but lossless encoding.'],
      ['Token healing', 'A workaround for prompts that end mid-word.', 'When a user prompt is appended after a system prompt, a word can be split at the boundary. Regenerating the last token with the trailing fragment considered repairs the boundary rather than deleting it.']
    ],
    example: { title: 'Justify a vocabulary increase', steps: ['Measure tokens per document at the current size on real traffic.', 'Compute the added embedding parameters and the resulting memory delta.', 'Model the prefill saving from shorter sequences.', 'Confirm the gain outweighs the extra memory before retraining.'], takeaway: 'Vocabulary growth trades embedding memory against sequence length; measure both sides.' },
    views: [
      { name: 'Vocabulary size trade-off', note: 'Neither extreme is free.', steps: [['Small V', 'Low memory, high fragmentation, long sequences.'], ['Large V', 'High memory, compact text, costlier training.'], ['Sweet spot', 'Where marginal memory stops buying meaningful compression.'], ['Measure', 'Tokens per byte on your actual traffic.']] },
      { name: 'Unknown token vs byte fallback', note: 'The failure mode changed from silent loss to visible cost.', steps: [['Unknown token', 'Unseen word collapses to one ID.'], ['Information lost', 'The surface form is unrecoverable.'], ['Byte fallback', 'Any byte string still encodes.'], ['New cost', 'Rare text becomes many tokens, not one.']] }
    ],
    precision: 'Byte-level tokenization trades the unknown-token failure for a cost failure. Nothing is lost, but rare text can be dramatically more expensive.',
    engineering: 'Track tokens-per-request as a first-class metric. A tokenizer upgrade can silently double inference cost without changing a single line of application code.',
    interview: 'Why does growing the vocabulary sometimes make a system worse overall?',
    checkpoint: { question: 'You double the vocabulary size. What is the most likely first-order effect on inference cost?', options: ['Always cheaper', 'More embedding memory but shorter sequences', 'Always more expensive', 'No change to either'], correct: 1, why: 'Larger vocabularies add embedding parameters but reduce tokens per document, so the net effect depends on which side dominates for your traffic.' }
  },
  5: {
    question: 'What does the model actually do with a token ID?',
    plain: 'It looks up one row of a learned table. The ID selects a vector, and that vector is the model’s only representation of the token. The table is trained alongside everything else, so similar tokens can end up near each other in the space.',
    goals: ['Trace an ID through the embedding lookup', 'Explain why an embedding is learned rather than assigned', 'Connect embedding geometry to downstream behaviour'],
    concepts: [
      ['Embedding matrix', 'A trained table mapping each ID to a vector.', 'The matrix has one row per vocabulary entry and one column per model dimension. It is learned end-to-end with the rest of the network, not constructed from statistics.'],
      ['Learned representation', 'Meaning emerges from training, not from the ID.', 'Two IDs that never co-occur meaningfully will not become neighbours. The geometry reflects distributional patterns the objective rewarded.'],
      ['Input and output heads', 'The same table is often reused in both directions.', 'Many models tie the input embedding and output projection weights, which reduces parameters and couples the two representations.'],
      ['Position is separate', 'The lookup is order-blind by construction.', 'A bag of embeddings has no notion of sequence. Position must be added explicitly, or every permutation of a sentence looks identical to the model.']
    ],
    example: { title: 'Diagnose a domain term that the model mishandles', steps: ['Inspect how the term fragments and which embedding rows are selected.', 'Check whether the fragments are shared with unrelated words.', 'Test whether the model behaves differently on the term when context is identical.', 'Decide between vocabulary extension, fine-tuning, or prompt-level disambiguation.'], takeaway: 'A domain failure often starts at the lookup, long before attention runs.' },
    views: [
      { name: 'Lookup path', note: 'One row of one matrix is the entire initial representation.', steps: [['Token ID', 'An integer indexes the vocabulary.'], ['Row select', 'One vector of length d_model is retrieved.'], ['No order', 'The lookup itself is position-blind.'], ['Downstream', 'Attention supplies context; position supplies order.']] },
      { name: 'Tied weights', note: 'Input embeddings and output projections are frequently shared.', steps: [['Embed in', 'IDs become vectors for the encoder.'], ['Transform', 'Attention and MLP layers process them.'], ['Project out', 'The final hidden state maps to vocabulary scores.'], ['Same table', 'Tying reduces parameters and couples both directions.']] }
    ],
    precision: 'An embedding row is not a definition. It is one point in a space whose neighbourhoods were shaped by the training objective.',
    engineering: 'When a term behaves oddly, verify its segmentation and its embedding neighbourhood before suspecting the prompt.',
    checkpoint: { question: 'You permute the tokens of a sentence before the embedding lookup. What does the lookup itself notice?', options: ['Nothing; it is order-blind', 'It raises an error', 'It adds position automatically', 'It changes the selected rows'], correct: 0, why: 'The lookup selects rows independently of order. Position must be injected separately for the sequence to be distinguishable.' }
  },
  6: {
    question: 'Why do embeddings live in high-dimensional space, and what does that geometry buy you?',
    plain: 'A few hundred or thousand dimensions let one token be similar to many others at once along different axes. Distance in that space becomes a proxy for relatedness, which is what makes retrieval, clustering, and analogy possible — and what makes the space hard to interpret directly.',
    goals: ['Explain why high dimensionality enables many simultaneous relations', 'Relate embedding distance to semantic similarity', 'Recognize where geometric intuition breaks down'],
    concepts: [
      ['Dimensionality', 'More axes allow more independent relationships at once.', 'In low dimensions, relationships compete. At hundreds of dimensions, a token can be close to its synonyms along one direction and far from them along another, encoding several relations simultaneously.'],
      ['Similarity measures', 'Cosine similarity ignores magnitude; dot product does not.', 'Cosine compares direction only, which is why it is the usual retrieval metric. Dot product rewards magnitude as well, which matters when vectors are used as scores rather than descriptions.'],
      ['Anisotropy', 'Real embedding spaces are not uniformly spherical.', 'Learned embeddings cluster along dominant directions, so raw cosine similarities sit in a narrow band. Normalization or whitening is often needed before distances are meaningful for retrieval.'],
      ['Composition', 'Context builds new vectors rather than selecting fixed ones.', 'After attention, a position holds a contextualized vector that no single vocabulary row produced. The space of activations is far richer than the space of input embeddings.']
    ],
    example: { title: 'Why nearest-neighbour search returned near-duplicates', steps: ['Plot the similarity distribution rather than reading a single score.', 'Check whether all results sit in a narrow high-similarity band.', 'Normalize or re-embed and re-measure the spread.', 'Add a score floor derived from the observed distribution, not a guessed constant.'], takeaway: 'Similarity thresholds must be calibrated to the actual distribution, not to intuition.' },
    views: [
      { name: 'Similarity measures', note: 'The choice changes what "close" means.', steps: [['Cosine', 'Compares direction, ignores magnitude.'], ['Dot product', 'Rewards both direction and magnitude.'], ['Euclidean', 'Sensitive to overall scale.'], ['Pick', 'Cosine for retrieval; dot when magnitude is meaningful.']] },
      { name: 'Input vs contextual vectors', note: 'Attention produces vectors that no lookup table contains.', steps: [['Input embedding', 'One fixed row per token.'], ['Attention mix', 'Neighbouring tokens contribute.'], ['Layer stack', 'Each layer refines the vector.'], ['Contextual', 'A position-specific representation, not a vocabulary entry.']] }
    ],
    precision: 'High dimensionality is not "more accurate". It allows many relations to coexist without interfering; it also makes naive distance intuition unreliable.',
    engineering: 'For retrieval, always calibrate your similarity threshold against a labelled sample. Fixed thresholds do not transfer across models or domains.',
    checkpoint: { question: 'Why does cosine similarity usually beat raw dot product for retrieval?', options: ['It is faster to compute', 'It ignores vector magnitude, so long vectors do not dominate', 'It produces integer scores', 'It requires no index'], correct: 1, why: 'Dot product grows with vector magnitude, so a few high-norm vectors can dominate results regardless of directional match.' }
  },
  7: {
    question: 'Why must a Transformer be told the order of its tokens?',
    plain: 'Attention mixes tokens without regard to position — it sees a set, not a sequence. Without an explicit order signal, "dog bites man" and "man bites dog" are indistinguishable. Positional information has to be injected, either by adding it to embeddings or by changing how attention scores are computed.',
    goals: ['Explain why attention is permutation-equivariant by default', 'Compare adding position to embeddings versus encoding it in attention', 'Identify where position enters a real forward pass'],
    concepts: [
      ['Permutation equivariance', 'Reorder the input and the outputs reorder identically.', 'Self-attention applies the same weights to every position, so it has no intrinsic sense of which token came first. This is a property of the operation, not a bug to patch.'],
      ['Absolute position', 'Add a position vector to each token embedding.', 'The simplest fix: each slot gets a fixed vector that is added before the first layer. It is cheap but ties the model to positions it saw during training.'],
      ['Relative position', 'Encode the distance between tokens rather than the slot.', 'Rotary embeddings and ALiBi score attention by relative offset, which generalizes to lengths beyond training more gracefully than absolute slot vectors.'],
      ['Injection point', 'Where position enters changes what later layers can undo.', 'Adding to embeddings is later undone by attention mixing. Encoding position inside the attention score survives every layer, which is why rotary embeddings dominate modern models.']
    ],
    example: { title: 'Model truncates badly beyond its training length', steps: ['Check whether position is absolute or relative in the architecture.', 'If absolute, expect degradation past the trained maximum.', 'If relative, verify the scaling method is configured for the longer length.', 'Re-measure quality at the target length rather than assuming the fix worked.'], takeaway: 'Position scheme determines how gracefully length extrapolation behaves.' },
    views: [
      { name: 'Where position enters', note: 'Two families, with different long-length behaviour.', steps: [['Add to embedding', 'Simple, but attention later mixes it away.'], ['Relative score', 'Rotary or ALiBi; survives every layer.'], ['Absolute slots', 'Tied to trained positions; extrapolates poorly.'], ['Relative offsets', 'Generalizes further with the right scaling.']] },
      { name: 'Set versus sequence', note: 'Without position, order information simply does not exist.', steps: [['Tokens', 'A bag of embedding vectors.'], ['Attention', 'Mixes them with no notion of order.'], ['Ambiguity', 'All permutations look identical.'], ['Fix', 'Inject position before or inside attention.']] }
    ],
    precision: 'Self-attention is permutation-equivariant, not invariant. Outputs follow the input permutation; they do not collapse to a single ordering-independent result.',
    engineering: 'When quality drops past a certain context length, check the position scheme before blaming attention or the prompt.',
    checkpoint: { question: 'You remove all positional information from a Transformer. What happens to the sentence "the cat sat on the mat"?', options: ['It is processed normally', 'Every word order becomes indistinguishable', 'The model raises an error', 'Only punctuation is affected'], correct: 1, why: 'Attention alone cannot distinguish order; without position, all permutations of the same tokens produce the same representation.' }
  },
  8: {
    question: 'What is the difference between learned and sinusoidal positional embeddings?',
    plain: 'Learned positions are free parameters — one vector per slot, trained like everything else. Sinusoidal positions are fixed by a formula using sines and cosines at different frequencies. Learned fits the training distribution; sinusoidal can extrapolate because unseen positions still have a defined value.',
    goals: ['Contrast parameterized versus fixed position vectors', 'Explain why sinusoidal functions were chosen', 'State the practical consequence for context extrapolation'],
    concepts: [
      ['Learned positions', 'One trainable vector per sequence slot.', 'Maximum length is bounded by the table size. Positions beyond the trained maximum have no vector, so the model cannot attend past its training length without surgery.'],
      ['Sinusoidal positions', 'Fixed vectors from sine and cosine at geometric frequencies.', 'Each dimension oscillates at a different rate, so the vector encodes position through a pattern of phases. Unseen positions still produce well-defined vectors.'],
      ['Relative structure', 'Sinusoidal vectors let attention learn relative offsets.', 'Because the encoding is built from shifted sinusoids, a fixed offset between two positions corresponds to a consistent transformation, which the model can learn to exploit.'],
      ['Empirical parity', 'In practice the two perform very similarly at matched length.', 'The usual justification for sinusoidal is extrapolation, not accuracy within the training range. Modern models largely moved to rotary embeddings instead.']
    ],
    example: { title: 'Extending context beyond the trained maximum', steps: ['Identify whether positions are learned or computed.', 'If learned, decide between interpolation, retraining the table, or a relative scheme.', 'If sinusoidal, verify no clipping or rounding is applied at the new length.', 'Measure quality at the target length rather than assuming generalization.'], takeaway: 'Extrapolation behaviour follows the position scheme, not the model size.' },
    views: [
      { name: 'Two ways to build a position vector', note: 'One is trained; the other is computed.', steps: [['Learned', 'A free parameter per slot, trained end to end.'], ['Sinusoidal', 'Fixed values from sines and cosines.'], ['Length limit', 'Learned is bounded by its table.'], ['Extrapolation', 'Sinusoidal still has defined values.']] },
      { name: 'Frequency structure', note: 'Different dimensions encode position at different scales.', steps: [['Low frequency', 'Changes slowly; encodes coarse position.'], ['High frequency', 'Changes quickly; separates nearby slots.'], ['Phase pattern', 'Together they form a near-unique signature.'], ['Offset', 'A fixed shift maps to a consistent transform.']] }
    ],
    precision: 'Sinusoidal encodings do not beat learned ones on accuracy within range. Their advantage is that unseen positions remain computable.',
    engineering: 'If you must extend a model’s context, prefer a relative scheme over growing a learned position table.',
    checkpoint: { question: 'Why can a model with sinusoidal positions be evaluated beyond its training length at all?', options: ['The table is larger', 'The encoding is computed by formula, so new positions have defined values', 'Attention ignores positions at long lengths', 'It always truncates instead'], correct: 1, why: 'Sinusoidal vectors are computed, not stored, so a position never seen in training still produces a valid vector.' }
  },
  9: {
    question: 'How does Rotary Position Embedding encode position, and why is it preferred?',
    plain: 'RoPE does not add a position vector. It rotates the query and key vectors by an angle proportional to their position, so the attention score between two tokens depends only on their relative offset. Position lives inside the score itself, which is why it survives every layer.',
    goals: ['Describe the rotation applied by RoPE', 'Explain why relative offset falls out of the rotation', 'Compare RoPE against additive absolute positions'],
    concepts: [
      ['Rotation by position', 'Each pair of dimensions is rotated by an angle proportional to position.', 'RoPE groups dimensions into pairs and rotates each pair by a different frequency. Higher positions accumulate more rotation, and each pair encodes position at its own scale.'],
      ['Relative offset in the score', 'Only the distance between positions affects attention.', 'Because rotation is a linear operation on query and key, the dot product between a rotated query and a rotated key depends on the angle between them — that is, on the position difference, not the absolute slots.'],
      ['Frequency allocation', 'Geometric frequencies cover long contexts smoothly.', 'Frequencies decrease geometrically across dimension pairs, so some pairs rotate slowly and remain coherent over long distances while others separate nearby tokens.'],
      ['Context extension', 'Scaling the base stretches position to longer contexts.', 'Methods such as NTK-aware scaling or YaRN adjust the frequency base so the rotation range covers longer sequences without retraining from scratch.']
    ],
    example: { title: 'Extending a RoPE model to a longer context', steps: ['Identify the frequency base and the dimension pairing.', 'Apply a scaling method rather than simply increasing the maximum position.', 'Evaluate quality at intermediate lengths, not just the target.', 'Watch for degradation on short sequences as a sign of over-stretching.'], takeaway: 'RoPE extension is a frequency problem, not a table-size problem.' },
    views: [
      { name: 'How the rotation works', note: 'Position is applied inside the attention score.', steps: [['Pair dimensions', 'Split the vector into 2D pairs.'], ['Rotate', 'Apply an angle proportional to position.'], ['Different rates', 'Each pair uses its own frequency.'], ['Score', 'Only the relative angle survives the dot product.']] },
      { name: 'Absolute vs rotary', note: 'Where position lives determines what survives attention.', steps: [['Additive', 'A vector added to the embedding.'], ['Attention mixing', 'Additive signal is diluted by later layers.'], ['Rotary', 'Applied to Q and K at every layer.'], ['Result', 'Relative offset remains available throughout.']] }
    ],
    precision: 'RoPE encodes absolute position through rotation but makes attention scores depend only on relative offset. Both statements are true and they are not in conflict.',
    engineering: 'When extending context, change the frequency schedule rather than the maximum index, and validate both short and long sequences afterwards.',
    checkpoint: { question: 'Why does RoPE make attention depend on relative position?', options: ['It adds a position vector to the output', 'Rotating both Q and K means their dot product depends on the angle difference', 'It masks distant tokens', 'It reorders the sequence before attention'], correct: 1, why: 'A rotation applied to both operands leaves the dot product sensitive only to the angle between them, which is the position difference.' }
  },
  10: {
    question: 'A tokenizer works well in English and fails badly elsewhere. How do you find out why?',
    plain: 'Measure, do not assume. Tokens per character varies enormously across languages, scripts, and domains. A tokenizer that is efficient for English can fragment Bengali, Arabic, or code into many more tokens, silently raising cost and shrinking effective context for those users.',
    goals: ['Measure fragmentation per language and per domain', 'Separate tokenizer failures from retrieval and model failures', 'Choose between vocabulary extension, prompt changes, and acceptance'],
    concepts: [
      ['Fragmentation measurement', 'Tokens per character is the first diagnostic.', 'Compute the ratio on real traffic per language, per code type, and per domain term. A single global average hides exactly the failures that matter.'],
      ['Failure attribution', 'A bad answer may not be a tokenizer problem.', 'Separate segmentation failure from retrieval failure and generation failure. Check whether the term fragments, whether the right passage was retrieved, and whether the model used it.'],
      ['Remediation ladder', 'Cheapest fix first, most invasive last.', 'Prompt-level disambiguation, then context injection with the correct spelling, then domain vocabulary extension, then a custom tokenizer with retraining. Each step costs more and constrains more.'],
      ['Equity of cost', 'Unequal fragmentation is an unequal service.', 'If one language costs three times more tokens per sentence, users of that language get shorter effective context and higher latency for identical service tiers.']
    ],
    example: { title: 'Support bot underperforms for one language', steps: ['Measure tokens per character for each supported language on real tickets.', 'Check whether the domain vocabulary fragments into common but unrelated pieces.', 'Verify retrieval returns the right passages before blaming segmentation.', 'Decide: extend vocabulary, inject clarification, or accept and budget the cost.'], takeaway: 'Fix the measured failure, and remember that fragmentation is a service-equity issue.' },
    views: [
      { name: 'Attribution path', note: 'Four candidates, only one of which is the tokenizer.', steps: [['Segmentation', 'Does the term fragment into unrelated pieces?'], ['Retrieval', 'Was the right evidence returned?'], ['Generation', 'Did the model use the evidence it was given?'], ['Decision', 'Fix the measured failure, not the assumed one.']] },
      { name: 'Remediation ladder', note: 'Escalate only when cheaper options fail.', steps: [['Clarify in prompt', 'State the expected form explicitly.'], ['Inject context', 'Supply the correct spelling in context.'], ['Extend vocabulary', 'Add domain terms and retrain embeddings.'], ['Custom tokenizer', 'Rebuild segmentation; requires full retraining.']] }
    ],
    precision: 'High fragmentation is not automatically a defect. It is a cost and context-length problem whose severity depends on the traffic mix.',
    engineering: 'Instrument tokens-per-request segmented by language. Aggregate cost metrics hide service inequality between user populations.',
    interview: 'How do you prove a quality regression is a tokenizer problem rather than a retrieval problem?',
    checkpoint: { question: 'Users of one language get shorter effective context at the same context-window setting. What is the most likely cause?', options: ['The context window is language-specific', 'Higher fragmentation consumes more of the same token budget', 'The tokenizer rejects their script', 'Attention weights differ by language'], correct: 1, why: 'The window counts tokens, not characters. Higher fragmentation means each sentence consumes more of the same fixed budget.' }
  }
};

export function getTokenizationGuide(id) {
  return tokenizationGuides[id];
}
