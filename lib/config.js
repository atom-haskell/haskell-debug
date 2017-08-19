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
        order: 0
    },
    GHCICommand: {
        title: 'GHCI Command',
        description: 'The command to run to execute `ghci`, this will get ignore if the' +
            ' previous setting is set to true',
        type: 'string',
        default: 'ghci',
        order: 1
    },
    GHCIArguments: {
        title: 'GHCI Arguments',
        description: 'Arguments to give to `ghci`, separated by a space',
        type: 'string',
        default: '',
        order: 2
    },
    nodeCommand: {
        description: 'The command to run to execute node.js',
        type: 'string',
        default: 'node',
        order: 3
    },
    terminalCommand: {
        description: 'The command to run to launch a terminal, where the command launched in the terminal is `%s`.',
        type: 'string',
        default: getTerminalCommand(),
        order: 4
    },
    clickGutterToToggleBreakpoint: {
        type: 'boolean',
        description: 'Insert a breakpoint when the gutter is clicked in a haskell source file',
        default: true,
        order: 5
    },
    showTerminal: {
        type: 'boolean',
        description: 'Show a terminal with `ghci` running when debugging',
        default: true,
        order: 6
    },
    functionToDebug: {
        type: 'string',
        description: 'The function to run when debugging',
        default: 'main',
        order: 7
    },
    breakOnException: {
        description: `Whether to break on exceptions, errors or neither.
            Note: breaking on exception may cause the debugger to freeze in some instances.
            See [#3](https://github.com/ThomasHickman/haskell-debug/issues/3)`,
        type: 'string',
        default: 'none',
        enum: exports.debugModes,
        order: 8
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5QkFBd0I7QUFFWCxRQUFBLFVBQVUsR0FBRztJQUN4QixFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLGdDQUFnQyxFQUFFO0lBQ2hFLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsdUNBQXVDLEVBQUU7SUFDekUsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxxQkFBcUIsRUFBRTtDQUM1RCxDQUFBO0FBRUQ7SUFDRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssWUFBWSxDQUFDLENBQUMsQ0FBQztRQUMvQixNQUFNLENBQUMsVUFBVSxDQUFBO0lBQ25CLENBQUM7SUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDakMsTUFBTSxDQUFDLDJDQUEyQyxDQUFBO0lBQ3BELENBQUM7SUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDbEMsTUFBTSxDQUFDLHNEQUFzRCxDQUFBO0lBQy9ELENBQUM7SUFBQyxJQUFJLENBQUMsQ0FBQztRQUVOLE1BQU0sQ0FBQyw2QkFBNkIsQ0FBQTtJQUN0QyxDQUFDO0FBQ0gsQ0FBQztBQUVZLFFBQUEsTUFBTSxHQUFHO0lBQ3BCLHlCQUF5QixFQUFFO1FBQ3pCLEtBQUssRUFBRSwrQkFBK0I7UUFDdEMsV0FBVyxFQUFFLGtFQUFrRTtZQUMvRSw4RUFBOEU7WUFDOUUsaUJBQWlCO1FBQ2pCLE9BQU8sRUFBRSxJQUFJO1FBQ2IsSUFBSSxFQUFFLFNBQVM7UUFDZixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsV0FBVyxFQUFFO1FBQ1gsS0FBSyxFQUFFLGNBQWM7UUFDckIsV0FBVyxFQUFFLG1FQUFtRTtZQUNoRixrQ0FBa0M7UUFDbEMsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsTUFBTTtRQUNmLEtBQUssRUFBRSxDQUFDO0tBQ1Q7SUFDRCxhQUFhLEVBQUU7UUFDYixLQUFLLEVBQUUsZ0JBQWdCO1FBQ3ZCLFdBQVcsRUFBRSxtREFBbUQ7UUFDaEUsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsRUFBRTtRQUNYLEtBQUssRUFBRSxDQUFDO0tBQ1Q7SUFDRCxXQUFXLEVBQUU7UUFDWCxXQUFXLEVBQUUsdUNBQXVDO1FBQ3BELElBQUksRUFBRSxRQUFRO1FBQ2QsT0FBTyxFQUFFLE1BQU07UUFDZixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsZUFBZSxFQUFFO1FBQ2YsV0FBVyxFQUFFLDhGQUE4RjtRQUMzRyxJQUFJLEVBQUUsUUFBUTtRQUNkLE9BQU8sRUFBRSxrQkFBa0IsRUFBRTtRQUM3QixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsNkJBQTZCLEVBQUU7UUFDN0IsSUFBSSxFQUFFLFNBQVM7UUFDZixXQUFXLEVBQUUseUVBQXlFO1FBQ3RGLE9BQU8sRUFBRSxJQUFJO1FBQ2IsS0FBSyxFQUFFLENBQUM7S0FDVDtJQUNELFlBQVksRUFBRTtRQUNaLElBQUksRUFBRSxTQUFTO1FBQ2YsV0FBVyxFQUFFLG9EQUFvRDtRQUNqRSxPQUFPLEVBQUUsSUFBSTtRQUNiLEtBQUssRUFBRSxDQUFDO0tBQ1Q7SUFDRCxlQUFlLEVBQUU7UUFDZixJQUFJLEVBQUUsUUFBUTtRQUNkLFdBQVcsRUFBRSxvQ0FBb0M7UUFDakQsT0FBTyxFQUFFLE1BQU07UUFDZixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsZ0JBQWdCLEVBQUU7UUFDaEIsV0FBVyxFQUFFOzs4RUFFNkQ7UUFDMUUsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsTUFBTTtRQUNmLElBQUksRUFBRSxrQkFBVTtRQUNoQixLQUFLLEVBQUUsQ0FBQztLQUNUO0NBQ0YsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIG9zIGZyb20gJ29zJ1xuXG5leHBvcnQgY29uc3QgZGVidWdNb2RlcyA9IFtcbiAgeyB2YWx1ZTogJ25vbmUnLCBkZXNjcmlwdGlvbjogJ0RvblxcJ3QgcGF1c2Ugb24gYW55IGV4Y2VwdGlvbnMnIH0sXG4gIHsgdmFsdWU6ICdlcnJvcnMnLCBkZXNjcmlwdGlvbjogJ1BhdXNlIG9uIGVycm9ycyAodW5jYXVnaHQgZXhjZXB0aW9ucyknIH0sXG4gIHsgdmFsdWU6ICdleGNlcHRpb25zJywgZGVzY3JpcHRpb246ICdQYXVzZSBvbiBleGNlcHRpb25zJyB9LFxuXVxuXG5mdW5jdGlvbiBnZXRUZXJtaW5hbENvbW1hbmQoKSB7XG4gIGlmIChvcy50eXBlKCkgPT09ICdXaW5kb3dzX05UJykge1xuICAgIHJldHVybiAnc3RhcnQgJXMnXG4gIH0gZWxzZSBpZiAob3MudHlwZSgpID09PSAnTGludXgnKSB7XG4gICAgcmV0dXJuIGB4LXRlcm1pbmFsLWVtdWxhdG9yIC1lIFwiYmFzaCAtYyBcXFxcXCIlc1xcXFxcIlwiYFxuICB9IGVsc2UgaWYgKG9zLnR5cGUoKSA9PT0gJ0RhcndpbicpIHtcbiAgICByZXR1cm4gYG9zYXNjcmlwdCAtZSAndGVsbCBhcHAgXCJUZXJtaW5hbFwiIHRvIGRvIHNjcmlwdCBcIiVzXCInYFxuICB9IGVsc2Uge1xuICAgIC8vIG5vdCByZWNvZ25pc2VkLCBob3BlIHh0ZXJtIHdvcmtzXG4gICAgcmV0dXJuIGB4dGVybSAtZSBcImJhc2ggLWMgXFxcXFwiJXNcXFxcXCJcImBcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29uZmlnID0ge1xuICB1c2VJZGVIYXNrZWxsQ2FiYWxCdWlsZGVyOiB7XG4gICAgdGl0bGU6ICdVc2UgaWRlLWhhc2tlbGwtY2FiYWwgYnVpbGRlcicsXG4gICAgZGVzY3JpcHRpb246IFwiVXNlIHRoZSBpZGUtaGFza2VsbC1jYWJhbCBidWlsZGVyJ3MgY29tbWFuZCB3aGVuIHJ1bm5pbmcgZ2hjaSAtIFwiICtcbiAgICAnd2lsbCBydW4gYHN0YWNrIGdoY2lgIHdoZW4gc3RhY2sgaXMgdGhlIGJ1aWxkZXIsIGBjYWJhbCByZXBsYCBmb3IgY2FiYWwgYW5kICcgK1xuICAgICdgZ2hjaWAgZm9yIG5vbmUnLFxuICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgIG9yZGVyOiAwXG4gIH0sXG4gIEdIQ0lDb21tYW5kOiB7XG4gICAgdGl0bGU6ICdHSENJIENvbW1hbmQnLFxuICAgIGRlc2NyaXB0aW9uOiAnVGhlIGNvbW1hbmQgdG8gcnVuIHRvIGV4ZWN1dGUgYGdoY2lgLCB0aGlzIHdpbGwgZ2V0IGlnbm9yZSBpZiB0aGUnICtcbiAgICAnIHByZXZpb3VzIHNldHRpbmcgaXMgc2V0IHRvIHRydWUnLFxuICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIGRlZmF1bHQ6ICdnaGNpJyxcbiAgICBvcmRlcjogMVxuICB9LFxuICBHSENJQXJndW1lbnRzOiB7XG4gICAgdGl0bGU6ICdHSENJIEFyZ3VtZW50cycsXG4gICAgZGVzY3JpcHRpb246ICdBcmd1bWVudHMgdG8gZ2l2ZSB0byBgZ2hjaWAsIHNlcGFyYXRlZCBieSBhIHNwYWNlJyxcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICBkZWZhdWx0OiAnJyxcbiAgICBvcmRlcjogMlxuICB9LFxuICBub2RlQ29tbWFuZDoge1xuICAgIGRlc2NyaXB0aW9uOiAnVGhlIGNvbW1hbmQgdG8gcnVuIHRvIGV4ZWN1dGUgbm9kZS5qcycsXG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgZGVmYXVsdDogJ25vZGUnLFxuICAgIG9yZGVyOiAzXG4gIH0sXG4gIHRlcm1pbmFsQ29tbWFuZDoge1xuICAgIGRlc2NyaXB0aW9uOiAnVGhlIGNvbW1hbmQgdG8gcnVuIHRvIGxhdW5jaCBhIHRlcm1pbmFsLCB3aGVyZSB0aGUgY29tbWFuZCBsYXVuY2hlZCBpbiB0aGUgdGVybWluYWwgaXMgYCVzYC4nLFxuICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIGRlZmF1bHQ6IGdldFRlcm1pbmFsQ29tbWFuZCgpLFxuICAgIG9yZGVyOiA0XG4gIH0sXG4gIGNsaWNrR3V0dGVyVG9Ub2dnbGVCcmVha3BvaW50OiB7XG4gICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgIGRlc2NyaXB0aW9uOiAnSW5zZXJ0IGEgYnJlYWtwb2ludCB3aGVuIHRoZSBndXR0ZXIgaXMgY2xpY2tlZCBpbiBhIGhhc2tlbGwgc291cmNlIGZpbGUnLFxuICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgb3JkZXI6IDVcbiAgfSxcbiAgc2hvd1Rlcm1pbmFsOiB7XG4gICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgIGRlc2NyaXB0aW9uOiAnU2hvdyBhIHRlcm1pbmFsIHdpdGggYGdoY2lgIHJ1bm5pbmcgd2hlbiBkZWJ1Z2dpbmcnLFxuICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgb3JkZXI6IDZcbiAgfSxcbiAgZnVuY3Rpb25Ub0RlYnVnOiB7XG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgZGVzY3JpcHRpb246ICdUaGUgZnVuY3Rpb24gdG8gcnVuIHdoZW4gZGVidWdnaW5nJyxcbiAgICBkZWZhdWx0OiAnbWFpbicsXG4gICAgb3JkZXI6IDdcbiAgfSxcbiAgYnJlYWtPbkV4Y2VwdGlvbjoge1xuICAgIGRlc2NyaXB0aW9uOiBgV2hldGhlciB0byBicmVhayBvbiBleGNlcHRpb25zLCBlcnJvcnMgb3IgbmVpdGhlci5cbiAgICAgICAgICAgIE5vdGU6IGJyZWFraW5nIG9uIGV4Y2VwdGlvbiBtYXkgY2F1c2UgdGhlIGRlYnVnZ2VyIHRvIGZyZWV6ZSBpbiBzb21lIGluc3RhbmNlcy5cbiAgICAgICAgICAgIFNlZSBbIzNdKGh0dHBzOi8vZ2l0aHViLmNvbS9UaG9tYXNIaWNrbWFuL2hhc2tlbGwtZGVidWcvaXNzdWVzLzMpYCxcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICBkZWZhdWx0OiAnbm9uZScsXG4gICAgZW51bTogZGVidWdNb2RlcyxcbiAgICBvcmRlcjogOFxuICB9XG59XG4iXX0=