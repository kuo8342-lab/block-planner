// Keep regression traffic separate from an already-running desktop preview.
function port(name, fallback) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error(`${name} must be a TCP port from 1 to 65535`);
  return value;
}
const previewPort = port('PACE_TEST_PORT', 5175);
const evidencePort = port('PACE_EVIDENCE_PORT', 5176);
if (previewPort === evidencePort) throw new Error('Preview and evidence ports must differ');
module.exports = {
  previewPort, evidencePort,
  previewUrl: `http://127.0.0.1:${previewPort}/`,
  evidenceUrl: `http://127.0.0.1:${evidencePort}/`
};
