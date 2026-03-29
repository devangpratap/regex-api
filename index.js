const express = require('express');
const { Worker } = require('worker_threads');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const REGEX_TIMEOUT_MS = 5000;
const MAX_PATTERN_LENGTH = 2000;
const MAX_INPUT_LENGTH = 100_000;

// GET /health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// POST /test
// body: { pattern: string, flags: string (optional), input: string }
// returns: matches, groups, positions, isValid
app.post('/test', (req, res) => {
  const { pattern, flags = '', input } = req.body;

  if (!pattern || input === undefined) {
    return res.status(400).json({ error: 'pattern and input are required' });
  }

  if (pattern.length > MAX_PATTERN_LENGTH) {
    return res.status(400).json({ error: `pattern exceeds maximum length of ${MAX_PATTERN_LENGTH}` });
  }

  if (input.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: `input exceeds maximum length of ${MAX_INPUT_LENGTH}` });
  }

  try {
    new RegExp(pattern, flags);
  } catch (e) {
    return res.status(400).json({ error: `invalid regex: ${e.message}` });
  }

  const worker = new Worker(path.join(__dirname, 'regex-worker.js'), {
    workerData: { pattern, flags, input },
  });

  const timer = setTimeout(() => {
    worker.terminate();
    res.status(408).json({ error: 'regex timed out — possible ReDoS pattern' });
  }, REGEX_TIMEOUT_MS);

  worker.on('message', (result) => {
    clearTimeout(timer);
    res.json({
      isValid: true,
      pattern,
      flags,
      input,
      matchCount: result.matches.length,
      matches: result.matches,
    });
  });

  worker.on('error', (err) => {
    clearTimeout(timer);
    res.status(500).json({ error: err.message });
  });
});

app.listen(PORT, () => console.log(`regex-api running on port ${PORT}`));
