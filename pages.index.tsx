import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const userId = "user_" + Math.floor(Math.random() * 1000); // 仮のユーザーID

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: true });
      setMessages(data || []);
    };

    fetchMessages();

    const subscription = supabase
      .channel("chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const sendMessage = async () => {
    if (!input) return;
    await supabase.from("messages").insert([{ user_id: userId, username: `User ${userId}`, message: input }]);
    setInput("");
  };

  const deleteMessage = async (id, owner) => {
    if (owner !== userId) return alert("削除できません！");
    await supabase.from("messages").delete().eq("id", id);
  };

  return (
    <div>
      <h1>みんなのチャット</h1>
      <div>
        {messages.map((msg) => (
          <p key={msg.id}>
            <strong>{msg.username}:</strong> {msg.message}
            {msg.user_id === userId && <button onClick={() => deleteMessage(msg.id, msg.user_id)}>🗑️</button>}
          </p>
        ))}
      </div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={sendMessage}>送信</button>
    </div>
  );
}