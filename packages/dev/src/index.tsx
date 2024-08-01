import markdoc from '@markdoc/markdoc';
import React from 'react';
import Tashmet, { Database } from '@tashmet/tashmet';
import ServerProxy from '@tashmet/proxy';
import {
  useLocation
} from "react-router-dom";


function render(components: any, renderable: any): React.ReactNode {
  const namespace = (name: string) => {
    if (name.includes('.')) {
      const ns = name.split('.');
      return { component: ns[0], node: ns[1] };
    } else {
      return { component: name, node: 'layout' };
    }
  }

  const result = markdoc.renderers.react(renderable, React, { components: (name: string) => {
    const ns = namespace(name);
    if (!(ns.component in components)) {
      throw Error(`Missing component '${ns.component}'`);
    }
    return (props: any) => components[ns.component][ns.node](props);
  }});

  return result;
}

export default function App({ path, components }: any): JSX.Element {
  const [content, setContent] = React.useState(null);
  const [db, setDb] = React.useState<Database | null>(null);
  const location = useLocation();
  
  React.useEffect(() => {
    if (db) {
      let slug = window.location.pathname;
      if (slug !== '/' && slug.endsWith('/')) {
        slug = slug.slice(0, -1);
      }
      db
        .collection('renderable')
        .findOne({ _id: slug })
        .then(doc => {
          if (doc) {
            setContent(doc.renderable);
          }
        });
    }

  }, [location]);

  React.useEffect(() => {
    const tashmet = new Tashmet(new ServerProxy('http://localhost:3000'));

    tashmet.connect()
      .then(async tashmet =>  {
        console.log('connected to dev server');

        const database = tashmet.db('pages');
        const renderable = database.collection('renderable');
        const devtarget = database.collection('devtarget');

        let slug = window.location.pathname;
        if (slug !== '/' && slug.endsWith('/')) {
          slug = slug.slice(0, -1);
        }

        const doc = await renderable.findOne({ _id: slug });

        if (doc) {
          setContent(doc.renderable);
        }

        const docWatcher = renderable.watch();
        const fileWatcher = devtarget.watch();

        docWatcher.on('change', change => {
          const doc = change.fullDocument;
          if (doc) {
            setContent(doc.renderable);
          }
        });
        fileWatcher.on('change', change => {
          if (change.documentKey?._id === '/main.css') {
            tashmet.close();
            window.location.reload();
          }
        });
        setDb(database);
      });
    return () => {
      tashmet.close();
    }
  }, []);

  if (content) {
    return render(components, content) as JSX.Element;
  }

  return <h1>Loading...</h1>;
}
