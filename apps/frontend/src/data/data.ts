import { SkipListState, OperationResult } from '../types/types';

export const MOCK_INITIAL_STATE: SkipListState = {
  height: 3,
  values: [10, 25, 30],
  levels: [
    {
      level: 2,
      nodes: [
        {
          id: 's2',
          label: '-∞',
          numericValue: null,
          kind: 'start',
          level: 2,
          nextId: 'n25-2',
        },
        {
          id: 'n25-2',
          label: '25',
          numericValue: 25,
          kind: 'value',
          level: 2,
          nextId: 'e2',
        },
        {
          id: 'e2',
          label: '+∞',
          numericValue: null,
          kind: 'end',
          level: 2,
          nextId: null,
        },
      ],
    },
    {
      level: 1,
      nodes: [
        {
          id: 's1',
          label: '-∞',
          numericValue: null,
          kind: 'start',
          level: 1,
          nextId: 'n10-1',
        },
        {
          id: 'n10-1',
          label: '10',
          numericValue: 10,
          kind: 'value',
          level: 1,
          nextId: 'n25-1',
        },
        {
          id: 'n25-1',
          label: '25',
          numericValue: 25,
          kind: 'value',
          level: 1,
          nextId: 'e1',
        },
        {
          id: 'e1',
          label: '+∞',
          numericValue: null,
          kind: 'end',
          level: 1,
          nextId: null,
        },
      ],
    },
    {
      level: 0,
      nodes: [
        {
          id: 's0',
          label: '-∞',
          numericValue: null,
          kind: 'start',
          level: 0,
          nextId: 'n10-0',
        },
        {
          id: 'n10-0',
          label: '10',
          numericValue: 10,
          kind: 'value',
          level: 0,
          nextId: 'n25-0',
        },
        {
          id: 'n25-0',
          label: '25',
          numericValue: 25,
          kind: 'value',
          level: 0,
          nextId: 'n30-0',
        },
        {
          id: 'n30-0',
          label: '30',
          numericValue: 30,
          kind: 'value',
          level: 0,
          nextId: 'e0',
        },
        {
          id: 'e0',
          label: '+∞',
          numericValue: null,
          kind: 'end',
          level: 0,
          nextId: null,
        },
      ],
    },
  ],
};
