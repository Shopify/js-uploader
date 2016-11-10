# JS Uploader

Use to upload files to S3 and NPM.

## Requirements

- Node 4+

## Configuration

You will need to have a config.ejson file with the following keys:

```
{
    "_public_key": "",
    "aws": {
        "accessKeyId": "",
        "secretAccessKey": "",
        "region": "",
        "bucket": ""
    }
}
```

You must ensure shipit runs the following command before deploy script is run.

```
ejson decrypt -o config.json config.ejson
```

## Usage

Instantiate an `Uploader` with config object for your project:

```
/**
 * @param {S3} config.s3 - aws s3 instance
 * @param {Array} config.files - array of file paths to upload
 * @param {String} config.dir - directory to upload all files from
 * @param {String} config.destination - name of s3 directory to upload to
 * @param {Number|String} config.version - version number
 * @param {Boolean} [true] config.latest - whether to upload /latest file
 */
```

```
const awsSDK = require('aws-sdk');
const awsConfig = require('../config.json').aws;
const Uploader = require('js-uploader');
const uploader = new Uploader({

const awsS3 = new awsSDK.S3({
  accessKeyId: awsConfig.accessKeyId,
  secretAccessKey: awsConfig.secretAccessKey,
  region: awsConfig.region,
  params: {
    Bucket: awsConfig.bucket,
    ACL: 'public-read'
  }
});

const uploader = new Uploader({
  s3: awsS3,
  dir: 'dist',
  destination: 'buy-button',
  version: currentVersion,
});

uploader.deployStaticFiles();
uploader.npmPublish();
```

Add the above to a JS file and add it to your shpit.yml:

```
deploy:
  override:
    - npm install --no-progress
    - ejson decrypt -o config.json config.ejson
    - npm run build
    - node ./scripts/my-deply-script.js
```
