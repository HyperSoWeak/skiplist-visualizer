import { NodeKind } from './skip-list.types';

export class SkipListNode {
  public next: SkipListNode | null = null;
  public prev: SkipListNode | null = null;
  public up: SkipListNode | null = null;
  public down: SkipListNode | null = null;

  constructor(
    public readonly id: string,
    public readonly kind: NodeKind,
    public readonly level: number,
    public readonly numericValue: number | null,
  ) {}

  get label(): string {
    if (this.kind === 'start') {
      return 'start';
    }

    if (this.kind === 'end') {
      return 'end';
    }

    return String(this.numericValue);
  }
}
