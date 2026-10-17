/**
 * Beginner → engineering bridge for Mentora's twelve Transformer Architecture
 * lessons. Diagrams are conceptual teaching illustrations, not benchmarks.
 * Keep interview A–F sections in courses.json as the next stage of study.
 */
export const transformerGuides = {
  1: {
    question: 'What is a Transformer actually made of?',
    plain: 'A Transformer is a stack of identical blocks. Each block does two things: it lets every token look at every other token (attention), then it transforms each token independently through a small network (feed-forward). Repeat that dozens of times and the token positions end up carrying rich context about the whole sequence.',
    goals: ['Name the components of a decoder-only Transformer', 'Explain what each component is responsible for', 'Describe why the blocks are stacked rather than written once'],
    concepts: [
      ['Token embeddings', 'The input, turned into vectors.', 'Each token ID selects one row of a trained matrix, producing a vector of width d_model. This is the only point where the model first sees the text.'],
      ['Attention block', 'Where tokens exchange information.', 'Attention lets each position compute a weighted mix of every permitted position. It is the only place in the architecture where tokens can influence one another.'],
      ['Feed-forward block', 'Where each token is processed on its own.', 'A two-layer network applied to every position independently and identically. It adds the nonlinearity and the capacity that attention alone does not provide.'],
      ['Residual + norm', 'The scaffold that keeps deep stacks trainable.', 'Every sub-layer output is added to its input and normalized. Without this, gradients through dozens of layers would either vanish or explode.']
    ],
    example: { title: 'Explain a Transformer to a non-ML engineer', steps: ['Say attention is where each word looks at the others to decide what it means here.', 'Say the feed-forward layer is where each position thinks for itself.', 'Say residuals and normalization are what let you stack thirty of these without the training collapsing.', 'Say the whole thing repeats, and depth is what buys the capability.'], takeaway: 'Attention mixes, feed-forward transforms, residuals make depth survivable.' },
    views: [
      { name: 'One block, end to end', note: 'A block has two sub-layers, each wrapped in residual and norm.', steps: [['Input vectors', 'One vector per token position.'], ['Multi-head attention', 'Every position reads every permitted position.'], ['Add + Norm', 'Residual skip, then normalize.'], ['Feed-forward', 'Same small network at each position.'], ['Add + Norm', 'Second residual and normalization.'], ['Output', 'Vectors ready for the next block.']] },
      { name: 'The whole stack', note: 'Dozens of identical blocks, then a vocabulary projection.', steps: [['Embeddings', 'Token IDs become vectors.'], ['Block × N', 'The same block repeated, with learned weights each time.'], ['Final norm', 'Stabilize before the output projection.'], ['Logits', 'Project to one score per vocabulary entry.']] }
    ],
    precision: 'A Transformer is not a database or a knowledge store. It is a parameterized function from token sequences to next-token distributions.',
    engineering: 'When you read a model card, the numbers that matter are d_model, the number of layers, attention heads, and vocabulary size. They determine memory, latency, and cost before any quality question arises.',
    interview: 'Why does a Transformer stack identical blocks rather than one very deep unique block?',
    checkpoint: { question: 'In a Transformer block, which sub-layer lets one token affect another?', options: ['The feed-forward network', 'Multi-head attention', 'Layer normalization', 'The embedding lookup'], correct: 1, why: 'Attention is the only operation that mixes information across positions. The feed-forward network and normalization act on each position independently.' }
  },
  2: {
    question: 'Walk me through one complete forward pass, step by step.',
    plain: 'Text becomes tokens, tokens become vectors, position is added, and then the sequence flows through a stack of blocks. Each block attends and transforms. At the end the final position’s vector is projected into scores over the whole vocabulary, and those scores become the next-token distribution.',
    goals: ['Trace a sequence through every stage of a forward pass', 'State the tensor shape at each stage', 'Identify which stages run once and which repeat per layer'],
    concepts: [
      ['Prefill', 'Processing the prompt in one parallel pass.', 'All prompt positions are computed together, since the ground truth prefix is already known. This is compute-heavy and is where prompt length dominates latency.'],
      ['Per-layer shapes', 'Attention and MLP operate on the same width.', 'Input to every block is [batch, sequence, d_model]. Attention mixes along the sequence axis; the feed-forward expands to d_ff and contracts back to d_model.'],
      ['Final projection', 'The last position becomes vocabulary scores.', 'A linear layer maps the final hidden state to one logit per vocabulary entry. Only the last position is needed for the next token, though all positions were computed.'],
      ['Positional signal', 'Order must enter before the first block.', 'Whether added to the embedding or applied inside attention, position is injected once and then available to every subsequent layer.']
    ],
    example: { title: 'Estimate prefill cost for a long prompt', steps: ['Count prompt tokens and note that prefill runs them in parallel.', 'Recognize that attention work grows with the square of prompt length.', 'Estimate the feed-forward cost, which grows linearly with sequence length.', 'Check whether the KV cache is being written during prefill — it usually is.'], takeaway: 'Prefill is parallel but superlinear; decode is serial but cheap per step.' },
    views: [
      { name: 'Prefill stage', note: 'The prompt is processed in one parallel forward pass.', steps: [['Tokenize', 'Text becomes a sequence of IDs.'], ['Embed + position', 'Each ID becomes a positioned vector.'], ['Blocks × N', 'Attention and MLP run for every position at once.'], ['Write KV cache', 'Keys and values are stored for later decode steps.']] },
      { name: 'Decode stage', note: 'One token at a time, reading from the cache.', steps: [['Last position', 'Only the newest position needs a full computation.'], ['Read cache', 'Previous keys and values are loaded, not recomputed.'], ['Attention', 'The new query attends over the cached sequence.'], ['Sample', 'A token is chosen and appended.']] }
    ],
    precision: 'Prefill and decode are different workloads. Prefill is compute-bound and parallel; decode is memory-bound and serial.',
    engineering: 'Measure time-to-first-token and time-per-output-token separately. Optimising one usually worsens the other.',
    interview: 'Which stages of a forward pass scale with sequence length, and how?',
    checkpoint: { question: 'During decode, what does the model recompute for the whole sequence?', options: ['Everything, from embeddings onward', 'Only the new position; earlier keys and values come from the cache', 'Only the attention weights', 'Nothing; decode is lookup-only'], correct: 1, why: 'The KV cache stores earlier keys and values, so only the new position needs a forward computation. Recomputing the prefix would make decode quadratic.' }
  },
  3: {
    question: 'What are Query, Key, and Value, and why three separate projections?',
    plain: 'Each token produces three vectors. The query says "what am I looking for", the key says "what do I contain", and the value says "what I will contribute if selected". Matching queries against keys decides the weights, and those weights combine the values. Three separate learned projections let a token advertise and retrieve different things.',
    goals: ['Explain the role of each of Q, K, and V', 'Write the tensor shapes through an attention computation', 'Justify why one projection would be insufficient'],
    concepts: [
      ['Query and key matching', 'Attention weights come from query-key similarity.', 'Each query is compared against every permitted key by dot product. High similarity means that position is relevant to this one, so it receives a large weight.'],
      ['Value as payload', 'Values carry what is actually mixed.', 'Once weights are computed, they combine value vectors. A position can be important for matching but carry modest content, or the reverse.'],
      ['Three learned projections', 'Separate weight matrices for Q, K, and V.', 'Using one projection for all three would force a token to advertise and retrieve with the same representation, coupling two roles that benefit from independence.'],
      ['Shape bookkeeping', 'Attention is [B, H, T, D] throughout.', 'Batch B, heads H, sequence T, head dimension D. Q and K are [B, H, T, D]; their product is [B, H, T, T]; multiplying by V of shape [B, H, T, D] returns [B, H, T, D].']
    ],
    example: { title: 'Debug an attention shape mismatch', steps: ['Write the expected shape of Q, K, V and the score matrix explicitly.', 'Check whether the head dimension or the head count is transposed.', 'Verify that K is transposed on its last two axes before the product.', 'Confirm the mask broadcasts over the batch and head axes.'], takeaway: 'Almost every attention bug is a transposition, not an algorithm error.' },
    views: [
      { name: 'Three roles, one position', note: 'The same token produces three different vectors.', steps: [['Token vector', 'One position’s hidden state.'], ['W_q projection', 'Produces the query: what this position seeks.'], ['W_k projection', 'Produces the key: what this position offers.'], ['W_v projection', 'Produces the value: what it contributes.']] },
      { name: 'Shapes through attention', note: 'The score matrix is the only quadratic object.', steps: [['Q, K, V', '[B, H, T, D] each.'], ['Q · Kᵀ', '[B, H, T, T] similarity scores.'], ['Scale + mask + softmax', 'Turns scores into weights.'], ['· V', 'Returns [B, H, T, D].']] }
    ],
    precision: 'Q and K determine attention weights; V determines what is mixed. A position can score highly while contributing little content.',
    engineering: 'If attention looks wrong, print shapes before reasoning about semantics. Most failures are a missing transpose on K.',
    checkpoint: { question: 'Which pair of tensors determines the attention weights?', options: ['Q and V', 'K and V', 'Q and K', 'V and the output projection'], correct: 2, why: 'Weights come from the similarity between queries and keys. Values only enter after the weights are computed.' }
  },
  4: {
    question: 'Why divide the attention scores by √dₖ?',
    plain: 'Q and K are dot products over dₖ dimensions. If those components are independent with unit variance, the dot product’s variance grows with dₖ — so the scores get large, softmax saturates, and gradients vanish. Dividing by √dₖ restores the variance to roughly one and keeps gradients alive.',
    goals: ['Derive why score variance grows with dimension', 'Explain the effect on softmax saturation and gradients', 'State when scaling becomes unnecessary or harmful'],
    concepts: [
      ['Variance growth', 'Dot products of dₖ unit-variance terms sum to variance dₖ.', 'Each term in the sum has variance one, and independent variances add. So the raw score has standard deviation √dₖ, which grows with the head dimension.'],
      ['Softmax saturation', 'Large logits push probabilities to one-hot.', 'When scores spread far apart, softmax outputs collapse toward zero and one. The attention becomes a hard selection, and the gradient through it approaches zero.'],
      ['Gradient flow', 'Saturated softmax means no learning signal.', 'A one-hot attention pattern passes almost no gradient to the projections, so the model cannot learn to attend differently. Scaling prevents this collapse.'],
      ['Assumption of independence', 'The argument assumes Q and K components are uncorrelated.', 'Once trained, components are correlated and scores can grow again. Some implementations therefore use learned or dynamic scaling instead of a fixed constant.']
    ],
    example: { title: 'Explain why a model stops learning at long head dimensions', steps: ['Compute the expected score magnitude at the head dimension in use.', 'Check whether softmax outputs are near one-hot during training.', 'Compare gradient norms in attention against those in the feed-forward layer.', 'Confirm scaling is applied before the mask, not after the softmax.'], takeaway: 'Scaling is a gradient-preservation trick, not a mathematical correction to attention.' },
    views: [
      { name: 'Why the variance grows', note: 'Independent terms add variance, not standard deviation.', steps: [['One term', 'Unit variance contribution.'], ['dₖ terms summed', 'Variance grows to dₖ.'], ['Standard deviation', 'Grows to √dₖ.'], ['Logits spread', 'Softmax saturates.']] },
      { name: 'Effect of scaling', note: 'Dividing brings logits back into a workable range.', steps: [['Raw scores', 'Large spread, near-one-hot attention.'], ['Divide by √dₖ', 'Standard deviation returns toward one.'], ['Softmax', 'Probabilities stay informative.'], ['Gradients', 'Remain non-zero and useful.']] }
    ],
    precision: 'The √dₖ factor is justified under an independence assumption that only holds early in training. It is a practical stabilizer, not a theorem about attention.',
    engineering: 'If you increase head dimension significantly, watch for training instability in the attention block specifically.',
    interview: 'What would you expect to happen if you removed the √dₖ scaling at head dimension 128?',
    checkpoint: { question: 'Why does unscaled attention lead to vanishing gradients?', options: ['The scores become too small', 'Softmax saturates to one-hot and its gradient approaches zero', 'The mask blocks too many positions', 'The value vectors become too large'], correct: 1, why: 'Large logit variance makes softmax outputs nearly one-hot, and the gradient of softmax at saturation is essentially zero, so no learning signal flows back.' }
  },
  5: {
    question: 'What is the difference between self-attention and cross-attention?',
    plain: 'In self-attention, queries, keys and values all come from the same sequence — a token reading its own context. In cross-attention, queries come from one sequence and keys and values from another, so one sequence reads information out of a different one.',
    goals: ['Identify the source of Q, K and V in each case', 'Explain where cross-attention appears in real systems', 'Describe the caching consequence of each'],
    concepts: [
      ['Self-attention', 'One sequence attends to itself.', 'Q, K and V are all projections of the same input. In a decoder this is masked so positions can only see the past; in an encoder it is bidirectional.'],
      ['Cross-attention', 'One sequence reads from another.', 'Q comes from the decoder or the adapter, while K and V come from the encoder output. This is how a translation or summarization model conditions generation on its source.'],
      ['Source-conditioned generation', 'The common use of cross-attention.', 'The source is encoded once into vectors, and the decoder attends over them at every step. Changing the source changes generation without changing decoder weights.'],
      ['Caching asymmetry', 'Cross-attention keys and values are reusable.', 'The source is fixed during decoding, so its keys and values can be computed once and cached, which makes cross-attention comparatively cheap per decode step.']
    ],
    example: { title: 'Decide whether you need cross-attention', steps: ['Check whether generation must be conditioned on a separate fixed input.', 'If yes, an encoder-decoder or a cross-attention adapter is the natural fit.', 'If the source can be flattened into the prompt, decoder-only may be simpler.', 'Weigh deployment simplicity against conditioning quality on measured tasks.'], takeaway: 'Cross-attention earns its complexity only when the source and the generation are genuinely separate.' },
    views: [
      { name: 'Self vs cross', note: 'The difference is where Q, K and V come from.', steps: [['Self', 'Q, K, V all from the same sequence.'], ['Cross', 'Q from one sequence; K, V from another.'], ['Direction', 'Self mixes within; cross reads across.'], ['Cost', 'Cross needs the source encoded first.']] },
      { name: 'Caching behaviour', note: 'A fixed source lets you reuse work.', steps: [['Source fixed', 'It does not change during decoding.'], ['Encode once', 'Source keys and values are computed.'], ['Cache them', 'Reused at every decode step.'], ['Decoder state', 'Only the growing target needs new work.']] }
    ],
    precision: 'Cross-attention requires a separate encoder output. Feeding the source as ordinary prompt tokens is a decoder-only alternative, not the same mechanism.',
    engineering: 'For document-conditioned generation, compare an encoder-decoder against a decoder-only model with the source in the prompt on measured quality, cost, and latency.',
    interview: 'In encoder-decoder cross-attention, where do Q, K and V come from?',
    checkpoint: { question: 'In a translation model, where do the keys and values of cross-attention come from?', options: ['The decoder’s own generated tokens', 'The encoder’s output for the source sentence', 'The vocabulary embeddings', 'The positional encodings'], correct: 1, why: 'Cross-attention lets the decoder read the source: Q is from the decoder state, while K and V are projections of the encoder output.' }
  },
  6: {
    question: 'What is causal masking, and why is it necessary?',
    plain: 'During autoregressive training, the model must not see the future tokens it is trying to predict. A causal mask sets the attention scores of every future position to negative infinity before the softmax, so each position can only attend to itself and the past.',
    goals: ['Explain the leakage problem a mask prevents', 'Describe how the mask is applied algebraically', 'Distinguish masking from serial computation'],
    concepts: [
      ['Teacher forcing leakage', 'Without a mask, training would copy the answer.', 'All target tokens are available at once during training. Unmasked attention would let a position read the very token it is supposed to predict, and training loss would be meaningless.'],
      ['The mask itself', 'A lower-triangular matrix added before softmax.', 'Future entries are set to negative infinity so that softmax assigns them exactly zero probability. The mask broadcasts across batch and head axes.'],
      ['Parallel prefill survives', 'Masking is not the same as serial computation.', 'The mask blocks information flow but not computation. Every position can still be evaluated in a single parallel matrix operation during training.'],
      ['Decode-time equivalence', 'At inference the past is the only past.', 'During generation, future tokens do not exist yet, so the training mask and the inference behaviour agree. This consistency is what makes teacher forcing work.']
    ],
    example: { title: 'Find a masking bug in a custom implementation', steps: ['Check whether the mask is applied before the softmax, not after.', 'Verify it is lower-triangular and that the diagonal is unmasked.', 'Confirm the mask broadcasts over batch and head dimensions.', 'Test that a position’s output is unchanged when future values are perturbed.'], takeaway: 'A mask applied after softmax changes weights but does not remove the leak.' },
    views: [
      { name: 'Masking before softmax', note: 'Setting scores to negative infinity removes them exactly.', steps: [['Raw scores', 'Full [T, T] matrix from Q · Kᵀ.'], ['Add mask', 'Future entries set to negative infinity.'], ['Softmax', 'Masked entries become exactly zero.'], ['· V', 'Only past and current positions contribute.']] },
      { name: 'Leakage test', note: 'Perturbing the future must not change the present.', steps: [['Forward pass', 'Compute outputs normally.'], ['Perturb future', 'Change values at positions after t.'], ['Recompute', 'Compare position t’s output.'], ['Result', 'Identical if the mask is correct.']] }
    ],
    precision: 'A causal mask enforces information flow, not computation order. Training still evaluates all positions in parallel.',
    engineering: 'Verify masking with a perturbation test rather than by inspection. A mask that is off by one row is easy to miss visually.',
    interview: 'If the causal mask prevents future information, why can training still be parallel across positions?',
    checkpoint: { question: 'Where must the causal mask be applied for it to work correctly?', options: ['After the softmax', 'Before the softmax, on the raw scores', 'On the value vectors', 'On the output projection'], correct: 1, why: 'Setting future scores to negative infinity before softmax makes their probabilities exactly zero. Applying it afterwards only rescales already-computed weights.' }
  },
  7: {
    question: 'Why use multiple attention heads instead of one?',
    plain: 'One head can only compute one attention pattern per position. Multiple heads let different heads specialise — one might track syntax, another coreference, another locality — and their outputs are concatenated and mixed by a final projection. Capacity per head is traded against the number of parallel relations.',
    goals: ['Explain what a single head cannot do', 'Describe how heads are split and recombined', 'Relate head count to head dimension at fixed width'],
    concepts: [
      ['Head splitting', 'The width is divided among heads rather than added to it.', 'At d_model 4096 with 32 heads, each head operates on 128 dimensions. More heads means narrower heads, not a wider model.'],
      ['Pattern diversity', 'Different heads learn different attention structures.', 'Empirically some heads specialise in previous-token attention, syntactic dependencies, or delimiter matching. This specialisation is learned, not designed.'],
      ['Output projection', 'Concatenated heads are mixed before the residual.', 'Head outputs are concatenated back to d_model and multiplied by W_o, which mixes information across heads and lets the next layer combine what different heads found.'],
      ['Redundancy and pruning', 'Many heads are not individually necessary.', 'Ablation studies show some heads can be zeroed with little effect. This redundancy is why head pruning and head-sharing schemes such as GQA are workable.']
    ],
    example: { title: 'Diagnose a model that ignores long-range references', steps: ['Inspect attention patterns for heads that should track the referent.', 'Check whether those heads are present at deeper layers where the effect is expected.', 'Test whether pruning or quantization has damaged them specifically.', 'Compare against a baseline before assuming an architectural cause.'], takeaway: 'Head-level behaviour is observable, so treat attention failures as measurable rather than mysterious.' },
    views: [
      { name: 'Split, attend, recombine', note: 'The model width is shared across heads.', steps: [['Input vectors', 'Width d_model at every position.'], ['Split', 'Divide into H heads of width d_h.'], ['Attend independently', 'Each head computes its own pattern.'], ['Concatenate', 'Join back to d_model.'], ['W_o mix', 'Combine information across heads.']] },
      { name: 'Fixed-width trade-off', note: 'More heads means narrower heads.', steps: [['d_model fixed', 'The total width does not change.'], ['More heads', 'Each head gets fewer dimensions.'], ['Capacity per head', 'Falls as head count rises.'], ['Sweet spot', 'Where diversity stops buying useful patterns.']] }
    ],
    precision: 'Multi-head attention does not increase the model width. It partitions an existing width and adds a mixing projection.',
    engineering: 'When comparing architectures, compare heads × head dimension rather than head count alone. Head count alone is not a capacity measure.',
    interview: 'What happens to head dimension if you double the number of heads while keeping d_model fixed?',
    checkpoint: { question: 'What is the role of the output projection W_o in multi-head attention?', options: ['It scales the attention scores', 'It mixes the concatenated head outputs back into d_model', 'It applies the causal mask', 'It normalizes the values'], correct: 1, why: 'Heads are computed independently, so their outputs must be concatenated and mixed by W_o before the residual connection.' }
  },
  8: {
    question: 'What does the feed-forward network in a Transformer actually do?',
    plain: 'After attention mixes information across positions, a small two-layer network processes each position on its own. It expands the width, applies a nonlinearity, then contracts back. Attention is where tokens talk; the feed-forward is where each token transforms what it learned.',
    goals: ['Describe the expand-transform-contract structure', 'Compare GELU, SiLU and SwiGLU activations', 'Explain why this block dominates parameter count'],
    concepts: [
      ['Two-layer structure', 'Expand to d_ff, apply nonlinearity, contract to d_model.', 'The first projection widens the representation, a nonlinearity introduces the transformation, and the second projects back to the residual stream width.'],
      ['Parameter dominance', 'Most parameters live here, not in attention.', 'With d_ff around four times d_model, the feed-forward block holds roughly two thirds of a layer’s parameters, which is why quantization work concentrates here.'],
      ['Gated variants', 'SwiGLU adds a learned gate.', 'SwiGLU splits the expansion into a value path and a gate path, multiplying them. It improves quality but requires adjusting d_ff to keep parameter count comparable.'],
      ['Position independence', 'The same weights apply at every position.', 'The block is a position-wise MLP. Its capacity is per-token; cross-token reasoning is entirely attention’s job.']
    ],
    example: { title: 'Choose an activation for a new model', steps: ['Start from the activation used by the architecture you are reproducing.', 'If experimenting, compare GELU against SwiGLU at matched parameter count.', 'Adjust d_ff downward when adopting a gated variant to keep size comparable.', 'Measure quality per parameter rather than raw quality.'], takeaway: 'Gated variants change quality and parameter count together; adjust width to compare fairly.' },
    views: [
      { name: 'Expand and contract', note: 'The block is a position-wise two-layer network.', steps: [['Input', 'Width d_model at one position.'], ['Project up', 'Expand to d_ff, typically 4× d_model.'], ['Nonlinearity', 'GELU, SiLU, or a gated variant.'], ['Project down', 'Return to d_model for the residual.']] },
      { name: 'Where the parameters live', note: 'Most of a layer’s capacity is in this block.', steps: [['Attention', 'Three projections plus output mixing.'], ['Feed-forward', 'Two large projections.'], ['Ratio', 'Roughly two thirds of layer parameters.'], ['Consequence', 'Quantization effort concentrates here.']] }
    ],
    precision: 'The feed-forward network has no cross-token interaction. All information exchange between positions happens in attention.',
    engineering: 'If you swap the activation, retune d_ff. SwiGLU at the same width as GELU is a larger model, not a like-for-like substitution.',
    checkpoint: { question: 'Which statement about the feed-forward block is true?', options: ['It mixes information across positions', 'It applies the same network independently at each position', 'It normalizes the residual stream', 'It determines attention weights'], correct: 1, why: 'The feed-forward block is a position-wise MLP. Cross-position information exchange is exclusively attention’s role.' }
  },
  9: {
    question: 'Why do Transformers need residual connections?',
    plain: 'Each sub-layer adds its output to its input rather than replacing it. That gives gradients a direct path back through the network that does not depend on the sub-layer’s weights, so a deep stack can train. It also means each block only has to learn a correction, not an entire transformation.',
    goals: ['Explain the gradient path residuals provide', 'Describe why depth becomes trainable', 'Relate residual streams to the "incremental refinement" view'],
    concepts: [
      ['Identity path', 'The gradient flows unimpeded through the skip.', 'Differentiating through x + f(x) gives 1 plus the sub-layer term. That constant 1 ensures gradients reach early layers regardless of what the sub-layer learned.'],
      ['Correction learning', 'Sub-layers learn deltas, not replacements.', 'Because the input is preserved, a block only needs to add what it contributes. This is why a well-trained block’s output is often close to its input.'],
      ['The residual stream', 'A running representation that layers read and write.', 'Viewed this way, each attention and feed-forward block reads the current stream and writes an update. Later layers can read what earlier layers wrote.'],
      ['Gradient accumulation', 'Early layers receive contributions from every later block.', 'Without skips, a gradient through thirty layers is a product of thirty Jacobians. With skips it is a sum, which is far better conditioned.']
    ],
    example: { title: 'Diagnose vanishing gradients in a deep stack', steps: ['Plot gradient norm against layer depth before changing anything.', 'Check whether the residual path is intact — a missing skip is easy to introduce in custom code.', 'Verify normalization sits on the branch, not on the stream.', 'Test a shallower configuration to isolate depth as the cause.'], takeaway: 'A missing residual is a one-line bug with a catastrophic and non-obvious symptom.' },
    views: [
      { name: 'Gradient path', note: 'The skip gives gradients a route that bypasses the sub-layer.', steps: [['Loss', 'Backward pass begins.'], ['Through sub-layer', 'Multiply by the sub-layer Jacobian.'], ['Through skip', 'Add the identity term.'], ['Early layers', 'Receive a gradient that does not vanish.']] },
      { name: 'Residual stream view', note: 'Layers write increments into a shared stream.', steps: [['Stream', 'Carries the running representation.'], ['Attention reads', 'Attends to the current stream.'], ['Attention writes', 'Adds its contribution.'], ['Repeat', 'Each block refines rather than replaces.']] }
    ],
    precision: 'Residual connections do not improve the expressiveness of a single block. They make depth trainable, which is where the capacity comes from.',
    engineering: 'In custom implementations, assert that the residual add is present. Its absence trains for a while and then fails confusingly.',
    interview: 'Why is the gradient through a residual network better conditioned than through a plain deep stack?',
    checkpoint: { question: 'What does the residual connection contribute to the backward pass?', options: ['It normalizes the gradient', 'A constant identity term that does not vanish with depth', 'It scales the gradient by the layer count', 'It applies the causal mask'], correct: 1, why: 'Differentiating x + f(x) yields 1 + f′(x). The constant 1 guarantees a gradient path regardless of what the sub-layer learned.' }
  },
  10: {
    question: 'What is the difference between LayerNorm and RMSNorm?',
    plain: 'LayerNorm centers activations by subtracting the mean and dividing by the standard deviation, then rescales with learned gains. RMSNorm drops the mean subtraction and divides only by the root mean square. It is cheaper and, empirically, works about as well.',
    goals: ['Write the computation for both normalizations', 'Explain why removing the mean is acceptable', 'State the cost difference'],
    concepts: [
      ['LayerNorm', 'Center and scale per position.', 'For one position’s vector, compute the mean and variance across features, then apply an affine transform with learned gain and bias.'],
      ['RMSNorm', 'Scale without centering.', 'Compute the root mean square of the features and divide by it, then apply a learned gain. There is no mean subtraction and no bias.'],
      ['Why it works', 'The direction matters more than the offset.', 'The argument is that the scale of the representation carries the useful information, so removing the mean costs little while removing the computation saves real time.'],
      ['Cost difference', 'Fewer reductions means less memory traffic.', 'RMSNorm avoids a mean pass and a bias application. On modern hardware the win comes mainly from reduced memory traffic, which dominates at these sizes.']
    ],
    example: { title: 'Choose a normalization for a new model', steps: ['Default to RMSNorm when reproducing a modern architecture.', 'Check whether the reference implementation uses it, and match it exactly.', 'If comparing against an older model, expect LayerNorm in Post-Norm form.', 'Measure throughput, not just quality, since the difference is a speed win.'], takeaway: 'RMSNorm is a performance choice with an empirically negligible quality cost.' },
    views: [
      { name: 'LayerNorm computation', note: 'Center and scale per position.', steps: [['Compute mean', 'Average across the feature axis.'], ['Compute variance', 'Second moment about the mean.'], ['Normalize', 'Divide by standard deviation.'], ['Affine', 'Apply learned gain and bias.']] },
      { name: 'RMSNorm computation', note: 'Scale only, no centering.', steps: [['Compute squares', 'Square each feature.'], ['Mean of squares', 'One reduction pass.'], ['Root', 'Take the square root.'], ['Divide and scale', 'Apply learned gain; no bias.']] }
    ],
    precision: 'RMSNorm is not LayerNorm with a shortcut. It removes centering entirely, which changes the computation and removes the bias term.',
    engineering: 'Normalizations are cheap in parameters and expensive in memory traffic. On inference hardware, RMSNorm’s real benefit is throughput.',
    checkpoint: { question: 'What does RMSNorm remove relative to LayerNorm?', options: ['The learned gain', 'The mean subtraction and the bias', 'The division by scale', 'The per-position computation'], correct: 1, why: 'RMSNorm divides by the root mean square instead of the standard deviation, so there is no centering and no bias term.' }
  },
  11: {
    question: 'Why do modern Transformers put LayerNorm before the sub-layer rather than after?',
    plain: 'In the original design the normalization came after attention and feed-forward. Modern models put it before. Pre-Norm gives a cleaner gradient path through the residual stream, which makes training stable enough to stack very deep models without warmup tricks.',
    goals: ['Compare Pre-Norm and Post-Norm block structure', 'Explain the gradient-path argument', 'State the trade-off in final quality'],
    concepts: [
      ['Post-Norm structure', 'The original order: sub-layer, then add, then normalize.', 'Normalization sits on the residual path itself, so the identity gradient route is interrupted by a normalization at every layer.'],
      ['Pre-Norm structure', 'Normalize first, then sub-layer, then add.', 'The residual stream passes through untouched, so gradients accumulate a clean identity term. Training is stable at depth without careful initialization.'],
      ['Gradient argument', 'Pre-Norm preserves the identity path.', 'With Post-Norm, gradients must pass through a normalization at each layer. With Pre-Norm they do not, which is why deep Pre-Norm models train without the original’s warmup schedule.'],
      ['Quality trade-off', 'Pre-Norm stabilizes training but can underperform slightly.', 'Some evidence suggests Post-Norm reaches better final quality given enough stability work. In practice Pre-Norm won because it is far easier to train.']
    ],
    example: { title: 'Diagnose training instability in a deep model', steps: ['Check the normalization order in the block definition.', 'If Post-Norm, verify a warmup schedule is in place.', 'Plot gradient norm by layer depth to see whether early layers are starved.', 'Consider switching to Pre-Norm before changing learning rate.'], takeaway: 'Training instability at depth is often an ordering problem, not a rate problem.' },
    views: [
      { name: 'Post-Norm block', note: 'The original Transformer order.', steps: [['Sub-layer', 'Attention or feed-forward runs first.'], ['Add', 'Residual combines input and output.'], ['Normalize', 'Normalization sits on the stream path.'], ['Cost', 'Gradient route interrupted at every layer.']] },
      { name: 'Pre-Norm block', note: 'The modern default.', steps: [['Normalize', 'Normalize the sub-layer input only.'], ['Sub-layer', 'Runs on the normalized input.'], ['Add', 'Residual passes the stream through untouched.'], ['Benefit', 'Clean identity gradient path.']] }
    ],
    precision: 'Pre-Norm and Post-Norm place normalization in different positions relative to the residual add, which changes the gradient path rather than the computation performed.',
    engineering: 'If you are reproducing a model, match its normalization order exactly. It affects training dynamics and the required warmup schedule.',
    checkpoint: { question: 'Why is Pre-Norm easier to train at depth?', options: ['It has fewer parameters', 'The residual stream passes through without normalization, preserving a clean gradient path', 'It applies the causal mask earlier', 'It uses a larger learning rate'], correct: 1, why: 'With Pre-Norm, the identity path of the residual is uninterrupted by normalization, so gradients reach early layers without attenuation.' }
  },
  12: {
    question: 'How does Transformer cost scale with sequence length and width?',
    plain: 'Attention work grows with the square of sequence length because every position is compared against every other. The feed-forward and projections grow linearly with length but quadratically with width. At short lengths the linear terms dominate; past a few thousand tokens attention takes over.',
    goals: ['State the compute and memory scaling of each component', 'Explain where the quadratic term dominates', 'Connect scaling to hardware limits'],
    concepts: [
      ['Attention is quadratic in length', 'The score matrix is [T, T] per head.', 'Computing and storing all pairwise comparisons costs O(T² · d). This is the term that makes long context expensive.'],
      ['Projections and MLP are linear in length', 'But quadratic in width.', 'Each position’s projections and feed-forward cost O(T · d²), which dominates at short lengths and large widths.'],
      ['Where the crossover sits', 'Length versus width decides the bottleneck.', 'Below a few thousand tokens the d² terms dominate. Beyond that, the T² attention term takes over, which is why long-context optimization targets attention specifically.'],
      ['Memory is the harder limit', 'Activations grow with T² before compute does.', 'Storing the score matrix exhausts memory faster than arithmetic becomes the constraint. FlashAttention exists primarily to avoid materializing that matrix.']
    ],
    example: { title: 'Estimate whether a workload is attention-bound', steps: ['Compare T against d for the workload in question.', 'If T is below d, assume projection and feed-forward dominate.', 'If T exceeds d, expect attention memory traffic to dominate.', 'Measure, since batching and kernel efficiency shift the practical crossover.'], takeaway: 'The crossover between linear and quadratic regimes is a property of your workload, not of Transformers in general.' },
    views: [
      { name: 'Cost by component', note: 'Different terms dominate at different lengths.', steps: [['Projections', 'O(T · d²) — linear in length.'], ['Attention scores', 'O(T² · d) — quadratic in length.'], ['Feed-forward', 'O(T · d²) — linear in length.'], ['Crossover', 'Where T approaches d.']] },
      { name: 'Compute vs memory', note: 'Memory fails before compute does.', steps: [['Score matrix', '[T, T] per head, per layer.'], ['Materialize', 'Exhausts memory at modest lengths.'], ['Avoid', 'FlashAttention computes without storing it.'], ['Consequence', 'Long context is a memory problem first.']] }
    ],
    precision: 'The quadratic term is in sequence length, not in width. A wide model at short length is not quadratic in the way a long model is.',
    engineering: 'When sizing hardware for long context, budget for the KV cache and attention memory before GPU arithmetic. Memory is usually the binding constraint.',
    interview: 'Which part of a Transformer scales quadratically with sequence length, and why does it matter in practice?',
    checkpoint: { question: 'At which regime does the quadratic attention term dominate over the d² terms?', options: ['Very short sequences', 'When sequence length approaches or exceeds the model width', 'Only during training', 'Never; d² always dominates'], correct: 1, why: 'Attention cost grows as T²·d while projections grow as T·d². The quadratic term overtakes once T is comparable to d.' }
  }
};

export function getTransformerGuide(id) {
  return transformerGuides[id];
}
