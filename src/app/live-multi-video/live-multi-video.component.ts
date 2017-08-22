import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

//declare var SimpleWebRTC;
declare var $;
declare var io;
declare var conference;
@Component({
    selector: 'live-multi-video',
    templateUrl: 'live-multi-video.component.html',
    styleUrls: ['live-multi-video.component.css']
})

export class LiveMultiVideoComponent implements OnInit {
    connection;
    videosContainer;
    roomsList;
    config;
    conferenceUI;
    session: string;
    cudySocket;
    localStream;
    isMute;
    sub;
    parentRouteId;
    constructor(private router: Router,private route: ActivatedRoute) { }

    ngOnInit() {
        this.sub = this.route.params.subscribe(params => {
            this.parentRouteId = params["id"];
            console.log(params);
        });
        this.isMute = false;
        this.setup();
    }

    setup() {
        var self = this;

        self.videosContainer = document.getElementById('videos-container') || document.body;
        self.roomsList = document.getElementById('rooms-list');

        self.config = {
            openSocket: function (config) {
                var SIGNALING_SERVER = 'https://angular-live-stream.herokuapp.com:443/',
                    //var SIGNALING_SERVER = 'http://localhost:5000/',
                    defaultChannel = location.href.replace(/\/|:|#|%|\.|\[|\]/g, '');

                var channel = config.channel || defaultChannel;
                var sender = Math.round(Math.random() * 999999999) + 999999999;
                io.connect(SIGNALING_SERVER).emit('new-channel', {
                    channel: channel,
                    sender: sender
                });

                var socket = io.connect(SIGNALING_SERVER + channel);
                socket.channel = channel;
                socket.on('connect', function () {
                    if (config.callback) config.callback(socket);
                });

                socket.send = function (message) {

                    socket.emit('message', {
                        sender: sender,
                        data: message
                    });

                };

                socket.on('message', (msg) => {
                    config.onmessage(msg);
                });
                self.cudySocket = socket;
            },
            onRemoteStream: function (media) {
                        var video1 = media.video;
                        video1.setAttribute('controls', true);
                        video1.setAttribute('id', media.stream.id);
                        video1.height = 300;
                        video1.width = 300;
                        self.videosContainer.insertBefore(video1, self.videosContainer.firstChild);
                        video1.play();
            },
            onRemoteStreamEnded: function (stream) {
                var video = document.getElementById(stream.id);
                if (video) video.parentNode.removeChild(video);
            },
            onRoomFound: function (room) {
                var alreadyExist = document.querySelector('button[data-broadcaster="' + room.broadcaster + '"]');
                if (alreadyExist) return;
        
                var tr = document.createElement('tr');
                tr.innerHTML = '<td><strong>' + room.roomName + '</strong> shared a conferencing room with you!</td>' +
                    '<td><button class="join">Join</button></td>';
                self.roomsList.insertBefore(tr, self.roomsList.firstChild);
        
                var joinRoomButton = <any>tr.querySelector('.join');
                joinRoomButton.setAttribute('data-broadcaster', room.broadcaster);
                joinRoomButton.setAttribute('data-roomToken', room.broadcaster);
                joinRoomButton.onclick = function () {
                    this.disabled = true;
        
                    var broadcaster = this.getAttribute('data-broadcaster');
                    var roomToken = this.getAttribute('data-roomToken');
                    self.captureUserMedia(function () {
                        self.conferenceUI.joinRoom({
                            roomToken: roomToken,
                            joinUser: broadcaster
                        });
                    });
                };
            }
        };

        self.conferenceUI = conference(self.config);
        
        document.getElementById('setup-new-room').onclick = function () {
            // this.disabled = true;
            self.captureUserMedia(function () {
                console.log(self.parentRouteId);
                self.conferenceUI.createRoom({
                    roomName: self.parentRouteId
                });
            });
        };
    }

    captureUserMedia(callback) {
        var self = this;
        var video = document.createElement('video');
        video.setAttribute('autoplay', 'true');
        video.setAttribute('controls', 'true');
        video.height = 300;
        video.width = 300;
        self.videosContainer.insertBefore(video, self.videosContainer.firstChild);

        self.getUserMedia({
            video: video,
            onsuccess: function (stream) {
                self.config.attachStream = stream;
                video.setAttribute('muted', 'true');
                callback();
            }
        });
    }

    getUserMedia(options) {

        var self = this;
        var n = navigator,
            media;
        //n.getUserMedia = n.mediaDevices.getUserMedia || n.getUserMedia;
        var video_constraints = {
            mandatory: {},
            optional: []
        };

        n.getUserMedia(options.constraints || {
            audio: true,
            video: video_constraints
        }, streaming, options.onerror || function (e) {
            console.error(e);
        });

        function streaming(stream) {

            var video = options.video;
            
            if (!stream.stop && stream.getTracks) {
                stream.stop = function () {
                    this.getTracks().forEach(function (track) {
                        track.stop();
                    });
                };
            }
            self.localStream = stream;
            if (video) {
                video['src'] = window.URL.createObjectURL(stream);
                video.play();
            }
            options.onsuccess && options.onsuccess(stream);
            media = stream;
        }

        return media;
    }

    // toggleMic() { // stream is your local WebRTC stream
    //     var stream = this.localStream;
    //     var audioTracks = stream.getAudioTracks();
    //     for (var i = 0, l = audioTracks.length; i < l; i++) {
    //         audioTracks[i].enabled = !audioTracks[i].enabled;
    //         if (audioTracks[i].enabled) this.isMute = false;
    //         else this.isMute = true;
    //     }
    // }

    canDeactivate() {
        var result = confirm("Are you sure you want to exit? - This may lead loss of connection")
        // if the editName !== this.user.name
        if (result) {
            if (this.cudySocket) this.cudySocket.socket.disconnect();
            if (this.localStream) this.localStream.stop();
            return true;
        }
        return false;
    }
}