import Application from '@ember/application';
import Resolver from './resolver';
import loadInitializers from 'ember-load-initializers';

import config from './config/environment';

const App = Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver,

  // eslint-disable-next-line ember/avoid-leaking-state-in-ember-objects
  customEvents: {
    // prevent non-passive listeners for touchstart/touchmove events
    touchstart: null,
    touchmove: null,
  },
});

loadInitializers(App, config.modulePrefix);

export default App;
