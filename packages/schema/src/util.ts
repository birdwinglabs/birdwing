import Markdoc, { Config, Node, RenderableTreeNode, Tag } from '@markdoc/markdoc';



export function generateIdIfMissing(node: Node, config: Config) {
  if (!config.variables?.generatedIds) {
    (config.variables as Record<string, any>).generatedIds = new Set<string>();
  }
  const generatedIds = config.variables?.generatedIds as Set<string>;

  if (!node.attributes.id) {
    const prefix = node.type === 'tag' ? node.tag : node.type;

    if (node.type === 'tag') {
      let index = 0;

      while (generatedIds.has(`${prefix}-${index}`)) {
        index++;
      }
      const id = `${prefix}-${index}`;
      generatedIds.add(id);
      node.attributes.id = id;
    }
  }
}

/**
* Returns the index of the last element in the array where predicate is true, and -1
* otherwise.
* @param array The source array to search in
* @param predicate find calls predicate once for each element of the array, in descending
* order, until it finds one where predicate returns true. If such an element is found,
* findLastIndex immediately returns that element index. Otherwise, findLastIndex returns -1.
*/
export function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
  let l = array.length;
  while (l--) {
    if (predicate(array[l], l, array))
      return l;
  }
  return -1;
}

export class TagList {
  static fromNodes(nodes: RenderableTreeNode[]) {
    return new TagList(nodes.filter(r => Tag.isTag(r)) as Tag[]);
  }

  constructor(private tags: Tag[]) {}

  all(): Tag[] {
    return this.tags;
  }

  last(): Tag | null {
    return this.tags.length > 0
      ? this.tags[this.tags.length - 1]
      : null;
  }

  byName<N extends string>(name: N): Tag<N>[] {
    return this.tags.filter(t => t.name === name) as Tag<N>[];
  }

  isEveryOfName(name: string): boolean {
    return this.tags.every(t => t.name === name);
  }
}

export interface HeadingSection {
  heading: Node;

  body: NodeList;
}

export class NodeList {
  constructor (private nodes: Node[]) {}

  headingSections(level: number = 1): HeadingSection[] {
    const indicies: number[] = [];

    this.nodes.forEach((node, index) => {
      if (node.type === 'heading' && node.attributes.level === level) {
        indicies.push(index);
      }
    });

    return indicies.map((value, index) => {
      return {
        heading: this.nodes[value],
        body: new NodeList(this.nodes.slice(value + 1, indicies[index + 1]))
      }
    });
  }

  beforeLastOfType(type: string) {
    const i = findLastIndex(this.nodes, node => node.type === type);
    if (i > 0) {
      return new NodeList(this.nodes.slice(0, i));
    }
    return this;
  }

  afterLastOfType(type: string) {
    const i = findLastIndex(this.nodes, node => node.type === type);
    if (i > 0 && i < this.nodes.length - 1) {
      return new NodeList(this.nodes.slice(i + 1));
    }
    return new NodeList([]);
  }

  transformFlat(config: any) {
    return this.nodes.map(n => Markdoc.transform(n, config)).flat();
  }
}