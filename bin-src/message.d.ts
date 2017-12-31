export type Message =
  { type: 'message', content: string } |
  { type: 'user-input' } |
  { type: 'destroy-prompt' } |
  { type: 'display-command', command: string } |
  { type: 'close' }
