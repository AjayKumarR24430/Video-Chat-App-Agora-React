import React, { useEffect, useState } from "react";
import {
  AgoraVideoPlayer,
  createClient,
  createMicrophoneAndCameraTracks,
  ClientConfig,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-react";
import {AppId} from "./config" 
import Rtm from "./Rtm";

const config: ClientConfig = { 
  mode: "rtc", codec: "vp8",
};

const appId: string = AppId; //ENTER APP ID HERE
const token: string | null = null;

const App = () => {
  const [inCall, setInCall] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [userName, setUserName] = useState("");
  return (
    <div>
      <br></br>
      <h1 className="heading">Video Chat Application</h1>
      <br></br><br></br>
      {inCall ? (
        <VideoCall setInCall={setInCall} channelName={channelName} userName={userName}/>
      ) : (
        <ChannelForm setInCall={setInCall} setChannelName={setChannelName} setUserName={setUserName}/>
      )}
    </div>
  );
};

// the create methods in the wrapper return a hook
// the create method should be called outside the parent component
// this hook can be used the get the client/stream in any component
const useClient = createClient(config);
const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks();

const VideoCall = (props: {
  setInCall: React.Dispatch<React.SetStateAction<boolean>>;
  channelName: string;
  userName: string;
}) => {
  const { setInCall, channelName, userName } = props;
  const [users, setUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [start, setStart] = useState<boolean>(false);
  // using the hook to get access to the client object
  const client = useClient();
  // ready is a state variable, which returns true when the local tracks are initialized, untill then tracks variable is null
  const { ready, tracks } = useMicrophoneAndCameraTracks();

  useEffect(() => {
    // function to initialise the SDK
    let init = async (name: string) => {
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        console.log("subscribe success");
        if (mediaType === "video") {
          setUsers((prevUsers) => {
            return [...prevUsers, user];
          });
        }
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      client.on("user-unpublished", (user, type) => {
        console.log("unpublished", user, type);
        if (type === "audio") {
          user.audioTrack?.stop();
        }
        if (type === "video") {
          setUsers((prevUsers) => {
            return prevUsers.filter((User) => User.uid !== user.uid);
          });
        }
      });

      client.on("user-left", (user) => {
        console.log("leaving", user);
        setUsers((prevUsers) => {
          return prevUsers.filter((User) => User.uid !== user.uid);
        });
      });

      await client.join(appId, name, token, null);
      if (tracks) await client.publish([tracks[0], tracks[1]]);
      setStart(true);

    };

    if (ready && tracks) {
      console.log("init ready");
      init(channelName);
    }

  }, [channelName, userName, client, ready, tracks]);


  return (
    <div className="container">
      <div className="row">
        <div className="col-9 col-sm">
          {ready && tracks && (
          <Controls tracks={tracks} setStart={setStart} setInCall={setInCall} />
          )}
          {start && tracks && <Videos users={users} tracks={tracks} />}
        </div>
        <div className="col-3 col-sm">
            <Rtm userName={userName}/>
        </div>
  </div>
  </div>
  );
};

const Videos = (props: {
  users: IAgoraRTCRemoteUser[];
  tracks: [IMicrophoneAudioTrack, ICameraVideoTrack];
}) => {
  const { users, tracks } = props;

  return (
    <div>
      <div id="videos">
        {/* AgoraVideoPlayer component takes in the video track to render the stream,
            you can pass in other props that get passed to the rendered div */}
        <AgoraVideoPlayer style={{height: '95%', width: '95%'}} className='vid' videoTrack={tracks[1]} />
        {users.length > 0 &&
          users.map((user) => {
            if (user.videoTrack) {
              return (
                <AgoraVideoPlayer style={{height: '95%', width: '95%'}} className='vid' videoTrack={user.videoTrack} key={user.uid} />
              );
            } else return null;
          })}
      </div>
    </div>
  );
};

export const Controls = (props: {
  tracks: [IMicrophoneAudioTrack, ICameraVideoTrack];
  setStart: React.Dispatch<React.SetStateAction<boolean>>;
  setInCall: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const client = useClient();
  const { tracks, setStart, setInCall } = props;
  const [trackState, setTrackState] = useState({ video: true, audio: true });

  const mute = async (type: "audio" | "video") => {
    if (type === "audio") {
      await tracks[0].setEnabled(!trackState.audio);
      setTrackState((ps) => {
        return { ...ps, audio: !ps.audio };
      });
    } else if (type === "video") {
      await tracks[1].setEnabled(!trackState.video);
      setTrackState((ps) => {
        return { ...ps, video: !ps.video };
      });
    }
  };

  const leaveChannel = async () => {
    await client.leave();
    client.removeAllListeners();
    // we close the tracks to perform cleanup
    tracks[0].close();
    tracks[1].close();
    setStart(false);
    setInCall(false);
  };

  return (
    <div className="controls">
      <p className={trackState.audio ? "on" : ""}
        onClick={() => mute("audio")}>
        {trackState.audio ? "Mute Audio" : "Unmute Audio"}
      </p>
      <p className={trackState.video ? "on" : ""}
        onClick={() => mute("video")}>
        {trackState.video ? "Turn off Video" : "Turn on Video"}
      </p>
      {<p onClick={() => leaveChannel()}>Leave</p>}
    </div>
  );
};

const ChannelForm = (props: {
  setInCall: React.Dispatch<React.SetStateAction<boolean>>;
  setChannelName: React.Dispatch<React.SetStateAction<string>>;
  setUserName: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const { setInCall, setChannelName, setUserName } = props;
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("");

  return (
    <form className="join">
      {appId === '' && <p style={{color: 'red'}}>Please enter your Agora App ID in App.tsx and refresh the page</p>}
      <input type="text"
        placeholder="Enter Channel Name"
        onChange={(e) => {setChannelName(e.target.value); setChannel(e.target.value)}}
      />
      <input type="text"
        placeholder="Enter your name"
        onChange={(e) => {setUserName(e.target.value); setName(e.target.value)}}
      />
      <button onClick={(e) => {
        e.preventDefault();
        if(name=="" && channel==""){
          alert("Please fill in the details!")
        }else if(name==""){
          alert("Please fill the name!")
        }else if(channel==""){
          alert("Please enter the channel name!")
        }else{
        setInCall(true);}
      }}>
        Join
      </button>
    </form>
  );
};

export default App;