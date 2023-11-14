const sharp = require('sharp');
const { S3Client } = require('@aws-sdk/client-s3');
const resize = require('sharp/lib/resize');

const s3 = new S3Client();

exports.handler = async (event, context, callback) => {
  const Bucket = event.Records[0].s3.bucket.name;
  const Key = decodeURIComponent(event.Records[0].s3.object.key); // original/파일이름.png
  const filename = Key.split('/').at(-1);
  const ext = Key.split('.').at(-1).toLowerCase();
  const requiredFormat = ext === 'jpg' ? 'jpeg' : ext;
  console.log('name', filename, 'ext', ext);

  try {
    const s3Object = await s3.getObject({ Bucket, Key });
    console.log('original', s3Object.Body.length);
    const resizedImage =  await sharp(s3Object.Body)
      .resize(200, 200, { fit: 'inside' }) //비율을 유지하면서 최대한 200으로 만든다.
      .toFormat(requiredFormat)
      .toBuffer();
    await s3.putObject({
      Bucket,
      Key: `thumb/${filename}`, // thumb/파일이름.png
      Body: resizedImage,
    })
    console.log('put', resizedImage.length);
    return callback(null, `thumb/${filename}`); //첫번째는 에러자리 두번째는 응답값자리 노드에서의 국룰?
  } catch (error) {
    console.error(error);
    return callback(error);
  }
}