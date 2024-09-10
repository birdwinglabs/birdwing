import React from 'react';
import Tashmet, { Database } from '@tashmet/tashmet';
import { Renderer } from '@aetlan/renderer';
import ServerProxy from '@tashmet/proxy';
import {
  useLocation
} from "react-router-dom";


export default function App({ path, components }: any): JSX.Element {
  const [content, setContent] = React.useState(null);
  const [db, setDb] = React.useState<Database | null>(null);
  const location = useLocation();

  const renderer = new Renderer(components);
  
  React.useEffect(() => {
    if (db) {
      let slug = window.location.pathname;
      if (slug !== '/' && slug.endsWith('/')) {
        slug = slug.slice(0, -1);
      }
      db
        .collection('routes')
        .findOne({ url: slug })
        .then(doc => {
          if (doc) {
            setContent(doc.tag);
          }
        });
    }

  }, [location]);

  function currentUrl() {
    let path = window.location.pathname;
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    return path;
  }

  React.useEffect(() => {
    const tashmet = new Tashmet(new ServerProxy('http://localhost:3000'));

    tashmet.connect()
      .then(async tashmet =>  {
        console.log('connected to dev server');

        const database = tashmet.db('aetlan');
        const routes = database.collection('routes');
        const devtarget = database.collection('target');

        const doc = await routes.findOne({ url: currentUrl() });

        if (doc) {
          setContent(doc.tag);
        }

        const docWatcher = routes.watch();
        const fileWatcher = devtarget.watch();

        docWatcher.on('change', change => {
          const doc = change.fullDocument;
          if (doc && doc.url === currentUrl()) {
            setContent(doc.tag);
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
    return renderer.render(content) as JSX.Element;
  }

  return <h1>Loading...</h1>;
}
