const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// POST /test
// body: { pattern: string, flags: string (optional), input: string }
// returns: matches, groups, positions, isValid
app.post('/test', (req, res) => {
  const { pattern, flags = '', input } = req.body;

  if (!pattern || input === undefined) {
    return res.status(400).json({ error: 'pattern and input are required' });
  }

  let regex;
  try {
    regex = new RegExp(pattern, flags);
  } catch (e) {
    return res.status(400).json({ error: `invalid regex: ${e.message}` });
  }

  const matches = [];
  const globalRegex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
  let match;

  while ((match = globalRegex.exec(input)) !== null) {
    matches.push({
      match: match[0],
      index: match.index,
      groups: match.groups || null,
      captured: match.slice(1),
    });
    if (match[0].length === 0) globalRegex.lastIndex++;
  }

  res.json({
    isValid: true,
    pattern,
    flags,
    input,
    matchCount: matches.length,
    matches,
  });
});

app.listen(PORT, () => console.log(`regex-api running on port ${PORT}`));
