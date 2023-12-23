// App.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
  const [text, setText] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [subtitles, setSubtitles] = useState([]);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);
  const MAX_CHARACTERS = 4000; // Character limit for the text box

  // Ref for the audio element
  const audioRef = useRef(new Audio());

  // Function to play audio from a given URL
  const playAudioFromUrl = (audioUrl) => {
    // Stop the current audio if it is playing
    const currentAudio = audioRef.current;
    if (!currentAudio.paused) {
      currentAudio.pause();
      currentAudio.currentTime = 0; // Reset the time
    }
    // Set new src and play
    currentAudio.src = audioUrl;
    currentAudio
      .play()
      .catch((error) => console.error("Error playing audio:", error));
  };

  // Call this function when subtitle changes
  useEffect(() => {
    if (subtitles.length > 0 && currentSubtitleIndex < subtitles.length) {
      const fetchAudioUrlAndPlay = async () => {
        try {
          const response = await axios.post(
            "https://us-central1-chat-window-widget.cloudfunctions.net/google-tts",
            { text: subtitles[currentSubtitleIndex] }
          );

          if (response.status === 200) {
            playAudioFromUrl(response.data.audioUrl);
          } else {
            throw new Error("Audio generation failed");
          }
        } catch (error) {
          console.error("Error fetching audio URL:", error);
        }
      };

      fetchAudioUrlAndPlay();
    }
  }, [currentSubtitleIndex, subtitles]);

  const handleImageGeneration = async (text) => {
    const triggerImageUrl =
      "https://us-central1-chat-window-widget.cloudfunctions.net/gpt-dalle-request";
    try {
      const response = await axios.post(triggerImageUrl, { prompt: text });
      if (response.status === 200 && response.data.imageUrl) {
        setImageURL(response.data.imageUrl);
      } else {
        throw new Error("Image generation failed");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Error generating image: " + error.message);
      throw error; // Rethrow to prevent further actions
    }
  };

  const handleSubtitleGeneration = async (text) => {
    const triggerSubtitlesUrl =
      "https://us-central1-chat-window-widget.cloudfunctions.net/gpt-ai-request";
    try {
      const response = await axios.post(triggerSubtitlesUrl, {
        systemMessage:
          "The user is attempting to make a still image movie given the passage provided. If a movie script were to be made for this passage, and then turned into a set (possibly just one) of subtitles that can be placed over an image that depicts this scene, what would that set of subtitles be? write it in quotes, and provide it as an array. Be strict with what you return, ensure it is just an array response with a series of subtitles that would go well in sequence over a still image that would be depicting the scene provided by the passage. My intent is to show each item in the array one at a time overlaid on the image, so as to speak the movie script / story to the image/passage in question. But be sure to just output the array.",
        aiModel: "gpt-4",
        messages: [
          {
            role: "user",
            content: text,
          },
        ],
      });
      if (response.status === 200 && response.data.message) {
        // Assuming the response is a stringified array inside the message property
        // Clean up the response and parse it as JSON
        const cleanedResponse = response.data.message.replace(
          /(\r\n|\n|\r)/gm,
          ""
        ); // Remove newlines
        const subtitlesArray = JSON.parse(cleanedResponse);

        if (Array.isArray(subtitlesArray)) {
          setSubtitles(subtitlesArray);
          // Log each subtitle to the console, with a newline between each
          const subtitlesAsString = subtitlesArray.join("\n");
          console.log(subtitlesAsString);
        } else {
          throw new Error("Subtitle generation did not return a valid array.");
        }
      } else {
        throw new Error("Subtitle generation failed.");
      }
    } catch (error) {
      console.error("Error generating subtitles:", error);
      alert("Error generating subtitles: " + error.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await handleImageGeneration(text);
      await handleSubtitleGeneration(text);
    } catch (error) {
      // Errors will be logged and alerted in the individual handlers
    }
  };

  const handleChange = (event) => {
    setText(event.target.value);
  };

  const handleSubtitleChange = (direction) => {
    setCurrentSubtitleIndex((prevIndex) => {
      if (direction === "next") {
        return (prevIndex + 1) % subtitles.length;
      }
      if (direction === "prev") {
        return (prevIndex - 1 + subtitles.length) % subtitles.length;
      }
      return prevIndex;
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <form onSubmit={handleSubmit}>
          <div style={{ position: "relative" }}>
            <textarea
              placeholder="Enter your text here"
              value={text}
              onChange={handleChange}
              maxLength={MAX_CHARACTERS}
              style={{ width: "300px", height: "200px", marginBottom: "6px" }}
            />
            <div
              style={{
                position: "absolute",
                right: "10px",
                bottom: "-20px",
                fontSize: "12px",
              }}
            >
              {text.length}/{MAX_CHARACTERS}
            </div>
          </div>
          <button type="submit">Generate Image and Subtitles</button>
        </form>
        {imageURL && (
          <div style={{ position: "relative", textAlign: "center" }}>
            {currentSubtitleIndex > 0 && (
              <button
                onClick={() => handleSubtitleChange("prev")}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "10px",
                  transform: "translateY(-50%)",
                }}
              >
                &lt;
              </button>
            )}
            <img
              src={imageURL}
              alt="Generated Visual"
              style={{ maxWidth: "100%", height: "auto" }}
            />
            {subtitles.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  bottom: "10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "rgba(0, 0, 0, 0.7)", // Semi-transparent background for readability
                  color: "white",
                  padding: "5px 10px",
                  maxWidth: "90%",
                  whiteSpace: "normal",
                }}
              >
                {subtitles[currentSubtitleIndex]}
              </div>
            )}
            {currentSubtitleIndex < subtitles.length - 1 && (
              <button
                onClick={() => handleSubtitleChange("next")}
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "10px",
                  transform: "translateY(-50%)",
                }}
              >
                &gt;
              </button>
            )}
          </div>
        )}
      </header>
    </div>
  );
};

export default App;
