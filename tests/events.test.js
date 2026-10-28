/* Tests for js/events.js, the small interpreter that runs onclick="..." attributes
   so the Content-Security-Policy can forbid inline scripts. It must run the handlers the
   pages use and refuse anything else.  Run: npm test                              */
const test = require("node:test");
const assert = require("node:assert");
const VC = require("../js/events.js");

function scope(log) {
  const App = { navigate: (...a) => log.push(["navigate", ...a]), authFieldSet: (...a) => log.push(["authFieldSet", ...a]), _private: () => log.push(["private"]) };
  const proto = Object.create({ inherited: () => log.push(["inherited"]) });
  return { objects: { App, proto }, globals: { closeModal: (...a) => log.push(["closeModal", ...a]) }, history: { back: () => log.push(["back"]) }, window: { print: () => log.push(["print"]) } };
}
const run = (src, extra = {}) => { const log = []; VC.runHandler(src, Object.assign({ el: { value: "typed" }, event: { target: null, key: "" }, scope: scope(log), state: {} }, extra)); return log; };

test("runs a whitelisted method with literal arguments", () => {
  assert.deepStrictEqual(run("App.navigate('#/founder/dashboard')"), [["navigate", "#/founder/dashboard"]]);
  assert.deepStrictEqual(run("App.authFieldSet('email',this.value)"), [["authFieldSet", "email", "typed"]]);
  assert.deepStrictEqual(run("App.navigate(3, true, null)"), [["navigate", 3, true, null]]);
});

test("runs several statements and handles escaped quotes", () => {
  assert.deepStrictEqual(run("closeModal(); App.navigate('it\\'s;ok')"), [["closeModal"], ["navigate", "it's;ok"]]);
});

test("supports the guards the pages use", () => {
  const el = {}; 
  assert.deepStrictEqual(run("if(event.target===this)closeModal()", { el, event: { target: el } }), [["closeModal"]]);
  assert.deepStrictEqual(run("if(event.target===this)closeModal()", { el, event: { target: {} } }), []);
  assert.deepStrictEqual(run("if(event.key==='Enter')App.navigate('x')", { event: { key: "Enter" } }), [["navigate", "x"]]);
  assert.deepStrictEqual(run("if(event.key==='Enter')App.navigate('x')", { event: { key: "a" } }), []);
  assert.deepStrictEqual(run("history.back()"), [["back"]]);
  assert.deepStrictEqual(run("window.print()"), [["print"]]);
});

test("refuses anything that is not a whitelisted call with literal arguments", () => {
  const bad = [
    "alert(1)", "fetch('https://evil.example')", "eval('1')", "App.nope()", "App._private()",
    "App.constructor('alert(1)')()", "App.__proto__.x()", "proto.inherited()", "window.location='x'",
    "App.navigate(document.cookie)", "App.navigate(1+1)", "App.navigate(`x`)", "App.navigate('a' + 'b')",
    "App.navigate(function(){})", "a=1", "App.navigate('unterminated",
  ];
  for (const src of bad) assert.throws(() => run(src), Error, "should refuse: " + src);
});

test("a value injected into an attribute cannot run code", () => {
  // what a startup named  x');alert(1);//  would look like if it reached an onclick unescaped
  assert.throws(() => run("App.navigate('x');alert(1);//')"));
});
