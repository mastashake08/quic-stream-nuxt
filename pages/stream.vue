<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 md:p-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-6 md:mb-8">WebRTC Copy-Paste Signaling</h1>
    
    <div class="flex space-x-2 mb-6 md:mb-8">
      <button @click="startStream('video')" class="px-4 py-2 md:px-6 md:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md">
        Stream Video
      </button>
      <button @click="startStream('desktop')" class="px-4 py-2 md:px-6 md:py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md">
        Stream Desktop
      </button>
    </div>

    <!-- Video Preview -->
    <div class="w-full max-w-lg mb-6 md:mb-8">
      <video v-show="localStream" ref="localVideo" class="rounded-lg shadow-lg w-full h-auto" autoplay playsinline muted></video>
    </div>

    <!-- Connection Status -->
    <div v-if="connectionStatus" class="bg-gray-50 border border-gray-300 text-gray-800 p-4 rounded-lg mb-4 w-full max-w-lg">
      <h2 class="font-semibold">{{ connectionStatus }}</h2>
    </div>

    <!-- Offer and Answer Text Areas -->
    <div class="w-full max-w-lg mb-4">
      <label class="block mb-2 font-semibold">Offer (Copy this entire JSON)</label>
      <textarea v-model="offerText" rows="6" class="w-full p-3 bg-white border border-gray-300 rounded-lg font-mono text-sm resize-none" readonly></textarea>
    </div>

    <!-- Text area for the answer (received from backend) -->
    <div class="w-full max-w-lg mb-4">
      <label class="block mb-2 font-semibold">Answer (Received from backend)</label>
      <textarea v-model="answerText" rows="6" class="w-full p-3 bg-white border border-gray-300 rounded-lg font-mono text-sm resize-none" ></textarea>
    </div>

    <div class="flex space-x-4 mb-4">
      <button @click="createOffer" class="px-4 py-2 md:px-6 md:py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow-md">
        Create Offer
      </button>
      <button @click="submitAnswer" class="px-4 py-2 md:px-6 md:py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md">
        Submit Answer
      </button>
    </div>

    <!-- Button to send offer via POST and get answer -->
    <div class="flex space-x-4">
      <button @click="sendOffer" class="px-4 py-2 md:px-6 md:py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md">
        Send Offer to Server
      </button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      localStream: null,
      connectionStatus: '',
      offerText: '', // JSON text of the offer object (with type and sdp)
      answerText: '', // JSON text of the answer object (with type and sdp)
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

        this.connectionStatus = 'Ready to create offer.';
      } catch (error) {
        console.error('Error starting stream:', error);
        this.connectionStatus = `Error: ${error.message}`;
      }
    },

    // Create an SDP offer and show full SDP object
    async createOffer() {
      try {
        // Use STUN server configuration
        const configuration = {
          iceServers: [
            {
              urls: 'stun:stun1.l.google.com:19302',
            },
          ],
        };

        // Initialize PeerConnection with STUN server
        this.pc = new RTCPeerConnection(configuration);

        // Add all tracks to the peer connection
        this.localStream.getTracks().forEach((track) => {
          this.pc.addTrack(track, this.localStream);
        });

        // Create SDP offer
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        // Display the SDP offer in JSON format
        this.offerText = JSON.stringify({
          type: offer.type,
          sdp: offer.sdp,
        }, null, 2);

        this.connectionStatus = 'Offer created. Copy this entire JSON and send it to the remote peer.';
      } catch (error) {
        console.error('Error creating offer:', error);
        this.connectionStatus = `Error: ${error.message}`;
      }
    },

    // Submit the answer (JSON object) pasted from the remote peer
    async submitAnswer() {
      try {
        // Ensure the peer connection is initialized
        if (!this.pc) {
          this.connectionStatus = 'Please create an offer first.';
          return;
        }

        // Parse the pasted answer into a JSON object
        const remoteAnswer = JSON.parse(this.answerText);

        // Convert the answer JSON into a proper RTCSessionDescription
        const answer = new RTCSessionDescription({
          type: remoteAnswer.type,
          sdp: remoteAnswer.sdp,
        });

        // Set the remote description
        await this.pc.setRemoteDescription(answer);

        this.connectionStatus = 'Connection established with the remote peer.';
      } catch (error) {
        console.error('Error submitting answer:', error);
        this.connectionStatus = `Error: ${error.message}`;
      }
    },

    // Send the offer to the server via POST and get the answer
    async sendOffer() {
      try {
        if (!this.offerText) {
          this.connectionStatus = 'Please create an offer first.';
          return;
        }

        this.connectionStatus = 'Sending offer to the server...';

        // Send the offer to the server using a POST request
        const response = await fetch('/offer', {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            sdp: JSON.parse(this.offerText).sdp,
            type: JSON.parse(this.offerText).type,
          }),
        });
        console.log(response)
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();

        // Display the received answer in the answer text area
        this.answerText = JSON.stringify({
          type: data.type,
          sdp: data.sdp,
        }, null, 2);

        this.connectionStatus = 'Answer received from server. You can now establish a connection.';
      } catch (error) {
        console.error('Error sending offer:', error);
        this.connectionStatus = `Error: ${error.message}`;
      }
    },
  },
};
</script>

<style scoped>
/* Add responsive styling if needed */
</style>
