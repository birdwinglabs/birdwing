import Markdoc, { Ast, Config, Node, RenderableTreeNode, RenderableTreeNodes, Schema, Tag } from '@markdoc/markdoc';
import { FactoryOptions, Group, NodeContext, NodeFilter, NodeFilterOptions, PipeOptions, Projection, PropertyAnnotation, PropertyAttributeOptions, PropertyTransform, TagFilter, TransformResult } from './interfaces.js';
import { ComponentType, Type } from '@birdwing/renderable';
import * as renderable from '@birdwing/renderable';



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

  start: number;

  end: number;
}

function *walkTag(tag: Tag): Generator<RenderableTreeNode> {
  for (const child of tag.children) {
    yield child;
    if (Tag.isTag(child)) {
      yield* walkTag(child);
    }
  }
}

export function headingsToList(level: number = 1) {
  return (nodes: Node[]) => {
    let start: number | undefined;
    const list = new Ast.Node('list');
    const head: Node[] = [];

    nodes.forEach((node, index) => {
      if (node.type === 'heading' && node.attributes.level === level) {
        list.children.push(new Ast.Node('item', {}, [node]));
        start = index;
      } else if (start === undefined) {
        head.push(node);
      } else {
        const lastItem = list.children.at(-1);
        if (lastItem) {
          lastItem.children.push(node);
        }
      }
    });

    return [...head, list];
  }
}

//export function listsToTabGroups() {
  //return (nodes: Node[]) => {
    //nodes.forEach(n => )
  //}
//}

export class NodeList {
  constructor (private nodes: Node[]) {}

  all() {
    return this.nodes;
  }

  filter(predicate: (value: Node, index: number) => boolean) {
    return new NodeList(this.nodes.filter(predicate));
  }

  *walk() {
    for (const node of this.nodes) {
      for (const child of node.walk()) {
        yield child;
      }
    }
  }

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
        body: new NodeList(this.nodes.slice(value + 1, indicies[index + 1])),
        start: value,
        end: indicies[index + 1],
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

  indexOfComment(comment: string) {
    return this.nodes.findIndex(node => node.type === 'comment' && node.attributes.content === comment)
  }

  commentSections(comments: string[] = [], unmatched?: string) {
    if (comments.length === 0) {
      comments = this.nodes.filter(n => n.type === 'comment').map(n => n.attributes.content);
    }

    const indicies = comments.reduce((res, comment) => {
      res[comment] = this.indexOfComment(comment);
      return res;
    }, {} as Record<string, number>);

    const firstIndex = Math.min(...Object.values(indicies).filter(v => v >= 0));

    return Object.entries(indicies).reduce((res, [comment, index]) => {
      if (index < 0) {
        res[comment] = comment === unmatched
          ? new NodeList(this.nodes.slice(0, firstIndex))
          : new NodeList([]);
      } else {
        res[comment] = new NodeList(this.nodes.slice(index, Object.values(indicies).find(v => v > index)));
      }
      return res;
    }, {} as Record<string, NodeList>);
  }

  splitByHr() {
    const indicies: number[] = [-1];

    this.nodes.forEach((node, index) => {
      if (node.type === 'hr') {
        indicies.push(index);
      }
    });

    return indicies.map((value, index) => {
      return {
        body: new NodeList(this.nodes.slice(value + 1, indicies[index + 1])),
        start: value,
        end: indicies[index + 1],
      }
    });
  }

  beforeComment(comment: string) {
    return this.sliceBefore(this.indexOfComment(comment));
  }

  afterComment(comment: string) {
    return this.sliceAfter(this.indexOfComment(comment));
  }

  transformFlat(config: any) {
    return this.nodes.map(n => Markdoc.transform(n, config)).flat();
  }

  private sliceBefore(index: number) {
    if (index > 0) {
      return new NodeList(this.nodes.slice(0, index));
    }
    return new NodeList(this.nodes);
  }

  private sliceAfter(index: number) {
    if (index > 0) {
      return new NodeList(this.nodes.slice(index + 1));
    }
    return new NodeList([]);
  }
}

function isFilterMatching(n: Node, match: NodeFilter) {
  if (typeof match === 'function') {
    return match(n);
  }

  const filter: NodeFilterOptions = typeof match === 'string' ? { node: match } : match;
  if (filter.node && n.type !== filter.node) {
    return false;
  }
  if (filter.descendant && !Array.from(n.walk()).some(n => n.type === filter.descendant)) {
    return false;
  }
  return true;
}


//function findTags(filter: TagFilter<any>, output: TransformResult[], group: string | undefined = undefined): Tag[] {
  //let tags = output
    //.filter(r => group !== undefined ? r.group === group : r.group === undefined)
    //.map(r => r.output)
    //.flat()
    //.filter(t => Tag.isTag(t));

  //return filterTags(tags, filter);
//}


function *walkNode(node: Node): Generator<NodeContext> {
  for (const child of node.children) {
    yield { node: child, parent: node, section: undefined };
    yield* walkNode(child);
  }
}

//function filterNodes(nodes: NodeContext[], filter: NodeFilterOptions) {
  //if (filter.deep) {
    //nodes = nodes.map(n => Array.from(walkNode(n.node))).flat();
  //}

  //if (filter.node) {
    //nodes = nodes.filter(n => n.node.type === filter.node);
  //}

  //if (filter.descendant) {
    //nodes = nodes.filter(n => Array.from(walkNode(n.node)).some(d => d.node.type === filter.descendant));
  //}

  //return filter.limit !== undefined ? nodes.slice(0, filter.limit) : nodes;
//}

function filterTags(nodes: RenderableTreeNode[], filter: TagFilter<any>) {
  let tags = nodes.filter(t => Tag.isTag(t));

  if (filter.deep) {
    tags = tags.map(t => Array.from(walkTag(t))).flat().filter(t => Tag.isTag(t));
  }

  tags = tags.filter(t => t.name === filter.tag);

  if (filter.attributes) {
    tags = tags.filter(t => Object.entries(filter.attributes || {}).every(([k,v]) => t.attributes[k] === v))
  }

  if (filter.limit !== undefined) {
    return tags.slice(0, 1);
  }
  return tags;
}

export class Factory<T extends ComponentType<object>> {
  constructor(
    private type: string,
    private options: FactoryOptions<T["schema"], T>
  ) {}

  createTag(node: Node, config: Config): Tag<T["tag"]> {
    const attr = { typeof: this.type, property: this.options.property, class: this.options.class };
    if (this.options.nodes) {
      for (const nt of this.options.nodes) {
        node.children = nt(node.children);
      }
    }
    const tRes = this.transform(node, config);

    const children = this.options.project && this.options.groups
      ? this.options.project(new Projection(tRes))
      : tRes.map(r => r.output).flat();

    return new Tag(this.options.tag, attr, Array.isArray(children) ? children : [children]);
  }

  private transform(node: Node, config: Config) {
    const groups: Record<string, NodeContext[]> = {};
    let section = 0;
    let groupIndex: number | undefined = undefined;
    let result: TransformResult[] = [];
    const attr = node.transformAttributes(config);

    const makeSchema = (tr: any) => {
      return typeof tr === 'string'
        ? { render: tr }
        : { transform(node, config) { return tr(node, config); }} as Schema;
    }

    const extraNodes: any = {};
    for (const [name, t] of Object.entries(this.options.transforms || {})) {
      extraNodes[name] = makeSchema(t);
    }

    const cfg = { ...config, nodes: { ...config.nodes, ...extraNodes } };

    for (const g of this.options.groups || []) {
      groups[g.name] = [];
    }
    groups['$default'] = [];

    for (const c of node.children) {
      if (c.type === 'hr') {
        section++;
        continue;
      }
      groupIndex = this.getGroupIndex(c, groupIndex, section);
      const groupName = groupIndex !== undefined && this.options.groups
        ? this.options.groups[groupIndex].name
        :  '$default';
      
      groups[groupName].push({ node: c, parent: node, section });
    }

    //for (const g of this.options.groups || []) {
      //if (g.clone && groups[g.clone]) {
        //groups[g.name] = groups[g.clone];
      //}
    //}
    
    //for (const [property, t] of Object.entries(this.options.properties || {})) {
      //const transformer = t as PropertyTransform<any>;

      //if (transformer.group && groups[transformer.group]) {
        //transformer.preProcess(property, groups[transformer.group]);
      //} else if (!transformer.group) {
        //transformer.preProcess(property, (groups['$default'] || []));
      //}
    //}

    for (const group of this.options.groups || [{ name: '$default' }]) {
      const groupNodes: any = {};
      for (const [name, t] of Object.entries(group.transforms || {})) {
        groupNodes[name] = makeSchema(t);
      }
      const groupCfg = { ...cfg, nodes: { ...cfg.nodes, ...groupNodes } };

      if (group.facets) {
        for (const f of group.facets) {
          const facetNodes: any = {};
          for (const [name, t] of Object.entries(f.transforms || {})) {
            facetNodes[name] = makeSchema(t);
          }
          const facetCfg = { ...groupCfg, nodes: { ...groupCfg.nodes, ...facetNodes } };

          groups[group.name].forEach(n => {
            result.push({
              group: group.name !== '$default' ? [group.name, f.name] : [],
              section: n.section || 0,
              output: n.node.transform(facetCfg) as RenderableTreeNodes,
            });
          })
        }
      } else {
        groups[group.name].forEach(n => {
          result.push({
            group: group.name !== '$default' ? [group.name] : [],
            section: n.section || 0,
            output: n.node.transform(groupCfg) as RenderableTreeNodes,
          });
        });
      }
    }

    // TODO: After output?
    for (const [property, t] of Object.entries(this.options.properties || {})) {
      const transformer = t as PropertyTransform<any>;

      transformer.postProcess(property, result, attr);
    }

    for (const group of this.options.groups || [{ name: '$default' }]) {
      if (group.facets) {
        for (const f of group.facets) {
          if (f.output) {
            const groupStart = result.findIndex(r => r.group.includes(f.name));
            const groupItems = result.filter(r => r.group.includes(f.name));
            const nodes = groupItems.map(r => r.output).flat();
            result.splice(groupStart, groupItems.length, {
              group: [group.name, f.name],
              section: 0,
              output: f.output(nodes),
            });
          }
        }
      }

      if (group.output) {
        const groupStart = result.findIndex(r => r.group.includes(group.name));
        const groupItems = result.filter(r => r.group.includes(group.name));
        const nodes = groupItems.map(r => r.output).flat();
        result.splice(groupStart, groupItems.length, {
          group: [group.name],
          section: 0,
          output: group.output(nodes),
        });
      }
    }

    return result;
  }

  private isInGroup(node: Node, group: Group, section: number) {
    if (group.section !== undefined && group.section !== section) {
      return false;
    }
    if (group.include) {
      return group.include.some(g => isFilterMatching(node, g));
    }
    return true;
  }

  private getGroupIndex(node: Node, previousGroup: number | undefined, section: number) {
    const groups = this.options.groups;
    if (!groups) {
      return undefined;
    }
    for (let i = previousGroup || 0; i<groups.length; i++) {
      if (this.isInGroup(node, groups[i], section)) {
        return i;
      }
    }
    return undefined;
  }
}

export function createFactory<T extends ComponentType<object>>(type: Type<T>, options: FactoryOptions<T["schema"], T>) {
  return new Factory(type.name, options);
} 

export class PropertyAnnotator<T extends renderable.NodeType> extends PropertyTransform<T> {
  constructor(private options: PropertyAnnotation<T>) { super(); }

  get group(): string | undefined {
    return this.options.group;
  }

  postProcess(property: string, result: TransformResult[], attr: Record<string, any>) {
    const { match, ns } = this.options;

    const filter = typeof match === 'string' ? { tag: match } : match;
    const tags = filterTags(result
      .filter(r => this.options.group !== undefined ? r.group.includes(this.options.group) : r.group.length === 0)
      .map(r => r.output)
      .flat(), filter);
    for (const t of tags) {
      t.attributes.property = ns ? `${ns}:${property}` : property;
    }
  }
}

export class PropertyAttribute<T extends renderable.NodeType> extends PropertyTransform<T> {
  constructor(private options: PropertyAttributeOptions<T>) { super(); }

  get group(): string | undefined {
    return this.options.group;
  }

  postProcess(p: string, result: TransformResult[], attr: Record<string, any>) {
    const { tag, ns } = this.options;

    let output: Tag;
    const property = ns ? `${ns}:${p}` : p

    switch (tag) {
      case 'meta':
        output = new Tag('meta', { content: attr[p], property });
        break;
      default:
        output = new Tag(tag, { property }, [attr[p]]);
    }

    result.push({
      group: this.options.group ? [this.options.group] : [],
      section: 0,
      output,
    })
  }
}

//export class PropertyTransformer<T extends renderable.NodeType> extends PropertyTransform<T> {
  //constructor(private options: PropertyTransformation<T>) { super(); }

  //get group(): string | undefined {
    //return this.options.group;
  //}

  //preProcess(property: string, nodes: NodeContext[]): void {
    //const { match, transform, replace } = this.options;

    //if (match) {
      //const filter = typeof this.options.match === 'string' ? { node: this.options.match } : this.options.match;
      //filterNodes(nodes, filter).forEach(n => {
        //if (typeof transform === 'function') {
          //const target = n.node;


          //const t: TransformFunction<any> = (node, config) => {
            //const tags = config.tags;

            //if (tags) {
              //ensureFunctions(tags['music-recording']);
            //}
            //return transform(node, config);
          //};

          //n.node.type = 'tag';
          //n.node.tag = 'proxy'
          //n.node.attributes = {
            //node: target,
            //property,
            //transform: t,
          //};
        //} else if (typeof transform === 'string') {
          //const next = n.node.transform;
          //n.node.transform = (config) => {
            //const res = next.apply(n.node, config);
            //if (Tag.isTag(res)) {
              //res.name = transform;
              //res.attributes.property = property;
            //}
            //return res;
          //}
        //} else if (replace) {
          //const i = n.parent.children.findIndex(v => v === n.node);
          //n.parent.children = n.parent.children.slice()
          //n.parent.children.splice(i, 1, replace(n.node));
          ////console.log(n.parent.children);
        //}
      //})
    //}
  //}
//}

export function tag<T extends renderable.NodeType>(options: PropertyAnnotation<T>) {
  return new PropertyAnnotator<T>(options);
}

//export function selectNode<T extends renderable.NodeType>(options: PropertyTransformation<T>) {
  //return new PropertyTransformer<T>(options);
//}

export function attribute<T extends renderable.NodeType>(options: PropertyAttributeOptions<T>) {
  return new PropertyAttribute<T>(options);
}

//export function transformAttribute<T extends renderable.NodeType>(options: PropertyTransformation<T>) {
  //return new PropertyTransformer<T>(options);
//}
