/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

// Put variables in global scope to make them available to the browser console.
const video = document.querySelector('video');
const canvas = window.canvas = document.querySelector('canvas');
canvas.width = 480;
canvas.height = 360;

const button = document.getElementById('button1');
button.onclick = function() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
};
const button2 = document.getElementById('button2');
let blobContent;
button2.onclick = function() {
  canvas.toBlob((blob) => {
    blobContent = blob;
    const newImg = document.createElement("img");
    const url = URL.createObjectURL(blob);
  
    newImg.onload = () => {
      // 不再需要读取该 blob，因此释放该对象
      URL.revokeObjectURL(url);
    };
  
    newImg.src = url;
    const div = document.createElement("div");
    div.innerText = url;
    document.body.appendChild(div);
    document.body.appendChild(newImg);
  }, "image/png");
};
const button3 = document.getElementById('button3');
button3.onclick = function() {
  const formData = new FormData();
  const file = new File([blobContent], "test.png", {
    type: "image/png",
  });
  formData.append('data', file);

  try {
    fetch('https://unidemo.dcloud.net.cn/upload', {
      method: 'POST',
      body: formData,
    }).then(res=>res.json()).then(json=>alert(JSON.stringify({size: json.files.data.size})));
  } catch (error) {
    alert('Error' + JSON.stringify(error));
  }
};

const button4 = document.getElementById('button4');
button4.onclick = function() {
  navigator.clipboard.write(
    [new ClipboardItem({ 'image/png': blobContent })]
  );
};

const button5 = document.getElementById('button5');
button5.onclick = function() {
  var B = document.createElement("a");
  B.href = URL.createObjectURL(blobContent);
  B.download = "test.png";
  document.body.appendChild(B);
  B.innerText="DownloadPNG";
  B.click();
};

const constraints = {
  audio: false,
  video: true
};

function handleSuccess(stream) {
  window.stream = stream; // make stream available to browser console
  video.srcObject = stream;
}

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);