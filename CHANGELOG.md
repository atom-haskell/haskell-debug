## 0.3.5
* Simplify terminal-echo
* Remove unused terminal-reporter message
* Rewrite GHCI interface code to use interactive-process
* Fix temp variable assignment
* Bump dependencies and a bit of housekeeping

## 0.3.4
* Support breakpoints in non-main modules (@DavidEichamnn)
* :art: Code cleanup
* Package deactivation (rudimentary)

## 0.3.3
* Move TerminalEcho to \/bin; target es5 with it

## 0.3.2
* Fix for trace history longer than 100
* Typed emitter

## 0.3.1
* Avoid using getActiveTextEditor, since it's unreliable
* bump submodules

## 0.3.0
* Bump minimal Atom version to 1.19
* Expression: don't attempt to evaluate empty expressions
* Tooltips: get closest identifier from grammar scope on empty range
* Use atom-select-list instead of space-pen
* Remove dependency on Emissary
* noImplicitAny
* Fix infinite loop in expression evaluation
* Migrate to UPI-3
* Switch to new typings
* Use Object.values instead of \_.values
