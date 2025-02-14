import React, { useRef, useState } from "react";

const App = () => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [stream, setStream] = useState(null);
  const [showRecorder, setShowRecorder] = useState(false);

  const startRecording = async () => {
    setShowRecorder(true);
    setRecordedVideo(null);
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });
      setStream(userStream);
      videoRef.current.srcObject = userStream;

      const options = MediaRecorder.isTypeSupported('video/mp4')
        ? { mimeType: 'video/mp4' }
        : { mimeType: 'video/webm' };

      const mediaRecorder = new MediaRecorder(userStream, options);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(chunks, { type: options.mimeType });
        setRecordedVideo(URL.createObjectURL(recordedBlob));
        setShowRecorder(false);
      };

      mediaRecorder.start();
      setRecording(true);

      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
          alert("Recording stopped automatically after 30 seconds.");
        }
      }, 30000);

    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Error accessing camera. Ensure camera permissions are allowed.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  };
  
 


  const uploadToDrive = async () => {
    if (recordedVideo) {
      const blob = await fetch(recordedVideo).then(r => r.blob());
      const formData = new FormData();
      formData.append("file", blob, "recorded-video.mp4");

      try {
        const response = await fetch("https://latest-mapper-2o69ujbm5-zawarkhanns-projects.vercel.app/api/v1/upload", {
          method: "POST",
          body: formData,
        });
    
        const result = await response.json(); // Parse JSON response
        if (result.data && result.data.downloadLink) {
          window.location.href = result.data.downloadLink;
        } else {
          alert("Download link not found. Response: " + JSON.stringify(result));
        }
      } catch (error) {
        console.error("Error during upload:", error);
        alert("An error occurred during the upload.");
      }
    
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Video Recorder</h1>
      {showRecorder && <video ref={videoRef} autoPlay className="w-80 h-60 bg-black rounded-lg" />}
      <div className="mt-4">
        {!recording ? (
          <button onClick={startRecording} className="px-4 py-2 bg-green-500 text-white rounded-lg">Start Recording</button>
        ) : (
          <button onClick={stopRecording} className="px-4 py-2 bg-red-500 text-white rounded-lg">Stop Recording</button>
        )}
      </div>
      {recordedVideo && !showRecorder && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Recorded Video</h2>
          <video src={recordedVideo} controls className="w-80 h-60 mt-2 rounded-lg" />
          <div className="mt-2">
            <button onClick={startRecording} className="px-4 py-2 bg-yellow-500 text-white rounded-lg mr-2">Record Again</button>
            <button onClick={uploadToDrive} className="px-4 py-2 bg-blue-500 text-white rounded-lg">Submit Video</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
