import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// 🔧 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCgjm2eZh4BWBi4_afbgVng0SCykEorIWY",
  authDomain: "test-2f3f3.firebaseapp.com",
  projectId: "test-2f3f3",
  storageBucket: "test-2f3f3.firebasestorage.app",
  messagingSenderId: "388801289465",
  appId: "1:388801289465:web:1c0af628c43adc68111628",
  measurementId: "G-3L4PZ3FP22"
};

// 🚀 Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const messagesRef = collection(db, "messages");

// 🧠 Set session-only persistence
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("✅ Session persistence set");
  })
  .catch((error) => {
    console.error("⚠️ Persistence setup failed:", error);
  });

// 📦 DOM
const loginContainer = document.getElementById("login-container");
const chatContainer = document.getElementById("chat-container");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const input = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const chatBox = document.getElementById("chat-box");
const toggleLoginBtn = document.getElementById("toggle-login");
const groupSelect = document.getElementById("group-select");

// 👁️ Toggle login container manually
toggleLoginBtn.addEventListener("click", () => {
  loginContainer.style.display =
    loginContainer.style.display === "block" ? "none" : "block";
});

// 🔐 Login handler
loginBtn.addEventListener("click", () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      console.log("✅ Logged in");
      emailInput.value = "";
      passwordInput.value = "";
    })
    .catch((error) => {
      alert("Login failed: " + error.message);
    });
});

// 🔓 Logout handler
logoutBtn.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      console.log("👋 Logged out");
      chatContainer.style.display = "none";
      loginContainer.style.display = "none";
      emailInput.value = "";
      passwordInput.value = "";
    })
    .catch((error) => {
      alert("Logout failed: " + error.message);
    });
});

// 🔄 Auth state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginContainer.style.display = "none";
    chatContainer.style.display = "block";
    await populateGroupSelect();
    const selectedGroup = groupSelect.value;
    loadMessagesForGroup(selectedGroup);
  } else {
    chatContainer.style.display = "none";
    loginContainer.style.display = "none";
  }
});

// 🔽 Populate group dropdown
async function populateGroupSelect() {
  const user = auth.currentUser;
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);
  const groups = userDoc.exists() ? userDoc.data().groups || [] : [];

  groupSelect.innerHTML = "";
  if (groups.length === 0) {
    groupSelect.innerHTML = `<option disabled>No groups assigned</option>`;
    return;
  }

  groups.forEach((group) => {
    const option = document.createElement("option");
    option.value = group;
    option.textContent = group;
    groupSelect.appendChild(option);
  });
}

// ✉️ Send message to selected group
sendBtn.addEventListener("click", async () => {
  const text = input.value.trim();
  const group = groupSelect.value;
  if (!text || !group) return;

  const user = auth.currentUser;
  const username = user.displayName || user.email;

  await addDoc(messagesRef, {
    text,
    username,
    createdAt: Date.now(),
    uid: user.uid,
    group
  });

  input.value = "";
});

// ⌨️ Send message on Enter key
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault(); // prevent new line
    sendBtn.click();
  }
});

// 🔄 Load messages for a specific group
let unsubscribe = null;

function loadMessagesForGroup(group) {
  if (!group) return;

  if (unsubscribe) unsubscribe(); // prevent multiple listeners

  const q = query(messagesRef, orderBy("createdAt"));
  unsubscribe = onSnapshot(q, (snapshot) => {
    chatBox.innerHTML = "";
    snapshot.forEach((doc) => {
      const msg = doc.data();
      if (msg.group === group) {
        const div = document.createElement("div");
        div.innerHTML = `<strong>${msg.username}:</strong> ${msg.text}`;
        chatBox.appendChild(div);
      }
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

// 🔁 Listen for group change
groupSelect.addEventListener("change", () => {
  const selectedGroup = groupSelect.value;
  loadMessagesForGroup(selectedGroup);
});

// 🧼 Auto logout
window.addEventListener("beforeunload", () => {
  signOut(auth).catch((error) => {
    console.error("Auto-logout failed:", error);
  });
});
