import markdoc from '@markdoc/markdoc';
import React from 'react';
import Tashmet from '@tashmet/tashmet';
import ServerProxy from '@tashmet/proxy';
import {
  createBrowserRouter,
  RouterProvider,
  Router,
  useLocation
} from "react-router-dom";
import { JsxElement } from 'typescript';


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

export async function createRouter(components: any) {
  const tashmet = new Tashmet(new ServerProxy('http://localhost:3000'));

  await tashmet.connect()
  const db = tashmet.db('pages');
  const renderables = await db.collection('renderable').find().toArray();

  const router = createBrowserRouter(renderables.map(r => ({
    path: r._id as string,
    element: render(components, r.renderable),
  })));

  tashmet.close();

  return router;
}

export default function App({ path, components }: any): JSX.Element {
  const [content, setContent] = React.useState(null);
  const location = useLocation();

  React.useEffect(() => {
    const tashmet = new Tashmet(new ServerProxy('http://localhost:3000'));

    tashmet.connect()
      .then(async tashmet =>  {
        const db = tashmet.db('pages');
        const renderable = db.collection('renderable');

        let slug = window.location.pathname;
        if (slug !== '/' && slug.endsWith('/')) {
          slug = slug.slice(0, -1);
        }
        console.log(slug);

        const doc = await renderable.findOne({ _id: slug });
        console.log(doc);

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
  }, [location]);

  if (content) {
    return render(components, content) as JSX.Element;
  }

  return <h1>{path}</h1>;
}


//export default function App({ components, routes }: any) {
  //const router = createBrowserRouter(routes.map((r: string) => ({
    //path: r,
    //element: <App path={r} components={components}/>
  //})));

  //return (
    //<React.StrictMode>
      //<RouterProvider router={router} />
    //</React.StrictMode>
  //);
//}

  //return <h1>Loading...</h1>;
  /*
  const [content, setContent] = React.useState(null);
  const location = useLocation();

  React.useEffect(() => {
    console.log('Location changed');
  }, [location]);

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
    return render(components, content);
  }

  return <h1>Loading...</h1>
  */
//}
