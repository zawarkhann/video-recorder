import React, { useRef, useState, useEffect } from "react";

const App = () => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [stream, setStream] = useState(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [details, setDetails] = useState([]);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [loading, setLoading] = useState(false);

  const startRecording = async () => {
    setShowRecorder(true);
    setRecordedVideo(null);
    setDetails([]); // Clear previous details when recording again
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });
      setStream(userStream);
      videoRef.current.srcObject = userStream;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          console.error("Location permission denied or error:", error);
          alert("Location access is required for this application.");
        }
      );

      const options = MediaRecorder.isTypeSupported("video/mp4")
        ? { mimeType: "video/mp4" }
        : { mimeType: "video/webm" };

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
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const uploadToDrive = async () => {
    if (recordedVideo) {
      setLoading(true);
      const blob = await fetch(recordedVideo).then((r) => r.blob());
      const formData = new FormData();
      formData.append("file", blob, "recorded-video.mp4");

      try {
        const response = await fetch("https://latest-mapper-2o69ujbm5-zawarkhanns-projects.vercel.app/api/v1/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        setLoading(false);

        if (result.data && result.data.downloadLink) {
          setDetails([{ ...result.data, latitude, longitude }]);
          setRecordedVideo(null); // Hide playback video after result comes
        } else {
          alert("Download link not found. Response: " + JSON.stringify(result));
        }
      } catch (error) {
        console.error("Error during upload:", error);
        alert("An error occurred during the upload.");
        setLoading(false);
      }
    }
  };

  return (
    <div className={`flex flex-col items-center p-4 ${loading ? 'opacity-50 bg-black pointer-events-none' : ''}`}>
      {loading && <div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex justify-center items-center text-white text-xl">Uploading...</div>}
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
      {details.length > 0 && (
        <div className="mt-4 p-4 bg-orange-500 rounded-lg text-white">
          <h2 className="text-xl font-semibold">Upload Details</h2>
          {details.map((item, index) => (
            <div key={index}>
              <p><strong>Name:</strong> {item.name}</p>
              <p><strong>ID:</strong> {item.id}</p>
              <p><strong>Latitude:</strong> {item.latitude}</p>
              <p><strong>Longitude:</strong> {item.longitude}</p>
              <p><strong>View Link:</strong> <a href={item.viewLink} target="_blank" rel="noopener noreferrer">View</a></p>
              <p><strong>Download Link:</strong> <a href={item.downloadLink} target="_blank" rel="noopener noreferrer">Download</a></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
