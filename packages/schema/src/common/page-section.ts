import { Node, Schema, Tag, NodeType } from "@markdoc/markdoc";
import { Match, TransformOptions } from "../interfaces.js";

export function transformBody(nodes: Node[], ns: string | undefined) {

}


export function processBodyNodes(nodes: Node[], ns: string | undefined = undefined) {
  let headline = false;
  let name = false;
  let image = false;

  nodes.forEach((n, i) => {
    //if (!image && n.type === 'paragraph')
    if (n.type === 'paragraph') {
      //console.log(n.children);
    }

    if (!name && !headline && n.type === 'paragraph' && n.children.every(c => c.type === 'text')) {
      n.attributes.property = ns ? `${ns}:name` : 'name';
      name = true;
    } else if (n.type === 'heading' && !headline) {
      n.attributes.property = ns ? `${ns}:headline` : 'headline';
      headline = true;
    } else if (n.type === 'paragraph') {
      n.attributes.property = ns ? `${ns}:description` : 'description';
    }
  });

  return nodes;
}

export function headline(property: string = 'headline'): TransformOptions {
  return {
    match: ({ node }) => node.type === 'heading',
    property,
  }
}

function matchOnlyText(type: NodeType) {
  return ({ node }: Match) => node.type === type && Array
      .from(node.walk())
      .every(n => n.type === 'inline' || n.type === 'text');
}

export function description(property: string = 'description'): TransformOptions {
  return {
    match: matchOnlyText('paragraph'),
    property,
  }
}

export function image(property: string = 'image'): TransformOptions {
  return {
    match: ({ node }) => node.type === 'paragraph' && Array.from(node.walk()).some(n => n.type === 'image'),
    input: node => Array.from(node.walk()).find(n => n.type === 'image'),
    property,
  }
}
