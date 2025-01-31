import { ComponentMiddleware, Element, ImagoMiddleware } from "../interfaces";

const columns: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
  7: 'lg:grid-cols-7',
  8: 'lg:grid-cols-8',
  9: 'lg:grid-cols-9',
  10: 'lg:grid-cols-10',
  11: 'lg:grid-cols-11',
  12: 'lg:grid-cols-12',
}

const rows: Record<number, string> = {
  1: 'lg:grid-rows-1',
  2: 'lg:grid-rows-2',
  3: 'lg:grid-rows-3',
  4: 'lg:grid-rows-4',
  5: 'lg:grid-rows-5',
  6: 'lg:grid-rows-6',
  7: 'lg:grid-rows-7',
  8: 'lg:grid-rows-8',
  9: 'lg:grid-rows-9',
  10: 'lg:grid-rows-10',
  11: 'lg:grid-rows-11',
  12: 'lg:grid-rows-12',
}

const colspan: Record<number, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  10: 'lg:col-span-10',
  11: 'lg:col-span-11',
  12: 'lg:col-span-12',
}

const rowspan: Record<number, string> = {
  1: 'lg:row-span-1',
  2: 'lg:row-span-2',
  3: 'lg:row-span-3',
  4: 'lg:row-span-4',
  5: 'lg:row-span-5',
  6: 'lg:row-span-6',
  7: 'lg:row-span-7',
  8: 'lg:row-span-8',
  9: 'lg:row-span-9',
  10: 'lg:row-span-10',
  11: 'lg:row-span-11',
  12: 'lg:row-span-12',
}

const flow: Record<string, string> = {
  'column': 'lg:grid-flow-col',
  'row': 'lg:grid-flow-row',
  'dense': 'lg:grid-flow-dense',
  'column dense': 'lg:grid-flow-col-dense',
  'row dense': 'lg:grid-flow-row-dense',
}

const order: Record<number, string> = {
  1: 'lg:order-1',
  2: 'lg:order-2',
  3: 'lg:order-3',
  4: 'lg:order-4',
  5: 'lg:order-5',
  6: 'lg:order-6',
  7: 'lg:order-7',
  8: 'lg:order-8',
  9: 'lg:order-9',
  10: 'lg:order-10',
  11: 'lg:order-11',
  12: 'lg:order-12',
}

const gridElement: ImagoMiddleware<Element<any>> = next => ({ name, props }) => {
  let className = [];

  if (props['data-layout'] === 'grid') {
    className.push('grid');
  }
  if (props['data-columns']) {
    className.push(columns[props['data-columns']]);
  }
  if (props['data-rows']) {
    className.push(rows[props['data-rows']]);
  }
  if (props['data-flow']) {
    className.push(flow[props['data-flow']]);
  }
  if (props['data-colspan']) {
    className.push(colspan[props['data-colspan']]);
  }
  if (props['data-rowspan']) {
    className.push(rowspan[props['data-rowspan']]);
  }
  if (props['data-order']) {
    className.push(order[props['data-order']]);
  }

  const newClass = [props.className, ...className].join(' ');

  return next({ name, props: { ...props, className: newClass }});
}

export const grid: ComponentMiddleware = {
  div: gridElement,
  ul: gridElement,
  li: gridElement,
  dl: gridElement,
}
