// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

async function main() {
  function findLargestPlayingVideo(forcePIP) {
    const videos = Array.from(document.querySelectorAll('video'))
      .filter(video => video.readyState != 0)
      .filter(video => {
        if (video._disablePictureInPicture === undefined) {
          video._disablePictureInPicture = video.disablePictureInPicture;
        }
        video.disablePictureInPicture = forcePIP ? false : video._disablePictureInPicture;
        return video.disablePictureInPicture === false;
      })
      .sort((v1, v2) => {
        const v1Rect = v1.getClientRects()[0] || { width: 0, height: 0 };
        const v2Rect = v2.getClientRects()[0] || { width: 0, height: 0 };
        return ((v2Rect.width * v2Rect.height) - (v1Rect.width * v1Rect.height));
      });

    if (videos.length === 0) {
      return;
    }

    return videos[0];
  }

  async function requestPictureInPicture(video) {
    video.requestPictureInPicture().then((pipWindow) => {
      video.setAttribute('__pip__', true);
      video.addEventListener('leavepictureinpicture', event => {
        video.removeAttribute('__pip__');
      }, { once: true });
      new ResizeObserver(maybeUpdatePictureInPictureVideo).observe(video);
    });
  }

  function maybeUpdatePictureInPictureVideo(entries, observer) {
    const observedVideo = entries[0].target;
    if (!document.querySelector('[__pip__]')) {
      observer.unobserve(observedVideo);
      return;
    }
    const video = findLargestPlayingVideo();
    if (video && !video.hasAttribute('__pip__')) {
      observer.unobserve(observedVideo);
      requestPictureInPicture(video);
    }
  }

  class HaxPIP {
      constructor(video, forcePIP) {
        this.video = video;
        this.forcePIP = forcePIP;
        this.commands = {
          'togglePIP': this.togglePIP,
          'enablePIP': this.enablePIP,
          'disablePIP': this.disablePIP,
          'setForcePIP': this.setForcePIP,
        }
      }

      togglePIP() {
        if (this.video.hasAttribute('__pip__')) {
          this.disablePIP();
        } else {
          this.enablePIP();
        }
      }

      enablePIP() {
        requestPictureInPicture(video);
      }

      disablePIP() {
        document.exitPictureInPicture();
      }

      setForcePIP(message) {
        this.forcePIP = message.args.forcePIP;
      }

      handleCommand(message) {
        if (this.commands[message.type]) {
          this.commands[message.type](message);
        } else {
          console.error('Unknown command received: ' + message.type);
        }
      }
  }

  const results = await chrome.storage.sync.get({ forcePIP: false });
  forcePIP = results.forcePIP;

  const video = findLargestPlayingVideo(forcePIP);
  if (!video) {
    return;
  }

  const haxPIP = new PIPHandler(video, forcePIP);
  chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log(message);
    // haxPIP.handleCommand(message);
  });
}

if (!window.initDone) {
  window.initDone = true;
  main();
}
