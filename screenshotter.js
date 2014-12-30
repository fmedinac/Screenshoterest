/*
 *  Blipshot
 *  Screenshotter.js
 *  Half of the screenshotter algorithm. See Screenshotter.DOM.js for the other half.
 *
 *  ==========================================================================================
 *  
 *  Copyright (c) 2010-2012, Davide Casali.
 *  All rights reserved.
 *  
 *  Redistribution and use in source and binary forms, with or without modification, are 
 *  permitted provided that the following conditions are met:
 *  
 *  Redistributions of source code must retain the above copyright notice, this list of 
 *  conditions and the following disclaimer.
 *  Redistributions in binary form must reproduce the above copyright notice, this list of 
 *  conditions and the following disclaimer in the documentation and/or other materials 
 *  provided with the distribution.
 *  Neither the name of the Baker Framework nor the names of its contributors may be used to 
 *  endorse or promote products derived from this software without specific prior written 
 *  permission.
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES 
 *  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT 
 *  SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, 
 *  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, 
 *  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
 *  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT 
 *  LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE 
 *  OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

var Screenshotter = {
  
  imageDataURL: [],
  imageDataResponsiveScreen: [],
    responsive: false,
    responsiveResolutions: [[480,640],[980,768],[1280,800]],
    responsiveScreen: 0,
    imageDirtyCutAt: [],
    imageDataURLPartial: [],
    responsiveHeights: [],
  
  shared: {
    imageDataURL: 0,
    
    originalScrollTop: 0,
    
    tab: {
      id: 0,
      url: "",
      title: "",
      hasVscrollbar: false
    }
  },
  
  // ****************************************************************************************** SCREENSHOT SEQUENCE START
  // Actions
    grabSimple: function(e){
        var self = this;
        self.responsive = false;
        
        // ****** Reset screenshot container
        this.imageDataURLPartial = [];
        this.imageDirtyCutAt = [];
        
        self.grab();
    },
    grabResponsive: function(e){
        var self = this;
        self.responsive = true;
        
        // ****** Reset screenshot container
        this.imageDataURLPartial = [];
        this.imageDirtyCutAt = [];
        this.responsiveHeights = [];
        
        self.resizeWindow();
    },
    
    resizeWindow: function(){
        UI.status('azure', "resize");
        var self = this;
        
        chrome.windows.getLastFocused(function (win) {
            chrome.tabs.captureVisibleTab(function (imgData) {

//                var img = new Image();
//
//                img.onload = function () {
                    var width  = self.responsiveResolutions[self.responsiveScreen][0];
                    var height = self.responsiveResolutions[self.responsiveScreen][1];

                    self._resizeWindow(width,height, false);
//                    self.grab();
//                }
//
//                img.src = imgData;
//                
//                setTimeout(function(){
//                    self.grab();
//                },1000);
            });
        });

    },
    _resizeWindow: function(width,height, ignorePopup){
        var self = this;
        
        chrome.windows.getLastFocused( function (win) {
            var opt = {};
            opt.width	= parseInt(width, 10);
            opt.height	= parseInt(height, 10);

            opt.left = opt.top = 0;

            chrome.windows.update( win.id, opt );
//            !ignorePopup && String(window.location.href).match(/popup\.html/) && window.close();
            
            setTimeout(function(){
                self.grab();
            },1000);
        });
    },
  
  // 0
  grab: function(e) {
    /****************************************************************************************************
     * It's a chaos: the ball must bounce between background and script content since the first
     * can grab and the second can access the DOM (scroll)
     *
     * So the call stack is:
     *    grab (bg)
     *      screenshotBegin (script)
     *      loop {
     *        screenshotVisibleArea (bg)
     *        screenshotScroll (script)
     *      }
     *      screenshotEnd (bg)
     *      screenshotReturn (script)
     */ 
    var self = this;
    
    
    // ****** Get tab data
    chrome.windows.getCurrent(function(win) {
      chrome.tabs.getSelected(win.id, function(tab) {
        self.shared.tab = tab;
        
        // ****** Check if everything's is in order.
        var parts = tab.url.match(/https?:\/\/chrome.google.com\/?.*/);
        if (parts !== null) {
          alert("\n\n\nI'm sorry.\n\nDue to security restrictions \non the Google Chrome Store, \nBlipshot can't run here.\n\nTry on any other page. ;)\n\n\n");
          return false;
        }
        
        // ****** Begin!
        self.screenshotBegin(self.shared);
      });
    });
  },
  
  // 1
  screenshotBegin: function(shared) { chrome.tabs.sendMessage(this.shared.tab.id, { action: 'screenshotBegin', shared: shared }); },
  
  // 2
  screenshotVisibleArea: function(shared) {
    var self = this;
    chrome.tabs.captureVisibleTab(null, { format: "png" /* png, jpeg */, quality: 80 }, function(dataUrl) {
      if (dataUrl && self.responsiveScreen >= 0) {
        // Grab successful
          self.imageDataResponsiveScreen.push(self.responsiveScreen);
        self.imageDataURLPartial.push(dataUrl);
        self.screenshotScroll(shared);
      } else {
        // Grab failed, warning
        // To handle issues like permissions - https://github.com/folletto/Blipshot/issues/9
        alert("\n\n\nI'm sorry.\n\nIt seems Blipshot wasn't able to grab the screenshot of the active tab.\n\nPlease check the extension permissions.\n\nIf the problem persists contact me at \nhttp://github.com/folletto/Blipshot/issues\n\n\n");
        return false;
      }
    });
  },
  
  // 3
  screenshotScroll: function(shared) { chrome.tabs.sendMessage(this.shared.tab.id, { action: 'screenshotScroll', shared: shared }); },
  
  // 4
  screenshotEnd: function(shared,cut) {
    var self = this;
    UI.status('azure', "make");
      
      self.imageDirtyCutAt.push(cut);
//    ++self.responsiveScreen;
      
    if(!self.responsive){
        self.createImage(shared);
      }else{
        ++self.responsiveScreen;
          
        if(self.responsiveScreen > self.responsiveResolutions.length-1){
            self.createImage(shared);
        }else{
            self.resizeWindow();
        }
      }
  },
    
    createImage: function(shared){
        var self = this;
        
        UI.status('orange', "create");
        
        
        this.recursiveImageMerge(self,this.imageDataURLPartial, shared.tab.hasVscrollbar, function(image) {
            shared.imageDataURL = image;
            self.screenshotReturn(shared);
        });
    },
  
  // 5
  screenshotReturn: function(shared) {
    UI.status('green', "done", 3000);
    chrome.tabs.sendMessage(this.shared.tab.id, { action: 'screenshotReturn', shared: shared });
  },
  
  // ****************************************************************************************** EVENT MANAGER / HALF
  eventManagerInit: function() {
    /****************************************************************************************************
     * This function prepares the internal plugin callbacks to bounce between the plugin and DOM side.
     * It's initialized at the end of this file.
     */
    var self = this;
    chrome.extension.onMessage.addListener(function(e) {
        switch (e.action) {
          case "grab": self.grab(); break;
          case "grabResponsive": self.grab(); break;
          case "screenshotVisibleArea": self.screenshotVisibleArea(e.shared); break;
          case "screenshotEnd": self.screenshotEnd(e.shared, e.cut); break;
        }
    });
  },
  
  // ****************************************************************************************** SUPPORT
  recursiveImageMerge: function(self, imageDataURLs, hasVscrollbar, callback, images, i) {
    /****************************************************************************************************
     * This function merges together all the pieces gathered during the scroll, recursively.
     * Returns a single data:// URL object from canvas.toDataURL("image/png") to the callback.
     */
      
    var fx = arguments.callee;
    i = i || 0;
    images = images || [];
    
      var xis = 0,
          yis = 0,
          currentScreen = 0,
          canvasH = 0,
          canvasW = 0;
      
    if (i < imageDataURLs.length) {
      images[i] = new Image();
      images[i].onload = function() {
        imageDataURLs[i] = null; // clear for optimize memory consumption (not sure)
        if (i == imageDataURLs.length - 1) {
          // ****** We're at the end of the chain, let's have fun with canvas.
          var canvas = window.document.createElement('canvas');
            

          
          // NOTE: Resizing a canvas is destructive, we can do it just now before stictching
          canvas.width = images[0].width - (hasVscrollbar ? 15 : 0); // <-- manage V scrollbar
          
//          if (images.length > 1) canvas.height = (imageDataURLs.length - 1) * images[0].height + imageDirtyCutAt;
//          else canvas.height = images[0].height;
          
//            canvas.height = 9999;
            
            yis = 0;
          // ****** Calculate size
            if(!self.responsive){
                if (images.length > 1) canvas.height = (imageDataURLs.length - 1) * images[0].height + self.imageDirtyCutAt[0];
                  else canvas.height = images[0].height;
                
                
                canvas.width = images[0].width - (hasVscrollbar ? 15 : 0); // <-- manage V scrollbar
            }else{
                var his = 0,
                    curHis = 0,
                    curImgScreen = 0;
                
                for (var jj = 0; jj < images.length; jj++) {
                    if(curImgScreen != self.imageDataResponsiveScreen[jj]){
                        his = Math.max(his, curHis);

                        curHis = 0;
                        curImgScreen = self.imageDataResponsiveScreen[jj];
                    }
                    var cut = 0;
                    
                      var nImages = 0;

                      for(var o = 0; o < self.imageDataResponsiveScreen.length; ++o){
                          if(self.imageDataResponsiveScreen[o] == self.imageDataResponsiveScreen[jj]) ++nImages;
                      }

                      if(nImages > 1 && self.imageDataResponsiveScreen[(jj+1)] != self.imageDataResponsiveScreen[jj] ){
                          cut = images[jj].height - self.imageDirtyCutAt[self.imageDataResponsiveScreen[jj]];
                      }
                    
                    curHis += images[jj].height-cut;
                }
                canvas.height = his+20;
                
                // width
                canvasW = 0;
                for(var k = 0; k < self.responsiveResolutions.length; ++k){
                    canvasW += parseInt(self.responsiveResolutions[k][0])+20; // <-- manage V scrollbar
                }
                canvas.width = canvasW-20;
            }
//                    UI.status('green', ""+canvasH);
//          
          // NOTE: Resizing a canvas is destructive, we can do it just now before stictching
            
            var context = canvas.getContext('2d');
            context.fillStyle = "#EEE";
            context.fillRect(0,0,canvas.width,canvas.height);
            context.shadowColor = "rgba( 0, 0, 0, 0.3 )";
            context.shadowOffsetX = 3;
            context.shadowOffsetY = 3;
            context.shadowBlur = 4;
            
            yis = 0;
          // ****** Stitch
          for (var j = 0; j < images.length; j++) {
            var cut = 0;
              if(!self.responsive){
                if (images.length > 1 && j == images.length - 1) cut = images[j].height - self.imageDirtyCutAt[0];
              }else{
                  var nImages = 0;
                  
                  for(var o = 0; o < self.imageDataResponsiveScreen.length; ++o){
                      if(self.imageDataResponsiveScreen[o] == self.imageDataResponsiveScreen[j]) ++nImages;
                  }
                  
                  if(nImages > 1 && self.imageDataResponsiveScreen[(j+1)] != self.imageDataResponsiveScreen[j] ){
                      cut = images[j].height - self.imageDirtyCutAt[self.imageDataResponsiveScreen[j]];
                  }
                  
              }
              
//              cut = 0;
            
            var height = images[j].height - cut;
            var width = images[j].width;
            //alert("[i:" + i + ", j:" + j + "]" + width + "x" + height + "(cut:" + cut + ") --- images:" + imageDataURLs.length);
            
              if(self.responsive || self.imageDataResponsiveScreen[j] == 0){
                  if(currentScreen != self.imageDataResponsiveScreen[j]){
                      xis = 0;
                      for(var s = 0; s < self.imageDataResponsiveScreen[j]; ++s){
                        xis += self.responsiveResolutions[s][0]+20;
                      }
                      
                      yis = 0;
                      currentScreen = self.imageDataResponsiveScreen[j];
                  }
              }else{
                  xis = 0;
              }
              
//              alert(1);
//            canvas.getContext("2d").drawImage(images[j], 0, cut, width, height, 0, 0, width, height);
              context.drawImage(images[j], 0, cut, width, height, xis, yis, width, height);
              yis += images[j].height;
              
              
//              if(canvasH < yis) canvasH = yis;
          }
//            canvas.height = 600;
          
             var http = new XMLHttpRequest();
            var url = 'http://www.felipemedina.com.br/Huge/Pint/createFile.php';
//            var url = 'http://localhost/huge/PinterestChromeExtension/0_Tech/0_Prototype/Blipshot-master/php/createFile.php';
            var params = "data="+canvas.toDataURL("image/jpeg",0.8);
//            xhr.onreadystatechange = handleStateChange; // Implemented elsewhere.
            http.open("POST", url, true);
            
            http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
//            http.setRequestHeader("Content-length", params.length);
//            http.setRequestHeader("Connection", "close");

            http.onreadystatechange = function() {//Call a function when the state changes.
                if(http.readyState == 4 && http.status == 200) {
//                    alert(http.responseText);
                    
                    imageURL = http.responseText;
                    
                    chrome.tabs.getSelected(null, function(tab) {
                      //properties of tab object
                      tabId = tab.id;
                      tabUrl = tab.url;
                        
                        var w = 640;
                        var h = 360;
                        var left = (screen.width/2)-(w/2);
                        var top = (screen.height/2)-(h/2); 
                        
                        var statusText = localStorage["statusText"];
                        
                        if(!statusText || statusText == "undefined") statusText = "";

                        var viewTabUrl = 'http://www.pinterest.com/pin/create/button/?url='+tabUrl+'&media=http://www.felipemedina.com.br/Huge/Pint/' +  imageURL + '&description='+statusText+' '+tabUrl;
                        chrome.windows.create({'url': viewTabUrl, 'type': 'popup', 'width': w, 'height': h, 'left': left, 'top': top} , function(window) {
                            });
//                        chrome.tabs.create({url: viewTabUrl}, function(tab) {
//                        });
                      //rest of the save functionality.
                    });
                    
                    callback(canvas.toDataURL("image/jpeg",0.8),http.responseText);
                    
                }
            }
            http.send(params);
        } else {
          // ****** Down!
          fx(self,imageDataURLs, hasVscrollbar, callback, images, ++i);
        }
      }
      images[i].src = imageDataURLs[i]; // Load!
    }
  }
}

/* \/ Initialize callback listeners */
Screenshotter.eventManagerInit();
/* /\ Initialize callback listeners */