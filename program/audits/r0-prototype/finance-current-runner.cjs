// Retain the original 406-check harness and its hash. Adapt only its two uncertainty-state
// selectors to the current UI; this wrapper is not a claim that the old run tested this revision.
const fs = require("node:fs"), path = require("node:path");
const original = path.join(__dirname, "finance-runner.cjs");
let source = fs.readFileSync(original, "utf8");
const oldTitle = 'message("sos", "en", "tools", "Tools.checkout.notPaidTitle")';
const oldRetry = 'await capture(customer, "ordinary-checkout-lost-response-en-light-1440");\n  await customer.page.getByRole("button", { name: /^Pay / }).click();';
if (!source.includes(oldTitle) || !source.includes(oldRetry)) throw new Error("Archived finance selector shape changed");
source = source.replace(oldTitle, 'message("sos", "en", "tools", "Tools.checkout.unconfirmedTitle")');
source = source.replace(oldRetry, 'await capture(customer, "ordinary-checkout-lost-response-en-light-1440");\n  await customer.page.getByRole("button", { name: "Recover payment", exact: true }).click();');
module._compile(source, original);
