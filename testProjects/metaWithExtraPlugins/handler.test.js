/*eslint-disable import/no-extraneous-dependencies*/
import _ from 'lodash';

import { MockPlugin, MockTracePlugin } from '../util/plugins';
import { resetEnv } from '../../util/testUtils';

const iopipe = require('./iopipe');

beforeEach(() => {
  resetEnv();
});

describe('Meta with extra plugin, no deduping', () => {
  test('Has configuration', done => {
    let inspectableInvocation;
    iopipe({
      clientId: 'foobar',
      plugins: [
        inv => {
          inspectableInvocation = inv;
          return new MockPlugin(inv);
        }
      ]
    })((event, context) => {
      try {
        const { config } = context.iopipe;
        const { plugins } = inspectableInvocation;

        expect(config.extends).toEqual({ plugins: ['@iopipe/trace'] });

        const names = _.chain(plugins)
          .map(p => p.meta.name)
          .value();

        expect(plugins).toHaveLength(2);
        expect(names).toEqual(['mock-plugin', '@iopipe/trace']);

        expect(_.isFunction(context.iopipe.mark.start)).toBe(true);

        done();
      } catch (err) {
        throw err;
      }
    })({}, {});
  });
});

describe('Meta with extra plugin, dedupes trace plugin', () => {
  /* When a consumer provides their own plugins, the plugins should be deduped via the meta.name string. If a consumer provides a duplicate with the same meta.name, their plugin should be used instead of the default. */

  test('Has configuration', done => {
    let inspectableInvocation;
    iopipe({
      clientId: 'foobar',
      plugins: [
        inv => {
          inspectableInvocation = inv;
          return new MockPlugin(inv);
        },
        inv => new MockTracePlugin(inv)
      ]
    })((event, context) => {
      try {
        const { config } = context.iopipe;
        const { plugins } = inspectableInvocation;

        expect(config.extends).toEqual({ plugins: ['@iopipe/trace'] });

        const names = _.chain(plugins)
          .map(p => p.meta.name)
          .value();

        expect(plugins).toHaveLength(2);
        expect(names).toEqual(['mock-plugin', '@iopipe/trace']);
        expect(plugins[1].meta.version).toBe('mocked-trace');

        done();
      } catch (err) {
        throw err;
      }
    })({}, {});
  });
});
