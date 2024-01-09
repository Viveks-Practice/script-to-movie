import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
  const [text, setText] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [subtitles, setSubtitles] = useState([]);
  const [ttsUrls, setTtsUrls] = useState([]);
  const MAX_CHARACTERS = 4000; // Character limit for the text box

  const handleImageGeneration = async (text) => {
    const triggerImageUrl =
      "https://us-central1-chat-window-widget.cloudfunctions.net/gpt-dalle-request";

    try {
      const response = await axios.post(triggerImageUrl, { prompt: text });
      if (response.status === 200 && response.data.imageUrl) {
        setImageURL(response.data.imageUrl);
        handleSubtitleGeneration(text); // Proceed to next step after image
      } else {
        throw new Error("Image generation failed");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Error generating image: " + error.message);
    }
  };

  const handleSubtitleGeneration = async (text) => {
    const triggerSubtitlesUrl =
      "https://us-central1-chat-window-widget.cloudfunctions.net/gpt-ai-request";

    try {
      const response = await axios.post(triggerSubtitlesUrl, {
        systemMessage: "your system message here",
        aiModel: "gpt-4",
        messages: [{ role: "user", content: text }],
      });

      if (response.status === 200 && response.data.message) {
        const subtitlesArray = JSON.parse(response.data.message);
        setSubtitles(subtitlesArray);
        fetchTTSUrls(subtitlesArray); // Fetch TTS after generating subtitles
      } else {
        throw new Error("Subtitle generation failed.");
      }
    } catch (error) {
      console.error("Error generating subtitles:", error);
      alert("Error generating subtitles: " + error.message);
    }
  };

  const fetchTTSUrls = async (subtitlesArray) => {
    try {
      const urls = await Promise.all(
        subtitlesArray.map((subtitle) =>
          axios
            .post(
              "https://us-central1-chat-window-widget.cloudfunctions.net/google-tts",
              { text: subtitle }
            )
            .then((response) => response.data.audioUrl)
        )
      );
      setTtsUrls(urls);
    } catch (error) {
      console.error("Error fetching TTS URLs:", error);
      alert("Error fetching TTS URLs: " + error.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await handleImageGeneration(text);
  };

  const handleChange = (event) => {
    setText(event.target.value);
  };

  return (
    <div className="App">
      <header className="App-header">
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Enter your text here"
            value={text}
            onChange={handleChange}
            maxLength={MAX_CHARACTERS}
            style={{ width: "300px", height: "200px", marginBottom: "6px" }}
          />
          <button type="submit">Generate Assets</button>
        </form>
        {/* Displaying image and subtitles for debugging */}
        {imageURL && (
          <img
            src={imageURL}
            alt="Generated Visual"
            style={{ maxWidth: "100%", height: "auto" }}
          />
        )}
        {subtitles.map((subtitle, index) => (
          <p key={index}>{subtitle}</p>
        ))}
      </header>
    </div>
  );
};

export default App;
