"use strict";

const path = require('path');
const request = require('request');
const fs = require('fs');
const mime = require('mime-types');
const exec = require('child_process').exec;
const defaultContentType = 'application/javascript';

const getContentType = function(filePath) {
  return mime.lookup(filePath) || defaultContentType;
}

const run = function (cmd) {
  return new Promise(function (resolve, reject) {
    exec(cmd, function (error, stdout, stderr) {
      if (error) {
        reject(error);
      }
      if (stdout) {
        console.log(stdout);
      }
      if (stderr) {
        console.error(stderr);
      }
      resolve(stdout, stderr);
    });
  });
}


/**
 * @param {Object} config
 * @param {S3} config.s3 - aws s3 instance
 * @param {Array} config.files - array of file paths to upload
 * @param {String} config.dir - directory to upload all files from
 * @param {String} config.destination - name of s3 directory to upload to
 * @param {Number|String} config.version - version number
 * @param {Boolean} [true] config.latest - whether to upload /latest file
 */

const Uploader = function(config) {
  this.config = Object.assign({}, {
    latest: true,
  }, config);
  if (config.files) {
    this.filePaths = config.files;
  }
  if (config.dir) {
    this.filePaths = fs.readdirSync(config.dir).map((file) => {
      return config.dir + '/' + file;
    });
  }
}

Uploader.prototype.deployStaticFiles = function () {
  return Promise.all(this.filePaths.map((filePath) => {
    const uploadPaths = [];
    const basename = path.basename(filePath);
    const dir = path.dirname(filePath);
    const contents = fs.readFileSync(filePath);

    if (this.config.version) {
      uploadPaths.push(path.join(this.config.destination, this.config.version, basename));
      if (this.config.latest) {
        uploadPaths.push(path.join(this.config.destination, 'latest', basename));
      }
    } else {
      uploadPaths.push(path.join(this.config.destination, basename));
    }

    return Promise.all(uploadPaths.map((uploadPath) => {
      return this.deployStaticFile(path.join(dir, basename), uploadPath);
    }));
  }));
}

Uploader.prototype.deployStaticFile = function(filePath, destination) {
  return this.config.s3.putObject({
    Body: fs.readFileSync(filePath),
    Key: destination,
    ContentType: getContentType(filePath),
  }).promise().then((data) => {
    console.info(`Uploaded ${filePath} to S3 as ${destination}`);
  }, (error) => {
    console.error(error);
    if(error) {
      throw new Error(`Error uploading ${filePath}`);
    }
  });
}

Uploader.prototype.purgeStaticFiles = function () {
  return Promise.all(this.filePaths.map((filePath) => {
    return this.purgeStaticFile(filePath);
  }));
}

Uploader.prototype.purgeStaticFile = function(assetUrl, headers) {
  if (!headers) headers = {};

  return new Promise((resolve, reject) => {
    request({
      method: 'PURGE',
      url: assetUrl,
      headers: headers
    }, function(error) {
      if (error) {
        return reject('Error purging ' + assetUrl, error);
      }
      console.info('Purged ' + assetUrl);
      return resolve();
    })
  })
}

Uploader.prototype.npmPublish = function () {
  return run ('npm publish');
}

Uploader.prototype.yarnPublish = function () {
  return run ('yarn publish');
}
module.exports = Uploader;
