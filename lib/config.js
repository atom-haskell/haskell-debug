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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5QkFBd0I7QUFFWCxRQUFBLFVBQVUsR0FBRztJQUN4QixFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLGdDQUFnQyxFQUFFO0lBQ2hFLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsdUNBQXVDLEVBQUU7SUFDekUsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxxQkFBcUIsRUFBRTtDQUM1RCxDQUFBO0FBRUQ7SUFDRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssWUFBWSxDQUFDLENBQUMsQ0FBQztRQUMvQixNQUFNLENBQUMsVUFBVSxDQUFBO0lBQ25CLENBQUM7SUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDakMsTUFBTSxDQUFDLDJDQUEyQyxDQUFBO0lBQ3BELENBQUM7SUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDbEMsTUFBTSxDQUFDLHNEQUFzRCxDQUFBO0lBQy9ELENBQUM7SUFBQyxJQUFJLENBQUMsQ0FBQztRQUVOLE1BQU0sQ0FBQyw2QkFBNkIsQ0FBQTtJQUN0QyxDQUFDO0FBQ0gsQ0FBQztBQUVZLFFBQUEsTUFBTSxHQUFHO0lBQ3BCLHlCQUF5QixFQUFFO1FBQ3pCLEtBQUssRUFBRSwrQkFBK0I7UUFDdEMsV0FBVyxFQUFFLGtFQUFrRTtZQUMvRSw4RUFBOEU7WUFDOUUsaUJBQWlCO1FBQ2pCLE9BQU8sRUFBRSxJQUFJO1FBQ2IsSUFBSSxFQUFFLFNBQVM7UUFDZixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsV0FBVyxFQUFFO1FBQ1gsS0FBSyxFQUFFLGNBQWM7UUFDckIsV0FBVyxFQUFFLG1FQUFtRTtZQUNoRixrQ0FBa0M7UUFDbEMsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsTUFBTTtRQUNmLEtBQUssRUFBRSxDQUFDO0tBQ1Q7SUFDRCxhQUFhLEVBQUU7UUFDYixLQUFLLEVBQUUsZ0JBQWdCO1FBQ3ZCLFdBQVcsRUFBRSxtREFBbUQ7UUFDaEUsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsRUFBRTtRQUNYLEtBQUssRUFBRSxDQUFDO0tBQ1Q7SUFDRCxXQUFXLEVBQUU7UUFDWCxXQUFXLEVBQUUsdUNBQXVDO1FBQ3BELElBQUksRUFBRSxRQUFRO1FBQ2QsT0FBTyxFQUFFLE1BQU07UUFDZixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsZUFBZSxFQUFFO1FBQ2YsV0FBVyxFQUFFLDhGQUE4RjtRQUMzRyxJQUFJLEVBQUUsUUFBUTtRQUNkLE9BQU8sRUFBRSxrQkFBa0IsRUFBRTtRQUM3QixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsNkJBQTZCLEVBQUU7UUFDN0IsSUFBSSxFQUFFLFNBQVM7UUFDZixXQUFXLEVBQUUseUVBQXlFO1FBQ3RGLE9BQU8sRUFBRSxJQUFJO1FBQ2IsS0FBSyxFQUFFLENBQUM7S0FDVDtJQUNELFlBQVksRUFBRTtRQUNaLElBQUksRUFBRSxTQUFTO1FBQ2YsV0FBVyxFQUFFLG9EQUFvRDtRQUNqRSxPQUFPLEVBQUUsSUFBSTtRQUNiLEtBQUssRUFBRSxDQUFDO0tBQ1Q7SUFDRCxlQUFlLEVBQUU7UUFDZixJQUFJLEVBQUUsUUFBUTtRQUNkLFdBQVcsRUFBRSxvQ0FBb0M7UUFDakQsT0FBTyxFQUFFLE1BQU07UUFDZixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsZ0JBQWdCLEVBQUU7UUFDaEIsV0FBVyxFQUFFOzs4RUFFNkQ7UUFDMUUsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsTUFBTTtRQUNmLElBQUksRUFBRSxrQkFBVTtRQUNoQixLQUFLLEVBQUUsQ0FBQztLQUNUO0NBQ0YsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIG9zIGZyb20gJ29zJ1xuXG5leHBvcnQgY29uc3QgZGVidWdNb2RlcyA9IFtcbiAgeyB2YWx1ZTogJ25vbmUnLCBkZXNjcmlwdGlvbjogJ0RvblxcJ3QgcGF1c2Ugb24gYW55IGV4Y2VwdGlvbnMnIH0sXG4gIHsgdmFsdWU6ICdlcnJvcnMnLCBkZXNjcmlwdGlvbjogJ1BhdXNlIG9uIGVycm9ycyAodW5jYXVnaHQgZXhjZXB0aW9ucyknIH0sXG4gIHsgdmFsdWU6ICdleGNlcHRpb25zJywgZGVzY3JpcHRpb246ICdQYXVzZSBvbiBleGNlcHRpb25zJyB9LFxuXVxuXG5mdW5jdGlvbiBnZXRUZXJtaW5hbENvbW1hbmQgKCkge1xuICBpZiAob3MudHlwZSgpID09PSAnV2luZG93c19OVCcpIHtcbiAgICByZXR1cm4gJ3N0YXJ0ICVzJ1xuICB9IGVsc2UgaWYgKG9zLnR5cGUoKSA9PT0gJ0xpbnV4Jykge1xuICAgIHJldHVybiBgeC10ZXJtaW5hbC1lbXVsYXRvciAtZSBcImJhc2ggLWMgXFxcXFwiJXNcXFxcXCJcImBcbiAgfSBlbHNlIGlmIChvcy50eXBlKCkgPT09ICdEYXJ3aW4nKSB7XG4gICAgcmV0dXJuIGBvc2FzY3JpcHQgLWUgJ3RlbGwgYXBwIFwiVGVybWluYWxcIiB0byBkbyBzY3JpcHQgXCIlc1wiJ2BcbiAgfSBlbHNlIHtcbiAgICAvLyBub3QgcmVjb2duaXNlZCwgaG9wZSB4dGVybSB3b3Jrc1xuICAgIHJldHVybiBgeHRlcm0gLWUgXCJiYXNoIC1jIFxcXFxcIiVzXFxcXFwiXCJgXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNvbmZpZyA9IHtcbiAgdXNlSWRlSGFza2VsbENhYmFsQnVpbGRlcjoge1xuICAgIHRpdGxlOiAnVXNlIGlkZS1oYXNrZWxsLWNhYmFsIGJ1aWxkZXInLFxuICAgIGRlc2NyaXB0aW9uOiBcIlVzZSB0aGUgaWRlLWhhc2tlbGwtY2FiYWwgYnVpbGRlcidzIGNvbW1hbmQgd2hlbiBydW5uaW5nIGdoY2kgLSBcIiArXG4gICAgJ3dpbGwgcnVuIGBzdGFjayBnaGNpYCB3aGVuIHN0YWNrIGlzIHRoZSBidWlsZGVyLCBgY2FiYWwgcmVwbGAgZm9yIGNhYmFsIGFuZCAnICtcbiAgICAnYGdoY2lgIGZvciBub25lJyxcbiAgICBkZWZhdWx0OiB0cnVlLFxuICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICBvcmRlcjogMFxuICB9LFxuICBHSENJQ29tbWFuZDoge1xuICAgIHRpdGxlOiAnR0hDSSBDb21tYW5kJyxcbiAgICBkZXNjcmlwdGlvbjogJ1RoZSBjb21tYW5kIHRvIHJ1biB0byBleGVjdXRlIGBnaGNpYCwgdGhpcyB3aWxsIGdldCBpZ25vcmUgaWYgdGhlJyArXG4gICAgJyBwcmV2aW91cyBzZXR0aW5nIGlzIHNldCB0byB0cnVlJyxcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICBkZWZhdWx0OiAnZ2hjaScsXG4gICAgb3JkZXI6IDFcbiAgfSxcbiAgR0hDSUFyZ3VtZW50czoge1xuICAgIHRpdGxlOiAnR0hDSSBBcmd1bWVudHMnLFxuICAgIGRlc2NyaXB0aW9uOiAnQXJndW1lbnRzIHRvIGdpdmUgdG8gYGdoY2lgLCBzZXBhcmF0ZWQgYnkgYSBzcGFjZScsXG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgZGVmYXVsdDogJycsXG4gICAgb3JkZXI6IDJcbiAgfSxcbiAgbm9kZUNvbW1hbmQ6IHtcbiAgICBkZXNjcmlwdGlvbjogJ1RoZSBjb21tYW5kIHRvIHJ1biB0byBleGVjdXRlIG5vZGUuanMnLFxuICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIGRlZmF1bHQ6ICdub2RlJyxcbiAgICBvcmRlcjogM1xuICB9LFxuICB0ZXJtaW5hbENvbW1hbmQ6IHtcbiAgICBkZXNjcmlwdGlvbjogJ1RoZSBjb21tYW5kIHRvIHJ1biB0byBsYXVuY2ggYSB0ZXJtaW5hbCwgd2hlcmUgdGhlIGNvbW1hbmQgbGF1bmNoZWQgaW4gdGhlIHRlcm1pbmFsIGlzIGAlc2AuJyxcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICBkZWZhdWx0OiBnZXRUZXJtaW5hbENvbW1hbmQoKSxcbiAgICBvcmRlcjogNFxuICB9LFxuICBjbGlja0d1dHRlclRvVG9nZ2xlQnJlYWtwb2ludDoge1xuICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICBkZXNjcmlwdGlvbjogJ0luc2VydCBhIGJyZWFrcG9pbnQgd2hlbiB0aGUgZ3V0dGVyIGlzIGNsaWNrZWQgaW4gYSBoYXNrZWxsIHNvdXJjZSBmaWxlJyxcbiAgICBkZWZhdWx0OiB0cnVlLFxuICAgIG9yZGVyOiA1XG4gIH0sXG4gIHNob3dUZXJtaW5hbDoge1xuICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICBkZXNjcmlwdGlvbjogJ1Nob3cgYSB0ZXJtaW5hbCB3aXRoIGBnaGNpYCBydW5uaW5nIHdoZW4gZGVidWdnaW5nJyxcbiAgICBkZWZhdWx0OiB0cnVlLFxuICAgIG9yZGVyOiA2XG4gIH0sXG4gIGZ1bmN0aW9uVG9EZWJ1Zzoge1xuICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIGRlc2NyaXB0aW9uOiAnVGhlIGZ1bmN0aW9uIHRvIHJ1biB3aGVuIGRlYnVnZ2luZycsXG4gICAgZGVmYXVsdDogJ21haW4nLFxuICAgIG9yZGVyOiA3XG4gIH0sXG4gIGJyZWFrT25FeGNlcHRpb246IHtcbiAgICBkZXNjcmlwdGlvbjogYFdoZXRoZXIgdG8gYnJlYWsgb24gZXhjZXB0aW9ucywgZXJyb3JzIG9yIG5laXRoZXIuXG4gICAgICAgICAgICBOb3RlOiBicmVha2luZyBvbiBleGNlcHRpb24gbWF5IGNhdXNlIHRoZSBkZWJ1Z2dlciB0byBmcmVlemUgaW4gc29tZSBpbnN0YW5jZXMuXG4gICAgICAgICAgICBTZWUgWyMzXShodHRwczovL2dpdGh1Yi5jb20vVGhvbWFzSGlja21hbi9oYXNrZWxsLWRlYnVnL2lzc3Vlcy8zKWAsXG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgZGVmYXVsdDogJ25vbmUnLFxuICAgIGVudW06IGRlYnVnTW9kZXMsXG4gICAgb3JkZXI6IDhcbiAgfVxufVxuIl19