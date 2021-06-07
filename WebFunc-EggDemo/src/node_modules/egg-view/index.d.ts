import { Application, PlainObject } from 'egg';

interface RenderOptions extends PlainObject {
  name?: string;
  root?: string;
  locals?: PlainObject;
  viewEngine?: string;
}

interface ViewBase {
  /**
   * Render a file by view engine, then set to body
   * @param {String} name - the file path based on root
   * @param {Object} [locals] - data used by template
   * @param {Object} [options] - view options, you can use `options.viewEngine` to specify view engine
   * @return {Promise<String>} result - return a promise with a render result
   */
  render(name: string, locals?: any, options?: RenderOptions): Promise<null>;

  /**
   * Render a file by view engine and return it
   * @param {String} name - the file path based on root
   * @param {Object} [locals] - data used by template
   * @param {Object} [options] - view options, you can use `options.viewEngine` to specify view engine
   * @return {Promise<String>} result - return a promise with a render result
   */
  renderView(
    name: string,
    locals?: any,
    options?: RenderOptions
  ): Promise<string>;

  /**
   * Render a template string by view engine
   * @param {String} tpl - template string
   * @param {Object} [locals] - data used by template
   * @param {Object} [options] - view options, you can use `options.viewEngine` to specify view engine
   * @return {Promise<String>} result - return a promise with a render result
   */
  renderString(
    name: string,
    locals?: any,
    options?: RenderOptions
  ): Promise<string>;
}

interface ViewManager extends Map<string, any> {
  use(name: string, viewEngine: ViewBase): void;
  resolve(name: string): Promise<string>;
}

interface ContextView extends ViewBase {
  app: Application;
  viewManager: ViewManager;
}

declare module 'egg' {
  interface Application {
    view: ViewManager;
  }

  interface Context extends ViewBase {
    /**
     * View instance that is created every request
     */
    view: ContextView;
  }

  interface EggAppConfig {
    view: {
      root: string;
      cache: boolean;
      defaultExtension: string;
      defaultViewEngine: string;
      mapping: PlainObject<string>;
    };
  }
}
