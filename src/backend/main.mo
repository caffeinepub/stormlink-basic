import Array "mo:base/Array";
import Time "mo:base/Time";
import Nat "mo:base/Nat";

actor {
  type Message = {
    id: Nat;
    nickname: Text;
    text: Text;
    timestamp: Int;
  };

  var messages: [Message] = [];
  var nextId: Nat = 0;

  public func postMessage(nickname: Text, text: Text): async Nat {
    let msg: Message = {
      id = nextId;
      nickname = nickname;
      text = text;
      timestamp = Time.now();
    };
    messages := Array.append(messages, [msg]);
    if (messages.size() > 200) {
      messages := Array.tabulate(200, func(i: Nat): Message {
        messages[messages.size() - 200 + i]
      });
    };
    nextId += 1;
    return msg.id;
  };

  public query func getMessages(sinceId: Nat): async [Message] {
    Array.filter(messages, func(m: Message): Bool { m.id >= sinceId })
  };

  public query func getAllMessages(): async [Message] {
    messages
  };
};
