/**
 * Beginner → engineering bridge for Mentora's fourteen Advanced Transformers
 * lessons. Diagrams are conceptual teaching illustrations, not benchmarks.
 * Keep interview A–F sections in courses.json as the next stage of study.
 */
export const advancedGuides = {
  1: {
    question: 'What makes a Transformer "sparse", and why bother?',
    plain: 'A dense model runs every parameter on every token. A sparse model activates only a subset — fewer experts, fewer layers, fewer attention pairs. The point is to hold more total capacity while spending less compute per token, because dense cost grows with the whole model every single step.',
    goals: ['Distinguish activation sparsity from weight sparsity', 'Explain the compute-versus-capacity trade', 'Identify when sparsity does not help'],
    concepts: [
      ['Dense layers', 'Every parameter participates in every token.', 'Cost scales with total parameter count. Adding capacity adds cost uniformly, regardless of how much the token needs.'],
      ['Sparse activation', 'Only a subset runs per token.', 'The model can hold far more total parameters while each token pays for a fraction. Capacity and per-token cost become separable.'],
      ['Where sparsity lives', 'Expert choice, layer skipping, and attention pattern.', 'Mixture of Experts sparsifies the feed-forward layer; sliding window sparsifies attention; depth sparsity skips layers entirely.'],
      ['Routing is the risk', 'Someone must decide what to activate.', 'Every sparse scheme needs a decision mechanism, and that mechanism can be imbalanced — leaving some capacity unused while other paths saturate.']
    ],
    example: { title: 'A model is too expensive at your traffic level', steps: ['Measure active parameters per token, not total parameters.', 'Check whether a sparse or MoE variant of the same family exists.', 'Compare tokens per second at matched quality rather than model size.', 'Confirm serving support — sparse models need specialised kernels.'], takeaway: 'Total parameters tell you memory; active parameters tell you cost per token.' },
    views: [
      { name: 'Dense versus sparse compute', note: 'What each token actually pays for.', steps: [['Dense', 'All parameters run.'], ['Sparse', 'A selected subset runs.'], ['Capacity', 'Total can grow without proportional cost.'], ['Requirement', 'A routing decision.']] },
      { name: 'Three sparsity sites', note: 'Sparsity is applied at different layers.', steps: [['Feed-forward', 'Mixture of Experts.'], ['Attention', 'Sliding window or sparse patterns.'], ['Depth', 'Skip whole layers.'], ['Common risk', 'Imbalanced activation.']] }
    ],
    precision: 'Sparsity reduces compute per token, not necessarily memory. The full weights must usually still be resident.',
    engineering: 'When comparing a dense and a sparse model, compare active parameters per token and tokens per second — not parameter count alone.',
    checkpoint: { question: 'What does sparsity primarily reduce?', options: ['Memory required to store weights', 'Compute spent per token, while total capacity can stay large', 'The number of training tokens needed', 'Sequence length limits'], correct: 1, why: 'Only a subset of parameters is activated per token, so per-token cost falls while the model can still hold many more total parameters.' }
  },
  2: {
    question: 'How does a Mixture of Experts layer decide who computes what?',
    plain: 'A small router scores each token against a set of expert networks and picks the top few. Those experts process the token and their outputs are combined by the router’s weights. The trick is keeping the load even — if one expert gets everything, you paid for capacity you are not using.',
    goals: ['Describe top-k routing and weighted combination', 'Explain load balancing and why it is auxiliary', 'Identify routing failure modes'],
    concepts: [
      ['Top-k routing', 'Each token selects a few experts.', 'A linear router produces scores over experts; the highest-scoring few are chosen. Their outputs are mixed using the corresponding router weights.'],
      ['Load balancing loss', 'An auxiliary term that spreads traffic.', 'Without it, routing collapses onto a few experts that happen to be good early. A auxiliary loss penalizes imbalance so capacity stays utilized.'],
      ['Token choice versus expert choice', 'Two directions for the same problem.', 'Token-choice has tokens pick experts and can overload them. Expert-choice has experts pick tokens, guaranteeing balance but potentially splitting related tokens.'],
      ['Training instability', 'Routing decisions are discrete and non-differentiable.', 'The selection is not differentiable, so gradients flow through the chosen experts only. Early imbalance can become self-reinforcing if uncorrected.']
    ],
    example: { title: 'MoE model trains with spiking loss spikes', steps: ['Track expert utilization per step to spot collapse.', 'Check whether the auxiliary balancing coefficient is set.', 'Verify that dropped tokens are handled rather than silently discarded.', 'Lower the router learning rate if routing keeps flipping sharply.'], takeaway: 'Watch expert utilization — it predicts instability before loss does.' },
    views: [
      { name: 'One token through routing', note: 'Score, select, mix.', steps: [['Token', 'One hidden state.'], ['Router scores', 'A value per expert.'], ['Top-k selected', 'Only a few activate.'], ['Weighted mix', 'Combine their outputs.']] },
      { name: 'Balancing the load', note: 'Why the auxiliary loss exists.', steps: [['Natural routing', 'Some experts dominate.'], ['Idle capacity', 'Paid for, unused.'], ['Auxiliary loss', 'Penalizes imbalance.'], ['Result', 'Traffic spread across experts.']] }
    ],
    precision: 'An MoE layer increases parameter count with modest compute increase. Memory cost follows total parameters; compute follows active ones.',
    engineering: 'Instrument expert utilization in serving. A skewed distribution silently wastes the capacity you are paying to hold.',
    checkpoint: { question: 'What problem does the load-balancing auxiliary loss solve?', options: ['Slow expert computation', 'Routing collapsing onto a few experts, leaving others unused', 'Excessive memory usage', 'Attention score saturation'], correct: 1, why: 'Without a balancing term, early router advantages compound and traffic concentrates, so most of the added capacity never runs.' }
  },
  3: {
    question: 'What is the difference between MHA, MQA, and GQA?',
    plain: 'Multi-head attention gives every head its own keys and values — maximum flexibility, maximum KV cache. Multi-query attention uses one shared key and value set for all heads — tiny cache, some quality cost. Grouped-query attention sits between: heads share keys and values within groups, trading a little quality for a large memory saving.',
    goals: ['Compare the three schemes by cache size', 'Explain why decode is memory-bound', 'Choose a scheme from memory constraints'],
    concepts: [
      ['Multi-head attention', 'Independent K and V per head.', 'Full expressiveness: each head learns its own key and value projections. The KV cache stores one copy per head, which is the dominant decode memory cost.'],
      ['Multi-query attention', 'One K and V shared across all heads.', 'The cache shrinks by the head-count factor. Quality can drop since all heads retrieve from one representation, but the win at decode is large.'],
      ['Grouped-query attention', 'Heads grouped, sharing K and V within a group.', 'A tunable middle: more groups means more cache and more quality; fewer groups means the opposite. Most modern models use GQA.'],
      ['Why it matters at decode', 'Decode is bandwidth-bound.', 'Each decode step reads the entire KV cache. Cache size directly sets how much memory must move per token, which is the bottleneck.']
    ],
    example: { title: 'Choose between model variants for the same hardware', steps: ['Compute KV cache per sequence for each candidate at your target length.', 'Add the model weights to find total memory.', 'Check batch size that then fits.', 'Only then compare quality — the constraint is often memory, not accuracy.'], takeaway: 'The scheme that fits your batch size at target length is usually the right one.' },
    views: [
      { name: 'Three cache shapes', note: 'Same heads, different key/value sharing.', steps: [['MHA', 'K and V per head.'], ['GQA', 'K and V per group of heads.'], ['MQA', 'One K and V for all heads.'], ['Cache', 'Shrinks MHA → GQA → MQA.']] },
      { name: 'Why decode cares', note: 'Every step reads the whole cache.', steps: [['Decode step', 'One new token.'], ['Read cache', 'Entire K and V history.'], ['Bandwidth', 'The binding limit.'], ['Smaller cache', 'Directly faster steps.']] }
    ],
    precision: 'GQA reduces KV cache size, not attention compute per se. The speedup comes from moving less memory during decode.',
    engineering: 'Compare candidates on KV bytes per sequence at your working context length, then on batch size. Quality differences are usually smaller than the memory difference.',
    checkpoint: { question: 'Why does GQA speed up generation?', options: ['It computes fewer attention scores', 'It stores fewer key/value tensors in the cache, reducing memory read per decode step', 'It uses a smaller vocabulary', 'It reduces the number of layers'], correct: 1, why: 'Decode is bandwidth-bound on reading the KV cache. Sharing keys and values across head groups shrinks that cache and therefore each step’s memory traffic.' }
  },
  4: {
    question: 'What is the KV cache and why does decoding need it?',
    plain: 'During decoding the model needs the keys and values of every previous position. Recomputing them each step would be quadratic. Instead the first pass stores them, and every later step just reads them. That single idea is what makes generation linear rather than quadratic.',
    goals: ['Explain what is cached and why', 'Describe the cost shift caching creates', 'Connect caching to the prefill/decode split'],
    concepts: [
      ['What is stored', 'Keys and values for every layer and head.', 'Each layer’s attention needs past K and V. Nothing else from earlier steps needs to be retained, but what is retained grows with sequence length.'],
      ['Why recompute is untenant', 'Without a cache, decoding is quadratic.', 'Generating t tokens by recomputing the prefix each time costs O(t²) work. The cache converts that to O(t) additional work.'],
      ['Prefill writes, decode reads', 'The two phases use the cache differently.', 'Prefill processes the prompt and populates the cache; each decode step appends one entry and reads the whole thing.'],
      ['The cost it creates', 'Cache growth becomes the constraint.', 'Caching solves compute and creates a memory problem: the cache grows linearly with sequence length and bounds batch size.']
    ],
    example: { title: 'Throughput drops as conversations lengthen', steps: ['Measure KV cache bytes against conversation length.', 'Check whether batch size is being reduced automatically as cache grows.', 'Compare GQA or MQA variants to shrink the cache.', 'Consider truncating or summarizing history to bound growth.'], takeaway: 'Long conversations reduce throughput through cache growth, not through model size.' },
    views: [
      { name: 'Without a cache', note: 'The quadratic path.', steps: [['Step 1', 'Compute all positions.'], ['Step 2', 'Recompute positions 1..2.'], ['Step t', 'Recompute 1..t again.'], ['Total', 'O(t²) work.']] },
      { name: 'With a cache', note: 'Write once, read each step.', steps: [['Prefill', 'Compute prompt, store K and V.'], ['Decode step', 'Compute only the new position.'], ['Read cache', 'Reuse all prior K and V.'], ['Append', 'Add one entry.']] }
    ],
    precision: 'The KV cache stores intermediate activations of attention, not model weights. It is per-sequence state that must live in fast memory.',
    engineering: 'Budget the KV cache explicitly per request. It is usually the largest single consumer of GPU memory during serving.',
    checkpoint: { question: 'What does the KV cache store?', options: ['Model weights', 'Keys and values from earlier positions for every layer', 'The full attention score matrix', 'The optimizer state'], correct: 1, why: 'Attention at each step needs prior keys and values. Caching them avoids recomputing the prefix; the score matrix itself is not retained.' }
  },
  5: {
    question: 'How much memory does the KV cache actually need?',
    plain: 'Two (key and value) times layers times sequence length times KV heads times head dimension times bytes per element. Double it for both tensors, multiply by batch, and it dominates GPU memory quickly. At 32 layers, 8 KV heads, 128 dimensions, and 8k tokens, one sequence in bf16 is about 1 GiB.',
    goals: ['Write the KV cache memory formula', 'Identify which factors you can change', 'Relate cache size to batch and context limits'],
    concepts: [
      ['The formula', '2 × layers × tokens × kv_heads × head_dim × bytes.', 'The factor of two is for keys and values. Everything else is a model dimension or a workload dimension you can trade.'],
      ['Knobs that actually help', 'KV heads and sequence length dominate.', 'Layer count and head dimension are fixed by the architecture. Reducing KV heads through GQA, or bounding sequence length, are the practical levers.'],
      ['Compression beyond reduction', 'Quantize or evict cache entries.', 'Storing the cache at lower precision cuts memory roughly in half. Eviction and dropping old blocks trade quality directly.'],
      ['Cache sets the batch', 'Concurrent sequences share the budget.', 'At fixed memory, larger cache per sequence means fewer concurrent sequences. Throughput is often bounded by this, not by arithmetic.']
    ],
    example: { title: 'OOM during long-context serving', steps: ['Compute cache per sequence with the formula for your configuration.', 'Multiply by intended concurrency and compare against free memory.', 'Subtract weights and activation workspace to find the real headroom.', 'Reduce KV heads, context, or batch — in that order of preference.'], takeaway: 'Compute it before serving. Cache surprises arrive as OOM under load.' },
    views: [
      { name: 'The memory formula', note: 'Every factor is visible and separable.', steps: [['2 tensors', 'Key and value.'], ['× layers', 'Each layer caches its own.'], ['× tokens', 'Grows with sequence length.'], ['× heads × dim', 'Per-layer tensor shape.'], ['× bytes', 'Precision of storage.']] },
      { name: 'Levers by priority', note: 'Some factors are yours to move.', steps: [['KV heads', 'Reduce with GQA or MQA.'], ['Sequence length', 'Bound it explicitly.'], ['Bytes', 'Store at lower precision.'], ['Layers', 'Fixed by architecture.']] }
    ],
    precision: 'The formula excludes allocator overhead, fragmentation, and prefix sharing. Real usage is somewhat higher than the arithmetic suggests.',
    engineering: 'Compute this before choosing hardware, not after the OOM. It converts an architecture into a serving constraint in one line.',
    checkpoint: { question: 'Which factor in the KV cache formula scales the memory most directly with conversation growth?', options: ['Layer count', 'Sequence length (number of cached tokens)', 'Model parameter count', 'Vocabulary size'], correct: 1, why: 'Layers and head dimensions are fixed by architecture; sequence length is the workload variable that grows with every turn.' }
  },
  6: {
    question: 'What does FlashAttention actually change?',
    plain: 'Not the result — the same numbers come out. It changes how attention is computed: tiles of the score matrix are processed in fast memory and never written to slow memory. It also uses an online softmax that accumulates across tiles without needing the whole matrix at once.',
    goals: ['Explain why the naive form is memory-bound', 'Describe tiling and online softmax', 'State what FlashAttention does not change'],
    concepts: [
      ['The naive bottleneck', 'Materializing [T, T] is a memory problem.', 'Standard attention writes the full score matrix to GPU memory and reads it back for softmax. That traffic dominates even when arithmetic is modest.'],
      ['Tiling', 'Work in blocks that fit in fast memory.', 'Sub-blocks of queries and keys are loaded into SRAM, multiplied, and consumed there. The full matrix never exists in global memory.'],
      ['Online softmax', 'Accumulate normalization across tiles.', 'Running maximum and running sum are maintained as tiles arrive, so each block is softmaxed correctly without seeing the rest. This is what makes tiling possible.'],
      ['No algorithmic change', 'The output is mathematically identical.', 'Exact attention is preserved — this is an IO-aware reorganization, not an approximation. Sparse and approximate schemes are separate ideas.']
    ],
    example: { title: 'Long-sequence training OOMs despite modest arithmetic', steps: ['Check whether attention is materializing the score matrix.', 'Confirm the kernel in use actually supports the sequence length.', 'Enable the memory-efficient path in the framework.', 'Re-measure peak memory rather than assuming the flag applied.'], takeaway: 'Attention OOM is usually an IO problem, and FlashAttention is the IO fix.' },
    views: [
      { name: 'Naive attention IO', note: 'Traffic dominates.', steps: [['Q · Kᵀ', 'Write [T, T] to global memory.'], ['Read back', 'For softmax.'], ['Write again', 'To multiply by V.'], ['Cost', 'Memory traffic, not flops.']] },
      { name: 'FlashAttention tiling', note: 'Keep blocks in fast memory.', steps: [['Load tile', 'Into SRAM.'], ['Multiply', 'Compute partial scores.'], ['Online softmax', 'Update running max and sum.'], ['Accumulate', 'Never materialize the matrix.']] }
    ],
    precision: 'FlashAttention is exact, not approximate. It reduces memory I/O while computing the same attention output.',
    engineering: 'Confirm the kernel actually being used at runtime. Falling back to a naive path at unsupported shapes silently costs you the benefit.',
    checkpoint: { question: 'What does FlashAttention avoid?', options: ['Computing attention scores', 'Writing the full [T, T] score matrix to GPU memory', 'Using a causal mask', 'Scaling by sqrt(d_k)'], correct: 1, why: 'It tiles the computation and folds in an online softmax so the matrix is never materialized. The arithmetic result is unchanged.' }
  },
  7: {
    question: 'How does sliding window attention save anything?',
    plain: 'Instead of every token attending to all previous ones, each token attends only to a fixed number of recent positions. The score matrix becomes a band rather than a triangle, so cost and cache grow with window size instead of sequence length. The trade is explicit: information older than the window must be carried forward somehow.',
    goals: ['Describe the band structure and its cost', 'Explain how old information survives', 'State where the fixed window hurts'],
    concepts: [
      ['Fixed window', 'Attention restricted to the last w positions.', 'Each token sees only a local neighbourhood. Cost becomes linear in sequence length with a constant of w rather than quadratic in length.'],
      ['Information propagation', 'Older context moves forward hop by hop.', 'Position t can reach t−k only through intermediate positions. Depth determines effective reach, so distant information degrades as it is relayed.'],
      ['Cache savings', 'Only the window must be cached.', 'Past positions outside the window can be evicted, which bounds cache growth independent of total sequence length.'],
      ['Where it hurts', 'Global reasoning needs a global view.', 'Tasks needing a fact stated at the beginning and consulted at the end fail if no path preserves it. This is a real capability limit, not a tuning issue.']
    ],
    example: { title: 'Long-document task degrades with sliding window', steps: ['Test whether the answer depends on content older than the window.', 'Compare against full attention on identical inputs to isolate the cause.', 'Check whether intermediate layers propagate the needed information.', 'Consider a hybrid that attends globally at a few layers.'], takeaway: 'If the answer lives outside the window, no amount of tuning recovers it.' },
    views: [
      { name: 'Band versus triangle', note: 'What the pattern looks like.', steps: [['Full causal', 'Every token sees all past.'], ['Sliding window', 'Only the last w positions.'], ['Score matrix', 'A band, not a triangle.'], ['Cost', 'Linear in length, scaled by w.']] },
      { name: 'Carrying old information', note: 'Depth substitutes for reach.', steps: [['Fact early in context', 'Far from current position.'], ['Relayed forward', 'Through intermediate positions.'], ['Attenuates', 'Each hop loses fidelity.'], ['Failure', 'When the path is too long.']] }
    ],
    precision: 'Sliding window reduces compute and cache, but it does not preserve unlimited context. Effective reach is bounded by depth and relay quality.',
    engineering: 'Before adopting a locally-attentive model for long documents, test an input whose answer requires the very beginning of the context.',
    checkpoint: { question: 'What does sliding window attention change about memory?', options: ['Nothing', 'Only the window must be cached, so cache no longer grows with full sequence length', 'It eliminates the KV cache entirely', 'It doubles cache usage'], correct: 1, why: 'Positions outside the window can be evicted, bounding cache growth by window size rather than by total sequence length.' }
  },
  8: {
    question: 'What is an attention sink, and why do streaming models need one?',
    plain: 'Transformers reliably dump a large share of attention onto the first token, often regardless of its content. That "sink" acts as a place to put attention when nothing else is relevant. If you drop old tokens to save memory, you remove the sink and the model degrades — so streaming methods always keep a few initial tokens.',
    goals: ['Explain why attention concentrates on the first token', 'Describe what breaks when it is evicted', 'Explain sink preservation in streaming attention'],
    concepts: [
      ['Attention sink phenomenon', 'Mass concentrates on position zero.', 'Empirically, models allocate disproportionate attention to the first token, especially at later layers, independent of what that token means.'],
      ['Why it exists', 'A low-cost place to route unused attention.', 'Softmax must place all mass somewhere. When no position is relevant, dumping attention on a fixed token is a cheap way to satisfy normalization.'],
      ['Eviction breaks it', 'Removing the sink degrades output sharply.', 'Streaming schemes that drop old tokens and keep no sink produce noticeably worse text. The model loses the outlet its training relied on.'],
      ['Sink tokens retained', 'Keep a small initial window always.', 'Streaming methods such as StreamingLLM retain the first few tokens alongside a sliding recent window, bounding memory while preserving the sink.']
    ],
    example: { title: 'Streaming generation degrades over time', steps: ['Check whether early tokens are being evicted entirely.', 'Retain the first few positions regardless of the sliding window.', 'Compare output quality with and without sink retention.', 'Confirm memory is still bounded by window plus sink.'], takeaway: 'A handful of initial tokens is the cheapest fix for streaming degradation.' },
    views: [
      { name: 'Where attention goes', note: 'A persistent first-token sink.', steps: [['Softmax', 'Must place all probability mass.'], ['No clear target', 'Nothing in context is relevant.'], ['Sink', 'Mass lands on position zero.'], ['Result', 'A trained-in habit.']] },
      { name: 'Streaming with sinks', note: 'Bound memory without removing the sink.', steps: [['Keep first k tokens', 'The sink is always present.'], ['Sliding recent window', 'Tracks the newest context.'], ['Evict the middle', 'Old but non-sink tokens are dropped.'], ['Total', 'Fixed, independent of length.']] }
    ],
    precision: 'Attention sinks are an observed property of trained models, not a designed feature. Streaming methods must accommodate them rather than assume them away.',
    engineering: 'If a long-context optimization drops tokens without retaining early positions, test quality on long generations before adopting it.',
    checkpoint: { question: 'Why do streaming attention methods keep the first few tokens?', options: ['They are expensive to recompute', 'The model relies on them as an attention sink, and evicting it degrades output', 'They contain the system prompt', 'Position encoding requires them'], correct: 1, why: 'Models concentrate attention on early positions as an outlet. Removing that outlet breaks a pattern training established, so streaming schemes retain a small initial window.' }
  },
  9: {
    question: 'Why does KV cache need paging at all?',
    plain: 'A naive cache allocates one contiguous block per sequence sized to the maximum possible length. Most of it sits unused, and fragmentation prevents new sequences from fitting. PagedAttention splits the cache into fixed-size blocks like virtual memory pages, allocating them only as needed and sharing them across sequences.',
    goals: ['Explain fragmentation in contiguous allocation', 'Describe block-based allocation', 'State the benefits and the costs'],
    concepts: [
      ['Contiguous waste', 'Pre-allocating the maximum wastes most of it.', 'A sequence that might reach 4k tokens reserves space for 4k on the first step. Short sequences never use their reservation, and freed gaps cannot be reused.'],
      ['Fixed-size blocks', 'Allocate cache in uniform pages.', 'Blocks are allocated on demand as the sequence grows, so memory is consumed only by tokens actually generated.'],
      ['Shared blocks', 'Identical prefixes reuse one copy.', 'A shared system prompt produces identical early tokens. With block sharing, many sequences read the same blocks instead of holding private copies.'],
      ['Overhead of indirection', 'Block tables must be maintained.', 'A mapping from logical to physical positions is added at every access. The indirection costs a little computation to buy a large memory saving.']
    ],
    example: { title: 'GPU memory is fragmented and new requests are rejected', steps: ['Measure allocated versus actually used cache bytes.', 'Check whether sequences reserve their maximum length upfront.', 'Move to a paged or block-based allocator.', 'Enable prefix sharing if system prompts are repeated across requests.'], takeaway: 'Fragmentation, not total usage, is often why memory is unavailable.' },
    views: [
      { name: 'Contiguous allocation', note: 'Waste by reservation.', steps: [['Request arrives', 'Reserve maximum length.'], ['Generate', 'Use a fraction.'], ['Short sequence', 'Most reservation idle.'], ['Free gaps', 'Cannot satisfy new requests.']] },
      { name: 'Paged allocation', note: 'Demand-driven blocks.', steps: [['Block size fixed', 'Uniform pages.'], ['Allocate on demand', 'Only as tokens arrive.'], ['Share prefixes', 'Common prompt blocks reused.'], ['Reclaim', 'Blocks return to the pool.']] }
    ],
    precision: 'PagedAttention changes allocation, not the attention computation. The arithmetic over cached keys and values is unchanged.',
    engineering: 'Measure memory utilisation, not just memory use. Low utilisation with rejected requests is the signature of fragmentation.',
    checkpoint: { question: 'What is the main benefit of block-based KV allocation?', options: ['Fewer model parameters', 'Demand-driven allocation that avoids wasting reserved-but-unused memory', 'Faster attention arithmetic', 'Higher model accuracy'], correct: 1, why: 'Blocks are allocated as tokens actually arrive and shared across common prefixes, so memory tracks real usage rather than worst-case reservation.' }
  },
  10: {
    question: 'Where does long context actually cost you?',
    plain: 'Three places at once: attention compute grows quadratically, KV cache grows linearly and bounds batch size, and quality often degrades well before the limit. Optimizing only the arithmetic misses the real constraint, which is usually memory bandwidth during decode.',
    goals: ['Enumerate the cost dimensions of long context', 'Identify which binds first in practice', 'Relate cost to quality degradation'],
    concepts: [
      ['Compute grows quadratically', 'Attention comparisons scale with T².', 'More positions mean more pairs. FlashAttention hides the memory cost but not the arithmetic.'],
      ['Cache grows linearly', 'And it sets the batch size.', 'Longer sequences mean fewer concurrent requests in fixed memory, reducing throughput even where compute is sufficient.'],
      ['Quality degrades early', 'Usable length is shorter than stated length.', 'Recall weakens positionally and instruction adherence falls. Spending more on a window you cannot use reliably is wasted cost.'],
      ['Which binds first', 'Usually memory, then bandwidth.', 'In practice cache capacity or decode bandwidth limits before raw arithmetic does, so optimization targets memory traffic.']
    ],
    example: { title: 'Cost per request grows faster than expected with context', steps: ['Break cost into prefill compute, decode bandwidth, and cache footprint.', 'Check whether concurrency fell as sequences lengthened.', 'Compare quality at the longer length against a retrieval approach.', 'Reduce context if quality does not justify the cost.'], takeaway: 'Longer context costs memory and throughput even when compute is affordable.' },
    views: [
      { name: 'Three costs at once', note: 'They scale differently.', steps: [['Attention compute', 'Quadratic in length.'], ['KV cache', 'Linear, bounds batch.'], ['Quality', 'Degrades before the limit.'], ['Dominant', 'Memory or bandwidth, usually.']] },
      { name: 'Cost versus value', note: 'Spending more on unused window.', steps: [['Stated window', 'What the architecture accepts.'], ['Usable window', 'Where quality holds.'], ['Spend beyond it', 'Cost with no benefit.'], ['Alternative', 'Retrieve rather than widen.']] }
    ],
    precision: 'Quadratic attention cost is real but rarely the first constraint. Cache capacity and decode bandwidth usually bind earlier.',
    engineering: 'When a long-context request is expensive, ask whether the quality at that length justified the cost — measure both or you will only see one.',
    checkpoint: { question: 'Which cost of long context directly reduces throughput by limiting concurrent requests?', options: ['Attention arithmetic', 'KV cache memory consuming the batch budget', 'Tokenizer cost', 'Positional encoding computation'], correct: 1, why: 'Cache grows linearly with sequence length and shares fixed GPU memory, so longer sequences mean fewer concurrent sequences and lower throughput.' }
  },
  11: {
    question: 'What is inference-time compute, and when is it worth it?',
    plain: 'Instead of making the model bigger, spend more compute at answering time — generate intermediate steps, sample several candidates, verify and select. It buys accuracy on hard problems without retraining. The cost is latency and money per query, and gains do not transfer to tasks that were never hard.',
    goals: ['Describe what extra inference compute buys', 'Relate cost to task difficulty', 'Recognize when it does not help'],
    concepts: [
      ['Extra tokens of reasoning', 'Generate intermediate steps before answering.', 'A model allowed to produce reasoning tokens can decompose a problem. This spends compute proportional to problem difficulty.'],
      ['Search and verification', 'Sample multiple candidates and select.', 'Generating several answers and scoring them turns one attempt into a search. Verification quality determines whether selection helps at all.'],
      ['Cost is per-query', 'Latency and price scale with effort.', 'Long reasoning increases time-to-first-token and billed tokens. For easy queries this buys nothing and simply costs more.'],
      ['Difficulty-adaptive routing', 'Spend effort only where it pays.', 'The engineering answer is to route hard problems to an expensive path and keep cheap ones on a fast path, using a classifier or a confidence signal.']
    ],
    example: { title: 'Reasoning model makes the product too slow', steps: ['Stratify traffic by task difficulty and measure accuracy per tier.', 'Route easy queries to a fast path with no reasoning budget.', 'Cap reasoning tokens for the expensive path.', 'Track accuracy per unit cost, not accuracy alone.'], takeaway: 'Inference-time compute is a budget to allocate, not a switch to flip on globally.' },
    views: [
      { name: 'Where extra compute goes', note: 'Three ways to spend it.', steps: [['Reasoning tokens', 'Generate intermediate steps.'], ['Sample multiple', 'Produce several candidates.'], ['Verify and select', 'Score and choose.'], ['Cost', 'Latency and tokens per query.']] },
      { name: 'Adaptive spending', note: 'Effort should follow difficulty.', steps: [['Cheap path', 'Easy queries, no reasoning.'], ['Detect difficulty', 'Classifier or confidence.'], ['Expensive path', 'Reasoning budget for hard cases.'], ['Measure', 'Accuracy per unit cost.']] }
    ],
    precision: 'More inference tokens do not guarantee correct reasoning. They guarantee more computation, which helps only when the extra steps are productive.',
    engineering: 'Always report accuracy together with cost and latency per tier. A reasoning model that wins on accuracy and triples cost per query may lose overall.',
    checkpoint: { question: 'What is the main cost of spending more compute at inference?', options: ['Higher training cost', 'Higher per-query latency and token cost', 'Reduced model capacity', 'Larger KV cache for the same sequence'], correct: 1, why: 'The extra compute happens per query — more generated tokens means more latency and more billed tokens, regardless of whether the reasoning helped.' }
  },
  12: {
    question: 'What can you learn from Mixtral and DeepSeek as case studies?',
    plain: 'Both are useful because they isolate one design decision you can reason about. Mixtral shows a sparse MoE that keeps per-token cost modest while holding many parameters. DeepSeek variants show aggressive efficiency choices in attention and routing. Read them as engineering trade-offs, not as recipe lists.',
    goals: ['Extract a design trade-off from each case', 'Distinguish architecture from marketing claims', 'Evaluate a new architecture by the same questions'],
    concepts: [
      ['Mixtral’s MoE choice', 'Capacity without proportional compute.', 'A sparse mixture over feed-forward experts means active parameters per token stay modest while the model holds far more total capacity.'],
      ['Routing as the engineering problem', 'Balance, dropped tokens, and deployment.', 'The hard part of MoE is not the experts — it is keeping routing balanced and serving the sparse pattern efficiently.'],
      ['Efficiency as a design theme', 'Both families optimize cost per token.', 'Attention variants, cache handling, and active-parameter reduction recur because decode cost is the binding constraint in practice.'],
      ['Reading architectures critically', 'Ask what the change buys and costs.', 'For any architecture, ask what it reduces, what it complicates, and which workload would prefer the alternative.']
    ],
    example: { title: 'Evaluate a newly announced architecture', steps: ['Identify the single claim being made — cheaper, faster, or better.', 'Ask what it costs in memory, complexity, or quality elsewhere.', 'Find the workload where the trade is favourable.', 'Verify with measured numbers rather than announced ones.'], takeaway: 'Every architecture change is a trade. Find the trade, then decide if your workload wants it.' },
    views: [
      { name: 'Reading a case study', note: 'Four questions, any architecture.', steps: [['What does it reduce?', 'Compute, memory, latency, or data.'], ['What does it add?', 'Complexity, memory, or serving constraints.'], ['Which workload benefits?', 'Trade-offs are workload-specific.'], ['What is measured?', 'Versus what is claimed.']] },
      { name: 'Mixtral as MoE evidence', note: 'One isolated decision.', steps: [['Sparse experts', 'Feed-forward sparsified.'], ['Active parameters', 'Modest per token.'], ['Total parameters', 'Much larger.'], ['Hard part', 'Routing and serving.']] }
    ],
    precision: 'Architectural case studies are evidence about trade-offs, not proof that a design transfers to your workload.',
    engineering: 'When adopting a novel architecture, confirm serving support first. Novel patterns often lack the kernel and tooling maturity of the standard path.',
    checkpoint: { question: 'What makes Mixtral an instructive case study?', options: ['It is the largest model available', 'It isolates sparse MoE so capacity can grow while active compute per token stays modest', 'It uses no attention', 'It requires no KV cache'], correct: 1, why: 'The interesting variable is that total parameters rise while only a few experts run per token — capacity and cost are decoupled.' }
  },
  13: {
    question: 'What is a Recursive Language Model?',
    plain: 'A model that treats its own intermediate outputs as further input — allowing it to revise, extend, or critique what it just produced rather than emitting everything in one forward pass. The recursion is at the level of generation, not training, and it trades extra calls for a chance to correct itself.',
    goals: ['Describe recursion in generation rather than architecture', 'Compare it with single-pass generation', 'Identify when revision helps'],
    concepts: [
      ['Model as its own input', 'Outputs re-enter as prompts.', 'A generated intermediate step becomes part of the next call’s context, so the model can act on its own earlier reasoning.'],
      ['Revision versus commit', 'One shot versus iterated correction.', 'Single-pass generation commits at every token. Recursion allows a draft, an evaluation, and a revision before anything final is emitted.'],
      ['Cost in calls', 'Each recursion multiplies latency.', 'Every additional pass is a full forward call. The benefit must exceed the added latency and token cost.'],
      ['Error compounding risk', 'A wrong intermediate step propagates.', 'If the revision step trusts a faulty draft, recursion magnifies rather than corrects the error. Verification must be independent.']
    ],
    example: { title: 'Decide whether to add a revision loop', steps: ['Measure how often a single pass produces correctable errors.', 'Add a revision pass and measure improvement on those cases.', 'Compare improvement against added latency and cost.', 'Retain the loop only if net task success improves.'], takeaway: 'Revision earns its cost only when errors are common and detectable.' },
    views: [
      { name: 'Single pass', note: 'Commit at every token.', steps: [['Prompt', 'Given once.'], ['Generate', 'Emit forward, no revision.'], ['Commit', 'Each token fixed.'], ['Result', 'No self-correction.']] },
      { name: 'Recursive pass', note: 'Draft, evaluate, revise.', steps: [['Draft', 'Produce an intermediate output.'], ['Feed back', 'Output becomes new input.'], ['Evaluate', 'Assess the draft.'], ['Revise', 'Emit a corrected version.']] }
    ],
    precision: 'Recursion in generation is a system-level loop, not an architectural change to the Transformer itself.',
    engineering: 'Measure net task success, not intermediate quality. A revision loop that improves drafts but loses on latency-adjusted success is a regression.',
    checkpoint: { question: 'What does a recursive language model do with its own output?', options: ['Discards it', 'Feeds it back as input for a further pass', 'Stores it in the KV cache permanently', 'Trains on it immediately'], correct: 1, why: 'The defining property is that intermediate output re-enters as input, enabling revision rather than single-pass commitment.' }
  },
  14: {
    question: 'How does a diffusion language model differ from autoregressive generation?',
    plain: 'Autoregressive models emit tokens left to right, one at a time, each depending on all previous ones. Diffusion models start from noise and refine a whole sequence over several denoising steps, in parallel. It is a different generation paradigm — not a faster version of the same one.',
    goals: ['Contrast sequential emission with parallel refinement', 'Explain what each step costs', 'State where each approach is appropriate'],
    concepts: [
      ['Autoregressive generation', 'One token per step, left to right.', 'Each step depends on everything before it, which creates the serial dependency that sets decode latency.'],
      ['Diffusion over sequences', 'Refine a whole sequence from noise.', 'A complete sequence of tokens is progressively denoised over several steps, with many positions updated simultaneously in each step.'],
      ['Latency profile differs', 'Steps versus sequence length.', 'AR latency grows with output length. Diffusion latency grows with the number of denoising steps, which need not equal the output length.'],
      ['Different failure surface', 'Errors are corrected in parallel, not committed.', 'Because positions are revised together, an early mistake can be revised rather than baked in — but the process also needs a way to stop and decide.']
    ],
    example: { title: 'Compare the two for a latency-sensitive task', steps: ['Measure AR latency against required output length.', 'Measure diffusion latency against denoising step count.', 'Compare quality at matched latency budgets.', 'Choose on the workload shape, not on novelty.'], takeaway: 'The latency curves have different shapes; match yours to the task.' },
    views: [
      { name: 'Autoregressive', note: 'Serial by construction.', steps: [['Token 1', 'Generated.'], ['Token 2', 'Depends on token 1.'], ['Repeat', 'One at a time.'], ['Latency', 'Grows with length.']] },
      { name: 'Diffusion', note: 'Parallel refinement.', steps: [['Start from noise', 'A full sequence placeholder.'], ['Denoise', 'Refine many positions at once.'], ['Iterate', 'Several steps.'], ['Latency', 'Grows with step count.']] }
    ],
    precision: 'A diffusion language model changes the generation algorithm, not the training objective family. It is not simply a faster autoregressive model.',
    engineering: 'Compare on matched latency and quality budgets. Different scaling shapes mean the winner depends on output length.',
    checkpoint: { question: 'What is the fundamental difference in how tokens are produced?', options: ['Diffusion uses a larger vocabulary', 'Autoregressive emits sequentially; diffusion refines a whole sequence in parallel steps', 'Diffusion has no training phase', 'Autoregressive updates all positions simultaneously'], correct: 1, why: 'AR commits one token at a time with a serial dependency; diffusion starts from noise and denoises many positions together over several steps.' }
  }
};

export function getAdvancedGuide(id) {
  return advancedGuides[id];
}
