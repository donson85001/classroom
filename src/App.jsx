import React, { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const DESKS = [
  { id: 1, x: 80, y: 220 },
  { id: 2, x: 310, y: 220 },
  { id: 3, x: 540, y: 220 },
  { id: 4, x: 770, y: 220 },
  { id: 5, x: 195, y: 430 },
  { id: 6, x: 425, y: 430 },
  { id: 7, x: 655, y: 430 }
];

const STEP_MS = {
  greet: 1400,
  chair: 900,
  walk: 1800,
  sit: 700
};

const DEMO_MESSAGES = [
  { name: "小恩", text: "大家好，我來了" },
  { name: "Momo", text: "今天要上課了嗎" },
  { name: "Kai", text: "先幫我留位置" },
  { name: "Rita", text: "老師好" },
  { name: "阿哲", text: "我準備好了" }
];

const COLORS = [
  ["#60a5fa", "#2563eb"],
  ["#f472b6", "#e11d48"],
  ["#34d399", "#16a34a"],
  ["#a78bfa", "#7c3aed"],
  ["#fbbf24", "#f97316"],
  ["#22d3ee", "#0d9488"]
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const hashName = (name) =>
  Array.from(name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

const getAvatarPalette = (name) => COLORS[hashName(name) % COLORS.length];

function App() {
  const [users, setUsers] = useState([]);
  const [nameInput, setNameInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [toast, setToast] = useState("");
  const queueRef = useRef([]);
  const usersRef = useRef([]);
  const runningRef = useRef(false);

  const syncUsers = (updater) => {
    setUsers((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      usersRef.current = next;
      return next;
    });
  };

  const desks = useMemo(() => {
    return DESKS.map((desk) => {
      const occupant = users.find((u) => u.deskId === desk.id);
      return {
        ...desk,
        occupiedBy: occupant?.name ?? null,
        chairPulled: !!occupant && ["chair", "walking", "sitting", "seated"].includes(occupant.stage)
      };
    });
  }, [users]);

  const findAvailableDesk = () => {
    const used = new Set(usersRef.current.map((u) => u.deskId).filter(Boolean));
    return DESKS.find((desk) => !used.has(desk.id));
  };

  const setUserPatch = (id, patch) => {
    syncUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };

  const pulseSpeech = async (id, text) => {
    setUserPatch(id, {
      speech: text,
      speaking: true,
      speechToken: Date.now()
    });
    await wait(2200);
    setUserPatch(id, {
      speaking: false,
      speech: ""
    });
  };

  const handleExistingSpeaker = async (existingUser, text) => {
    setUserPatch(existingUser.id, { stage: "raise-hand" });
    await pulseSpeech(existingUser.id, text || "我又說話了");
    setUserPatch(existingUser.id, { stage: "seated" });
  };

  const handleFirstSpeaker = async (name, text) => {
    const desk = findAvailableDesk();
    if (!desk) {
      setToast("書桌已滿，先增加桌位再來。");
      window.clearTimeout(handleFirstSpeaker.toastTimer);
      handleFirstSpeaker.toastTimer = window.setTimeout(() => setToast(""), 1800);
      return;
    }

    const id = `${name}-${Date.now()}`;
    const newUser = {
      id,
      name,
      messageCount: 1,
      deskId: desk.id,
      stage: "greeting",
      pos: { x: 20, y: 92 },
      speech: `哈囉！我是 ${name}`,
      speaking: true,
      speechToken: Date.now()
    };

    syncUsers((prev) => [...prev, newUser]);
    await wait(STEP_MS.greet);

    setUserPatch(id, { stage: "chair", speech: "" });
    await wait(STEP_MS.chair);

    setUserPatch(id, {
      stage: "walking",
      pos: { x: desk.x + 16, y: desk.y + 20 }
    });
    await wait(STEP_MS.walk);

    setUserPatch(id, {
      stage: "sitting",
      pos: { x: desk.x + 12, y: desk.y + 32 }
    });
    await wait(STEP_MS.sit);

    setUserPatch(id, {
      stage: "seated",
      speech: text || "我坐好了",
      speaking: true
    });
    await wait(2200);
    setUserPatch(id, { speech: "", speaking: false });
  };

  const processQueue = async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    while (queueRef.current.length > 0) {
      const item = queueRef.current.shift();
      const existing = usersRef.current.find(
        (u) => u.name.toLowerCase() === item.name.toLowerCase()
      );

      if (existing) {
        syncUsers((prev) =>
          prev.map((u) =>
            u.id === existing.id ? { ...u, messageCount: u.messageCount + 1 } : u
          )
        );
        await handleExistingSpeaker(existing, item.text);
      } else {
        await handleFirstSpeaker(item.name, item.text);
      }
    }

    runningRef.current = false;
  };

  const simulateChat = (name, text) => {
    const cleanName = name.trim();
    const cleanText = (text || "").trim();

    if (!cleanName) return;
    queueRef.current.push({ name: cleanName, text: cleanText });
    processQueue();
  };

  const onAddSpeaker = () => {
    simulateChat(nameInput, messageInput);
    setNameInput("");
    setMessageInput("");
  };

  const playDemo = () => {
    DEMO_MESSAGES.forEach((item, index) => {
      setTimeout(() => simulateChat(item.name, item.text), index * 300);
    });
  };

  const resetAll = () => {
    queueRef.current = [];
    runningRef.current = false;
    syncUsers([]);
    setToast("");
  };

  return (
    <div className="page">
      <aside className="panel">
        <div className="panel-card">
          <div className="title-row">
            <div>
              <h1>聊天室教室模式</h1>
              <p>第一次發話：打招呼 → 分配書桌 → 拉椅子 → 坐下</p>
            </div>
            <span className="pill">GitHub 可直接跑</span>
          </div>

          <div className="block">
            <label>觀眾名稱</label>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="例如：小恩"
            />
          </div>

          <div className="block">
            <label>發言內容</label>
            <input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="例如：大家晚安"
              onKeyDown={(e) => {
                if (e.key === "Enter") onAddSpeaker();
              }}
            />
          </div>

          <div className="button-row">
            <button className="primary" onClick={onAddSpeaker}>新增發話</button>
            <button onClick={playDemo}>播放示範</button>
            <button onClick={resetAll}>重設</button>
          </div>

          <div className="block">
            <label>快速測試</label>
            <div className="chip-grid">
              {DEMO_MESSAGES.map((item) => (
                <button
                  key={item.name}
                  className="chip"
                  onClick={() => simulateChat(item.name, item.text)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="info-box">
            <strong>目前已做好的行為</strong>
            <ul>
              <li>第一次講話會從入口出現</li>
              <li>先正面打招呼</li>
              <li>自動配空書桌</li>
              <li>椅子先拉開</li>
              <li>角色走到桌前坐下</li>
              <li>之後再發言會坐著舉手並冒對話泡泡</li>
            </ul>
          </div>

          <div className="info-box">
            <strong>接真聊天室的位置</strong>
            <p>把 simulateChat(name, text) 換成 Twitch / YouTube chat 訊息事件即可。</p>
          </div>
        </div>
      </aside>

      <main className="stage-wrap">
        <div className="toolbar">
          <div className="stat">已入座：{users.filter((u) => u.stage === "seated").length}</div>
          <div className="stat">總觀眾：{users.length}</div>
          {toast ? <div className="toast">{toast}</div> : null}
        </div>

        <div className="stage">
          <div className="entry-sign">入口</div>
          <div className="room-label">OBS Overlay / Classroom Mode</div>

          {desks.map((desk) => (
            <Desk key={desk.id} desk={desk} />
          ))}

          {users.map((user) => (
            <Avatar key={user.id} user={user} />
          ))}
        </div>
      </main>
    </div>
  );
}

function Desk({ desk }) {
  return (
    <div
      className="desk-slot"
      style={{ left: desk.x, top: desk.y }}
    >
      <div className="desk-top" />
      <div className="desk-leg leg-a" />
      <div className="desk-leg leg-b" />
      <div className="desk-leg leg-c" />
      <div className="desk-leg leg-d" />

      <motion.div
        className="chair"
        animate={{ left: desk.chairPulled ? -8 : 20 }}
        transition={{ duration: STEP_MS.chair / 1000, ease: "easeInOut" }}
      >
        <div className="chair-back" />
        <div className="chair-seat" />
        <div className="chair-leg chair-leg-left" />
        <div className="chair-leg chair-leg-right" />
      </motion.div>

      {desk.occupiedBy ? (
        <div className="desk-name">書桌 {desk.id} · {desk.occupiedBy}</div>
      ) : (
        <div className="desk-empty">書桌 {desk.id}</div>
      )}
    </div>
  );
}

function Avatar({ user }) {
  const [c1, c2] = getAvatarPalette(user.name);
  const isGreeting = user.stage === "greeting";
  const isWalking = user.stage === "walking";
  const isSitting = user.stage === "sitting";
  const isSeated = user.stage === "seated";
  const isRaiseHand = user.stage === "raise-hand";

  return (
    <motion.div
      className="avatar-wrap"
      animate={{
        left: user.pos.x,
        top: user.pos.y,
        scale: isSeated || isSitting || isRaiseHand ? 0.98 : 1
      }}
      transition={{
        left: { duration: isWalking ? STEP_MS.walk / 1000 : 0.45, ease: "easeInOut" },
        top: { duration: isWalking ? STEP_MS.walk / 1000 : 0.45, ease: "easeInOut" },
        scale: { duration: 0.3 }
      }}
    >
      <AnimatePresence>
        {user.speaking && user.speech ? (
          <motion.div
            key={user.speechToken}
            className="speech"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            {user.speech}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="avatar">
        <div
          className="head"
          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
        >
          {isGreeting ? (
            <>
              <div className="eye left" />
              <div className="eye right" />
              <div className="smile" />
            </>
          ) : null}
        </div>

        <motion.div
          className="body"
          style={{ background: `linear-gradient(180deg, ${c1}, ${c2})` }}
          animate={
            isWalking
              ? { y: [0, -2, 0, -2, 0] }
              : isSitting
              ? { scaleY: [1, 0.92] }
              : { y: 0, scaleY: 1 }
          }
          transition={{ duration: 0.6, repeat: isWalking ? Infinity : 0 }}
        />

        <motion.div
          className="arm left-arm"
          animate={
            isGreeting
              ? { rotate: [-20, 30, -12, 30, 0] }
              : isRaiseHand
              ? { rotate: [-40, -65, -40] }
              : isSitting || isSeated
              ? { rotate: 35, x: 1, y: 10 }
              : { rotate: 10 }
          }
          transition={{ duration: isRaiseHand ? 0.7 : 1.05, repeat: isRaiseHand ? Infinity : 0 }}
        />
        <motion.div
          className="arm right-arm"
          animate={isSitting || isSeated ? { rotate: -35, x: -1, y: 10 } : { rotate: -10 }}
          transition={{ duration: 0.45 }}
        />

        <motion.div
          className="leg left-leg"
          animate={
            isWalking
              ? { rotate: [18, -12, 18, -12] }
              : isSitting || isSeated || isRaiseHand
              ? { rotate: 84 }
              : { rotate: 4 }
          }
          transition={{ duration: 0.45, repeat: isWalking ? Infinity : 0 }}
        />
        <motion.div
          className="leg right-leg"
          animate={
            isWalking
              ? { rotate: [-18, 12, -18, 12] }
              : isSitting || isSeated || isRaiseHand
              ? { rotate: 84 }
              : { rotate: -4 }
          }
          transition={{ duration: 0.45, repeat: isWalking ? Infinity : 0 }}
        />
      </div>

      <div className="name-tag">{user.name}</div>
      <div className="sub-tag">發言 {user.messageCount} 次</div>
    </motion.div>
  );
}

export default App;
