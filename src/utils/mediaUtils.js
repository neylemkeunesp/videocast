// Function to concatenate video blobs into a single video file
export async function concatenateVideos(videoBlobs) {
  try {
    console.log('Starting video concatenation:', {
      totalBlobs: videoBlobs.length,
      blobSizes: videoBlobs.map(blob => blob.size)
    });
    
    // Create video elements and load metadata
    const videos = await Promise.all(
      videoBlobs.map(async (blob) => {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(blob);
        video.muted = true; // Required for autoplay
        
        // Wait for metadata to load
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            video.width = video.videoWidth;
            video.height = video.videoHeight;
            resolve();
          };
          video.onerror = () => reject(new Error('Failed to load video'));
          video.load();
        });
        
        return video;
      })
    );
    
    console.log('Created video elements:', videos);

    // Calculate total duration
    const totalDuration = videos.reduce((sum, video) => sum + video.duration, 0);
    console.log('Total duration:', totalDuration);

    // Create a canvas to combine videos
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Use first video's dimensions
    canvas.width = videos[0].videoWidth;
    canvas.height = videos[0].videoHeight;
    
    // Create MediaRecorder
    const stream = canvas.captureStream(60); // 60 fps for smoother video
    // Try different video formats in order of preference
    const mimeTypes = [
      'video/webm;codecs=h264',
      'video/webm',
      'video/mp4'
    ];
    
    let selectedMimeType;
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }
    
    if (!selectedMimeType) {
      throw new Error('No supported video format found');
    }
    
    console.log('Using video format:', selectedMimeType);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond: 8000000 // 8 Mbps for better quality
    });

    const chunks = [];
    // Request data every second for better memory management
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    // Configure recorder to handle data in chunks
    mediaRecorder.start(1000); // Collect data every second
    console.log('MediaRecorder started with timeslice: 1000ms');

    return new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, combining chunks');
        const finalBlob = new Blob(chunks, { type: selectedMimeType });
        console.log('Created final blob:', finalBlob);
        
        // Cleanup
        videos.forEach(video => {
          URL.revokeObjectURL(video.src);
        });
        
        resolve(finalBlob);
      };


      async function playVideosSequentially() {
        console.log('Starting sequential video playback');
        for (let i = 0; i < videos.length; i++) {
          const video = videos[i];
          console.log(`Playing video ${i + 1}/${videos.length}`);
          
          await new Promise((resolve) => {
            video.currentTime = 0;
            let frameId;
            let lastDrawTime = 0;
            const frameInterval = 1000 / 60; // Target 60fps
            
            function drawFrame(timestamp) {
              if (!video.paused && !video.ended) {
                try {
                  // Only draw if enough time has passed
                  if (timestamp - lastDrawTime >= frameInterval) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    lastDrawTime = timestamp;
                  }
                  frameId = requestAnimationFrame(drawFrame);
                } catch (error) {
                  console.error('Error drawing video frame:', error);
                  cancelAnimationFrame(frameId);
                }
              }
            }

          video.onplay = () => {
            console.log(`Video ${i + 1}/${videos.length} started playing`);
            drawFrame(performance.now());
          };

          video.onended = () => {
            console.log(`Video ${i + 1}/${videos.length} finished playing (${((i + 1) / videos.length * 100).toFixed(1)}% complete)`);
            cancelAnimationFrame(frameId);
            resolve();
          };

            video.play().catch(error => {
              console.error(`Error playing video ${i + 1}:`, error);
              resolve(); // Continue to next video even if there's an error
            });
          });
        }

        console.log('All videos played, stopping recorder');
        mediaRecorder.stop();
      }

      // Start the sequential playback
      playVideosSequentially();
    });
  } catch (error) {
    console.error('Error concatenating videos:', error);
    throw new Error('Failed to concatenate videos: ' + error.message);
  }
}

// Function to concatenate audio blobs into a single audio file
export async function concatenateAudios(audioBlobs) {
  try {
    console.log('Starting audio concatenation:', {
      totalBlobs: audioBlobs.length,
      blobSizes: audioBlobs.map(blob => blob.size)
    });
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffers = await Promise.all(
      audioBlobs.map(async (blob) => {
        try {
          // Ensure we're working with mp3 data
          const audioBlob = new Blob([blob], { type: 'audio/mp3' });
          const arrayBuffer = await audioBlob.arrayBuffer();
          return await audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
          console.error('Error decoding audio:', error);
          throw new Error(`Failed to decode audio: ${error.message}`);
        }
      })
    );

    // Calculate total duration and log buffer details
    const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
    console.log('Audio buffers prepared:', {
      totalBuffers: audioBuffers.length,
      totalLength,
      sampleRate: audioBuffers[0].sampleRate,
      channels: audioBuffers[0].numberOfChannels
    });
    
    // Create a buffer for the combined audio
    const combinedBuffer = audioContext.createBuffer(
      audioBuffers[0].numberOfChannels,
      totalLength,
      audioBuffers[0].sampleRate
    );

    // Combine the audio buffers with progress tracking
    let offset = 0;
    for (let i = 0; i < audioBuffers.length; i++) {
      const buffer = audioBuffers[i];
      console.log(`Combining audio buffer ${i + 1}/${audioBuffers.length} (${((i + 1) / audioBuffers.length * 100).toFixed(1)}% complete)`);
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        combinedBuffer.getChannelData(channel).set(channelData, offset);
      }
      offset += buffer.length;
    }

    // Convert the combined buffer back to a blob
    const source = audioContext.createBufferSource();
    source.buffer = combinedBuffer;
    
    const destination = audioContext.createMediaStreamDestination();
    source.connect(destination);

    // Try different audio formats in order of preference
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp3',
      'audio/mpeg'
    ];
    
    let selectedMimeType;
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }
    
    if (!selectedMimeType) {
      throw new Error('No supported audio format found');
    }

    console.log('Using audio format:', selectedMimeType);
    const mediaRecorder = new MediaRecorder(destination.stream, {
      mimeType: selectedMimeType,
      audioBitsPerSecond: 128000 // 128 kbps for good quality
    });
    
    const chunks = [];

    return new Promise((resolve) => {
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: selectedMimeType });
        audioContext.close();
        resolve(finalBlob);
      };

      mediaRecorder.start();
      source.start(0);

      // Stop after the combined duration plus a small buffer
      setTimeout(() => {
        try {
          mediaRecorder.stop();
          source.stop();
        } catch (error) {
          console.error('Error stopping media recorder:', error);
        }
      }, (combinedBuffer.duration * 1000) + 500);
    });
  } catch (error) {
    console.error('Error concatenating audio:', error);
    throw new Error('Failed to concatenate audio: ' + error.message);
  }
}
