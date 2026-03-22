# Backend API Notes

This document summarizes the HTTP contract exposed by the skip list backend and the response shape expected by a replay-oriented frontend.

## Base URL

```text
http://localhost:3000
```

Swagger UI:

```text
http://localhost:3000/docs
```

## Endpoints

### `GET /state`

Returns the full serialized skip list.

### `POST /find`

Request body:

```json
{
  "value": 20
}
```

Behavior:

- Replays the traversal from the top layer
- Reports whether the value exists
- Returns the final state without mutating the structure

### `POST /insert`

Request body:

```json
{
  "value": 20,
  "flipSequence": [true, false]
}
```

Behavior:

- Reuses the same traversal logic as `find`
- Rejects duplicate values with `success: false`
- Inserts the value at the bottom layer
- Promotes the tower according to either `flipSequence` or the seeded RNG
- Adds a new top layer when promotion exceeds the current height

### `POST /delete`

Request body:

```json
{
  "value": 20
}
```

Behavior:

- Reuses the same traversal logic as `find`
- Rejects missing values with `success: false`
- Removes the entire tower from top to bottom
- Removes empty top layers while at least one layer remains

### `POST /reset`

Request body:

```json
{
  "seed": 20260322,
  "values": [10, 20, 30]
}
```

Behavior:

- Rebuilds the skip list from scratch
- Optionally sets a deterministic seed
- Optionally preloads unique integer values using the seeded generator

## Operation Response Shape

All mutation-style endpoints return:

```json
{
  "success": true,
  "message": "Inserted value 20.",
  "actionType": "insert",
  "targetValue": 20,
  "steps": [],
  "finalState": {},
  "coinFlips": [true, false],
  "showAlert": false
}
```

### Important Fields

- `success`: business-level success flag
- `message`: human-readable summary for logs or UI messaging
- `actionType`: `find`, `insert`, `delete`, `reset`, or `validation`
- `steps`: ordered animation instructions
- `finalState`: serialized skip list after the operation
- `coinFlips`: the exact promotion decisions used during insert
- `showAlert`: hint for frontend popup or alert behavior

## Step Model

Each step contains:

- `index`: stable playback order
- `type`: semantic event name such as `visit`, `move_right`, `insert_node`, or `remove_level`
- `message`: readable description for debugging or teaching views
- `nodeIds`: involved nodes for the frame
- `stateChanges`: requested semantic highlights such as `visited`, `next`, or `found`
- `focusNodeId`: primary node for the frame
- `nextNodeId`: currently inspected neighbor when relevant
- `direction`: `right` or `down` when a traversal move happens
- `structureChange`: structural mutation payload for insert/delete/level changes
- `playbackHint`: coarse rendering hint such as `move`, `structure`, or `alert`

## Serialized Skip List State

The serialized state is layer-oriented and ordered from top to bottom.

Each level contains:

- `level`: numeric layer index where `0` is the bottom layer
- `headId` and `tailId`: sentinel node ids
- `nodeIds`: the horizontal order of nodes on that layer
- `nodes`: full node objects with left/right/up/down references

Each node contains:

- `id`: stable runtime identifier
- `label`: rendered label such as `start`, `end`, or the numeric value
- `numericValue`: numeric value for data nodes, otherwise `null`
- `kind`: `start`, `end`, or `value`
- `level`: numeric layer index
- `nextId`, `prevId`, `upId`, `downId`: adjacency references for the frontend

## Validation Rules

- `value` must be an integer
- `seed` must be an unsigned 32-bit integer when provided
- `values` in `POST /reset` must be unique integers

Validation failures return HTTP `400` with the same high-level response envelope:

```json
{
  "success": false,
  "message": "value must be a valid integer",
  "actionType": "validation",
  "targetValue": null,
  "steps": [],
  "finalState": null,
  "coinFlips": [],
  "showAlert": true
}
```

## Frontend Integration Guidance

- Treat `steps` as the source of truth for animation timing.
- Treat `finalState` as the source of truth for the resulting structure.
- Do not derive coin flips from structure height. Use `coinFlips` directly.
- Node highlight values are semantic states, not presentation colors. The frontend should map them to its own theme.
