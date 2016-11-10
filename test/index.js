'use strict';

const fs = require('fs');
const chai = require('chai');
const sinon = require('sinon');
const assert = chai.assert;
sinon.assert.expose(chai.assert, {prefix: ''});

const Uploader = require('../index');

const s3Mock = {
  putObject: sinon.stub().returns({
    promise: () => Promise.resolve()
  })
}

suite('Uploader class', () => {
  let uploader;
  setup(() => {
    uploader = new Uploader({
      s3: s3Mock,
      dir: 'test/testDir',
      destination: 'testbucket',
      version: '0.1.1',
    });
  });

  suite('constructor assigns filePaths correctly', () => {
    test('when passed a directory', () => {
      assert.deepEqual(uploader.filePaths, ['test/testDir/test-asset-2.js', 'test/testDir/test-asset.js']);
    });

    test('when passed an array of filenames', () => {
      uploader = new Uploader({
        s3: s3Mock,
        files: ['test/testDir/test-asset.js'],
        destination: 'testbucket',
        version: '0.1.1',
      });
      assert.deepEqual(uploader.filePaths, ['test/testDir/test-asset.js']);
    });
  });

  suite('deployStaticFiles', () => {
    suite('with version', () => {
      test('calls deployStaticFile for versioned and latest file', () => {
        uploader = new Uploader({
          s3: s3Mock,
          files: ['test/testDir/test-asset.js'],
          destination: 'testbucket',
          version: '0.1.1',
        });
        const deployStaticFile = sinon.stub(uploader, 'deployStaticFile').returns(Promise.resolve());

        return uploader.deployStaticFiles().then((files) => {
          assert.calledTwice(deployStaticFile);
          assert.calledWith(deployStaticFile.firstCall, 'test/testDir/test-asset.js', 'testbucket/0.1.1/test-asset.js');
          assert.calledWith(deployStaticFile.secondCall, 'test/testDir/test-asset.js', 'testbucket/latest/test-asset.js');
        });
      });
    });

    suite('without version', () => {
      test('calls deployStaticFile for file', () => {
        uploader = new Uploader({
          s3: s3Mock,
          files: ['test/testDir/test-asset.js'],
          destination: 'testbucket',
        });
        const deployStaticFile = sinon.stub(uploader, 'deployStaticFile').returns(Promise.resolve());

        return uploader.deployStaticFiles().then((files) => {
          assert.calledWith(deployStaticFile, 'test/testDir/test-asset.js', 'testbucket/test-asset.js');
        });
      });
    });

    suite('with latest = false', () => {
      test('calls deployStaticFile for versioned file', () => {
        uploader = new Uploader({
          s3: s3Mock,
          files: ['test/testDir/test-asset.js'],
          destination: 'testbucket',
          latest: false,
          version: '0.1.1',
        });
        const deployStaticFile = sinon.stub(uploader, 'deployStaticFile').returns(Promise.resolve());
        return uploader.deployStaticFiles().then((files) => {
          assert.calledOnce(deployStaticFile);
          assert.calledWith(deployStaticFile, 'test/testDir/test-asset.js', 'testbucket/0.1.1/test-asset.js');
        });
      });
    });
  });

  suite('deployStaticFile', () => {
    test('calls s3.putObject with config obect', () => {
      return uploader.deployStaticFile('test/testDir/test-asset.js', 'testbucket/test-asset.js').then(() => {
        assert.calledWith(s3Mock.putObject, {
          body: fs.readFileSync('test/testDir/test-asset.js'),
          key: 'testbucket/test-asset.js',
          contentType: 'application/javascript',
        });
      });
    });
  });
});
