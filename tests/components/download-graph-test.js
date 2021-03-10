import { click, render, settled, waitFor } from '@ember/test-helpers';
import { module, test } from 'qunit';

import Service from '@ember/service';
import { defer } from 'rsvp';

import { hbs } from 'ember-cli-htmlbars';
import { task } from 'ember-concurrency';
import window from 'ember-window-mock';
import { setupWindowMock } from 'ember-window-mock/test-support';
import timekeeper from 'timekeeper';

import { setupRenderingTest } from 'cargo/tests/helpers';

import { toChartData } from '../../components/download-graph';
import ChartJsLoader from '../../services/chartjs';

module('Component | DownloadGraph', function (hooks) {
  setupRenderingTest(hooks);
  setupWindowMock(hooks);

  test('happy path', async function (assert) {
    this.data = exampleData();

    await render(hbs`<DownloadGraph @data={{this.data}} />`);
    assert.dom('[data-test-download-graph]').exists();
    assert.dom('[data-test-download-graph] [data-test-spinner]').doesNotExist();
    assert.dom('[data-test-download-graph] canvas').exists();
    assert.dom('[data-test-download-graph] [data-test-error]').doesNotExist();
  });

  test('loading spinner', async function (assert) {
    this.data = exampleData();

    let deferred = defer();

    class MockService extends ChartJsLoader {
      constructor() {
        super(...arguments);
        this.originalLoadTask = this.loadTask;
        this.loadTask = this.mockLoadTask;
      }

      @(task(function* () {
        yield deferred.promise;
        return yield this.originalLoadTask.perform();
      }).drop())
      mockLoadTask;
    }

    this.owner.register('service:chartjs', MockService);

    render(hbs`<DownloadGraph @data={{this.data}} />`);
    await waitFor('[data-test-download-graph] [data-test-spinner]');
    assert.dom('[data-test-download-graph]').exists();
    assert.dom('[data-test-download-graph] [data-test-spinner]').exists();
    assert.dom('[data-test-download-graph] canvas').doesNotExist();
    assert.dom('[data-test-download-graph] [data-test-error]').doesNotExist();

    deferred.resolve();
    await settled();
    assert.dom('[data-test-download-graph]').exists();
    assert.dom('[data-test-download-graph] [data-test-spinner]').doesNotExist();
    assert.dom('[data-test-download-graph] canvas').exists();
    assert.dom('[data-test-download-graph] [data-test-error]').doesNotExist();
  });

  test('error behavior', async function (assert) {
    class MockService extends Service {
      // eslint-disable-next-line require-yield
      @(task(function* () {
        throw new Error('nope');
      }).drop())
      loadTask;
    }

    this.owner.register('service:chartjs', MockService);

    await render(hbs`<DownloadGraph @data={{this.data}} />`);
    assert.dom('[data-test-download-graph]').exists();
    assert.dom('[data-test-download-graph] [data-test-spinner]').doesNotExist();
    assert.dom('[data-test-download-graph] canvas').doesNotExist();
    assert.dom('[data-test-download-graph] [data-test-error]').exists();

    window.location.reload = () => assert.step('reload');
    await click('[data-test-download-graph] [data-test-reload]');
    assert.verifySteps(['reload']);
  });

  module('toChartData()', function () {
    test('converts raw download data to Chart.js format', function (assert) {
      timekeeper.travel(new Date('2020-12-30T12:34:56Z'));

      let data = exampleData();
      let result = toChartData(data);
      assert.deepEqual(result, {
        datasets: [
          {
            backgroundColor: '#d3b5bc',
            borderColor: '#67001f',
            borderWidth: 2,
            cubicInterpolationMode: 'monotone',
            data: [
              { x: new Date('2020-12-30T12:34:56Z'), y: 30520 },
              { x: new Date('2020-12-29T12:34:56Z'), y: 31631 },
              { x: new Date('2020-12-28T12:34:56Z'), y: 0 },
            ],
            label: '1.0.56',
            pointHoverBorderWidth: 2,
            pointHoverRadius: 5,
          },
          {
            backgroundColor: '#eabdc0',
            borderColor: '#b2182b',
            borderWidth: 2,
            cubicInterpolationMode: 'monotone',
            data: [
              { x: new Date('2020-12-30T12:34:56Z'), y: 3702 },
              { x: new Date('2020-12-29T12:34:56Z'), y: 4157 },
              { x: new Date('2020-12-28T12:34:56Z'), y: 2414 },
              { x: new Date('2020-12-27T12:34:56Z'), y: 15713 },
              { x: new Date('2020-12-26T12:34:56Z'), y: 0 },
            ],
            label: '1.0.55',
            pointHoverBorderWidth: 2,
            pointHoverRadius: 5,
          },
          {
            backgroundColor: '#f3d0ca',
            borderColor: '#d6604d',
            borderWidth: 2,
            cubicInterpolationMode: 'monotone',
            data: [
              { x: new Date('2020-12-30T12:34:56Z'), y: 4298 },
              { x: new Date('2020-12-29T12:34:56Z'), y: 4277 },
              { x: new Date('2020-12-28T12:34:56Z'), y: 2786 },
              { x: new Date('2020-12-27T12:34:56Z'), y: 2477 },
              { x: new Date('2020-12-26T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-25T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-24T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-23T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-22T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-21T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-20T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-19T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-18T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-17T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-16T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-15T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-14T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-13T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-12T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-11T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-10T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-09T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-08T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-07T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-06T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-05T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-04T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-03T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-02T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-01T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-30T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-29T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-28T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-27T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-26T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-25T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-24T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-23T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-22T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-21T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-20T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-19T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-18T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-17T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-16T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-15T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-14T12:34:56Z'), y: 0 },
            ],
            label: '1.0.54',
            pointHoverBorderWidth: 2,
            pointHoverRadius: 5,
          },
          {
            backgroundColor: '#fce4d9',
            borderColor: '#f4a582',
            borderWidth: 2,
            cubicInterpolationMode: 'monotone',
            data: [
              { x: new Date('2020-12-30T12:34:56Z'), y: 2228 },
              { x: new Date('2020-12-29T12:34:56Z'), y: 1650 },
              { x: new Date('2020-12-28T12:34:56Z'), y: 968 },
              { x: new Date('2020-12-27T12:34:56Z'), y: 873 },
              { x: new Date('2020-12-26T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-25T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-24T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-23T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-22T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-21T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-20T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-19T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-18T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-17T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-16T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-15T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-14T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-13T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-12T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-11T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-10T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-09T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-08T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-07T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-06T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-05T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-04T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-03T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-02T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-01T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-30T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-29T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-28T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-27T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-26T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-25T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-24T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-23T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-22T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-21T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-20T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-19T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-18T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-17T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-16T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-15T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-14T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-13T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-12T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-11T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-10T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-09T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-08T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-07T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-06T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-05T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-04T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-03T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-02T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-01T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-31T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-30T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-29T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-28T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-27T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-26T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-25T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-24T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-23T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-22T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-21T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-20T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-19T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-18T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-17T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-16T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-15T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-14T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-13T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-12T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-11T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-10T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-09T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-08T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-07T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-06T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-05T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-04T11:34:56Z'), y: 0 },
            ],
            label: '1.0.53',
            pointHoverBorderWidth: 2,
            pointHoverRadius: 5,
          },
          {
            backgroundColor: '#deedf5',
            borderColor: '#92c5de',
            borderWidth: 2,
            cubicInterpolationMode: 'monotone',
            data: [
              { x: new Date('2020-12-30T12:34:56Z'), y: 201 },
              { x: new Date('2020-12-29T12:34:56Z'), y: 261 },
              { x: new Date('2020-12-28T12:34:56Z'), y: 181 },
              { x: new Date('2020-12-27T12:34:56Z'), y: 186 },
              { x: new Date('2020-12-26T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-25T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-24T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-23T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-22T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-21T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-20T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-19T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-18T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-17T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-16T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-15T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-14T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-13T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-12T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-11T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-10T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-09T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-08T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-07T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-06T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-05T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-04T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-03T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-02T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-01T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-30T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-29T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-28T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-27T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-26T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-25T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-24T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-23T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-22T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-21T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-20T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-19T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-18T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-17T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-16T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-15T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-14T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-13T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-12T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-11T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-10T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-09T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-08T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-07T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-06T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-05T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-04T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-03T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-02T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-01T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-31T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-30T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-29T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-28T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-27T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-26T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-25T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-24T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-23T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-22T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-21T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-20T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-19T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-18T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-17T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-16T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-15T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-14T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-13T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-12T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-11T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-10T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-09T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-08T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-07T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-06T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-05T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-04T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-03T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-02T11:34:56Z'), y: 0 },
            ],
            label: '1.0.52',
            pointHoverBorderWidth: 2,
            pointHoverRadius: 5,
          },
          {
            backgroundColor: '#c9deed',
            borderColor: '#4393c3',
            borderWidth: 2,
            cubicInterpolationMode: 'monotone',
            data: [
              { x: new Date('2020-12-30T12:34:56Z'), y: 36745 },
              { x: new Date('2020-12-29T12:34:56Z'), y: 33242 },
              { x: new Date('2020-12-28T12:34:56Z'), y: 19981 },
              { x: new Date('2020-12-27T12:34:56Z'), y: 19064 },
              { x: new Date('2020-12-26T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-25T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-24T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-23T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-22T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-21T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-20T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-19T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-18T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-17T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-16T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-15T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-14T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-13T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-12T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-11T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-10T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-09T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-08T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-07T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-06T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-05T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-04T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-03T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-02T12:34:56Z'), y: 0 },
              { x: new Date('2020-12-01T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-30T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-29T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-28T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-27T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-26T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-25T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-24T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-23T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-22T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-21T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-20T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-19T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-18T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-17T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-16T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-15T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-14T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-13T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-12T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-11T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-10T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-09T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-08T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-07T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-06T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-05T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-04T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-03T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-02T12:34:56Z'), y: 0 },
              { x: new Date('2020-11-01T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-31T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-30T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-29T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-28T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-27T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-26T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-25T12:34:56Z'), y: 0 },
              { x: new Date('2020-10-24T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-23T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-22T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-21T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-20T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-19T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-18T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-17T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-16T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-15T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-14T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-13T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-12T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-11T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-10T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-09T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-08T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-07T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-06T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-05T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-04T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-03T11:34:56Z'), y: 0 },
              { x: new Date('2020-10-02T11:34:56Z'), y: 0 },
            ],
            label: 'Other',
            pointHoverBorderWidth: 2,
            pointHoverRadius: 5,
          },
        ],
      });
    });
  });
});

function exampleData() {
  let FIVE_2 = { num: '1.0.52', created_at: new Date('2020-10-01') };
  let FIVE_3 = { num: '1.0.53', created_at: new Date('2020-10-05') };
  let FIVE_4 = { num: '1.0.54', created_at: new Date('2020-11-15') };
  let FIVE_5 = { num: '1.0.55', created_at: new Date('2020-12-27') };
  let FIVE_6 = { num: '1.0.56', created_at: new Date('2020-12-29') };

  let downloads = [
    { version: FIVE_2, date: '2020-12-30', downloads: 201 },
    { version: FIVE_3, date: '2020-12-30', downloads: 2228 },
    { version: FIVE_4, date: '2020-12-30', downloads: 4298 },
    { version: FIVE_5, date: '2020-12-30', downloads: 3702 },
    { version: FIVE_6, date: '2020-12-30', downloads: 30520 },
    { version: FIVE_2, date: '2020-12-29', downloads: 261 },
    { version: FIVE_3, date: '2020-12-29', downloads: 1650 },
    { version: FIVE_4, date: '2020-12-29', downloads: 4277 },
    { version: FIVE_5, date: '2020-12-29', downloads: 4157 },
    { version: FIVE_6, date: '2020-12-29', downloads: 31631 },
    { version: FIVE_2, date: '2020-12-28', downloads: 181 },
    { version: FIVE_3, date: '2020-12-28', downloads: 968 },
    { version: FIVE_4, date: '2020-12-28', downloads: 2786 },
    { version: FIVE_5, date: '2020-12-28', downloads: 2414 },
    { version: FIVE_2, date: '2020-12-27', downloads: 186 },
    { version: FIVE_3, date: '2020-12-27', downloads: 873 },
    { version: FIVE_4, date: '2020-12-27', downloads: 2477 },
    { version: FIVE_5, date: '2020-12-27', downloads: 15713 },
  ];

  downloads.content = {
    meta: {
      extra_downloads: [
        { date: '2020-12-30', downloads: 36745 },
        { date: '2020-12-29', downloads: 33242 },
        { date: '2020-12-28', downloads: 19981 },
        { date: '2020-12-27', downloads: 19064 },
      ],
    },
  };

  return downloads;
}
