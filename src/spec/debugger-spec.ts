/*delete require.cache[require.resolve("../lib/Debugger")];
import Debugger = require("../lib/Debugger");

declare function waitsForPromise(...args);

var debugger_: Debugger;

var topDescribeFunc = describe;

if(typeof atom == "undefined"){
    console.warn("WARN: debugger-spec cannot be run outside of atom");
    topDescribeFunc = xdescribe;
}

topDescribeFunc("Debugger", () => {
    beforeEach(() =>
        waitsForPromise(() =>
            atom.workspace.open("./test.hs", {searchAllPanes: true})));

    it("shows the debugging toolbar", () => {
        var breakpoints = new Map<number, Breakpoint>();
        debugger_ = new Debugger(breakpoints);
    })
})*/

//TODO: finish this
