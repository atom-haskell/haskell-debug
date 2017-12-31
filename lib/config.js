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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5QkFBd0I7QUFFWCxRQUFBLFVBQVUsR0FBMEU7SUFDL0YsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxnQ0FBZ0MsRUFBRTtJQUNoRSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLHVDQUF1QyxFQUFFO0lBQ3pFLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUscUJBQXFCLEVBQUU7Q0FDNUQsQ0FBQTtBQUVEO0lBQ0UsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDL0IsTUFBTSxDQUFDLFVBQVUsQ0FBQTtJQUNuQixDQUFDO0lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sQ0FBQywyQ0FBMkMsQ0FBQTtJQUNwRCxDQUFDO0lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyxzREFBc0QsQ0FBQTtJQUMvRCxDQUFDO0lBQUMsSUFBSSxDQUFDLENBQUM7UUFFTixNQUFNLENBQUMsNkJBQTZCLENBQUE7SUFDdEMsQ0FBQztBQUNILENBQUM7QUFFWSxRQUFBLE1BQU0sR0FBRztJQUNwQix5QkFBeUIsRUFBRTtRQUN6QixLQUFLLEVBQUUsK0JBQStCO1FBQ3RDLFdBQVcsRUFBRSxrRUFBa0U7WUFDL0UsOEVBQThFO1lBQzlFLGlCQUFpQjtRQUNqQixPQUFPLEVBQUUsSUFBSTtRQUNiLElBQUksRUFBRSxTQUFTO1FBQ2YsS0FBSyxFQUFFLENBQUM7S0FDVDtJQUNELFdBQVcsRUFBRTtRQUNYLEtBQUssRUFBRSxjQUFjO1FBQ3JCLFdBQVcsRUFBRSxtRUFBbUU7WUFDaEYsa0NBQWtDO1FBQ2xDLElBQUksRUFBRSxRQUFRO1FBQ2QsT0FBTyxFQUFFLE1BQU07UUFDZixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsYUFBYSxFQUFFO1FBQ2IsS0FBSyxFQUFFLGdCQUFnQjtRQUN2QixXQUFXLEVBQUUsbURBQW1EO1FBQ2hFLElBQUksRUFBRSxRQUFRO1FBQ2QsT0FBTyxFQUFFLEVBQUU7UUFDWCxLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsV0FBVyxFQUFFO1FBQ1gsV0FBVyxFQUFFLHVDQUF1QztRQUNwRCxJQUFJLEVBQUUsUUFBUTtRQUNkLE9BQU8sRUFBRSxNQUFNO1FBQ2YsS0FBSyxFQUFFLENBQUM7S0FDVDtJQUNELGVBQWUsRUFBRTtRQUNmLFdBQVcsRUFBRSw4RkFBOEY7UUFDM0csSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsa0JBQWtCLEVBQUU7UUFDN0IsS0FBSyxFQUFFLENBQUM7S0FDVDtJQUNELDZCQUE2QixFQUFFO1FBQzdCLElBQUksRUFBRSxTQUFTO1FBQ2YsV0FBVyxFQUFFLHlFQUF5RTtRQUN0RixPQUFPLEVBQUUsSUFBSTtRQUNiLEtBQUssRUFBRSxDQUFDO0tBQ1Q7SUFDRCxZQUFZLEVBQUU7UUFDWixJQUFJLEVBQUUsU0FBUztRQUNmLFdBQVcsRUFBRSxvREFBb0Q7UUFDakUsT0FBTyxFQUFFLElBQUk7UUFDYixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsZUFBZSxFQUFFO1FBQ2YsSUFBSSxFQUFFLFFBQVE7UUFDZCxXQUFXLEVBQUUsb0NBQW9DO1FBQ2pELE9BQU8sRUFBRSxNQUFNO1FBQ2YsS0FBSyxFQUFFLENBQUM7S0FDVDtJQUNELGdCQUFnQixFQUFFO1FBQ2hCLFdBQVcsRUFBRTs7OEVBRTZEO1FBQzFFLElBQUksRUFBRSxRQUFRO1FBQ2QsT0FBTyxFQUFFLE1BQU07UUFDZixJQUFJLEVBQUUsa0JBQVU7UUFDaEIsS0FBSyxFQUFFLENBQUM7S0FDVDtDQUNGLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBvcyBmcm9tICdvcydcblxuZXhwb3J0IGNvbnN0IGRlYnVnTW9kZXM6IEFycmF5PHt2YWx1ZTogJ25vbmUnIHwgJ2Vycm9ycycgfCAnZXhjZXB0aW9ucycsIGRlc2NyaXB0aW9uOiBzdHJpbmd9PiA9IFtcbiAgeyB2YWx1ZTogJ25vbmUnLCBkZXNjcmlwdGlvbjogJ0RvblxcJ3QgcGF1c2Ugb24gYW55IGV4Y2VwdGlvbnMnIH0sXG4gIHsgdmFsdWU6ICdlcnJvcnMnLCBkZXNjcmlwdGlvbjogJ1BhdXNlIG9uIGVycm9ycyAodW5jYXVnaHQgZXhjZXB0aW9ucyknIH0sXG4gIHsgdmFsdWU6ICdleGNlcHRpb25zJywgZGVzY3JpcHRpb246ICdQYXVzZSBvbiBleGNlcHRpb25zJyB9LFxuXVxuXG5mdW5jdGlvbiBnZXRUZXJtaW5hbENvbW1hbmQoKSB7XG4gIGlmIChvcy50eXBlKCkgPT09ICdXaW5kb3dzX05UJykge1xuICAgIHJldHVybiAnc3RhcnQgJXMnXG4gIH0gZWxzZSBpZiAob3MudHlwZSgpID09PSAnTGludXgnKSB7XG4gICAgcmV0dXJuIGB4LXRlcm1pbmFsLWVtdWxhdG9yIC1lIFwiYmFzaCAtYyBcXFxcXCIlc1xcXFxcIlwiYFxuICB9IGVsc2UgaWYgKG9zLnR5cGUoKSA9PT0gJ0RhcndpbicpIHtcbiAgICByZXR1cm4gYG9zYXNjcmlwdCAtZSAndGVsbCBhcHAgXCJUZXJtaW5hbFwiIHRvIGRvIHNjcmlwdCBcIiVzXCInYFxuICB9IGVsc2Uge1xuICAgIC8vIG5vdCByZWNvZ25pc2VkLCBob3BlIHh0ZXJtIHdvcmtzXG4gICAgcmV0dXJuIGB4dGVybSAtZSBcImJhc2ggLWMgXFxcXFwiJXNcXFxcXCJcImBcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29uZmlnID0ge1xuICB1c2VJZGVIYXNrZWxsQ2FiYWxCdWlsZGVyOiB7XG4gICAgdGl0bGU6ICdVc2UgaWRlLWhhc2tlbGwtY2FiYWwgYnVpbGRlcicsXG4gICAgZGVzY3JpcHRpb246IFwiVXNlIHRoZSBpZGUtaGFza2VsbC1jYWJhbCBidWlsZGVyJ3MgY29tbWFuZCB3aGVuIHJ1bm5pbmcgZ2hjaSAtIFwiICtcbiAgICAnd2lsbCBydW4gYHN0YWNrIGdoY2lgIHdoZW4gc3RhY2sgaXMgdGhlIGJ1aWxkZXIsIGBjYWJhbCByZXBsYCBmb3IgY2FiYWwgYW5kICcgK1xuICAgICdgZ2hjaWAgZm9yIG5vbmUnLFxuICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgIG9yZGVyOiAwLFxuICB9LFxuICBHSENJQ29tbWFuZDoge1xuICAgIHRpdGxlOiAnR0hDSSBDb21tYW5kJyxcbiAgICBkZXNjcmlwdGlvbjogJ1RoZSBjb21tYW5kIHRvIHJ1biB0byBleGVjdXRlIGBnaGNpYCwgdGhpcyB3aWxsIGdldCBpZ25vcmUgaWYgdGhlJyArXG4gICAgJyBwcmV2aW91cyBzZXR0aW5nIGlzIHNldCB0byB0cnVlJyxcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICBkZWZhdWx0OiAnZ2hjaScsXG4gICAgb3JkZXI6IDEsXG4gIH0sXG4gIEdIQ0lBcmd1bWVudHM6IHtcbiAgICB0aXRsZTogJ0dIQ0kgQXJndW1lbnRzJyxcbiAgICBkZXNjcmlwdGlvbjogJ0FyZ3VtZW50cyB0byBnaXZlIHRvIGBnaGNpYCwgc2VwYXJhdGVkIGJ5IGEgc3BhY2UnLFxuICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIGRlZmF1bHQ6ICcnLFxuICAgIG9yZGVyOiAyLFxuICB9LFxuICBub2RlQ29tbWFuZDoge1xuICAgIGRlc2NyaXB0aW9uOiAnVGhlIGNvbW1hbmQgdG8gcnVuIHRvIGV4ZWN1dGUgbm9kZS5qcycsXG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgZGVmYXVsdDogJ25vZGUnLFxuICAgIG9yZGVyOiAzLFxuICB9LFxuICB0ZXJtaW5hbENvbW1hbmQ6IHtcbiAgICBkZXNjcmlwdGlvbjogJ1RoZSBjb21tYW5kIHRvIHJ1biB0byBsYXVuY2ggYSB0ZXJtaW5hbCwgd2hlcmUgdGhlIGNvbW1hbmQgbGF1bmNoZWQgaW4gdGhlIHRlcm1pbmFsIGlzIGAlc2AuJyxcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICBkZWZhdWx0OiBnZXRUZXJtaW5hbENvbW1hbmQoKSxcbiAgICBvcmRlcjogNCxcbiAgfSxcbiAgY2xpY2tHdXR0ZXJUb1RvZ2dsZUJyZWFrcG9pbnQ6IHtcbiAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgZGVzY3JpcHRpb246ICdJbnNlcnQgYSBicmVha3BvaW50IHdoZW4gdGhlIGd1dHRlciBpcyBjbGlja2VkIGluIGEgaGFza2VsbCBzb3VyY2UgZmlsZScsXG4gICAgZGVmYXVsdDogdHJ1ZSxcbiAgICBvcmRlcjogNSxcbiAgfSxcbiAgc2hvd1Rlcm1pbmFsOiB7XG4gICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgIGRlc2NyaXB0aW9uOiAnU2hvdyBhIHRlcm1pbmFsIHdpdGggYGdoY2lgIHJ1bm5pbmcgd2hlbiBkZWJ1Z2dpbmcnLFxuICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgb3JkZXI6IDYsXG4gIH0sXG4gIGZ1bmN0aW9uVG9EZWJ1Zzoge1xuICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIGRlc2NyaXB0aW9uOiAnVGhlIGZ1bmN0aW9uIHRvIHJ1biB3aGVuIGRlYnVnZ2luZycsXG4gICAgZGVmYXVsdDogJ21haW4nLFxuICAgIG9yZGVyOiA3LFxuICB9LFxuICBicmVha09uRXhjZXB0aW9uOiB7XG4gICAgZGVzY3JpcHRpb246IGBXaGV0aGVyIHRvIGJyZWFrIG9uIGV4Y2VwdGlvbnMsIGVycm9ycyBvciBuZWl0aGVyLlxuICAgICAgICAgICAgTm90ZTogYnJlYWtpbmcgb24gZXhjZXB0aW9uIG1heSBjYXVzZSB0aGUgZGVidWdnZXIgdG8gZnJlZXplIGluIHNvbWUgaW5zdGFuY2VzLlxuICAgICAgICAgICAgU2VlIFsjM10oaHR0cHM6Ly9naXRodWIuY29tL1Rob21hc0hpY2ttYW4vaGFza2VsbC1kZWJ1Zy9pc3N1ZXMvMylgLFxuICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIGRlZmF1bHQ6ICdub25lJyxcbiAgICBlbnVtOiBkZWJ1Z01vZGVzLFxuICAgIG9yZGVyOiA4LFxuICB9LFxufVxuIl19