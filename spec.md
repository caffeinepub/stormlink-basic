# StormLink Basic

## Current State
New project. Empty backend and no frontend yet.

## Requested Changes (Diff)

### Add
- Nickname entry screen (stored in localStorage)
- Chat interface with message bubbles (sent = right/blue, received = left/gray)
- Backend stores messages globally (all users in one room)
- Polling every 2 seconds to fetch new messages
- Each message has: id, nickname, text, timestamp
- Messages capped at last 200 to keep storage lean

### Modify
- None

### Remove
- None

## Implementation Plan
1. Backend: single actor with `postMessage(nickname, text)` and `getMessages(since: Nat)` endpoints
2. Frontend: two views — nickname entry and chat room
3. Poll getMessages every 2 seconds using the last known message id
4. Store nickname in localStorage
5. Render bubbles: own messages right-aligned blue, others left-aligned gray
