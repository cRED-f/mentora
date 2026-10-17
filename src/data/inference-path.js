/**
 * Beginner → engineering bridge for Mentora's sixteen Inference &
 * Infrastructure lessons. Diagrams are conceptual teaching illustrations,
 * not benchmarks. Keep interview A–F sections in courses.json as the next
 * stage of study.
 */
export const inferenceGuides = {
  1: {
    question: 'What is the difference between prefill and decode?',
    plain: 'Prefill runs once on your prompt and processes every token simultaneously. Decode runs repeatedly, producing one token at a time. Prefill is a big parallel matrix multiply; decode is a tiny one that must read the whole KV cache each time. They have opposite characteristics, which is why systems treat them differently.',
    goals: ['Describe what each phase computes', 'Explain why they have opposite profiles', 'Connect the split to measurement'],
    concepts: [
      ['Prefill', 'One parallel pass over the entire prompt.', 'All prompt positions are computed together because their content is already known. It populates the KV cache and determines time to first token.'],
      ['Decode', 'One sequential pass per generated token.', 'Only the new position needs computation, but it must read all cached keys and values. This repeats until generation stops.'],
      ['Opposite profiles', 'Parallel-heavy versus memory-heavy.', 'Prefill uses the GPU’s arithmetic throughput well; decode barely uses it and is dominated by memory reads. Optimizing one rarely helps the other.'],
      ['Both write the cache', 'Prefill writes, decode extends.', 'Prefill creates cache entries for the prompt; each decode step appends one. Cache growth is driven mostly by the prompt.']
    ],
    example: { title: 'A request feels slow even with a fast model', steps: ['Measure prefill and decode separately rather than end-to-end.', 'Check whether the prompt is large relative to the requested output.', 'If prefill dominates, reduce prompt size or chunk it.', 'If decode dominates, reduce output length or batch differently.'], takeaway: 'One latency number hides two workloads with opposite bottlenecks.' },
    views: [
      { name: 'Prefill phase', note: 'One parallel pass, compute-heavy.', steps: [['Prompt arrives', 'All tokens available.'], ['Process together', 'Full matrix operations.'], ['Write cache', 'Store keys and values.'], ['Emit first token', 'Ends time-to-first-token.']] },
      { name: 'Decode phase', note: 'One serial step at a time, bandwidth-heavy.', steps: [['New position', 'Compute only this token.'], ['Read cache', 'Entire history, every step.'], ['Sample', 'Choose one token.'], ['Repeat', 'Until a stop condition.']] }
    ],
    precision: 'Prefill and decode are not different models. They are two phases of one forward pass with very different hardware behaviour.',
    engineering: 'Instrument them separately. Every serving decision — batching, chunking, disaggregation — starts from which phase dominates your workload.',
    checkpoint: { question: 'What distinguishes prefill from decode?', options: ['Prefill generates output; decode processes the prompt', 'Prefill processes the prompt in parallel; decode generates one token per step', 'Prefill runs on the CPU and decode on the GPU', 'Decode is optional and prefill is not'], correct: 1, why: 'Prefill consumes the prompt in one parallel pass and fills the KV cache. Decode extends it one token at a time, reading the cache each step.' }
  },
  2: {
    question: 'Why is prefill compute-bound but decode bandwidth-bound?',
    plain: 'Prefill does a lot of arithmetic on data already in use — the GPU’s compute units are the limit. Decode does very little arithmetic per step, but must read the entire KV cache from memory to do it. The data movement, not the calculation, is the limit. This is the roofline distinction that governs serving.',
    goals: ['Explain arithmetic intensity and the roofline', 'Relate each phase to its limiting resource', 'Identify which optimizations help which phase'],
    concepts: [
      ['Arithmetic intensity', 'Flops per byte moved.', 'Prefill has high intensity: many operations per byte loaded. Decode has low intensity: few operations per byte, so memory sets the pace.'],
      ['Compute-bound', 'The arithmetic unit is the ceiling.', 'When a phase saturates the GPU’s flops, adding bandwidth does nothing. Prefill sits here.'],
      ['Bandwidth-bound', 'Data movement is the ceiling.', 'When a phase waits on memory, faster arithmetic does nothing. Decode sits here, reading cache for almost no computation.'],
      ['Why the split matters', 'Different phases need different fixes.', 'Batching helps decode amortize cache reads across sequences. It does little for prefill, which is already using compute well.']
    ],
    example: { title: 'GPU utilization is low during generation', steps: ['Check which phase dominates at that moment.', 'Low utilization during decode is expected — it is bandwidth-bound.', 'Measure achieved memory bandwidth against the hardware peak.', 'If bandwidth is saturated, batching is the lever; more flops will not help.'], takeaway: 'Low utilization during decode is normal, not a bug.' },
    views: [
      { name: 'Arithmetic intensity', note: 'Operations per byte moved.', steps: [['Prefill', 'High intensity: many flops per byte.'], ['Decode', 'Low intensity: few flops per byte.'], ['Roofline', 'Intensity decides the ceiling.'], ['Consequence', 'Different limits for each phase.']] },
      { name: 'What each phase needs', note: 'Optimizations do not transfer.', steps: [['Prefill', 'Needs arithmetic throughput.'], ['Decode', 'Needs memory bandwidth.'], ['Batching', 'Amortizes decode cache reads.'], ['Faster flops', 'Helps prefill, not decode.']] }
    ],
    precision: 'Decode is bandwidth-bound at batch size one. Batching can raise arithmetic intensity enough to shift the limit, which is why throughput scaling is non-linear.',
    engineering: 'Read your GPU’s achieved bandwidth during decode. If it is near peak, no software change will help — only batching or a smaller cache will.',
    checkpoint: { question: 'Why is decode typically bandwidth-bound?', options: ['It performs very little arithmetic but must read the whole KV cache each step', 'It runs on a slower GPU', 'It processes the entire prompt again', 'It uses single-precision weights'], correct: 1, why: 'Each decode step computes only one position yet reads every cached key and value, so data movement dominates over computation.' }
  },
  3: {
    question: 'What do TTFT and TPOT actually measure?',
    plain: 'Time to first token is everything before generation becomes visible — queueing, prefill, and the first decode step. Time per output token is the steady-state speed after that. They behave differently under load, so a single "latency" number tells you almost nothing about where time went.',
    goals: ['Decompose end-to-end latency', 'Explain what each metric reveals under load', 'Measure throughput alongside latency'],
    concepts: [
      ['Time to first token', 'Queue, prefill, and first decode.', 'A large prompt moves TTFT directly. Queueing under load can dominate it, which is a capacity signal rather than a model signal.'],
      ['Time per output token', 'Steady-state decode speed.', 'TPOT reflects batching and bandwidth. It is usually steadier than TTFT but degrades when concurrency rises.'],
      ['Throughput versus latency', 'They trade against each other.', 'Larger batches raise tokens per second while increasing per-request latency. Optimizing one typically costs the other.'],
      ['Percentiles matter', 'Averages hide the tail.', 'Report p50 and p95 for both metrics. The tail is where queueing and long prompts show up and where users actually complain.']
    ],
    example: { title: 'Users report slowness but average latency looks fine', steps: ['Split p95 TTFT and p95 TPOT rather than reading the mean.', 'Correlate TTFT spikes with prompt length and concurrency.', 'Check whether batch size grew during the spikes.', 'Fix the phase that the tail is actually showing.'], takeaway: 'Averages will not tell you which phase is failing; percentiles will.' },
    views: [
      { name: 'Decomposing latency', note: 'Each segment has its own cause.', steps: [['Queue wait', 'Capacity signal.'], ['Prefill', 'Prompt length signal.'], ['First decode', 'Transition point.'], ['Steady decode', 'TPOT begins here.']] },
      { name: 'Throughput versus latency', note: 'The central serving trade.', steps: [['Small batch', 'Low latency, low throughput.'], ['Large batch', 'High throughput, higher latency.'], ['Tune to SLO', 'Latency bound, maximize throughput.'], ['Measure p95', 'Not the mean.']] }
    ],
    precision: 'TTFT includes queueing. A rising TTFT under load may say nothing about the model and everything about saturation.',
    engineering: 'Set separate SLOs for TTFT and TPOT. A single latency target lets one phase hide behind the other.',
    checkpoint: { question: 'What does time to first token include?', options: ['Only the model forward pass', 'Queueing, prompt prefill, and the first decode step', 'Only the sampling step', 'Network transfer after the response is complete'], correct: 1, why: 'It spans everything before the user sees output — waiting for capacity, processing the prompt, and producing the first token.' }
  },
  4: {
    question: 'Why is the first token slower than the rest?',
    plain: 'Because the whole prompt has to be processed before anything can be produced. The first token waits for prefill of every input token, while each later token only needs one cheap decode step. Add queueing when the system is busy, and the asymmetry becomes very large.',
    goals: ['Explain why prefill precedes the first token', 'Describe queueing contribution', 'Identify what can reduce perceived wait'],
    concepts: [
      ['Prompt must complete first', 'Generation cannot start early.', 'The next-token distribution requires the final prompt position’s hidden state, which requires the entire prompt to have been processed.'],
      ['Prefill cost grows with prompt', 'Long inputs directly delay first token.', 'A prompt several times longer than the eventual answer pushes TTFT up while TPOT stays flat — a distinctive signature.'],
      ['Queueing adds to the wait', 'Especially under load.', 'If no capacity is free, the request waits before prefill even begins. Under saturation this dominates the entire TTFT.'],
      ['Streaming is perception, not speed', 'Chunking changes how waiting feels.', 'Streaming tokens as they arrive makes a long total response feel faster, but does not reduce TTFT itself.']
    ],
    example: { title: 'Users complain the app hangs before answering', steps: ['Measure prompt length distribution against TTFT.', 'Separate queue time from prefill time.', 'Chunk long prefill or reduce prompt size if prefill dominates.', 'If queueing dominates, the fix is capacity, not prompt engineering.'], takeaway: 'Slow first token with normal steady speed means prefill or queueing, not the model.' },
    views: [
      { name: 'Why first is slower', note: 'One-time costs before generation.', steps: [['Queue', 'Wait for capacity.'], ['Prefill', 'Process every prompt token.'], ['First decode', 'Produce token one.'], ['Steady state', 'Subsequent steps are cheap.']] },
      { name: 'Signature by cause', note: 'Where the time is tells you what to fix.', steps: [['Long prompt', 'Prefill dominates.'], ['High load', 'Queueing dominates.'], ['Fix prompt', 'Reduce prompt size.'], ['Fix capacity', 'Add instances.']] }
    ],
    precision: 'Streaming reduces perceived latency, not actual TTFT. The first token still waits for the same prefill work.',
    engineering: 'When TTFT is the complaint, first check prompt length and queue time before touching model or decoding settings.',
    checkpoint: { question: 'Why must prefill finish before the first token appears?', options: ['The tokenizer processes tokens serially', 'The next-token distribution depends on the final prompt position, which requires the whole prompt', 'The model must load from disk', 'Sampling is performed before the forward pass'], correct: 1, why: 'The distribution for position t depends on the hidden state at the last prompt position, which only exists after every prompt token has been processed.' }
  },
  5: {
    question: 'How does KV caching make decode incremental?',
    plain: 'Prefill computes and stores keys and values for every prompt position. Each decode step computes only the new position, reads the cached entries for attention, and appends one new entry. Without re-reading everything from the model, each step stays roughly constant in work instead of growing with history.',
    goals: ['Describe what decode reads and writes', 'Explain why cache placement matters', 'Connect caching to bandwidth limits'],
    concepts: [
      ['Write at prefill, read at decode', 'One pass stores, later passes reuse.', 'The prompt’s keys and values are computed once. Every subsequent step appends a single row and reads the whole structure.'],
      ['Constant work per step', 'Relative to recomputing the prefix.', 'Each decode step costs roughly the same regardless of history length, which is what makes generation practical at all.'],
      ['Cache placement matters', 'It must sit in fast memory.', 'Cache lives in GPU high-bandwidth memory because decode reads it every step. Placing it in slower storage would negate the benefit entirely.'],
      ['The cost that remains', 'Reading it is still expensive.', 'The step is cheap in arithmetic but reads a lot of data, which is precisely why decode ends up bandwidth-bound.']
    ],
    example: { title: 'Decode speed falls as generation lengthens', steps: ['Measure cache bytes against sequence length.', 'Confirm the cache is resident in GPU memory, not host memory.', 'Check whether batch growth is increasing total reads per step.', 'Consider GQA or eviction if cache is the binding constraint.'], takeaway: 'Caching removes recomputation but not the read — the read is what decode pays for.' },
    views: [
      { name: 'Prefill writes', note: 'Compute once, store once.', steps: [['Prompt positions', 'All processed together.'], ['K and V per layer', 'Computed for each position.'], ['Stored', 'Written into GPU memory.'], ['Ready', 'For every later step.']] },
      { name: 'Decode reads and appends', note: 'Incremental by construction.', steps: [['New token', 'Only this is computed.'], ['Read cache', 'Full history for attention.'], ['Append one row', 'Cache grows by one.'], ['Sample', 'Repeat.']] }
    ],
    precision: 'The KV cache stores attention inputs, not intermediate activations of the whole model. Only keys and values are retained across steps.',
    engineering: 'Cache placement decides performance. Verify residency in device memory — a cache spilling to host memory destroys decode throughput.',
    checkpoint: { question: 'What does each decode step compute?', options: ['The entire sequence from embeddings', 'Only the new position, reusing cached keys and values for attention', 'A fresh KV cache each step', 'Nothing; decode is a lookup table'], correct: 1, why: 'Prior keys and values come from the cache, so only the new position requires a forward computation. Recomputing the prefix would make decode quadratic.' }
  },
  6: {
    question: 'What lives in GPU memory during inference, and what runs out first?',
    plain: 'Four things: model weights that never move, the KV cache that grows with every sequence, activations and workspace for the current computation, and small runtime overheads. Weights are fixed once you pick a model. The cache is what grows until the batch stops fitting — so it usually runs out first.',
    goals: ['Enumerate GPU memory consumers', 'Predict which grows with workload', 'Budget memory before deploying'],
    concepts: [
      ['Weights', 'Fixed cost, set by model and precision.', 'Larger models and higher precision mean more resident memory. This is the floor you must clear before serving a single request.'],
      ['KV cache', 'Grows with sequences and concurrency.', 'The dominant variable cost. Every active sequence holds its own cache, so it scales with both length and batch size.'],
      ['Activations and workspace', 'Temporary buffers for the current computation.', 'Peak workspace can be substantial during prefill with long prompts, and must fit alongside everything else.'],
      ['The budget equation', 'Weights + cache + workspace + overhead ≤ total.', 'If weights alone consume most of memory, no batch size will be efficient. This single line determines viability before deployment.']
    ],
    example: { title: 'Cannot reach target concurrency on the chosen GPU', steps: ['Compute weights at the deployed precision.', 'Compute cache per sequence at target length.', 'Solve for sequences that fit after reserving workspace.', 'If the number is too low, reduce precision, KV heads, or model size.'], takeaway: 'Do this arithmetic before choosing hardware, not after the first OOM.' },
    views: [
      { name: 'Memory consumers', note: 'Fixed, growing, and temporary.', steps: [['Weights', 'Fixed by model and precision.'], ['KV cache', 'Grows with length and batch.'], ['Workspace', 'Peak during computation.'], ['Overhead', 'Allocator and runtime.']] },
      { name: 'What runs out first', note: 'Almost always the cache.', steps: [['Weights clear', 'Resident before serving.'], ['Cache grows', 'With each added sequence.'], ['Workspace needs room', 'Must still fit.'], ['Result', 'Cache growth sets the batch.']] }
    ],
    precision: 'GPU memory is a single shared budget. Growth in any one consumer directly reduces what is available to the others.',
    engineering: 'Record peak memory by consumer in production. Total utilisation alone will not tell you which one to reduce.',
    checkpoint: { question: 'Which consumer grows with the number of concurrent sequences?', options: ['Model weights', 'The KV cache', 'The tokenizer', 'The compiled kernels'], correct: 1, why: 'Each active sequence holds its own cache, so adding sequences adds cache linearly. Weights are fixed regardless of concurrency.' }
  },
  7: {
    question: 'What does quantization actually trade?',
    plain: 'Quantization stores each number in fewer bits — FP16 instead of FP32, INT8 or INT4 instead of floating point. It cuts memory roughly in proportion to bit width, which matters twice: smaller weights and a smaller KV cache. The cost is precision, which can hurt quality in ways that depend on the model and the method.',
    goals: ['Compare numeric formats by size and range', 'Explain where quantization helps most', 'Describe how quality loss is measured'],
    concepts: [
      ['Bit width is the lever', 'Halving bits halves the storage.', 'FP32 to FP16 halves memory; INT4 is roughly a quarter of FP32. For both weights and cache, this translates directly into batch capacity.'],
      ['Range versus precision', 'Formats differ in representable span.', 'Floating point carries an exponent for wide range; integers need a scale factor to map a narrow fixed range. Choosing the scale is the central problem.'],
      ['Weights versus activations', 'Different sensitivity.', 'Weights are static and can be calibrated offline. Activations vary per input and are harder, which is why weight-only quantization is common.'],
      ['Quality must be measured', 'Bit reduction does not predict task loss.', 'Perplexity may barely move while a specific downstream task degrades. Evaluation on the actual task is required.']
    ],
    example: { title: 'Model does not fit comfortably on one GPU', steps: ['Compute current weights at deployed precision.', 'Estimate the saving at INT8 and INT4.', 'Confirm the runtime supports the format with efficient kernels.', 'Evaluate on your real task set before and after — not perplexity alone.'], takeaway: 'Quantization is the cheapest memory win available, and the only one needing a quality re-check.' },
    views: [
      { name: 'Format comparison', note: 'Bits, range, and accuracy.', steps: [['FP32', 'Baseline precision.'], ['FP16 / BF16', 'Half the size, standard for inference.'], ['INT8', 'Roughly a quarter; usually fine.'], ['INT4', 'Smallest; quality needs checking.']] },
      { name: 'What it buys', note: 'Memory on both sides.', steps: [['Weights shrink', 'Lower resident footprint.'], ['KV cache shrinks', 'More sequences fit.'], ['Batch rises', 'Throughput improves.'], ['Cost', 'Precision, and therefore quality.']] }
    ],
    precision: 'Quantization reduces storage precision. It does not change the algorithm, but it can change outputs enough to matter for a specific task.',
    engineering: 'Evaluate quantized models on your own held-out set with task-level metrics. Aggregate perplexity routinely hides real regressions.',
    checkpoint: { question: 'What does quantization primarily reduce?', options: ['The number of layers', 'The bits per stored number, cutting weight and cache memory', 'Sequence length limits', 'The number of attention heads'], correct: 1, why: 'Storing values in fewer bits shrinks both weights and KV cache, directly increasing how much fits in fixed memory.' }
  },
  8: {
    question: 'What is the difference between post-training and quantization-aware training?',
    plain: 'Post-training quantization converts a finished model — cheap, fast, no retraining, but quality can drop. Quantization-aware training simulates low precision during training so the weights learn to tolerate it — expensive, much like a fine-tune, but generally preserves quality better.',
    goals: ['Compare cost and quality of both methods', 'Explain why simulation during training helps', 'Choose by available budget and tolerance'],
    concepts: [
      ['Post-training quantization', 'Convert after training completes.', 'Weights are clipped and scaled into the target format using a calibration set. Hours instead of weeks, with quality that depends heavily on the model and bit width.'],
      ['Calibration', 'Choosing the scale from representative data.', 'A small sample determines how the numeric range maps. Unrepresentative calibration data produces systematic clipping and quality loss.'],
      ['Quantization-aware training', 'Simulate low precision inside training.', 'Forward passes fake-quantize activations and weights, so gradients account for rounding. The model adapts to the precision it will run at.'],
      ['The cost asymmetry', 'QAT is a training run.', 'It requires data, compute, and expertise comparable to fine-tuning. It is justified only where PTQ quality is insufficient.']
    ],
    example: { title: 'INT8 PTQ degrades a critical task', steps: ['Verify the calibration set represents production inputs.', 'Try a different calibration sample or a per-channel scheme.', 'If quality still misses the bar, plan a quantization-aware run.', 'Re-evaluate the full task set after any change.'], takeaway: 'Fix calibration first — it is cheap. QAT is the escalation, not the opening move.' },
    views: [
      { name: 'Post-training', note: 'Convert, calibrate, evaluate.', steps: [['Trained model', 'Untouched weights.'], ['Calibration set', 'Representative inputs.'], ['Compute scales', 'Map range to target format.'], ['Evaluate', 'Task-level check.']] },
      { name: 'Quantization-aware', note: 'Adapt during training.', steps: [['Insert fake quant', 'Simulate rounding.'], ['Train', 'Gradients account for it.'], ['Weights adapt', 'To the deployed precision.'], ['Export', 'Real low-precision weights.']] }
    ],
    precision: 'Post-training quantization does not change training. It maps an existing model into a lower-precision format using a calibration sample.',
    engineering: 'Always start with PTQ and a representative calibration set. Escalate to QAT only when measured quality still fails the requirement.',
    checkpoint: { question: 'What is the main advantage of quantization-aware training over PTQ?', options: ['It is much faster', 'The model adapts during training to the precision it will run at, usually preserving quality better', 'It requires no calibration data', 'It produces a larger model'], correct: 1, why: 'Simulating quantization in training lets gradients account for rounding, so the weights learn to remain accurate at low precision instead of being converted after the fact.' }
  },
  9: {
    question: 'Why is continuous batching better than waiting for a batch to finish?',
    plain: 'Static batching holds every request until the slowest one completes, so short requests idle behind long ones. Continuous batching lets a sequence leave the batch the moment it stops and admits a new one immediately. The GPU stays busy and throughput rises without changing a single model weight.',
    goals: ['Explain the stall problem in static batching', 'Describe how sequences join and leave mid-flight', 'Connect batching to tail latency'],
    concepts: [
      ['Static batching stalls', 'Everyone waits for the longest sequence.', 'A batch runs in lockstep, so a short request finishes early and holds a slot while others keep generating. Wasted capacity on every batch.'],
      ['Iteration-level scheduling', 'Decide admission at every decode step.', 'The scheduler re-evaluates the batch each step, admitting waiting requests and releasing finished ones without waiting for a full round.'],
      ['Throughput improves, latency varies', 'The trade is per-request waiting time.', 'Higher utilization means more requests in flight, which can raise individual latency even as total throughput climbs.'],
      ['Tail behaviour improves too', 'No slot held by a finished request.', 'Removing the lockstep constraint reduces the artificial waiting that static batching imposes on short requests.']
    ],
    example: { title: 'Throughput is low despite ample arrival rate', steps: ['Check whether batches wait for all sequences to finish.', 'Measure slot utilization — finished-but-resident sequences are the waste.', 'Enable iteration-level or continuous batching in the engine.', 'Re-measure throughput and p95 together.'], takeaway: 'Idle slots in a full batch are the cheapest throughput to recover.' },
    views: [
      { name: 'Static batching', note: 'Lockstep to completion.', steps: [['Assemble batch', 'Fixed group of requests.'], ['Step together', 'All sequences advance.'], ['Short request finishes', 'Slot sits idle.'], ['Wait', 'Until the longest ends.']] },
      { name: 'Continuous batching', note: 'Admission at every step.', steps: [['Decode step', 'All active sequences advance.'], ['Release', 'Finished sequences leave.'], ['Admit', 'Waiting requests enter.'], ['Repeat', 'Batch composition changes continuously.']] }
    ],
    precision: 'Continuous batching raises throughput by raising utilization. It does not make any individual sequence compute faster.',
    engineering: 'Measure tokens per second per GPU alongside p95 latency. Optimizing only one will mislead you about whether batching helped.',
    checkpoint: { question: 'What does continuous batching change?', options: ['The model architecture', 'The batch composition can change at every decode step rather than waiting for the whole batch to finish', 'The numeric precision used', 'The tokenizer behaviour'], correct: 1, why: 'Static batching holds sequences until the slowest completes. Iteration-level scheduling admits and releases sequences per step, eliminating idle slots.' }
  },
  10: {
    question: 'What do chunked prefill and prefill-decode disaggregation solve?',
    plain: 'A long prompt in one batch stalls every decode already running — prefill saturates compute while decode waits for bandwidth. Chunked prefill splits the prompt into pieces so decode keeps moving between them. Disaggregation goes further and runs prefill and decode on separate hardware, because their resource needs are opposite.',
    goals: ['Explain interference between phases', 'Describe chunking as a scheduling fix', 'Explain when separation of hardware is warranted'],
    concepts: [
      ['Cross-phase interference', 'Prefill in a batch stalls decode.', 'A large prefill occupies the GPU with arithmetic, delaying decode steps that were waiting on memory. Latency spikes for every in-flight request.'],
      ['Chunked prefill', 'Split the prompt into manageable pieces.', 'Processing a prompt in chunks interleaves with decode, keeping time per output token smoother at the cost of slightly longer total prefill.'],
      ['Disaggregation', 'Separate hardware per phase.', 'Prefill nodes and decode nodes are sized for their own bottleneck. Utilization rises because each runs its workload without contention.'],
      ['Cost of separation', 'Two pools to operate.', 'More hardware, orchestration, and transfer of cache between phases. It earns its complexity only at scale.']
    ],
    example: { title: 'TPOT spikes whenever one long prompt arrives', steps: ['Correlate TPOT spikes with prompt lengths arriving at the same time.', 'Enable chunked prefill and re-measure the spike.', 'If spikes persist at scale, evaluate phase separation.', 'Balance chunk size against added prefill latency.'], takeaway: 'One long prompt should not stall everyone else’s stream.' },
    views: [
      { name: 'Interference', note: 'The problem chunking addresses.', steps: [['Decode running', 'Waiting on memory bandwidth.'], ['Large prefill arrives', 'Saturates compute.'], ['Decode starves', 'TPOT spikes.'], ['Everyone sees it', 'Tail latency rises.']] },
      { name: 'Chunked prefill', note: 'Interleave instead of blocking.', steps: [['Split prompt', 'Into fixed-size chunks.'], ['Mix with decode', 'Alternate work each step.'], ['Smoother TPOT', 'No long stall.'], ['Cost', 'Slightly longer prefill.']] }
    ],
    precision: 'Chunked prefill changes scheduling, not total prefill work. It trades a small amount of prefill latency for much smoother decode latency.',
    engineering: 'If TPOT spikes correlate with long prompt arrivals, the fix is scheduling — not more GPUs.',
    checkpoint: { question: 'Why does a long prefill hurt other requests?', options: ['It changes model weights', 'It occupies the GPU with compute-bound work while concurrent decode steps wait on memory bandwidth', 'It invalidates the KV cache', 'It increases vocabulary size'], correct: 1, why: 'The phases compete for the same device. Prefill’s arithmetic saturates the GPU, starving bandwidth-bound decode steps and raising their latency.' }
  },
  11: {
    question: 'How does speculative decoding make generation faster?',
    plain: 'A cheap model drafts several tokens at once, then the expensive model verifies them all in one forward pass. Tokens the big model would have produced anyway are accepted; the rest are discarded and resampled. The output distribution is unchanged — you get the same result with fewer expensive passes.',
    goals: ['Describe draft and verify', 'Explain why output is preserved', 'Relate speedup to acceptance rate'],
    concepts: [
      ['Draft cheaply', 'A smaller or faster mechanism proposes tokens.', 'A small model, a specialised head, or even a simple n-gram scheme produces candidate tokens at low cost.'],
      ['Verify in parallel', 'One expensive pass checks many candidates.', 'The target model scores the whole draft in a single forward pass, since the draft supplies the full sequence to check.'],
      ['Distribution preserved', 'Rejection sampling keeps correctness.', 'When verification rejects a token, resampling from the corrected distribution ensures the result matches ordinary sampling. Speed is gained without changing output.'],
      ['Acceptance rate decides the win', 'Low acceptance means wasted draft work.', 'If the drafter rarely matches the target, verification overhead buys little. Measuring acceptance is the first diagnostic.']
    ],
    example: { title: 'Speculative decoding gives no speedup', steps: ['Measure draft acceptance rate on your traffic.', 'If it is low, the drafter is a poor match for the target.', 'Try a drafter trained on the same distribution or a longer draft.', 'Compare tokens per second including draft cost, not verification alone.'], takeaway: 'Acceptance rate is the metric; everything else follows from it.' },
    views: [
      { name: 'Draft and verify', note: 'The core loop.', steps: [['Draft several', 'Cheap model proposes k tokens.'], ['Verify once', 'Target scores all k in one pass.'], ['Accept prefix', 'Tokens the target agrees with.'], ['Resample', 'From the first mismatch.']] },
      { name: 'Where speedup comes from', note: 'Fewer expensive passes.', steps: [['Without', 'One target pass per token.'], ['With', 'One target pass covers many.'], ['Acceptance', 'High means many tokens per pass.'], ['Low acceptance', 'Draft cost with little gain.']] }
    ],
    precision: 'Speculative decoding does not change the output distribution when implemented with proper rejection sampling. It changes how many expensive passes are needed.',
    engineering: 'Instrument acceptance rate per traffic type. It degrades on out-of-domain prompts, and that is where the speedup silently disappears.',
    checkpoint: { question: 'What determines whether speculative decoding pays off?', options: ['The size of the draft model alone', 'How often the target model accepts drafted tokens', 'The number of attention heads', 'The quantization format used'], correct: 1, why: 'Verification passes are only cheap if they accept many tokens. Low acceptance means the drafter’s cost is spent with little returned.' }
  },
  12: {
    question: 'When do you need tensor, pipeline, or data parallelism?',
    plain: 'Data parallelism replicates the model and splits the batch — it trains, and can serve, with independent replicas. Tensor parallelism splits individual layer computations across GPUs, needed when one layer will not fit on one device. Pipeline parallelism splits by layer, which suits training more than low-latency serving. Different problems, different tools.',
    goals: ['Match parallelism strategy to the constraint', 'Explain communication cost of each', 'Identify what serving usually needs'],
    concepts: [
      ['Data parallelism', 'Replicate the model, split the workload.', 'Each replica handles independent requests or samples. Communication is only gradient averaging, so it scales cleanly but does not help if one copy will not fit.'],
      ['Tensor parallelism', 'Split one layer across devices.', 'Matrix multiplications are divided so a single layer fits. Communication happens every layer, so it requires fast interconnects and adds latency.'],
      ['Pipeline parallelism', 'Different layers on different devices.', 'Sequential by nature, so devices idle while a stage waits. Effective in training with microbatching; awkward for single-request latency.'],
      ['Serving usually needs replication first', 'Add copies before splitting a model.', 'Independent replicas scale throughput with minimal communication. Only split a single model when it cannot fit otherwise.']
    ],
    example: { title: 'Model does not fit on one GPU', steps: ['Confirm it is genuinely a fit problem, not a memory leak.', 'Try lower precision before splitting across devices.', 'If still too large, use tensor parallelism within a node.', 'Add data parallel replicas across nodes for throughput.'], takeaway: 'Fit the model first, then replicate for scale.' },
    views: [
      { name: 'The three strategies', note: 'Different axes of splitting.', steps: [['Data', 'Replicate model; split batch.'], ['Tensor', 'Split one layer.'], ['Pipeline', 'Split across layers.'], ['Communication', 'Rises right to left.']] },
      { name: 'Serving guidance', note: 'Choose by constraint.', steps: [['Fits on one GPU', 'Replicate.'], ['Does not fit', 'Tensor parallel within node.'], ['Very large', 'Add pipeline stages.'], ['Latency sensitive', 'Avoid pipeline.']] }
    ],
    precision: 'Parallelism reduces the memory each device holds but adds communication. Every strategy trades bandwidth for capacity.',
    engineering: 'Do not reach for tensor parallelism to increase throughput — replication does that with far less communication. Split only when the model will not fit.',
    checkpoint: { question: 'Which strategy should you try first to increase serving throughput?', options: ['Tensor parallelism', 'Data parallelism — independent replicas', 'Pipeline parallelism', 'Increasing sequence length'], correct: 1, why: 'Replicas scale throughput with only minimal communication and no added per-request latency. Splitting a single model is only needed when it cannot fit alone.' }
  },
  13: {
    question: 'How do you choose between serving frameworks?',
    plain: 'They differ in where they focus: some on high-throughput batching and paging, some on low-latency serving, some on maximal portability to a laptop. Choose by constraint — the hardware you have, the model size, the latency you must meet, and the operational surface you want to own.',
    goals: ['Identify what each family optimizes for', 'Match a framework to a deployment constraint', 'Recognize that portability and throughput trade off'],
    concepts: [
      ['Throughput-oriented engines', 'Continuous batching and paged cache at scale.', 'Built for many concurrent requests on datacenter GPUs, with scheduling and memory management as the core value.'],
      ['Portability-first runtimes', 'Run anywhere with modest setup.', 'Desktop and edge-friendly runtimes optimize for compatibility and minimal dependencies rather than maximal concurrency.'],
      ['Vendor-optimized stacks', 'Best performance on specific hardware.', 'Compiled kernels and graph optimization can win substantially on their target platform, at the cost of flexibility.'],
      ['The real constraint', 'Your hardware and operational tolerance.', 'A framework that needs specialized hardware you do not have is not faster in practice. Operational complexity counts as cost.']
    ],
    example: { title: 'Choosing a serving stack for a new deployment', steps: ['List hard constraints: model size, hardware, concurrency, latency SLO.', 'Shortlist frameworks that support your model and hardware.', 'Benchmark with your own prompts and concurrency distribution.', 'Include operational cost — configuration, upgrades, debugging.'], takeaway: 'Benchmark on your traffic; published throughput numbers rarely transfer.' },
    views: [
      { name: 'Focus areas', note: 'What each family optimizes.', steps: [['Throughput engines', 'Batching and cache management.'], ['Portable runtimes', 'Compatibility and low setup cost.'], ['Vendor stacks', 'Performance on target hardware.'], ['Choose', 'By constraint, not by popularity.']] },
      { name: 'Selection criteria', note: 'The questions that matter.', steps: [['Model support', 'Does it run your architecture?'], ['Hardware', 'Does it fit your devices?'], ['Latency', 'Can it meet your SLO?'], ['Operations', 'Can you run it?']] }
    ],
    precision: 'Framework benchmarks are hardware-, model-, and workload-specific. A published advantage may not exist in your configuration.',
    engineering: 'Benchmark with your own prompt-length and concurrency distribution. Synthetic benchmarks at one point hide the behaviour you will actually see.',
    checkpoint: { question: 'What should most influence your serving framework choice?', options: ['Which has the most GitHub stars', 'Your hardware, model, latency requirements, and operational tolerance', 'The programming language it is written in', 'Whether it supports training'], correct: 1, why: 'Each framework optimizes for different constraints. The right choice follows from what you must run on, and how you must run it.' }
  },
  14: {
    question: 'What does roofline profiling tell you that utilization does not?',
    plain: 'GPU utilization says the device is busy; it does not say whether it is doing arithmetic or waiting on memory. A roofline compares achieved flops and achieved bandwidth against the hardware ceilings, and shows which one you are actually hitting. That tells you which optimization could possibly help.',
    goals: ['Read a roofline', 'Distinguish busy from efficient', 'Choose the right optimization from the bottleneck'],
    concepts: [
      ['Two ceilings', 'Peak flops and peak bandwidth.', 'Hardware fixes both. A workload’s arithmetic intensity decides which ceiling it will hit first.'],
      ['The roofline curve', 'Intensity maps to attainable performance.', 'Low intensity lands on the bandwidth slope; high intensity lands on the compute plateau. Your position on that curve is the diagnosis.'],
      ['Utilization misleads', 'Busy is not efficient.', 'A device can show high utilization while mostly stalling on memory. Utilization alone cannot distinguish useful work from waiting.'],
      ['Diagnosis drives the fix', 'Different bottlenecks, different solutions.', 'Bandwidth-bound work needs smaller or fewer reads — batching, quantization, cache reduction. Compute-bound work needs fewer operations or more hardware.']
    ],
    example: { title: 'Adding GPUs did not improve latency', steps: ['Measure achieved flops and bandwidth against hardware peaks.', 'Determine which ceiling the workload actually approaches.', 'If bandwidth-bound, check cache reads and batch size.', 'If compute-bound, examine model size and sequence length.'], takeaway: 'Do not add hardware until you know which resource is exhausted.' },
    views: [
      { name: 'Reading a roofline', note: 'Where your workload sits.', steps: [['Compute ceiling', 'Horizontal limit in flops.'], ['Bandwidth slope', 'Rises with intensity.'], ['Your point', 'Achieved performance.'], ['Diagnosis', 'Slope means bandwidth-bound.']] },
      { name: 'From diagnosis to fix', note: 'The bottleneck picks the optimization.', steps: [['Bandwidth-bound', 'Batch, quantize, shrink cache.'], ['Compute-bound', 'Reduce work or add devices.'], ['Neither saturated', 'Scheduling or framework issue.'], ['Verify', 'Re-measure after the change.']] }
    ],
    precision: 'Peak hardware numbers are theoretical. Compare against achievable peaks for your precision and kernel set, or the conclusion will be wrong.',
    engineering: 'A roofline converts "the GPU is slow" into a specific resource to attack. Utilization alone never does that.',
    checkpoint: { question: 'What does a roofline reveal that GPU utilization does not?', options: ['Whether the GPU is running at all', 'Whether the workload is limited by compute or by memory bandwidth', 'The cost of the deployment', 'How many requests are queued'], correct: 1, why: 'Utilization only reports that the device is busy. A roofline compares achieved flops and bandwidth against ceilings, identifying which resource is actually binding.' }
  },
  15: {
    question: 'When does self-hosting beat a managed API?',
    plain: 'Usually at sustained high volume, or when data cannot leave your infrastructure. Below that, a managed API wins on time to market, operations, and the fact that someone else owns the failures. The crossover depends on utilization — idle GPUs are expensive, and low utilization makes self-hosting strictly worse.',
    goals: ['Identify the real crossover conditions', 'Account for operational cost honestly', 'Recognize non-economic reasons to self-host'],
    concepts: [
      ['Utilization drives economics', 'Idle capacity costs the same either way.', 'Self-hosting pays for GPUs whether requests arrive or not. Managed pricing scales with use, so it wins at low or bursty volume.'],
      ['Operational surface', 'You own serving, upgrades, and failures.', 'On-call, patching, capacity planning, and observability are real costs usually excluded from naive per-token comparisons.'],
      ['Data and compliance reasons', 'Sometimes not an economic decision at all.', 'Requirements about where data lives, retention, or auditability can mandate self-hosting regardless of cost.'],
      ['Portability of workload', 'Your prompts are not tied to one vendor.', 'Evaluating vendor change as a project — not a URL swap — is part of the decision. Multi-model routing reduces lock-in risk.']
    ],
    example: { title: 'Compare self-hosting against a managed API', steps: ['Measure actual monthly token volume and its burstiness.', 'Model GPU cost at realistic utilization, not peak.', 'Add engineering and operational hours at a real rate.', 'Only then compare against the managed bill.'], takeaway: 'Model at realistic utilization. Peak-load math always favors self-hosting wrongly.' },
    views: [
      { name: 'Economic factors', note: 'Where each option wins.', steps: [['Low volume', 'Managed wins; no idle cost.'], ['Sustained high volume', 'Self-hosting can win.'], ['Bursty traffic', 'Managed absorbs the peaks.'], ['Crossover', 'Set by utilization.']] },
      { name: 'Non-economic factors', note: 'Reasons that override price.', steps: [['Data residency', 'May mandate self-hosting.'], ['Retention policy', 'Vendor terms may not fit.'], ['Portability', 'Model changes are a project.'], ['Expertise', 'Can you run it?']] }
    ],
    precision: 'Per-token price comparisons that ignore utilization and operational cost systematically favor self-hosting beyond what is real.',
    engineering: 'Compute the crossover utilization explicitly. If you cannot reach it with realistic traffic, the decision is already made.',
    checkpoint: { question: 'What most determines whether self-hosting is economical?', options: ['The model’s parameter count alone', 'Sustained GPU utilization — idle capacity costs money either way', 'The number of engineers on the team', 'The serving framework chosen'], correct: 1, why: 'Self-hosting carries fixed cost regardless of traffic. It wins only when volume keeps the hardware busy enough to beat usage-based pricing.' }
  },
  16: {
    question: 'How do you plan capacity for an inference service?',
    plain: 'Start from the service objective, work out how many tokens per second you must sustain, then derive how many GPUs that requires given your per-device throughput at the target concurrency. Add headroom for spikes and failure. The arithmetic is not complicated — skipping the step is what causes outages.',
    goals: ['Derive capacity from an SLO', 'Model concurrency and per-device throughput', 'Include headroom and failure modes'],
    concepts: [
      ['Start from the objective', 'Latency SLO plus arrival rate.', 'Desired concurrent requests and the TTFT/TPOT targets define the load. Throughput requirements follow from arrival rate and average output length.'],
      ['Per-device throughput at concurrency', 'Not theoretical peak.', 'Measure tokens per second at the batch size your latency target permits. That number, not the model’s headline speed, drives the calculation.'],
      ['Headroom for spikes', 'Arrival rate is not constant.', 'Bursty traffic needs reserve capacity or autoscaling. Sizing to average load guarantees misses during peaks.'],
      ['Failure accounting', 'N-1 or N-2 resilience.', 'Capacity must survive losing a device. Planning exactly to peak load means one failure becomes an outage.']
    ],
    example: { title: 'Size a cluster for a new launch', steps: ['Fix the latency SLO and estimate arrival rate with growth margin.', 'Measure per-GPU throughput at the permitted concurrency.', 'Divide required tokens per second by measured per-device output.', 'Add headroom for spikes and for one device failure.'], takeaway: 'Measured throughput at your concurrency is the only number that sizes correctly.' },
    views: [
      { name: 'From SLO to devices', note: 'Each step uses a measurement.', steps: [['Latency SLO', 'Sets permissible concurrency.'], ['Measured throughput', 'Tokens per second per GPU.'], ['Required rate', 'Arrival rate × output length.'], ['Devices', 'Required ÷ measured.']] },
      { name: 'Headroom', note: 'Sizing to average fails at peaks.', steps: [['Average load', 'Too small a baseline.'], ['Spike factor', 'Reserve for bursts.'], ['Failure loss', 'Survive losing a device.'], ['Result', 'Capacity above peak, on purpose.']] }
    ],
    precision: 'Capacity planning that uses peak theoretical throughput rather than measured throughput at your concurrency will undersize the deployment.',
    engineering: 'Re-derive the calculation after every model or framework change. Measured per-device throughput moves more often than architecture diagrams suggest.',
    checkpoint: { question: 'What should per-device throughput be measured at?', options: ['The model’s theoretical peak flops', 'The batch size your latency target actually permits', 'Batch size one only', 'The maximum batch size possible'], correct: 1, why: 'Your latency SLO caps concurrency, and throughput at that concurrency is what capacity follows. Theoretical peak or unrestricted batch sizes are not achievable under the SLO.' }
  }
};

export function getInferenceGuide(id) {
  return inferenceGuides[id];
}
