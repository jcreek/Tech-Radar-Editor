import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';

export const techRadarEditorPlugin = createBackendPlugin({
  pluginId: 'tech-radar-editor',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
      },
      async init({ httpRouter, logger, config }) {
        const router = await createRouter({ logger, config });
        httpRouter.use(router);
      },
    });
  },
});
