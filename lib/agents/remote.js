'use strict';

const WebDriverAgent = require('../WebdriverAgent');
const { WebDriver, Capabilities } = require('selenium-webdriver');
const _http = require('selenium-webdriver/http');

class RemoteAgent extends WebDriverAgent {
  constructor(options) {
    super(options);

    if (!options || typeof options.webdriverServer !== 'string') {
      throw new Error('RemoteAgent: \'webdriverServer\' is required but was ' +
        'not specified.');
    }
    this.webdriverServer = options.webdriverServer;

    if (typeof Capabilities[options.remoteType] !== 'function') {
      throw new Error('RemoteAgent: unrecognized \'remoteType\': \'' +
        options.remoteType + '\'.');
    }
    this.remoteType = options.remoteType;

    if (typeof options.hostPath === 'string') {
      throw new Error('RemoteAgent: \'hostPath\' specified.');
    }
  }

  evalScript(...args) {
    return this._driver.getCurrentUrl()
      .then(() => super.evalScript(...args));
  }

  _createDriver() {
    const url = this.hostPath;
    let client = Promise.resolve(new _http.HttpClient(this.webdriverServer))
    let executor = new _http.Executor(client);
    const ProductCapabilities = Capabilities[this.remoteType];
    let caps = ProductCapabilities();
    caps.set('platform', 'Windows 10');
    caps.set('version', '15.15063');

    return WebDriver.createSession(executor, { desired: caps, required: caps });
  }
}

module.exports = RemoteAgent;
