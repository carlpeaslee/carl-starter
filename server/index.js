/* eslint-disable no-console, no-shadow */
import path from 'path';
import webpack from 'webpack';
import express from 'express';
import graphQLHTTP from 'express-graphql';
import WebpackDevServer from 'webpack-dev-server';
import historyApiFallback from 'connect-history-api-fallback';
import chalk from 'chalk';
import webpackConfig from '../webpack.config';
import config from './config/environment';
import schema from './data/schema';
import { renderToString } from 'react-dom/server';


if (config.env === 'development') {
  // Launch GraphQL
  const graphql = express();
  graphql.use('/', graphQLHTTP({
    graphiql: true,
    pretty: true,
    schema
  }));
  graphql.listen(config.graphql.port, () => console.log(chalk.green(`GraphQL is listening on port ${config.graphql.port}`)));

  // Launch Relay by using webpack.config.js
  const relayServer = new WebpackDevServer(webpack(webpackConfig), {
    contentBase: '/build/',
    proxy: {
      '/graphql': `http://localhost:${config.graphql.port}`
    },
    stats: {
      colors: true
    },
    hot: true,
    historyApiFallback: true
  });


  // initialize the server and configure support for ejs templates
  graphql.set('view engine', 'ejs');
  graphql.set('views', path.join(__dirname, 'views'));

  // define the folder that will be used for static assets
  graphql.use('/', express.static(path.join(__dirname, '../build')));

  // universal routing and rendering
  graphql.get('*', (req, res) => {
    match(
      { routes, location: req.url },
      (err, redirectLocation, renderProps) => {

        // in case of error display the error message
        if (err) {
          return res.status(500).send(err.message);
        }

        // in case of redirect propagate the redirect to the browser
        if (redirectLocation) {
          return res.redirect(302, redirectLocation.pathname + redirectLocation.search);
        }

        // generate the React markup for the current route
        let markup;
        if (renderProps) {
          // if the current route matched we have renderProps
          markup = renderToString(<RouterContext {...renderProps}/>);
        } else {
          // otherwise we can render a 404 page
          markup = renderToString(<NotFoundPage/>);
          res.status(404);
        }

        // render the index template with the embedded React markup
        return res.render('index', { markup });
      }
    );
  });

  // Serve static resources
  relayServer.listen(config.port, () => console.log(chalk.green(`Relay is listening on port ${config.port}`)));
} else if (config.env === 'production') {
  // Launch Relay by creating a normal express server
  const relayServer = express();
  relayServer.use(historyApiFallback());

  // initialize the server and configure support for ejs templates
  relayServer.set('view engine', 'ejs');
  relayServer.set('views', path.join(__dirname, 'views'));

  // define the folder that will be used for static assets
  relayServer.use('/', express.static(path.join(__dirname, '../build')));

  // universal routing and rendering
  relayServer.get('*', (req, res) => {
    match(
      { routes, location: req.url },
      (err, redirectLocation, renderProps) => {

        // in case of error display the error message
        if (err) {
          return res.status(500).send(err.message);
        }

        // in case of redirect propagate the redirect to the browser
        if (redirectLocation) {
          return res.redirect(302, redirectLocation.pathname + redirectLocation.search);
        }

        // generate the React markup for the current route
        let markup;
        if (renderProps) {
          // if the current route matched we have renderProps
          markup = renderToString(<RouterContext {...renderProps}/>);
        } else {
          // otherwise we can render a 404 page
          markup = renderToString(<NotFoundPage/>);
          res.status(404);
        }

        // render the index template with the embedded React markup
        return res.render('index', { markup });
      }
    );
  });



  relayServer.use('/graphql', graphQLHTTP({ schema }));
  relayServer.listen(config.port, () => console.log(chalk.green(`Relay is listening on port ${config.port}`)));
}
