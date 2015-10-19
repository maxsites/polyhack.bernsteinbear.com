function pauseVideo() {
    this.video.pause();
    this.streaming = false;
}

function playVideo() {
    this.streaming = true;
    this.video.play();
}

var QRCodeScanner = {
    canvas: document.getElementById("qr-canvas"),
    video: document.getElementById('v'),
    capture: document.getElementById('capture'),
    // photo: document.getElementById('p'),
    width: 320,
    height: 240,
    streaming: false,
    lastMsg: null,
    intervalLock: 'released',

    /**
     * Present content on screen
     */
    read: function scanner_read(txt) {
	var that = this;
	if (txt != this.lastMsg) {
	    var msg = document.getElementById('message');
	    var signInObject = new SignIn();

	    var registrantQuery = new Parse.Query(Registrants);
	    registrantQuery.equalTo('emailAddress', txt);
	    console.log("SENDING QUERY");
	    registrantQuery.first().then(function(registrant) {
		if (typeof registrant !== 'undefined') {
		    var firstName = registrant.get('firstName');
		    var lastName = registrant.get('lastName');
		    msg.innerHTML = firstName + " " + lastName;
		    console.log("SAVING");
		    signInObject.set('registrant', registrant);
		    return signInObject.save(null);
		}
		else {
		    msg.innerHTML = 'ERROR';
		    return Parse.Promise.error("User is not a registrant.");
		}
	    }).then(function signInUser(signInObject) {
		document.body.style.background = '#5cb85c';
		playVideoBound();
		that.lastMsg = txt;
	    }, function signInError(signInObject, error) {
		document.body.style.background = '#d9534f';
		playVideoBound();
		that.lastMsg = txt;
	    });
	}
    },

    formatContent: function scanner_format(txt) {
	if (txt.indexOf('http') === 0) {
	    return '<a href="' + txt + '" target="_blank">' + txt + '</a>';
	} else {
	    return txt;
	}
    },

    // imageData: null,
    context: null,

    init: function scanner_init() {
	navigator.getMedia = ( navigator.getUserMedia ||
			       navigator.webkitGetUserMedia ||
			       navigator.mozGetUserMedia ||
			       navigator.msGetUserMedia);
	var self = this;
	navigator.getMedia(
	    {
		video: true,
		audio: false
	    },
	    function(stream) {
		var vendorURL = window.URL || window.webkitURL;
		self.video.src = vendorURL.createObjectURL(stream);
		self.video.play();
	    },
	    function(err) {
		console.log("An error occured! " + err);
	    }
	);

	this.canvas.addEventListener("dragenter", this.dragenter, false);
	this.canvas.addEventListener("dragover", this.dragover, false);
	this.canvas.addEventListener("drop", this.drop.bind(this), false);

	qrcode.callback = this.read.bind(this);

	this.video.addEventListener('canplay', function(ev) {
	    if (!self.streaming) {
		// self.height = self.video.videoHeight / (self.video.videoWidth/self.width);
		self.video.setAttribute('width', self.width);
		self.video.setAttribute('height', self.height);
		self.canvas.setAttribute('width', self.width);
		self.canvas.setAttribute('height', self.height);
		self.streaming = true;
		// console.log('w:'+self.video.videoWidth+'/h:'+self.video.videoHeight);
		self.canvas.style.width = self.width + "px";
		self.canvas.style.height = self.height + "px";
		self.canvas.width = self.width;
		self.canvas.height = self.height;
		self.context = self.canvas.getContext("2d");
		self.context.clearRect(0, 0, self.width, self.height);
		// self.imageData = self.context.getImageData(0,0,
		//   self.video.videoWidth,self.video.videoHeight);
	    }
	}, false);

	this.video.addEventListener('play', function(){
	    //It should repeatly capture till a qrcode is successfully captured.
	    if (self.intervalLock == 'released') {
		self.intervalLock = 'acquired';
		self.scanQRCode();
	    }

	    // setTimeout(function scanrepeat() {
	    //	self.scanQRCode();
	    //	setTimeout(scanrepeat, 1000);
	    // }, 1000);

	    // setInterval(function(){
	    //	self.scanQRCode();
	    // }, 1000);
	}, false);
    },

    dragenter: function scanner_dragenter(e) {
	e.stopPropagation();
	e.preventDefault();
    },

    dragover: function scanner_dragover(e) {
	e.stopPropagation();
	e.preventDefault();
    },

    drop: function scanner_drop(e) {
	e.stopPropagation();
	e.preventDefault();

	var dt = e.dataTransfer;
	var files = dt.files;

	this.handleFiles(files);
    },

    handleFiles: function scanner_handleFiles(f) {
	var o = [];
	for (var i =0; i < f.length; i++) {
	    var reader = new FileReader();

	    reader.onload = (function(theFile) {
		return function(e) {
		    qrcode.decode(e.target.result);
		};
	    })(f[i]);

	    // Read in the image file as a data URL.
	    reader.readAsDataURL(f[i]);
	}
    },

    /**
     * Decode the QRCode
     */
    scanQRCode: function scanner_scanQRCode() {
	window.pauseVideoBound = pauseVideo.bind(this);
	window.playVideoBound = playVideo.bind(this);

	if (this.context != null) {
	    this.context.clearRect(0, 0, this.width, this.height);
	    this.context.drawImage(this.video, 0, 0, this.width, this.height);
	    // var data = this.canvas.toDataURL('image/png');
	    // this.photo.setAttribute('src', data);

	    try {
		// Stop automatic capture.
		if (qrcode.decode()) {
		    pauseVideoBound();
		}
		playVideoBound();
	    }
	    catch (e) {
	    }
	}

	setTimeout(this.scanQRCode.bind(this), 1000);
    }
};

window.addEventListener('load', function onload_scanner() {
    window.removeEventListener('load', onload_scanner);
    QRCodeScanner.init();
});
