import React from 'react';
import Relay from 'react-relay';
import ReactDOM from 'react-dom';
import { browserHistory, applyRouterMiddleware, Router } from 'react-router';
import useRelay from 'react-router-relay';
import { Provider } from 'react-redux';

import configureStore from './redux/configureStore'

import '../node_modules/react-mdl/extra/material.js';
import Route from './routes/Route';

const store = configureStore()

const rootNode = document.createElement('div');
document.body.appendChild(rootNode);

ReactDOM.render(
  <Provider store={store}><Router history={browserHistory} routes={Route} render={applyRouterMiddleware(useRelay)} environment={Relay.Store} /></Provider>,
  rootNode
);
