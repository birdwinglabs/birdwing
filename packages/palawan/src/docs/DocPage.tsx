import { createComponent } from '@birdwing/imago';
import { schema } from "@birdwing/renderable";

import { Layout } from '../Layout';
import * as ui from '../Common';

const HeadingAnchor = ({ id, children }: any) => (
  <a className="group relative border-none @5xl:-ml-2 @5xl:pl-2" href={'#' + id}>
    { children }
  </a>
)

export const Page = createComponent(schema.DocPage, node => ({
  properties: {
    name: "text-3xl font-bold dark:text-white",
    topic: "text-secondary-600 dark:text-secondary-300",
    description: "text-lg text-stone-500 dark:text-primary-100 mb-12",
  },
  refs: {
    body: 'my-16',
  },
  tags: {
    ...ui.tags,
    h1: {
      render: ({ id, Slot }) => (
        <h1 id={id} className='text-sm font-500 -mt-12 pt-16 text-primary-500 dark:text-primary-300'>
          <HeadingAnchor id={id}><Slot/></HeadingAnchor>
        </h1>
      ),
    },
    h2: {
      render: ({ id, Slot }) => (
        <h2 id={id} className='text-lg font-bold -mt-12 pt-16 dark:text-white'>
          <HeadingAnchor id={id}><Slot/></HeadingAnchor>
        </h2>
      )
    }
  },
  render: ({ Slot }) => {
    return(
      <Layout>
        <Slot property="menu"/>
        <div className="max-w-7xl mx-auto px-4 2xl:px-6 3xl:px-8">
          <nav className="hidden xl:block fixed z-20 inset-0 top-[3.8125rem] left-[max(0px,calc(50%-40rem))] right-auto w-[19rem] pb-10 pl-8 pr-6 overflow-y-auto">
            <Slot property="summary"/>
          </nav>
          <div className="xl:pl-[19.5rem]">
            <div className={`max-w-4xl mx-auto pt-10 xl:max-w-none xl:ml-0 ${node.data.headings ? '2xl:mr-[15.5rem] 2xl:pr-16' : ''}`}>
              <Slot name="body"/>
              <Slot property="pagination"/>
              <Slot property="footer"/>
            </div>
          </div>

          <Slot property="headings"/>
        </div>
      </Layout>
    )
  }
}));
