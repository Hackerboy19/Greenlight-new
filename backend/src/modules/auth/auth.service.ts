// Re-exported so scripts (seed, hash-password) and the login route share one
// hashing implementation. See password.js for the stored format.
export { hashPassword, verifyPassword, needsRehash } from './password.js';
