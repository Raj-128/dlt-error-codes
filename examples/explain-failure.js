// How this package is meant to be used in a real backend: turn an opaque DLT
// failure code from a delivery report into something a human can act on, and
// log it where you will actually see it.
//
//   node examples/explain-failure.js

import { lookup } from '../src/index.js';

/**
 * Turn a DLT code from a delivery report into a readable explanation.
 * Returns null when the code is unknown, so callers can decide what to do.
 */
function explain(dltCode) {
  const e = lookup(dltCode);
  if (!e) return null;
  return {
    code: dltCode,
    label: e.label,
    summary: e.meaning,
    action: e.fix,
    trust: e.confidence,
    readMore: e.sources[0],
  };
}

/** What you would actually call when a delivery report comes back failed. */
function onDeliveryReportFailed({ messageId, phone, dltCode }) {
  const masked = String(phone).replace(/\d(?=\d{4})/g, 'x'); // never log full numbers
  const info = explain(dltCode);

  if (!info) {
    console.error(
      `[sms] ${messageId} to ${masked} failed with unknown DLT code ${dltCode}. ` +
        `Check the gateway dashboard and consider adding this code to dlt-error-codes.`,
    );
    return;
  }

  console.error(
    [
      `[sms] ${messageId} to ${masked} failed`,
      `      DLT ${info.code} (${info.label}) [${info.trust}]`,
      `      ${info.summary}`,
      `      Action: ${info.action}`,
      `      ${info.readMore}`,
    ].join('\n'),
  );
}

// --- demo -------------------------------------------------------------------

console.log('A variable overflowed its registered length:\n');
onDeliveryReportFailed({
  messageId: 'msg_01H8X',
  phone: '0000000000',
  dltCode: '635',
});

console.log('\n\nHeader and template are not linked:\n');
onDeliveryReportFailed({
  messageId: 'msg_01H8Y',
  phone: '0000000000',
  dltCode: '634',
});

console.log('\n\nA code the dataset does not cover yet:\n');
onDeliveryReportFailed({
  messageId: 'msg_01H8Z',
  phone: '0000000000',
  dltCode: '699',
});
