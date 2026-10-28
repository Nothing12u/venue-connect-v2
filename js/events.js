/* ============================================================
   VENTURE CONNECT — delegated event handling

   The pages are built as HTML strings that carry inline handlers such as
   onclick="App.navigate('#/founder/dashboard')". A strict Content-Security-Policy
   (script-src 'self') refuses to run inline handlers, so instead of weakening the
   policy with 'unsafe-inline' this file reads those attributes and runs them
   itself — but ONLY a tiny, safe subset:

     - calls of the form  App.method(...)  or  closeModal(...)  to functions that the
       caller whitelists (see install()),
     - with literal arguments only: 'strings', numbers, true/false/null, this,
       this.value, event,
     - a few fixed statements: event.stopPropagation(), history.back(), window.print(),
       and the guards if(event.target===this) and if(event.key==='Enter').

   Nothing is ever passed to eval / new Function, so a value that ends up inside an
   attribute can at worst name a whitelisted function with literal arguments.
   ============================================================ */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.VCEvents = factory();
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const IDENT = /^[A-Za-z_$][\w$]*$/;

  /* ---------- parsing ---------- */

  // Split on ';' that is not inside a quoted string.
  function splitStatements(src) {
    const out = [];
    let cur = "", quote = null;
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (quote) {
        cur += c;
        if (c === "\\" && i + 1 < src.length) { cur += src[++i]; }
        else if (c === quote) quote = null;
      } else if (c === "'" || c === '"') { quote = c; cur += c; }
      else if (c === ";") { out.push(cur); cur = ""; }
      else cur += c;
    }
    if (quote) throw new Error("unterminated string");
    out.push(cur);
    return out.map(s => s.trim()).filter(Boolean);
  }

  // Parse "a, 'b', 3, this" (the text between the call's parentheses).
  function parseArgs(src) {
    const args = [];
    let i = 0;
    const n = src.length;
    const ws = () => { while (i < n && /\s/.test(src[i])) i++; };
    ws();
    if (i >= n) return args;
    for (;;) {
      ws();
      const c = src[i];
      if (c === "'" || c === '"') {
        let s = "";
        i++;
        for (;;) {
          if (i >= n) throw new Error("unterminated string");
          const d = src[i++];
          if (d === "\\") {
            const e = src[i++];
            s += e === "n" ? "\n" : e === "t" ? "\t" : e;
          } else if (d === c) break;
          else s += d;
        }
        args.push({ t: "lit", v: s });
      } else {
        const m = /^(-?\d+(?:\.\d+)?|true|false|null|undefined|this\.value|this|event)(?![\w$.])/.exec(src.slice(i));
        if (!m) throw new Error("unsupported argument near: " + src.slice(i, i + 20));
        i += m[0].length;
        const tok = m[1];
        if (tok === "this") args.push({ t: "this" });
        else if (tok === "this.value") args.push({ t: "thisValue" });
        else if (tok === "event") args.push({ t: "event" });
        else if (tok === "true") args.push({ t: "lit", v: true });
        else if (tok === "false") args.push({ t: "lit", v: false });
        else if (tok === "null") args.push({ t: "lit", v: null });
        else if (tok === "undefined") args.push({ t: "lit", v: undefined });
        else args.push({ t: "lit", v: Number(tok) });
      }
      ws();
      if (i >= n) break;
      if (src[i] !== ",") throw new Error("expected , near: " + src.slice(i, i + 20));
      i++;
    }
    return args;
  }

  function parseStatement(stmt) {
    let m;
    // if(event.target===this) STATEMENT   |   if(event.key==='Enter') STATEMENT
    if ((m = /^if\s*\(\s*(event\.target\s*===\s*this|event\.key\s*===\s*(?:'[^']*'|"[^"]*"))\s*\)\s*([\s\S]+)$/.exec(stmt))) {
      const cond = m[1].replace(/\s+/g, "");
      const then = parseStatement(m[2].trim());
      if (cond === "event.target===this") return { k: "if", cond: { t: "targetIsThis" }, then };
      return { k: "if", cond: { t: "key", v: cond.slice(cond.indexOf("===") + 4, -1) }, then };
    }
    if (stmt === "event.stopPropagation()") return { k: "stop" };
    if (stmt === "history.back()") return { k: "back" };
    if (stmt === "window.print()") return { k: "print" };
    if ((m = /^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)?)\s*\(([\s\S]*)\)$/.exec(stmt))) {
      const path = m[1].split(".");
      if (!path.every(p => IDENT.test(p))) throw new Error("bad name: " + m[1]);
      return { k: "call", path, args: parseArgs(m[2]) };
    }
    throw new Error("unsupported statement: " + stmt.slice(0, 40));
  }

  const cache = new Map();
  function parse(src) {
    let ast = cache.get(src);
    if (!ast) {
      ast = splitStatements(src).map(parseStatement);
      if (cache.size > 2000) cache.clear();
      cache.set(src, ast);
    }
    return ast;
  }

  /* ---------- running ---------- */

  function resolveCall(path, scope) {
    if (path.length === 1) {
      const fn = scope.globals && Object.prototype.hasOwnProperty.call(scope.globals, path[0]) ? scope.globals[path[0]] : null;
      if (typeof fn !== "function") throw new Error("not an allowed function: " + path[0]);
      return { fn, self: null };
    }
    const obj = scope.objects && Object.prototype.hasOwnProperty.call(scope.objects, path[0]) ? scope.objects[path[0]] : null;
    const name = path[1];
    if (!obj || name.startsWith("_") || !Object.prototype.hasOwnProperty.call(obj, name) || typeof obj[name] !== "function") {
      throw new Error("not an allowed method: " + path.join("."));
    }
    return { fn: obj[name], self: obj };
  }

  function runStatement(ast, ctx) {
    switch (ast.k) {
      case "stop":
        if (ctx.event && ctx.event.stopPropagation) ctx.event.stopPropagation();
        ctx.state.stopped = true;
        return undefined;
      case "back": if (ctx.scope.history) ctx.scope.history.back(); return undefined;
      case "print": if (ctx.scope.window) ctx.scope.window.print(); return undefined;
      case "if": {
        const c = ast.cond;
        const ok = c.t === "targetIsThis" ? ctx.event.target === ctx.el : ctx.event.key === c.v;
        return ok ? runStatement(ast.then, ctx) : undefined;
      }
      case "call": {
        const { fn, self } = resolveCall(ast.path, ctx.scope);
        const args = ast.args.map(a => {
          switch (a.t) {
            case "lit": return a.v;
            case "this": return ctx.el;
            case "thisValue": return ctx.el.value;
            case "event": return ctx.event;
            default: return undefined;
          }
        });
        return fn.apply(self, args);
      }
      default: throw new Error("bad statement");
    }
  }

  function runHandler(src, ctx) {
    let result;
    for (const st of parse(src)) result = runStatement(st, ctx);
    return result;
  }

  /* ---------- DOM wiring ---------- */

  // Emulates inline handlers: the handler on the clicked element runs first, then on each
  // ancestor, until one calls event.stopPropagation().
  function dispatch(event, type, scope) {
    const attr = "on" + type;
    const state = { stopped: false };
    let el = event.target;
    while (el && el.nodeType === 1 && !state.stopped) {
      if (el.hasAttribute(attr)) {
        try {
          const res = runHandler(el.getAttribute(attr), { el, event, scope, state });
          if (res && typeof res.then === "function") {
            res.catch(err => { if (scope.onError) scope.onError(err); else console.error(err); });
          }
        } catch (err) {
          if (scope.onError) scope.onError(err); else console.error(err);
        }
      }
      el = el.parentElement;
    }
  }

  // scope = { objects: { App }, globals: { closeModal, togglePwVis }, history, window, onError }
  function install(doc, scope) {
    ["click", "input", "change", "keydown"].forEach(type => {
      doc.addEventListener(type, ev => dispatch(ev, type, scope), false);
    });
  }

  return { parse, runHandler, dispatch, install, splitStatements, parseArgs };
}));
