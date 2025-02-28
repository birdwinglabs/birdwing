import { RenderableTreeNode, Tag } from "@markdoc/markdoc";
import * as renderable from '@birdwing/renderable';
import { walkTag } from "../util";

export class RenderableNodeCursor<T extends RenderableTreeNode = RenderableTreeNode> {
  constructor(public readonly nodes: T[]) {}

  static fromData<TagName extends renderable.NodeType>(data: any, tag: TagName) {
    return new RenderableNodeCursor([new Tag(tag, {}, [data])]);
  }

  wrap<TagName extends string>(tag: TagName, attributes: Record<string, any> = {}): RenderableNodeCursor<Tag<TagName>> {
    return new RenderableNodeCursor([new Tag(tag, attributes, this.nodes)]);
  }

  tag<TagName extends renderable.NodeType>(tag: TagName): RenderableNodeCursor<Tag<TagName>> {
    const nodes = this.nodes.filter(n => Tag.isTag(n) && n.name === tag) as unknown as Tag<TagName>[];
    return new RenderableNodeCursor(nodes);
  }

  tags<TagNames extends renderable.NodeType[]>(...tags: TagNames): RenderableNodeCursor<Tag<TagNames[number]>> {
    const nodes = this.nodes.filter(n => Tag.isTag(n) && (tags as string[]).includes(n.name)) as unknown as Tag<TagNames[number]>[];
    return new RenderableNodeCursor(nodes);
  }

  typeof(type: string): RenderableNodeCursor<T> {
    return new RenderableNodeCursor(this.nodes.filter(n => Tag.isTag(n) && n.attributes.typeof === type));
  }

  concat(...other: (RenderableTreeNode | RenderableNodeCursor)[]) {
    const nodes = other.map(o => o instanceof RenderableNodeCursor ? o.nodes : o).flat();
    return new RenderableNodeCursor([...this.nodes, ...nodes]);
  }

  flatten() {
    const nodes = this.nodes.map(t => Tag.isTag(t) ? Array.from(walkTag(t)) : t).flat();
    return new RenderableNodeCursor(nodes);
  } 

  limit(count: number) {
    return new RenderableNodeCursor(this.nodes.slice(0, count));
  }

  toArray(): T[] {
    return this.nodes;
  }

  next(): T {
    return this.nodes[0];
  }
}
