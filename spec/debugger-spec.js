"use strict";
delete require.cache[require.resolve("../lib/Debugger")];
const Debugger = require("../lib/Debugger");
var debugger_;
var topDescribeFunc = describe;
if (typeof atom == "undefined") {
    console.warn("WARN: debugger-spec cannot be run outside of atom");
    topDescribeFunc = xdescribe;
}
topDescribeFunc("Debugger", () => {
    beforeEach(() => waitsForPromise(() => atom.workspace.open("./test.hs", { searchAllPanes: true })));
    it("shows the debugging toolbar", () => {
        var breakpoints = new Map();
        debugger_ = new Debugger(breakpoints);
    });
});
