import markdoc from '@markdoc/markdoc';
import React from 'react';
import Tashmet from '@tashmet/tashmet';
import ServerProxy from '@tashmet/proxy';


export default function App({ components }: any) {
  const [content, setContent] = React.useState(null);

  React.useEffect(() => {
    const tashmet = new Tashmet(new ServerProxy('http://localhost:3000'));

    tashmet.connect()
      .then(async tashmet =>  {
        const db = tashmet.db('pages');
        const renderable = db.collection('renderable');

        const slug = window.location.pathname !== '/' ? window.location.pathname.slice(0, -1) : '/';

        const doc = await renderable.findOne({ _id: slug });

        if (doc) {
          setContent(doc.renderable);
        }

        const watcher = renderable.watch();

        watcher.on('change', change => {
          const doc = change.fullDocument;
          if (doc) {
            setContent(doc.renderable);
          }
        });
      });
    return () => {
      tashmet.close();
    }
  }, []);

  if (content) {
    const namespace = (name: string) => {
      if (name.includes('.')) {
        const ns = name.split('.');
        return { component: ns[0], node: ns[1] };
      } else {
        return { component: name, node: 'layout' };
      }
    }

    const result = markdoc.renderers.react(content, React, { components: (name: string) => {
      const ns = namespace(name);
      if (!(ns.component in components)) {
        throw Error(`Missing component '${ns.component}'`);
      }
      return (props: any) => components[ns.component][ns.node](props);
    }});

    return result;
  }

  return <h1>Loading...</h1>
}
