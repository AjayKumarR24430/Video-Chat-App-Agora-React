import React, { useState } from "react";
import "./App.css";
import useAgoraRtm from "./hooks/useAgoraRtm";
import AgoraRTM from "agora-rtm-sdk";
import { RtmClient } from "./types/AgoraRTMTypes";
import { makeid } from "./helpers/randomId";
import {AppId} from "./config" 

const client = AgoraRTM.createInstance(AppId);
const randomUseName = makeid(5);
function Rtm() {
  const [textArea, setTextArea] = useState("");
  const { messages, sendChannelMessage } = useAgoraRtm(
    randomUseName,
    client as RtmClient
  );
  const submitMessage = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.charCode === 13) {
      e.preventDefault();
      if (textArea.trim().length === 0) return;
      sendChannelMessage(e.currentTarget.value);
      setTextArea("");
    }
  };
  return (
    <div className="App">
      <h1>Chat Box</h1>
      <div className="d-flex flex-column ">
        {messages.map((data, index) => {
          return (
            <div className="row" key={`chat${index + 1}`}>
              <h5 className="font-size-6" style={{ color: data.user.color }}>
                {`${data.user.name} :`}
              </h5>
              <p>{` ${data.message}`}</p>
            </div>
          );
        })}
      </div>
      <div>
        <textarea
          placeholder="Type your message here"
          className="form-control"
          onChange={(e) => setTextArea(e.target.value)}
          aria-label="With textarea"
          value={textArea}
          onKeyPress={submitMessage}
        />
      </div>
    </div>
  );
}

export default Rtm;
