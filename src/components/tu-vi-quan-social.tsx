"use client";

import { useState } from "react";
import styles from "./tu-vi-quan-social.module.css";

export type QuanSocialMessage = { id: string; playerId: string; alias: string; text: string; createdAt: number };

type Props = {
  socketSend: (body: Record<string, unknown>) => void;
  messages: QuanSocialMessage[];
  ownId?: string;
  roomName?: string;
  connected?: boolean;
  error?: string;
  onFocusChange?: (focused: boolean) => void;
};

export default function TuViQuanSocial({ socketSend, messages, ownId, roomName = "sân này", connected = true, error, onFocusChange }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [waiting, setWaiting] = useState(false);
  function send(value: string) {
    if (!connected || waiting || !value.trim()) return;
    socketSend({ type: "chat", text: value.trim() });
    setText("");
    setWaiting(true);
    window.setTimeout(() => setWaiting(false), 2100);
  }
  return <section className={styles.social} aria-label="Trò chuyện với khách trong sân" onFocus={() => onFocusChange?.(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) onFocusChange?.(false); }} onKeyDown={event => event.stopPropagation()} onKeyUp={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()}>
    <button type="button" className={styles.toggle} aria-expanded={open} onClick={() => setOpen(!open)}>Trò chuyện trong sân{messages.length ? ` · ${messages.length}` : ""}</button>
    {open && <div className={styles.body}>
      <p className={styles.note}>Mọi khách ở {roomName} đều đọc được. Lời nhắn tự mất sau 1 phút. Không gửi thông tin riêng.</p>
      <div className={styles.messages} role="log" aria-live="polite" aria-relevant="additions">
        {!messages.length && <p className={styles.note}>Chưa có lời nhắn. Bạn có thể chào khách đang chờ cùng mình.</p>}
        {messages.map(message => <p key={message.id}><strong>{message.playerId === ownId ? "Bạn" : message.alias}:</strong> {message.text}</p>)}
      </div>
      <div className={styles.greetings}>
        <button type="button" disabled={!connected || waiting} onClick={() => send("Chào mọi người!")}>Chào mọi người</button>
        <button type="button" disabled={!connected || waiting} onClick={() => send("Chúc mọi người bình an!")}>Chúc bình an</button>
        <button type="button" disabled={!connected} onClick={() => socketSend({ type: "action", action: "meditate" })}>Cùng tĩnh tâm</button>
      </div>
      <form className={styles.form} onSubmit={event => { event.preventDefault(); send(text); }}>
        <label htmlFor="quan-courtyard-message">Lời nhắn cho sân</label>
        <div><input id="quan-courtyard-message" autoComplete="off" maxLength={120} value={text} disabled={!connected} onChange={event => setText(event.target.value)} placeholder="Bạn muốn chào ai?" /><button disabled={!connected || waiting || !text.trim()} type="submit">Gửi</button></div>
        <span className={styles.note}>{!connected ? "Đang mất kết nối với sân." : waiting ? "Đợi một chút trước lời nhắn tiếp theo." : `${text.length}/120 ký tự`}</span>
      </form>
      {error && <p className={styles.error} role="status">{error}</p>}
    </div>}
  </section>;
}
