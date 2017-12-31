"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
exports.debugModes = [
    { value: 'none', description: 'Don\'t pause on any exceptions' },
    { value: 'errors', description: 'Pause on errors (uncaught exceptions)' },
    { value: 'exceptions', description: 'Pause on exceptions' },
];
function getTerminalCommand() {
    if (os.type() === 'Windows_NT') {
        return 'start %s';
    }
    else if (os.type() === 'Linux') {
        return `x-terminal-emulator -e "bash -c \\"%s\\""`;
    }
    else if (os.type() === 'Darwin') {
        return `osascript -e 'tell app "Terminal" to do script "%s"'`;
    }
    else {
        return `xterm -e "bash -c \\"%s\\""`;
    }
}
exports.config = {
    useIdeHaskellCabalBuilder: {
        title: 'Use ide-haskell-cabal builder',
        description: "Use the ide-haskell-cabal builder's command when running ghci - " +
            'will run `stack ghci` when stack is the builder, `cabal repl` for cabal and ' +
            '`ghci` for none',
        default: true,
        type: 'boolean',
        order: 0,
    },
    GHCICommand: {
        title: 'GHCI Command',
        description: 'The command to run to execute `ghci`, this will get ignore if the' +
            ' previous setting is set to true',
        type: 'string',
        default: 'ghci',
        order: 1,
    },
    GHCIArguments: {
        title: 'GHCI Arguments',
        description: 'Arguments to give to `ghci`, separated by a space',
        type: 'string',
        default: '',
        order: 2,
    },
    nodeCommand: {
        description: 'The command to run to execute node.js',
        type: 'string',
        default: 'node',
        order: 3,
    },
    terminalCommand: {
        description: 'The command to run to launch a terminal, where the command launched in the terminal is `%s`.',
        type: 'string',
        default: getTerminalCommand(),
        order: 4,
    },
    clickGutterToToggleBreakpoint: {
        type: 'boolean',
        description: 'Insert a breakpoint when the gutter is clicked in a haskell source file',
        default: true,
        order: 5,
    },
    showTerminal: {
        type: 'boolean',
        description: 'Show a terminal with `ghci` running when debugging',
        default: true,
        order: 6,
    },
    functionToDebug: {
        type: 'string',
        description: 'The function to run when debugging',
        default: 'main',
        order: 7,
    },
    breakOnException: {
        description: `Whether to break on exceptions, errors or neither.
            Note: breaking on exception may cause the debugger to freeze in some instances.
            See [#3](https://github.com/ThomasHickman/haskell-debug/issues/3)`,
        type: 'string',
        default: 'none',
        enum: exports.debugModes,
        order: 8,
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHlCQUF3QjtBQUVYLFFBQUEsVUFBVSxHQUEwRTtJQUMvRixFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLGdDQUFnQyxFQUFFO0lBQ2hFLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsdUNBQXVDLEVBQUU7SUFDekUsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxxQkFBcUIsRUFBRTtDQUM1RCxDQUFBO0FBRUQ7SUFDRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssWUFBWSxDQUFDLENBQUMsQ0FBQztRQUMvQixNQUFNLENBQUMsVUFBVSxDQUFBO0lBQ25CLENBQUM7SUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDakMsTUFBTSxDQUFDLDJDQUEyQyxDQUFBO0lBQ3BELENBQUM7SUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDbEMsTUFBTSxDQUFDLHNEQUFzRCxDQUFBO0lBQy9ELENBQUM7SUFBQyxJQUFJLENBQUMsQ0FBQztRQUVOLE1BQU0sQ0FBQyw2QkFBNkIsQ0FBQTtJQUN0QyxDQUFDO0FBQ0gsQ0FBQztBQUVZLFFBQUEsTUFBTSxHQUFHO0lBQ3BCLHlCQUF5QixFQUFFO1FBQ3pCLEtBQUssRUFBRSwrQkFBK0I7UUFDdEMsV0FBVyxFQUFFLGtFQUFrRTtZQUMvRSw4RUFBOEU7WUFDOUUsaUJBQWlCO1FBQ2pCLE9BQU8sRUFBRSxJQUFJO1FBQ2IsSUFBSSxFQUFFLFNBQVM7UUFDZixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsV0FBVyxFQUFFO1FBQ1gsS0FBSyxFQUFFLGNBQWM7UUFDckIsV0FBVyxFQUFFLG1FQUFtRTtZQUNoRixrQ0FBa0M7UUFDbEMsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsTUFBTTtRQUNmLEtBQUssRUFBRSxDQUFDO0tBQ1Q7SUFDRCxhQUFhLEVBQUU7UUFDYixLQUFLLEVBQUUsZ0JBQWdCO1FBQ3ZCLFdBQVcsRUFBRSxtREFBbUQ7UUFDaEUsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsRUFBRTtRQUNYLEtBQUssRUFBRSxDQUFDO0tBQ1Q7SUFDRCxXQUFXLEVBQUU7UUFDWCxXQUFXLEVBQUUsdUNBQXVDO1FBQ3BELElBQUksRUFBRSxRQUFRO1FBQ2QsT0FBTyxFQUFFLE1BQU07UUFDZixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsZUFBZSxFQUFFO1FBQ2YsV0FBVyxFQUFFLDhGQUE4RjtRQUMzRyxJQUFJLEVBQUUsUUFBUTtRQUNkLE9BQU8sRUFBRSxrQkFBa0IsRUFBRTtRQUM3QixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsNkJBQTZCLEVBQUU7UUFDN0IsSUFBSSxFQUFFLFNBQVM7UUFDZixXQUFXLEVBQUUseUVBQXlFO1FBQ3RGLE9BQU8sRUFBRSxJQUFJO1FBQ2IsS0FBSyxFQUFFLENBQUM7S0FDVDtJQUNELFlBQVksRUFBRTtRQUNaLElBQUksRUFBRSxTQUFTO1FBQ2YsV0FBVyxFQUFFLG9EQUFvRDtRQUNqRSxPQUFPLEVBQUUsSUFBSTtRQUNiLEtBQUssRUFBRSxDQUFDO0tBQ1Q7SUFDRCxlQUFlLEVBQUU7UUFDZixJQUFJLEVBQUUsUUFBUTtRQUNkLFdBQVcsRUFBRSxvQ0FBb0M7UUFDakQsT0FBTyxFQUFFLE1BQU07UUFDZixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsZ0JBQWdCLEVBQUU7UUFDaEIsV0FBVyxFQUFFOzs4RUFFNkQ7UUFDMUUsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsTUFBTTtRQUNmLElBQUksRUFBRSxrQkFBVTtRQUNoQixLQUFLLEVBQUUsQ0FBQztLQUNUO0NBQ0YsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIG9zIGZyb20gJ29zJ1xuXG5leHBvcnQgY29uc3QgZGVidWdNb2RlczogQXJyYXk8e3ZhbHVlOiAnbm9uZScgfCAnZXJyb3JzJyB8ICdleGNlcHRpb25zJywgZGVzY3JpcHRpb246IHN0cmluZ30+ID0gW1xuICB7IHZhbHVlOiAnbm9uZScsIGRlc2NyaXB0aW9uOiAnRG9uXFwndCBwYXVzZSBvbiBhbnkgZXhjZXB0aW9ucycgfSxcbiAgeyB2YWx1ZTogJ2Vycm9ycycsIGRlc2NyaXB0aW9uOiAnUGF1c2Ugb24gZXJyb3JzICh1bmNhdWdodCBleGNlcHRpb25zKScgfSxcbiAgeyB2YWx1ZTogJ2V4Y2VwdGlvbnMnLCBkZXNjcmlwdGlvbjogJ1BhdXNlIG9uIGV4Y2VwdGlvbnMnIH0sXG5dXG5cbmZ1bmN0aW9uIGdldFRlcm1pbmFsQ29tbWFuZCgpIHtcbiAgaWYgKG9zLnR5cGUoKSA9PT0gJ1dpbmRvd3NfTlQnKSB7XG4gICAgcmV0dXJuICdzdGFydCAlcydcbiAgfSBlbHNlIGlmIChvcy50eXBlKCkgPT09ICdMaW51eCcpIHtcbiAgICByZXR1cm4gYHgtdGVybWluYWwtZW11bGF0b3IgLWUgXCJiYXNoIC1jIFxcXFxcIiVzXFxcXFwiXCJgXG4gIH0gZWxzZSBpZiAob3MudHlwZSgpID09PSAnRGFyd2luJykge1xuICAgIHJldHVybiBgb3Nhc2NyaXB0IC1lICd0ZWxsIGFwcCBcIlRlcm1pbmFsXCIgdG8gZG8gc2NyaXB0IFwiJXNcIidgXG4gIH0gZWxzZSB7XG4gICAgLy8gbm90IHJlY29nbmlzZWQsIGhvcGUgeHRlcm0gd29ya3NcbiAgICByZXR1cm4gYHh0ZXJtIC1lIFwiYmFzaCAtYyBcXFxcXCIlc1xcXFxcIlwiYFxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjb25maWcgPSB7XG4gIHVzZUlkZUhhc2tlbGxDYWJhbEJ1aWxkZXI6IHtcbiAgICB0aXRsZTogJ1VzZSBpZGUtaGFza2VsbC1jYWJhbCBidWlsZGVyJyxcbiAgICBkZXNjcmlwdGlvbjogXCJVc2UgdGhlIGlkZS1oYXNrZWxsLWNhYmFsIGJ1aWxkZXIncyBjb21tYW5kIHdoZW4gcnVubmluZyBnaGNpIC0gXCIgK1xuICAgICd3aWxsIHJ1biBgc3RhY2sgZ2hjaWAgd2hlbiBzdGFjayBpcyB0aGUgYnVpbGRlciwgYGNhYmFsIHJlcGxgIGZvciBjYWJhbCBhbmQgJyArXG4gICAgJ2BnaGNpYCBmb3Igbm9uZScsXG4gICAgZGVmYXVsdDogdHJ1ZSxcbiAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgb3JkZXI6IDAsXG4gIH0sXG4gIEdIQ0lDb21tYW5kOiB7XG4gICAgdGl0bGU6ICdHSENJIENvbW1hbmQnLFxuICAgIGRlc2NyaXB0aW9uOiAnVGhlIGNvbW1hbmQgdG8gcnVuIHRvIGV4ZWN1dGUgYGdoY2lgLCB0aGlzIHdpbGwgZ2V0IGlnbm9yZSBpZiB0aGUnICtcbiAgICAnIHByZXZpb3VzIHNldHRpbmcgaXMgc2V0IHRvIHRydWUnLFxuICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIGRlZmF1bHQ6ICdnaGNpJyxcbiAgICBvcmRlcjogMSxcbiAgfSxcbiAgR0hDSUFyZ3VtZW50czoge1xuICAgIHRpdGxlOiAnR0hDSSBBcmd1bWVudHMnLFxuICAgIGRlc2NyaXB0aW9uOiAnQXJndW1lbnRzIHRvIGdpdmUgdG8gYGdoY2lgLCBzZXBhcmF0ZWQgYnkgYSBzcGFjZScsXG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgZGVmYXVsdDogJycsXG4gICAgb3JkZXI6IDIsXG4gIH0sXG4gIG5vZGVDb21tYW5kOiB7XG4gICAgZGVzY3JpcHRpb246ICdUaGUgY29tbWFuZCB0byBydW4gdG8gZXhlY3V0ZSBub2RlLmpzJyxcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICBkZWZhdWx0OiAnbm9kZScsXG4gICAgb3JkZXI6IDMsXG4gIH0sXG4gIHRlcm1pbmFsQ29tbWFuZDoge1xuICAgIGRlc2NyaXB0aW9uOiAnVGhlIGNvbW1hbmQgdG8gcnVuIHRvIGxhdW5jaCBhIHRlcm1pbmFsLCB3aGVyZSB0aGUgY29tbWFuZCBsYXVuY2hlZCBpbiB0aGUgdGVybWluYWwgaXMgYCVzYC4nLFxuICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIGRlZmF1bHQ6IGdldFRlcm1pbmFsQ29tbWFuZCgpLFxuICAgIG9yZGVyOiA0LFxuICB9LFxuICBjbGlja0d1dHRlclRvVG9nZ2xlQnJlYWtwb2ludDoge1xuICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICBkZXNjcmlwdGlvbjogJ0luc2VydCBhIGJyZWFrcG9pbnQgd2hlbiB0aGUgZ3V0dGVyIGlzIGNsaWNrZWQgaW4gYSBoYXNrZWxsIHNvdXJjZSBmaWxlJyxcbiAgICBkZWZhdWx0OiB0cnVlLFxuICAgIG9yZGVyOiA1LFxuICB9LFxuICBzaG93VGVybWluYWw6IHtcbiAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgZGVzY3JpcHRpb246ICdTaG93IGEgdGVybWluYWwgd2l0aCBgZ2hjaWAgcnVubmluZyB3aGVuIGRlYnVnZ2luZycsXG4gICAgZGVmYXVsdDogdHJ1ZSxcbiAgICBvcmRlcjogNixcbiAgfSxcbiAgZnVuY3Rpb25Ub0RlYnVnOiB7XG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgZGVzY3JpcHRpb246ICdUaGUgZnVuY3Rpb24gdG8gcnVuIHdoZW4gZGVidWdnaW5nJyxcbiAgICBkZWZhdWx0OiAnbWFpbicsXG4gICAgb3JkZXI6IDcsXG4gIH0sXG4gIGJyZWFrT25FeGNlcHRpb246IHtcbiAgICBkZXNjcmlwdGlvbjogYFdoZXRoZXIgdG8gYnJlYWsgb24gZXhjZXB0aW9ucywgZXJyb3JzIG9yIG5laXRoZXIuXG4gICAgICAgICAgICBOb3RlOiBicmVha2luZyBvbiBleGNlcHRpb24gbWF5IGNhdXNlIHRoZSBkZWJ1Z2dlciB0byBmcmVlemUgaW4gc29tZSBpbnN0YW5jZXMuXG4gICAgICAgICAgICBTZWUgWyMzXShodHRwczovL2dpdGh1Yi5jb20vVGhvbWFzSGlja21hbi9oYXNrZWxsLWRlYnVnL2lzc3Vlcy8zKWAsXG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgZGVmYXVsdDogJ25vbmUnLFxuICAgIGVudW06IGRlYnVnTW9kZXMsXG4gICAgb3JkZXI6IDgsXG4gIH0sXG59XG4iXX0=