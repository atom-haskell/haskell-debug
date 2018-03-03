"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
exports.debugModes = [
    { value: 'none', description: "Don't pause on any exceptions" },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliLXNyYy9jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5QkFBd0I7QUFFWCxRQUFBLFVBQVUsR0FHbEI7SUFDSCxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLCtCQUErQixFQUFFO0lBQy9ELEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsdUNBQXVDLEVBQUU7SUFDekUsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxxQkFBcUIsRUFBRTtDQUM1RCxDQUFBO0FBRUQ7SUFDRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssWUFBWSxDQUFDLENBQUMsQ0FBQztRQUMvQixNQUFNLENBQUMsVUFBVSxDQUFBO0lBQ25CLENBQUM7SUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDakMsTUFBTSxDQUFDLDJDQUEyQyxDQUFBO0lBQ3BELENBQUM7SUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDbEMsTUFBTSxDQUFDLHNEQUFzRCxDQUFBO0lBQy9ELENBQUM7SUFBQyxJQUFJLENBQUMsQ0FBQztRQUVOLE1BQU0sQ0FBQyw2QkFBNkIsQ0FBQTtJQUN0QyxDQUFDO0FBQ0gsQ0FBQztBQUVZLFFBQUEsTUFBTSxHQUFHO0lBQ3BCLHlCQUF5QixFQUFFO1FBQ3pCLEtBQUssRUFBRSwrQkFBK0I7UUFDdEMsV0FBVyxFQUNULGtFQUFrRTtZQUNsRSw4RUFBOEU7WUFDOUUsaUJBQWlCO1FBQ25CLE9BQU8sRUFBRSxJQUFJO1FBQ2IsSUFBSSxFQUFFLFNBQVM7UUFDZixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsV0FBVyxFQUFFO1FBQ1gsS0FBSyxFQUFFLGNBQWM7UUFDckIsV0FBVyxFQUNULG1FQUFtRTtZQUNuRSxrQ0FBa0M7UUFDcEMsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsTUFBTTtRQUNmLEtBQUssRUFBRSxDQUFDO0tBQ1Q7SUFDRCxhQUFhLEVBQUU7UUFDYixLQUFLLEVBQUUsZ0JBQWdCO1FBQ3ZCLFdBQVcsRUFBRSxtREFBbUQ7UUFDaEUsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsRUFBRTtRQUNYLEtBQUssRUFBRSxDQUFDO0tBQ1Q7SUFDRCxXQUFXLEVBQUU7UUFDWCxXQUFXLEVBQUUsdUNBQXVDO1FBQ3BELElBQUksRUFBRSxRQUFRO1FBQ2QsT0FBTyxFQUFFLE1BQU07UUFDZixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsZUFBZSxFQUFFO1FBQ2YsV0FBVyxFQUNULDhGQUE4RjtRQUNoRyxJQUFJLEVBQUUsUUFBUTtRQUNkLE9BQU8sRUFBRSxrQkFBa0IsRUFBRTtRQUM3QixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsNkJBQTZCLEVBQUU7UUFDN0IsSUFBSSxFQUFFLFNBQVM7UUFDZixXQUFXLEVBQ1QseUVBQXlFO1FBQzNFLE9BQU8sRUFBRSxJQUFJO1FBQ2IsS0FBSyxFQUFFLENBQUM7S0FDVDtJQUNELFlBQVksRUFBRTtRQUNaLElBQUksRUFBRSxTQUFTO1FBQ2YsV0FBVyxFQUFFLG9EQUFvRDtRQUNqRSxPQUFPLEVBQUUsSUFBSTtRQUNiLEtBQUssRUFBRSxDQUFDO0tBQ1Q7SUFDRCxlQUFlLEVBQUU7UUFDZixJQUFJLEVBQUUsUUFBUTtRQUNkLFdBQVcsRUFBRSxvQ0FBb0M7UUFDakQsT0FBTyxFQUFFLE1BQU07UUFDZixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsZ0JBQWdCLEVBQUU7UUFDaEIsV0FBVyxFQUFFOzs4RUFFNkQ7UUFDMUUsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsTUFBTTtRQUNmLElBQUksRUFBRSxrQkFBVTtRQUNoQixLQUFLLEVBQUUsQ0FBQztLQUNUO0NBQ0YsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIG9zIGZyb20gJ29zJ1xuXG5leHBvcnQgY29uc3QgZGVidWdNb2RlczogQXJyYXk8e1xuICB2YWx1ZTogJ25vbmUnIHwgJ2Vycm9ycycgfCAnZXhjZXB0aW9ucydcbiAgZGVzY3JpcHRpb246IHN0cmluZ1xufT4gPSBbXG4gIHsgdmFsdWU6ICdub25lJywgZGVzY3JpcHRpb246IFwiRG9uJ3QgcGF1c2Ugb24gYW55IGV4Y2VwdGlvbnNcIiB9LFxuICB7IHZhbHVlOiAnZXJyb3JzJywgZGVzY3JpcHRpb246ICdQYXVzZSBvbiBlcnJvcnMgKHVuY2F1Z2h0IGV4Y2VwdGlvbnMpJyB9LFxuICB7IHZhbHVlOiAnZXhjZXB0aW9ucycsIGRlc2NyaXB0aW9uOiAnUGF1c2Ugb24gZXhjZXB0aW9ucycgfSxcbl1cblxuZnVuY3Rpb24gZ2V0VGVybWluYWxDb21tYW5kKCkge1xuICBpZiAob3MudHlwZSgpID09PSAnV2luZG93c19OVCcpIHtcbiAgICByZXR1cm4gJ3N0YXJ0ICVzJ1xuICB9IGVsc2UgaWYgKG9zLnR5cGUoKSA9PT0gJ0xpbnV4Jykge1xuICAgIHJldHVybiBgeC10ZXJtaW5hbC1lbXVsYXRvciAtZSBcImJhc2ggLWMgXFxcXFwiJXNcXFxcXCJcImBcbiAgfSBlbHNlIGlmIChvcy50eXBlKCkgPT09ICdEYXJ3aW4nKSB7XG4gICAgcmV0dXJuIGBvc2FzY3JpcHQgLWUgJ3RlbGwgYXBwIFwiVGVybWluYWxcIiB0byBkbyBzY3JpcHQgXCIlc1wiJ2BcbiAgfSBlbHNlIHtcbiAgICAvLyBub3QgcmVjb2duaXNlZCwgaG9wZSB4dGVybSB3b3Jrc1xuICAgIHJldHVybiBgeHRlcm0gLWUgXCJiYXNoIC1jIFxcXFxcIiVzXFxcXFwiXCJgXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNvbmZpZyA9IHtcbiAgdXNlSWRlSGFza2VsbENhYmFsQnVpbGRlcjoge1xuICAgIHRpdGxlOiAnVXNlIGlkZS1oYXNrZWxsLWNhYmFsIGJ1aWxkZXInLFxuICAgIGRlc2NyaXB0aW9uOlxuICAgICAgXCJVc2UgdGhlIGlkZS1oYXNrZWxsLWNhYmFsIGJ1aWxkZXIncyBjb21tYW5kIHdoZW4gcnVubmluZyBnaGNpIC0gXCIgK1xuICAgICAgJ3dpbGwgcnVuIGBzdGFjayBnaGNpYCB3aGVuIHN0YWNrIGlzIHRoZSBidWlsZGVyLCBgY2FiYWwgcmVwbGAgZm9yIGNhYmFsIGFuZCAnICtcbiAgICAgICdgZ2hjaWAgZm9yIG5vbmUnLFxuICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgIG9yZGVyOiAwLFxuICB9LFxuICBHSENJQ29tbWFuZDoge1xuICAgIHRpdGxlOiAnR0hDSSBDb21tYW5kJyxcbiAgICBkZXNjcmlwdGlvbjpcbiAgICAgICdUaGUgY29tbWFuZCB0byBydW4gdG8gZXhlY3V0ZSBgZ2hjaWAsIHRoaXMgd2lsbCBnZXQgaWdub3JlIGlmIHRoZScgK1xuICAgICAgJyBwcmV2aW91cyBzZXR0aW5nIGlzIHNldCB0byB0cnVlJyxcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICBkZWZhdWx0OiAnZ2hjaScsXG4gICAgb3JkZXI6IDEsXG4gIH0sXG4gIEdIQ0lBcmd1bWVudHM6IHtcbiAgICB0aXRsZTogJ0dIQ0kgQXJndW1lbnRzJyxcbiAgICBkZXNjcmlwdGlvbjogJ0FyZ3VtZW50cyB0byBnaXZlIHRvIGBnaGNpYCwgc2VwYXJhdGVkIGJ5IGEgc3BhY2UnLFxuICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIGRlZmF1bHQ6ICcnLFxuICAgIG9yZGVyOiAyLFxuICB9LFxuICBub2RlQ29tbWFuZDoge1xuICAgIGRlc2NyaXB0aW9uOiAnVGhlIGNvbW1hbmQgdG8gcnVuIHRvIGV4ZWN1dGUgbm9kZS5qcycsXG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgZGVmYXVsdDogJ25vZGUnLFxuICAgIG9yZGVyOiAzLFxuICB9LFxuICB0ZXJtaW5hbENvbW1hbmQ6IHtcbiAgICBkZXNjcmlwdGlvbjpcbiAgICAgICdUaGUgY29tbWFuZCB0byBydW4gdG8gbGF1bmNoIGEgdGVybWluYWwsIHdoZXJlIHRoZSBjb21tYW5kIGxhdW5jaGVkIGluIHRoZSB0ZXJtaW5hbCBpcyBgJXNgLicsXG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgZGVmYXVsdDogZ2V0VGVybWluYWxDb21tYW5kKCksXG4gICAgb3JkZXI6IDQsXG4gIH0sXG4gIGNsaWNrR3V0dGVyVG9Ub2dnbGVCcmVha3BvaW50OiB7XG4gICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgIGRlc2NyaXB0aW9uOlxuICAgICAgJ0luc2VydCBhIGJyZWFrcG9pbnQgd2hlbiB0aGUgZ3V0dGVyIGlzIGNsaWNrZWQgaW4gYSBoYXNrZWxsIHNvdXJjZSBmaWxlJyxcbiAgICBkZWZhdWx0OiB0cnVlLFxuICAgIG9yZGVyOiA1LFxuICB9LFxuICBzaG93VGVybWluYWw6IHtcbiAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgZGVzY3JpcHRpb246ICdTaG93IGEgdGVybWluYWwgd2l0aCBgZ2hjaWAgcnVubmluZyB3aGVuIGRlYnVnZ2luZycsXG4gICAgZGVmYXVsdDogdHJ1ZSxcbiAgICBvcmRlcjogNixcbiAgfSxcbiAgZnVuY3Rpb25Ub0RlYnVnOiB7XG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgZGVzY3JpcHRpb246ICdUaGUgZnVuY3Rpb24gdG8gcnVuIHdoZW4gZGVidWdnaW5nJyxcbiAgICBkZWZhdWx0OiAnbWFpbicsXG4gICAgb3JkZXI6IDcsXG4gIH0sXG4gIGJyZWFrT25FeGNlcHRpb246IHtcbiAgICBkZXNjcmlwdGlvbjogYFdoZXRoZXIgdG8gYnJlYWsgb24gZXhjZXB0aW9ucywgZXJyb3JzIG9yIG5laXRoZXIuXG4gICAgICAgICAgICBOb3RlOiBicmVha2luZyBvbiBleGNlcHRpb24gbWF5IGNhdXNlIHRoZSBkZWJ1Z2dlciB0byBmcmVlemUgaW4gc29tZSBpbnN0YW5jZXMuXG4gICAgICAgICAgICBTZWUgWyMzXShodHRwczovL2dpdGh1Yi5jb20vVGhvbWFzSGlja21hbi9oYXNrZWxsLWRlYnVnL2lzc3Vlcy8zKWAsXG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgZGVmYXVsdDogJ25vbmUnLFxuICAgIGVudW06IGRlYnVnTW9kZXMsXG4gICAgb3JkZXI6IDgsXG4gIH0sXG59XG4iXX0=