import { Tailwind } from "@birdwing/imago";
import { schema } from "@birdwing/renderable";
import { PageSection } from './PageSection';
import * as ui from '../Common';

export const CallToAction = PageSection.extend(schema.CallToAction, cta => ({
  use: [Tailwind],
  properties: {
    eyebrow: 'text-6xl',
    headline: 'text-6xl',
  },
  tags: {
    pre: `min-h-full ${ui.tags.pre}`,
    ul: `mt-10 flex flex items-center gap-x-6`,
  },
  refs: cta.hasClass('split') ? {
    layout: 'gap-12',
    showcase: 'pb-12'
  } : {
    body: 'text-center',
    actions: 'text-center max-w-3xl mx-auto',
    showcase: 'pb-12'
  },
  render: ({ Slot }) => (
    <div className="bg-primary-100 dark:bg-primary-950 relative py-24 border-y border-primary-300">
      { cta.hasClass('pattern') &&
        <div className="absolute pattern top-0 bottom-0 w-full"></div> 
      }
      <ui.Container>
        <div className="relative">
          <Slot/>
        </div>
      </ui.Container>
    </div>
  )
}))
  .useComponent(schema.LinkItem, action => {
    return action.firstChild
      ? { class: ui.buttons.primary }
      : { class: ui.buttons.secondary, childAfter: <span aria-hidden="true">→</span> }
  })
  .useComponent(schema.Command, { tags: ui.tags })
