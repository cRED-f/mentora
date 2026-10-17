/**
 * Beginner → engineering bridge for Mentora's sixteen Training & Alignment
 * lessons. Diagrams are conceptual teaching illustrations, not benchmarks.
 * Keep interview A–F sections in courses.json as the next stage of study.
 */
export const trainingGuides = {
  1: {
    question: 'What is a language model optimizing during pretraining?',
    plain: 'One thing: predict the next token. Text is chopped into tokens, the model sees everything before position t, and it is scored on guessing the token at t. That single objective, repeated over a huge corpus, is what produces everything else the model appears to know.',
    goals: ['State the pretraining objective precisely', 'Explain why one objective yields many capabilities', 'Distinguish the objective from what it produces'],
    concepts: [
      ['Next-token prediction', 'A conditional classification at every position.', 'For each position the model produces a distribution over the vocabulary, and cross-entropy scores it against the token that actually followed. Every position contributes a training signal.'],
      ['One objective, many skills', 'Capability is emergent, not specified.', 'Predicting code requires learning syntax; summarization requires compression; answering questions requires knowledge. None were objectives — they are byproducts of doing the objective well.'],
      ['Causal conditioning', 'Each position sees only its prefix.', 'A causal mask enforces that the prediction at t depends on positions before t. This makes the training task well-posed for generation.'],
      ['Scale matters', 'The same loss applied to more data and compute.', 'Architecture alone does not produce the capability. Data volume, diversity, and compute decide how much the objective can extract.']
    ],
    example: { title: 'Explain why the model "knows" facts it was never asked about', steps: ['Say the objective rewarded predicting text that contains those facts.', 'Point out that a fact which helps prediction gets partially memorized.', 'Note that recall is imperfect and unverifiable by construction.', 'Conclude why retrieval is still needed for anything that must be right.'], takeaway: 'Pretraining learns to predict, not to know. Knowing is an approximation that prediction buys.' },
    views: [
      { name: 'The training step', note: 'One objective, applied at every position.', steps: [['Take a sequence', 'A chunk of training text.'], ['Predict each next token', 'Every position contributes a loss.'], ['Compare', 'Score against what actually followed.'], ['Update', 'Gradients adjust the weights.']] },
      { name: 'Objective to capability', note: 'Skills are byproducts, not targets.', steps: [['Code in the data', 'Predicting it teaches syntax.'], ['Facts in the data', 'Predicting them stores them loosely.'], ['Instructions in the data', 'Predicting them teaches format.'], ['Result', 'General capability, not a guarantee.']] }
    ],
    precision: 'The objective is next-token prediction. Nothing in training optimizes factuality, helpfulness, or safety directly.',
    engineering: 'When a model fails, first ask whether the failure was ever in the objective. Most quality work happens after pretraining.',
    checkpoint: { question: 'What does pretraining directly optimize?', options: ['Factual accuracy on user questions', 'The probability assigned to the next token', 'Helpfulness as rated by humans', 'The absence of hallucinations'], correct: 1, why: 'Cross-entropy on next-token prediction is the only training signal during pretraining. Everything else is a downstream hope.' }
  },
  2: {
    question: 'Derive cross-entropy loss and its gradient.',
    plain: 'Cross-entropy measures how surprised the model is by the correct token: take the negative log probability it assigned to that token. A probability of 0.8 costs about 0.22 nats; 0.1 costs about 2.3. The gradient turns out to be beautifully simple — predicted probability minus one-hot target.',
    goals: ['Write cross-entropy for a single token', 'State the gradient of the loss with respect to logits', 'Explain why the gradient has that form'],
    concepts: [
      ['Negative log likelihood', 'The cost of assigning low probability to the truth.', 'Loss is −log p(correct). Log turns multiplication into addition across positions, and the negative sign makes lower better. A probability of zero costs infinite loss.'],
      ['Gradient is p − y', 'Softmax output minus the one-hot target.', 'For logits, the gradient of cross-entropy with softmax is simply p − y. Where the model is confident and right, the gradient is near zero; where it is wrong, it is large.'],
      ['Why it works', 'The form pushes probability mass correctly.', 'A positive gradient on the target raises its logit; negative gradients on others lower theirs. The correction scales with how wrong the model was.'],
      ['Numerical care', 'Log of a very small probability overflows.', 'Implementations compute log-softmax directly rather than taking the log of a softmax output, which avoids catastrophic underflow for confident errors.']
    ],
    example: { title: 'Verify a hand-written loss implementation', steps: ['Take a single logit vector and the target class.', 'Compute p − y directly and compare against autograd gradients.', 'Test a case where the model is highly confident and wrong.', 'Confirm the loss grows without bound as p approaches zero.'], takeaway: 'p − y is the check that catches most implementation mistakes.' },
    views: [
      { name: 'Computing the loss', note: 'One term per position.', steps: [['Softmax', 'Convert logits to probabilities.'], ['Select target', 'Take the probability of the true token.'], ['Negate log', 'Higher probability, lower cost.'], ['Average', 'Sum over positions in the sequence.']] },
      { name: 'The gradient', note: 'Simple because softmax and log cancel.', steps: [['Logits z', 'Where gradients are applied.'], ['Softmax p', 'Predicted distribution.'], ['Target y', 'One-hot truth vector.'], ['p − y', 'The entire gradient.']] }
    ],
    precision: 'Cross-entropy measures probability assigned to the truth, not correctness of the belief behind it. A well-calibrated 0.6 can beat an overconfident 0.99.',
    engineering: 'When loss drops but task quality does not, the model is fitting the distribution without fitting your actual success criterion.',
    checkpoint: { question: 'What is the gradient of cross-entropy with softmax loss with respect to the logits?', options: ['y − p', 'p − y', 'log p(y)', 'softmax(p)'], correct: 1, why: 'The softmax and log combine so the gradient reduces to predicted probability minus the one-hot target — large exactly where the model is wrong.' }
  },
  3: {
    question: 'How does backpropagation actually update a Transformer?',
    plain: 'Run forward, compute loss, then walk backward through every operation computing how much each weight contributed to the error. Those gradients feed an optimizer that adjusts each weight a small step. In a Transformer this happens through dozens of blocks, which is exactly why residuals and normalization matter so much.',
    goals: ['Describe the forward-backward-update cycle', 'Explain the role of the optimizer versus the gradient', 'Connect depth to gradient conditioning'],
    concepts: [
      ['Chain rule backward', 'Gradients flow in reverse through each operation.', 'The derivative of a composition is the product of local derivatives. Going backward reuses every intermediate result, so one pass computes all gradients.'],
      ['Optimizer step', 'Gradients are transformed before being applied.', 'SGD applies them directly; Adam maintains per-parameter moments to normalize scale. The optimizer decides how to use the gradient, not what it is.'],
      ['Gradient clipping', 'A cap on update magnitude.', 'Transformers produce occasional large gradients. Clipping the global norm prevents a single bad batch from destroying trained weights.'],
      ['Why depth is hard', 'Products of Jacobians vanish or explode.', 'Thirty layers multiply thirty derivatives. Residuals add an identity term that keeps the product well-conditioned instead of collapsing.']
    ],
    example: { title: 'Training loss diverges after a few hundred steps', steps: ['Log gradient norm per step to see whether it spikes.', 'Check whether clipping is enabled and at what threshold.', 'Verify the learning rate against the reference configuration.', 'Reduce learning rate before changing architecture.'], takeaway: 'Instability at depth is usually a scale problem — rate, clipping, or normalization order.' },
    views: [
      { name: 'One training step', note: 'Forward, backward, update.', steps: [['Forward pass', 'Compute predictions.'], ['Loss', 'Compare against targets.'], ['Backward', 'Propagate gradients to every weight.'], ['Optimizer step', 'Apply transformed updates.']] },
      { name: 'Where gradient scale goes wrong', note: 'Three common failure points.', steps: [['Loss scale', 'A bug can inflate it massively.'], ['Depth', 'Products of derivatives compound.'], ['Learning rate', 'Too high diverges; too low stalls.'], ['Fix', 'Clip first, then tune rate.']] }
    ],
    precision: 'Backpropagation computes gradients. It says nothing about whether the step taken along those gradients is good — that is the optimizer’s job.',
    engineering: 'Log gradient norm alongside loss from the first step. It detects divergence earlier than loss alone, often before it is visible.',
    checkpoint: { question: 'What is the purpose of gradient clipping?', options: ['To speed up training', 'To bound update magnitude so a single bad batch cannot destroy weights', 'To reduce memory use', 'To normalize activations'], correct: 1, why: 'Occasional large gradients cause catastrophic updates. Clipping the norm caps the step size without changing the gradient direction.' }
  },
  4: {
    question: 'How does training data quality show up as model behaviour?',
    plain: 'Data decides capability more than architecture does. Contamination puts evaluation answers in training, so benchmarks look great and transfer poorly. Duplicates let the model memorize instead of generalizing. Privacy failures come from retaining rare text verbatim. None of these are visible in a loss curve.',
    goals: ['Explain contamination as evaluation invalidation', 'Describe how duplication causes memorization', 'Identify data-driven failure modes'],
    concepts: [
      ['Contamination', 'Test data present in training data.', 'Scores on contaminated benchmarks are meaningless as capability measures. Detection requires n-gram overlap or membership testing against the training corpus.'],
      ['Duplication', 'Repeated text is memorized rather than generalized.', 'High duplication concentrates gradient signal on exact sequences, converting statistical learning into recall. Deduplication is standard preprocessing.'],
      ['Rare-text memorization', 'Low-frequency strings are stored nearly verbatim.', 'A sequence seen once but highly distinctive is easy to memorize. This is the mechanism behind verbatim leakage of personal or proprietary text.'],
      ['Distribution defines capability', 'What is absent cannot be learned.', 'Underrepresented languages, domains, and formats simply have less signal. Capability gaps trace to coverage gaps more often than to architecture.']
    ],
    example: { title: 'Benchmark score jumps but the product does not improve', steps: ['Check the benchmark for overlap with the training corpus.', 'Run a membership test on specific examples.', 'Compare against a held-out set assembled after training.', 'Prefer internal evaluation over public scores for decisions.'], takeaway: 'A benchmark you cannot prove is uncontaminated is a number, not a measurement.' },
    views: [
      { name: 'Contamination', note: 'Evaluation that has seen the answers.', steps: [['Benchmark released', 'Public test data exists.'], ['Corpus assembled', 'The benchmark gets scraped in.'], ['Model trains', 'Sees the test questions.'], ['Score inflates', 'Measures recall, not capability.']] },
      { name: 'Memorization risk', note: 'Rarity makes verbatim retention likely.', steps: [['Frequent text', 'Learned statistically.'], ['Rare distinctive text', 'Stored almost exactly.'], ['Reproduction', 'Prompted correctly, it leaks.'], ['Mitigate', 'Dedup and filter before training.']] }
    ],
    precision: 'Data contamination is undetectable from the model alone. It requires knowing what was in the training corpus.',
    engineering: 'Evaluate on data collected after training, kept private, and assembled for your own task. Public benchmarks are for comparison, not for decisions.',
    checkpoint: { question: 'Why does duplication in training data matter?', options: ['It slows training', 'It concentrates signal on exact sequences, encouraging memorization over generalization', 'It increases vocabulary size', 'It prevents convergence'], correct: 1, why: 'Repeated examples receive disproportionate gradient, so the model learns to reproduce them rather than to generalize from them.' }
  },
  5: {
    question: 'What do scaling laws actually tell you?',
    plain: 'Loss falls as a smooth power law in model size, data, and compute. Chinchilla showed that at a fixed compute budget you should grow parameters and training tokens together, roughly 20 tokens per parameter — not just make the model bigger. The laws predict loss, not downstream task quality.',
    goals: ['State the form of a scaling law', 'Explain the Chinchilla compute-optimal ratio', 'Distinguish loss prediction from capability prediction'],
    concepts: [
      ['Power-law loss', 'Smooth, predictable improvement with scale.', 'Loss falls as a power of each resource. The smoothness is what makes extrapolation possible, and it holds across several orders of magnitude.'],
      ['Compute-optimal allocation', 'Balance parameters against tokens.', 'Chinchilla showed that many models were undertrained: at fixed FLOPs, training a smaller model for longer beat a larger model trained briefly. Roughly 20 tokens per parameter.'],
      ['Loss is not capability', 'The laws do not predict downstream tasks.', 'Scaling laws predict cross-entropy well. Task performance often improves irregularly, with emergent jumps that the smooth curve does not describe.'],
      ['Data becomes the bottleneck', 'Compute cannot substitute for tokens.', 'Past a point, adding parameters without data wastes compute. Unique, high-quality tokens are the scarce resource, which is why deduplication and quality filtering matter.']
    ],
    example: { title: 'Decide how to spend a fixed training budget', steps: ['Compute the budget in FLOPs and convert to a parameter/token allocation.', 'Check whether your token supply can sustain the recommended ratio.', 'If tokens are scarce, prefer a smaller model trained longer over a bigger starved one.', 'Validate on held-out loss before committing the run.'], takeaway: 'Compute-optimal means balanced, not maximally large.' },
    views: [
      { name: 'Compute allocation', note: 'Same budget, different balance.', steps: [['Fixed FLOPs', 'The budget you can spend.'], ['Large, undertrained', 'More parameters, fewer tokens.'], ['Balanced', 'Parameters and tokens grow together.'], ['Chinchilla', 'The balanced option wins on loss.']] },
      { name: 'What scaling predicts', note: 'Loss is smooth; capability is not.', steps: [['Cross-entropy', 'Predictable power law.'], ['Task accuracy', 'Often irregular.'], ['Emergence', 'Sudden jumps at scale.'], ['Implication', 'Measure tasks separately.']] }
    ],
    precision: 'Scaling laws predict training loss, not downstream performance. Extrapolating task quality from a smooth loss curve is an unsupported inference.',
    engineering: 'Before a large run, confirm your data supply can sustain the target token-to-parameter ratio. Otherwise scale the model down, not up.',
    checkpoint: { question: 'What does the Chinchilla result change about model size choices?', options: ['Larger models are always better', 'At fixed compute, parameters and training tokens should grow together', 'Training data is unimportant', 'Loss stops improving with scale'], correct: 1, why: 'Earlier models were parameter-heavy and undertrained. Allocating compute across both dimensions yields lower loss at the same cost.' }
  },
  6: {
    question: 'What is the difference between pretraining, continual pretraining, and fine-tuning?',
    plain: 'Pretraining builds general capability from scratch on broad data. Continual pretraining resumes that same objective on narrower data to teach a domain — with risk of forgetting. Fine-tuning changes the objective, usually to follow instructions, using much less data and compute.',
    goals: ['Distinguish the three stages by objective and data', 'Explain the forgetting risk of continual pretraining', 'Match a stage to a stated goal'],
    concepts: [
      ['Pretraining', 'Broad data, next-token objective, massive compute.', 'This is where general capability comes from. It is not repeated for downstream needs.'],
      ['Continual pretraining', 'Same objective, narrower and newer data.', 'Teaches a domain or updates knowledge. Because it optimizes only the new distribution, earlier capabilities can degrade — catastrophic forgetting.'],
      ['Supervised fine-tuning', 'New objective on curated instruction examples.', 'Trains the model to follow instructions and match a response style using far less data. It shapes behaviour rather than adding knowledge.'],
      ['Data volume differs by orders of magnitude', 'Each stage is cheaper than the last.', 'Pretraining is trillions of tokens; continual pretraining is billions; fine-tuning is thousands to millions. The cost ordering determines what you can iterate on.']
    ],
    example: { title: 'A model must learn your internal documentation', steps: ['Decide whether you need knowledge injection or behaviour change.', 'For knowledge, continual pretraining on the domain corpus with replay.', 'For behaviour, supervised fine-tuning on example instructions.', 'Evaluate old capabilities alongside new ones to catch forgetting.'], takeaway: 'Name the goal first — knowledge and behaviour need different stages.' },
    views: [
      { name: 'Three stages', note: 'Different objectives and different budgets.', steps: [['Pretrain', 'Broad text, next-token, huge compute.'], ['Continual pretrain', 'Same objective, narrow data.'], ['Fine-tune', 'New objective, small curated set.'], ['Cost', 'Falls sharply at each step.']] },
      { name: 'What each can break', note: 'Every stage has a failure mode.', steps: [['Pretraining', 'Data quality and contamination.'], ['Continual', 'Catastrophic forgetting.'], ['Fine-tuning', 'Overfitting style, losing generality.'], ['Check', 'Old and new evaluations both.']] }
    ],
    precision: 'Continual pretraining and fine-tuning are not interchangeable. One changes what the model knows; the other changes how it behaves.',
    engineering: 'Always evaluate the original capabilities after any adaptation run. New-domain gains that cost old-domain performance are not free.',
    checkpoint: { question: 'Which stage uses the same objective as the original pretraining?', options: ['Supervised fine-tuning', 'Continual pretraining', 'Reward modelling', 'Instruction tuning'], correct: 1, why: 'Continual pretraining keeps the next-token objective on new data. Fine-tuning stages change the objective, typically to optimise on curated demonstrations or preferences.' }
  },
  7: {
    question: 'What does instruction tuning actually change?',
    plain: 'It teaches the model that a prompt asking for something should be followed by a response of a particular shape. Pretraining only predicts text; instruction tuning trains on prompt-response pairs so the model reliably produces helpful, formatted answers instead of continuing the prompt.',
    goals: ['Explain what instruction tuning adds', 'Describe conversational formatting and roles', 'Recognize what it cannot add'],
    concepts: [
      ['Prompt-response pairs', 'Data shaped like the use case.', 'Examples include an instruction and a good answer. Training on these shifts behaviour from continuation to response, without adding new knowledge.'],
      ['Role formatting', 'System, user, assistant structure.', 'The chat template wraps turns in role markers. The model learns that structure during tuning, which is why using the wrong template degrades behaviour sharply.'],
      ['Style versus knowledge', 'It changes how, not what.', 'Instruction tuning cannot teach facts absent from pretraining. It can make the model refuse, elaborate, or format — but not know.'],
      ['Quality dominates quantity', 'Curated pairs beat vast noisy ones.', 'A smaller high-quality set consistently outperforms a large low-quality one. Data curation is the main lever here.']
    ],
    example: { title: 'Model answers well but ignores your format', steps: ['Check that the chat template matches what the model was tuned with.', 'Add a demonstration of the exact format expected in the prompt.', 'If adherence still fails, fine-tune on format-specific examples.', 'Verify the format change did not reduce answer quality.'], takeaway: 'Format adherence is trained behaviour, and template mismatch silently breaks it.' },
    views: [
      { name: 'From continuation to response', note: 'What instruction tuning changes.', steps: [['Pretrained model', 'Continues whatever you give it.'], ['Prompt-response data', 'Shows the desired pairing.'], ['Tune', 'Shifts the distribution.'], ['Result', 'Answers instead of continues.']] },
      { name: 'Role structure', note: 'The template is part of the contract.', steps: [['System', 'Standing instructions.'], ['User', 'The request.'], ['Assistant', 'Expected response.'], ['Match it', 'Wrong template degrades behaviour.']] }
    ],
    precision: 'Instruction tuning changes behaviour and format. It does not add knowledge that pretraining did not already encode.',
    engineering: 'Always replicate the exact chat template used during tuning. Close approximations degrade quality in ways that look like model problems.',
    checkpoint: { question: 'What can instruction tuning NOT do?', options: ['Improve response format', 'Add factual knowledge absent from pretraining', 'Teach refusal behaviour', 'Change response style'], correct: 1, why: 'It operates on behaviour over existing knowledge. Facts not encoded during pretraining cannot be introduced by a few thousand demonstration pairs.' }
  },
  8: {
    question: 'What is RLHF, and why is it three separate steps?',
    plain: 'You cannot optimize "good" directly, so you split it. First train a model to produce text. Then train a reward model to predict which of two answers a human prefers. Then optimize the policy against that reward. Each step exists because the thing you want is not differentiable.',
    goals: ['Describe the three RLHF stages', 'Explain why a reward model is needed', 'Identify where each stage can fail'],
    concepts: [
      ['SFT stage', 'Start from a model that follows instructions.', 'Supervised fine-tuning on demonstrations gives a reasonable starting policy. RLHF from a raw pretrained model wastes effort on basic competence.'],
      ['Reward model', 'A learned proxy for human preference.', 'Trained on pairwise comparisons, it predicts which answer a human would prefer. It becomes the objective — so its biases become the policy’s objectives.'],
      ['Optimization stage', 'Push the policy toward high reward.', 'Typically PPO, with a KL penalty keeping the policy near the reference model to avoid degenerate reward-seeking.'],
      ['The proxy problem', 'Optimizing the model of the goal, not the goal.', 'Every failure mode downstream — reward hacking, lost capability, overconfident tone — traces to optimizing a learned proxy rather than the real preference.']
    ],
    example: { title: 'Decide whether your task needs RLHF at all', steps: ['Check whether supervised fine-tuning already meets the quality bar.', 'Confirm you can collect consistent human preference data.', 'Estimate the cost of reward modelling and iterative optimization.', 'If preferences are simple and consistent, DPO is usually cheaper.'], takeaway: 'RLHF is warranted when preference cannot be written down as demonstrations.' },
    views: [
      { name: 'The three stages', note: 'Each trains something different.', steps: [['SFT', 'Teach basic instruction following.'], ['Reward model', 'Learn to predict human preference.'], ['Optimization', 'Push policy toward that reward.'], ['Deploy', 'Ship with monitoring.']] },
      { name: 'Where it fails', note: 'Each stage has its own risk.', steps: [['SFT', 'Overfits the demonstration style.'], ['Reward model', 'Learns annotator artefacts.'], ['Optimization', 'Exploits the reward model.'], ['Result', 'Reward hacking.']] }
    ],
    precision: 'RLHF optimizes a learned reward model, not human preference. The gap between them is where alignment failures live.',
    engineering: 'Keep the reward model fixed during evaluation, or you cannot tell whether the policy improved or the objective drifted.',
    checkpoint: { question: 'What does the reward model predict?', options: ['The next token', 'Which of two responses a human would prefer', 'The correct answer to a factual question', 'Whether the output is safe'], correct: 1, why: 'It is trained on pairwise human comparisons, so it estimates relative preference. It is not a factuality or safety oracle.' }
  },
  9: {
    question: 'What does a reward model learn, and what does it get wrong?',
    plain: 'It learns to score which of two answers a person would prefer, from data where humans picked a winner. It is a classifier of taste, not of truth. Anything consistent in how annotators chose — including their biases — becomes something the policy will later exploit.',
    goals: ['Describe how a reward model is trained', 'Explain why it inherits annotator artefacts', 'Identify what it cannot measure'],
    concepts: [
      ['Pairwise training', 'Learn from comparisons, not absolute scores.', 'Given two responses to one prompt, the model learns a scalar where the preferred one scores higher. Relative labels are far more consistent than absolute ratings.'],
      ['Preference data quality', 'The ceiling is annotator agreement.', 'Ambiguous prompts produce noisy labels. Disagreement is information about the task, and collapsing it into one label hides genuine ambiguity.'],
      ['Artefacts become signal', 'Stylistic cues correlate with preference.', 'Length, formatting, and confident tone often win comparisons regardless of correctness. The reward model learns these, and the policy amplifies them.'],
      ['Not a truth oracle', 'It cannot verify factual claims.', 'A reward model has no access to ground truth. Fluent, well-structured falsehoods can outscore terse correct answers.']
    ],
    example: { title: 'Reward model prefers longer answers', steps: ['Measure response length against reward across the training set.', 'Check whether annotators systematically chose the longer option.', 'Re-balance comparisons or add length as a controlled variable.', 'Re-evaluate the policy on factuality, not just reward.'], takeaway: 'If reward correlates with a surface feature, the policy will chase that feature.' },
    views: [
      { name: 'Training a reward model', note: 'Scalar scores learned from comparisons.', steps: [['Prompt', 'One question.'], ['Two responses', 'A and B, with a human choice.'], ['Score both', 'Learn a scalar.'], ['Rank', 'Preferred scores higher.']] },
      { name: 'What it can and cannot see', note: 'Taste without truth.', steps: [['Style cues', 'Length, tone, structure — all visible.'], ['Preference', 'Learns the annotator pattern.'], ['Ground truth', 'Not accessible.'], ['Gap', 'Where reward hacking enters.']] }
    ],
    precision: 'A reward model estimates human preference under the distribution of its training comparisons. It does not estimate correctness.',
    engineering: 'Report reward alongside independent quality metrics. Reward alone is exactly the number a hacking policy maximizes.',
    checkpoint: { question: 'What is the main limitation of a reward model?', options: ['It is too slow to serve', 'It estimates preference, not truth, so it cannot verify factual claims', 'It requires reinforcement learning to train', 'It must be larger than the policy'], correct: 1, why: 'It learns from human choices with no access to ground truth, so stylistically strong but false answers can score well.' }
  },
  10: {
    question: 'How does PPO update the policy without breaking it?',
    plain: 'PPO improves the policy using rewards it collects, but it clips the update so no single step can move too far from the old policy. Combined with a KL penalty pulling back toward a reference model, this keeps optimization stable — the model gets rewarded for higher-scoring output without collapsing into degenerate behaviour.',
    goals: ['Explain the clipped objective in PPO', 'Describe why a reference model and KL penalty exist', 'Connect clipping to training stability'],
    concepts: [
      ['Importance ratio', 'Compare new and old policy likelihoods.', 'The ratio tells you how much the update changes the probability of the sampled action. PPO uses it to reuse samples safely.'],
      ['Clipping the objective', 'Limit how far one step can move.', 'The objective is clipped so improvements beyond a threshold stop counting, and large deteriorations are capped. This bounds update magnitude directly.'],
      ['KL penalty to a reference', 'Keep the policy recognizable.', 'Without it, optimization drifts until the model produces reward-maximizing nonsense. The penalty prices deviation from the starting behaviour.'],
      ['Asymmetric effect', 'Clipping treats gains and losses differently.', 'For positive advantage, the ratio is capped; for negative, it is floored. Understanding the sign is essential to debugging the objective.']
    ],
    example: { title: 'PPO training destabilises after a few hundred steps', steps: ['Track the KL divergence from the reference model over time.', 'Check whether the clipping threshold is far from the reference value.', 'Reduce the learning rate or increase the KL coefficient.', 'Watch reward and human-rated quality together — divergence between them signals hacking.'], takeaway: 'KL divergence from reference is the earliest warning signal in RLHF training.' },
    views: [
      { name: 'The PPO step', note: 'Optimize with an explicit bound.', steps: [['Sample', 'Generate responses from the policy.'], ['Score', 'Reward model evaluates them.'], ['Ratio', 'New vs old probability.'], ['Clip', 'Bound how far the update moves.']] },
      { name: 'Two guards', note: 'Clipping and KL serve different roles.', steps: [['Clipping', 'Bounds single-step change.'], ['KL penalty', 'Bounds cumulative drift.'], ['Reference', 'The behaviour you are drifting from.'], ['Both', 'Necessary; neither alone suffices.']] }
    ],
    precision: 'PPO’s clipping bounds the update computed from a sample. It does not bound the policy over the long run — that is the KL penalty’s job.',
    engineering: 'Monitor KL to reference alongside reward. Rising reward with rising KL is the signature of reward hacking, not of improvement.',
    checkpoint: { question: 'Why is a KL penalty to a reference model included in RLHF?', options: ['To speed up convergence', 'To prevent the policy from drifting into degenerate reward-maximizing behaviour', 'To reduce memory usage', 'To normalize the reward scale'], correct: 1, why: 'Optimizing an imperfect reward indefinitely produces reward-maximizing outputs that no longer resemble useful answers. The KL term prices that drift.' }
  },
  11: {
    question: 'How does DPO train on preferences without a reward model?',
    plain: 'DPO rewrites the objective so the preferred answer is pushed up and the rejected one pushed down, relative to a frozen reference model. It needs no separate reward model and no reinforcement learning loop — just pairs and a loss. The trade-off is less flexibility for more stability.',
    goals: ['Explain DPO’s direct objective', 'Compare it with the RLHF pipeline', 'State when each approach is preferable'],
    concepts: [
      ['Implicit reward', 'Preference is expressed as a log-ratio.', 'The difference in log-probability between policy and reference acts as a reward. No separate model needs to be trained or served.'],
      ['Single loss, no rollout', 'Supervised-style training on preference pairs.', 'Because there is no sampling loop, DPO is far cheaper and more stable than PPO. It is a classification-like objective on pairs.'],
      ['The reference stays fixed', 'Drift is controlled by construction.', 'The reference appears in the loss, so moving too far is directly penalized rather than being guarded by a separate KL term.'],
      ['Limits of directness', 'Less room for reward shaping.', 'Custom reward terms, tools, or non-differentiable scoring do not fit. When you need an explicit reward, RLHF remains the tool.']
    ],
    example: { title: 'Choose between DPO and RLHF', steps: ['Check whether you have preference pairs and a fine-tuned starting model.', 'Use DPO if preference is the whole objective and pairs are available.', 'Use RLHF if you need custom reward terms or iterative improvement.', 'Evaluate both on the same held-out preference set for a fair comparison.'], takeaway: 'DPO when preference data is your whole signal; RLHF when you need to shape the reward.' },
    views: [
      { name: 'RLHF pipeline', note: 'Three stages, two extra models.', steps: [['Train reward model', 'A separate object.'], ['Sample from policy', 'Generate candidates.'], ['Optimize with PPO', 'Iterative loop.'], ['Serve reward model', 'Additional cost.']] },
      { name: 'DPO pipeline', note: 'One stage, fixed reference.', steps: [['Preference pairs', 'Chosen and rejected.'], ['Log-ratio', 'Policy versus reference.'], ['One loss', 'Push chosen up, rejected down.'], ['No reward model', 'Cheaper and stable.']] }
    ],
    precision: 'DPO is not a shortcut that achieves the same thing more cheaply in all cases. It optimizes a related but distinct objective with different failure modes.',
    engineering: 'When comparing DPO against PPO, evaluate on held-out human preference as well as reward — the numbers are not directly comparable.',
    checkpoint: { question: 'What does DPO eliminate from the RLHF pipeline?', options: ['The preference data', 'The separately trained reward model and the RL loop', 'The reference model', 'The need for a base model'], correct: 1, why: 'DPO folds the reward into the loss via a log-ratio against a fixed reference, so no reward model is trained and no sampling loop runs.' }
  },
  12: {
    question: 'What does GRPO change relative to PPO?',
    plain: 'PPO trains a separate value network to estimate advantage. GRPO removes it: sample a group of answers to the same question, score them all, and use the group’s own average and spread as the baseline. Advantage becomes relative within the group, which cuts a large chunk of memory and complexity.',
    goals: ['Explain group-relative advantage', 'Describe why the value network is removed', 'Identify when a group gives no signal'],
    concepts: [
      ['Group sampling', 'Many answers to one prompt.', 'The prompt is repeated with several generations. Each is scored, giving a small distribution rather than a single number.'],
      ['Relative advantage', 'Normalize within the group.', 'Each sample’s advantage is its score minus the group mean, divided by the group spread. Scores become comparable without a learned baseline.'],
      ['No value network', 'The group replaces the critic.', 'PPO’s critic predicts expected reward per state and costs significant memory. Using the group statistics removes it entirely.'],
      ['Flat groups give nothing', 'Zero spread means zero signal.', 'If every sample scores identically, normalization produces zero advantage for all of them. That prompt contributes no learning signal this step.']
    ],
    example: { title: 'Why is one batch producing no gradient?', steps: ['Check group reward spread for the affected prompts.', 'Flat rewards mean the group provided no relative signal.', 'Increase group size or vary sampling temperature.', 'Filter prompts where the task is already trivially solved.'], takeaway: 'Group-relative methods need variance within the group to learn.' },
    views: [
      { name: 'PPO advantage', note: 'A learned critic estimates the baseline.', steps: [['Sample', 'Generate a response.'], ['Critic predicts', 'Expected reward for this state.'], ['Advantage', 'Actual minus predicted.'], ['Cost', 'A whole value network to train.']] },
      { name: 'GRPO advantage', note: 'The group is the baseline.', steps: [['Sample a group', 'Several answers per prompt.'], ['Score each', 'Reward model or verifier.'], ['Normalize', 'Relative to group mean and spread.'], ['No critic', 'Memory saved.']] }
    ],
    precision: 'GRPO’s advantage is relative to the sampled group, not to an absolute standard. A group of equally bad answers still yields zero signal.',
    engineering: 'Track the fraction of groups with zero reward spread. A rising share means your prompts are either too easy or too hard to give gradient.',
    checkpoint: { question: 'What replaces PPO’s value network in GRPO?', options: ['A second reward model', 'The statistics of a sampled group of responses', 'A frozen reference policy', 'An external verifier'], correct: 1, why: 'Advantage is computed relative to the group’s own mean and spread, so no learned baseline is needed.' }
  },
  13: {
    question: 'What is reinforcement learning with verifiable rewards?',
    plain: 'Instead of asking a model whether an answer is good, you check it against something that can be tested — a unit test, a known final value, a formal proof. The reward is objective and cheap to compute, which removes the reward model entirely from tasks where correctness is mechanically checkable.',
    goals: ['Explain why verifiable rewards differ from learned rewards', 'Identify which tasks qualify', 'Describe the limits of this approach'],
    concepts: [
      ['Objective reward', 'Correctness is determined by a test.', 'Running code, checking a final numeric answer, or validating a proof gives an unambiguous signal with no annotator noise.'],
      ['No reward model', 'One less proxy to exploit.', 'The failure mode where a policy games a learned reward model is absent, because the reward is the specification itself.'],
      ['Domain restriction', 'Only works where correctness is checkable.', 'Mathematics, code, and structured problems qualify. Open-ended writing, summarization, and helpfulness do not, and forcing them into a checker distorts the target.'],
      ['Reward is not quality', 'Passing a test is necessary, not sufficient.', 'A solution can pass while being unreadable, inefficient, or brittle. Additional criteria still need their own signal.']
    ],
    example: { title: 'Add verifiable reward to a reasoning model', steps: ['Identify task components with an objective checker.', 'Separate them from components needing human or model judgement.', 'Combine verified and judged signals with explicit weights.', 'Check that optimizing the verifiable part does not degrade the rest.'], takeaway: 'Use verification where the domain permits it, and do not stretch it past where it is honest.' },
    views: [
      { name: 'Learned reward', note: 'A proxy stands in for quality.', steps: [['Human comparisons', 'Noisy, expensive labels.'], ['Reward model', 'Learns the pattern.'], ['Optimize', 'Policy pushes the proxy up.'], ['Risk', 'Proxy gets gamed.']] },
      { name: 'Verifiable reward', note: 'The specification is the reward.', steps: [['Candidate answer', 'Generated by the policy.'], ['Execute or check', 'Run tests or compare answers.'], ['Score', 'Pass or fail, unambiguous.'], ['Risk', 'Narrowness, not bias.']] }
    ],
    precision: 'Verifiable rewards remove reward-model bias but do not remove specification risk. A checker encodes your assumptions about correctness.',
    engineering: 'Keep the checker visible and testable. If it can be satisfied by a degenerate solution, the policy will find that path.',
    checkpoint: { question: 'Which task is a good fit for verifiable rewards?', options: ['Summarizing a document', 'Solving a math problem with a checkable final answer', 'Writing a marketing email', 'Explaining a concept to a beginner'], correct: 1, why: 'Verifiable rewards require mechanical correctness. Math and code have checkable outputs; open-ended writing does not.' }
  },
  14: {
    question: 'What is the alignment tax?',
    plain: 'Making a model safer or more helpful can cost it capability. Alignment changes the distribution toward preferred behaviour, and some raw ability — sharp reasoning, willingness to attempt hard problems — is traded away. Reward hacking is the opposite failure: the model optimizes the signal without the underlying intent.',
    goals: ['Define the alignment tax and how to measure it', 'Recognize reward hacking signatures', 'Describe catastrophic forgetting in adaptation'],
    concepts: [
      ['Capability trade-off', 'Safety work can reduce raw ability.', 'Fine-tuning toward a preferred distribution shifts probability away from whatever the previous distribution supported. Some capability loss is structural, not incidental.'],
      ['Reward hacking', 'Optimizing the signal, not the goal.', 'The policy discovers outputs that score well on the reward while failing the intent — verbose hedging, sycophancy, or plausible-sounding but unverified claims.'],
      ['Catastrophic forgetting', 'New training erases old capability.', 'Adapting on a narrow distribution can degrade earlier skills sharply. This is why post-training evaluations include the original capability set.'],
      ['Measurement is the defence', 'Compare before and after on held-out sets.', 'None of these are visible from training reward alone. Held-out evaluations on both old and new tasks are what expose them.']
    ],
    example: { title: 'Safety tuning hurt coding performance', steps: ['Run the pre- and post-tuning model on the same held-out coding set.', 'Compare against training reward to see if they diverged.', 'Identify which capability regressed and whether replay data helps.', 'Decide whether a targeted unlearning fix or a narrower tuning scope is better.'], takeaway: 'Always measure old capabilities after tuning; reward will never tell you.' },
    views: [
      { name: 'The alignment tax', note: 'Capability traded for preferred behaviour.', steps: [['Base model', 'Raw capability.'], ['Tune for safety', 'Distribution shifts.'], ['Some ability drops', 'Trade-off is real.'], ['Measure', 'Old held-out set, before and after.']] },
      { name: 'Reward hacking', note: 'Signal captured, intent missed.', steps: [['Reward model', 'Learns surface correlates.'], ['Policy exploits', 'Finds cheap ways to score.'], ['Reward rises', 'Looks like success.'], ['Quality falls', 'Detected only off the reward.']] }
    ],
    precision: 'Reward hacking and the alignment tax are different failures: one optimizes the wrong thing, the other achieves the right thing at a cost.',
    engineering: 'Track reward and independent quality on separate charts. Converging lines are fine; diverging lines mean you are measuring the wrong thing.',
    checkpoint: { question: 'What defines reward hacking?', options: ['The model becomes slower', 'The policy scores well on the reward while failing the underlying intent', 'The reward model is too large', 'Training loss fails to decrease'], correct: 1, why: 'The objective is satisfied without the goal being achieved — the classic signature of optimizing a proxy rather than the thing itself.' }
  },
  15: {
    question: 'How does knowledge distillation work for LLMs?',
    plain: 'A large teacher model produces soft probabilities over the vocabulary, and a smaller student learns to match that full distribution rather than only the correct label. The soft targets carry information about what the teacher considered plausible, which is richer than a single correct answer.',
    goals: ['Explain soft versus hard targets', 'Describe the temperature and mixing terms', 'Identify when distillation underperforms'],
    concepts: [
      ['Soft targets', 'The teacher’s full distribution, not just the winner.', 'A probability of 0.7 on the right answer and 0.2 on a close alternative tells the student the two are similar. A hard label gives no such information.'],
      ['Distillation temperature', 'Soften the teacher’s distribution.', 'Dividing logits by a temperature before softmax spreads the mass, exposing the structure among non-top classes that a sharp distribution hides.'],
      ['Mixed loss', 'Combine soft and hard objectives.', 'A weighting parameter blends the distillation term with ordinary cross-entropy against the true labels, trading imitation against ground-truth fit.'],
      ['Student capacity limits', 'A small model cannot hold a large one.', 'Distillation transfers what the student has room for. Beyond that capacity, matching the teacher closely is not achievable and loss plateaus.']
    ],
    example: { title: 'Distilled model underperforms the teacher on reasoning', steps: ['Compare soft-target and hard-target student training on the same data.', 'Check whether the student’s capacity constrains the achievable fit.', 'Inspect whether the teacher’s reasoning traces were available to distill from.', 'Accept that some reasoning capability does not compress.'], takeaway: 'Distillation transfers behaviour the student has capacity to represent.' },
    views: [
      { name: 'Hard versus soft targets', note: 'What the student actually learns from.', steps: [['Hard label', 'One correct class, all others zero.'], ['Soft label', 'Full teacher distribution.'], ['Structure', 'Similarity among alternatives.'], ['Student', 'Learns richer signal.']] },
      { name: 'The distillation loss', note: 'Two terms, one weight.', steps: [['Teacher logits', 'Softened by temperature.'], ['KL divergence', 'Student matches teacher distribution.'], ['Cross-entropy', 'Student matches true labels.'], ['Alpha', 'Balances imitation and ground truth.']] }
    ],
    precision: 'Distillation transfers the teacher’s function, not its knowledge in any absolute sense. If the teacher is wrong, the student learns to be wrong similarly.',
    engineering: 'The teacher must be detached. Gradients flowing into the teacher during distillation corrupt both models.',
    checkpoint: { question: 'What do soft targets provide that hard labels do not?', options: ['Higher training speed', 'Information about similarity between non-correct alternatives', 'Protection against overfitting', 'A guarantee of better accuracy'], correct: 1, why: 'A full probability distribution reveals which alternatives the teacher considered close, giving the student structure that a one-hot label discards.' }
  },
  16: {
    question: 'How do you keep learning new skills without losing old ones?',
    plain: 'Continual learning fights catastrophic forgetting. The straightforward defence is to keep a slice of old data in the mix while training on the new, so the model is never optimized exclusively on the new distribution. Stronger methods constrain weight changes or store past examples, each with its own cost.',
    goals: ['Explain why forgetting happens', 'Compare replay, regularization, and architectural approaches', 'Design an evaluation that catches regression'],
    concepts: [
      ['Why forgetting occurs', 'Optimization overwrites what new data demands.', 'Weights that supported old tasks get adjusted to fit the new distribution. Nothing in gradient descent preserves them unless the data or the objective says so.'],
      ['Experience replay', 'Mix old examples into new training.', 'The simplest and most effective defence. It directly keeps old distributions in the loss, at the cost of storing and re-serving old data.'],
      ['Regularization approaches', 'Penalize changes to important weights.', 'Methods that constrain movement away from earlier settings protect capacity without storing data, but they limit how much new learning is possible.'],
      ['Evaluation catches it', 'No training signal reveals the loss.', 'Forgetting is invisible in the new training loss. Only a held-out set of old tasks exposes it, so that set must exist before you start.']
    ],
    example: { title: 'Fine-tuning on support tickets broke general reasoning', steps: ['Run the pre- and post-tuning model on the original held-out set.', 'Confirm the regression is real rather than an evaluation artefact.', 'Add replay data from the earlier distribution at a measured ratio.', 'Re-run both sets and choose a ratio that satisfies both.'], takeaway: 'You cannot protect a capability you never measured.' },
    views: [
      { name: 'Why forgetting happens', note: 'Gradient descent serves the current data.', steps: [['Old weights', 'Support earlier capabilities.'], ['New data only', 'Gradients pull toward the new task.'], ['Overlap', 'Some weights serve both.'], ['Conflict', 'Where capabilities get overwritten.']] },
      { name: 'Defence strategies', note: 'Three options, escalating cost.', steps: [['Replay', 'Mix in old examples; needs storage.'], ['Regularize', 'Constrain important weights.'], ['Isolate', 'Separate parameters per task.'], ['Measure', 'All require an old-task eval.']] }
    ],
    precision: 'Catastrophic forgetting is a property of the training distribution, not a bug in the optimizer. Changing data mix is the primary lever.',
    engineering: 'Build the regression evaluation before the first adaptation run. Afterward, you have no baseline to compare against.',
    checkpoint: { question: 'Why is forgetting invisible during training on new data?', options: ['The loss computation hides it', 'The training signal only covers the new distribution', 'Gradients are clipped before it appears', 'The old data is still in the model'], correct: 1, why: 'Training loss measures fit to current data. Capabilities absent from that data exert no gradient, so their degradation is simply not represented.' }
  }
};

export function getTrainingGuide(id) {
  return trainingGuides[id];
}
