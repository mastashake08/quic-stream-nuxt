<template>
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 class="text-3xl font-bold text-gray-800 mb-8">Choose a Stream Type</h1>
      
      <div class="space-x-4 mb-8">
        <button @click="startStream('video')" class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md">
          Stream Video
        </button>
        <button @click="startStream('desktop')" class="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md">
          Stream Desktop
        </button>
      </div>
  
      <!-- Video Preview -->
      <div v-if="localStream" class="w-full max-w-lg mb-8">
        <video ref="localVideo" class="rounded-lg shadow-lg w-full h-auto" autoplay playsinline muted></video>
      </div>
  
      <!-- Connection Status -->
      <div v-if="connectionStatus" class="bg-gray-50 border border-gray-300 text-gray-800 p-4 rounded-lg">
        <h2 class="font-semibold">{{ connectionStatus }}</h2>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        localStream: null,
        connectionStatus: '',
        pc: null,
      };
    },
    methods: {
      // Method to start streaming video or desktop
      async startStream(type) {
        try {
          this.connectionStatus = 'Starting stream...';
  
          // Get user media (either video or desktop)
          if (type === 'video') {
            this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } else if (type === 'desktop') {
            this.localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
          }
  
          // Display the stream in the video element
          const localVideo = this.$refs.localVideo;
          localVideo.srcObject = this.localStream;
  
          // Create a peer connection
          await this.setupWebRTCConnection();
  
          this.connectionStatus = 'Streaming to WebRTC server...';
        } catch (error) {
          console.error('Error starting stream:', error);
          this.connectionStatus = `Error: ${error.message}`;
        }
      },
  
      // Set up WebRTC connection and send offer to WebTransport
      async setupWebRTCConnection() {
        this.pc = new RTCPeerConnection();
  
        // Add all tracks to the peer connection
        this.localStream.getTracks().forEach((track) => {
          this.pc.addTrack(track, this.localStream);
        });
  
        // Handle ICE candidate
        this.pc.onicecandidate = async (event) => {
          if (event.candidate) {
            // Handle new ICE candidates if needed
          }
        };
  
        // Create SDP offer
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
  
        // Send the offer to the WebRTC server using WebTransport
        const response = await this.sendOfferToServer(offer);
        if (response.sdp) {
          const answer = new RTCSessionDescription({ type: 'answer', sdp: response.sdp });
          await this.pc.setRemoteDescription(answer);
        }
      },
  
      // Send the SDP offer to the WebTransport server via fetch
      async sendOfferToServer(offer) {
        const url = 'https://localhost:8080/offer'; // Replace with your WebTransport offer URL
  
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: 'offer', sdp: offer.sdp }),
          });
  
          if (!response.ok) {
            throw new Error('Failed to send SDP offer');
          }
  
          return await response.json();
        } catch (error) {
          console.error('Failed to send offer to server:', error);
          this.connectionStatus = 'Failed to send offer to server';
        }
      },
    },
  };
  </script>
  
  <style scoped>
  /* Custom styling if needed, but Tailwind should cover most needs */
  </style>
  