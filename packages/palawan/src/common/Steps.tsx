import { Tailwind, createComponent } from '@birdwing/imago';
import { schema } from "@birdwing/renderable";
import { tags } from '../Common';

const style = {
  marker: [
    // Layout
    "inline-block",
    "w-6 h-6",
    "p-1",

    // Decoration
    "ring-1",
    "shadow-lg",
    "rounded",

    // Text
    "text-center",
    "text-xs",
    "font-bold",

    // Color
    "text-secondary-600",
    "bg-primary-50",
    "ring-primary-300",

    // Color (Dark)
    "dark:bg-primary-800",
    "dark:text-secondary-300",
  ],
  line: [
    "absolute top-6 mt-1 left-2 ml-1 h-full",
    "border-l",
    "border-stone-300",
    "dark:border-primary-900",
  ]
}

function StepMarker({ number }: any) {
  return <div className={style.marker.join(' ')}>{ number }</div>
}

function StepLine() {
  return <div className={style.line.join(' ')}/>
}

export interface StepsOptions {
  Container: React.FunctionComponent<any>;
}

export const Steps = ({ Container }: StepsOptions) => createComponent(schema.Steps, {
  class: 'w-full',
  parent: Container,
})
  .useComponent(schema.Step, step => ({
    use: [Tailwind],
    class: '@container my-2',
    children: ({ Slot }) => (
      <div className="relative flex gap-4">
        <StepMarker number={step.index + 1}/>
        <Slot/>
      </div>
    ),
    childBefore: !step.lastChild ? <StepLine/> : undefined,
    refs: {
      main: 'flex-1',
    },
    tags,
  }));
