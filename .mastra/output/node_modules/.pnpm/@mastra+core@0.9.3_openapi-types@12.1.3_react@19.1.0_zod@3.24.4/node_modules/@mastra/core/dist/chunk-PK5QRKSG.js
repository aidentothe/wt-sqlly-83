import { executeHook } from './chunk-BB4KXGBU.js';

// src/eval/metric.ts
var Metric = class {
};

// src/eval/evaluation.ts
async function evaluate({
  agentName,
  input,
  metric,
  output,
  runId,
  globalRunId,
  testInfo,
  instructions
}) {
  const runIdToUse = runId || crypto.randomUUID();
  const metricResult = await metric.measure(input.toString(), output);
  const traceObject = {
    input: input.toString(),
    output,
    result: metricResult,
    agentName,
    metricName: metric.constructor.name,
    instructions,
    globalRunId,
    runId: runIdToUse,
    testInfo
  };
  executeHook("onEvaluation" /* ON_EVALUATION */, traceObject);
  return { ...metricResult, output };
}

export { Metric, evaluate };
