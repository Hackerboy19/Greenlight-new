/**
 * Fills in web globals that Node 16 lacks, so the bundled server can run on
 * hosts that only offer Node 16 (the Plesk server for greenlight.fsia.in).
 * On Node 18+ every global already exists and this file does nothing.
 *
 * fetch itself can't be added from here without a new package. On Node 16 the
 * host can enable it with NODE_OPTIONS=--experimental-fetch; without it, only
 * the live-site import and the AI helpers are unavailable.
 */

import { Blob } from 'node:buffer';
import { webcrypto } from 'node:crypto';
import * as streamWeb from 'node:stream/web';
import { deserialize, serialize } from 'node:v8';

const define = (name, value) => {
  if (typeof globalThis[name] === 'undefined' && value !== undefined) {
    Object.defineProperty(globalThis, name, { value, writable: true, configurable: true });
  }
};

for (const [name, value] of Object.entries(streamWeb)) define(name, value);
define('Blob', Blob);
define('crypto', webcrypto);
define('structuredClone', (value) => deserialize(serialize(value)));
