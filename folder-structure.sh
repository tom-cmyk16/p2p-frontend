#!/usr/bin/env bash
# =============================================================
# Feature-based React frontend structure
# Run from inside your frontend/ folder (the one containing src/).
# Assumes: axios, react-router-dom (v7, i.e. NOT the v8 "react-router"
# package), socket.io-client already installed.
# =============================================================
set -e

echo "== 1. Shared, cross-feature folders =="
mkdir -p src/lib
mkdir -p src/context
mkdir -p src/routes
mkdir -p src/components/common

echo "== 2. Feature folders (components/hooks/pages/services each) =="
for f in auth profile tutorApplication tutors quiz chat ratings reports admin; do
  mkdir -p "src/features/$f/components"
  mkdir -p "src/features/$f/hooks"
  mkdir -p "src/features/$f/pages"
  mkdir -p "src/features/$f/services"
done

# -------------------------------------------------------------
# Shared API client
# -------------------------------------------------------------
cat > src/lib/apiClient.js << 'EOF'
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Attach the JWT to every outgoing request, if we have one.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized handling for expired/invalid sessions.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
EOF

# -------------------------------------------------------------
# Global auth context (needed across almost every feature)
# -------------------------------------------------------------
cat > src/context/AuthContext.jsx << 'EOF'
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    setIsLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider>");
  return ctx;
}
EOF

# -------------------------------------------------------------
# Route protection
# -------------------------------------------------------------
cat > src/routes/ProtectedRoute.jsx << 'EOF'
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

// requiredRole: optional — "admin", "tutor", "student". Omit to just
// require any logged-in user.
export default function ProtectedRoute({ children, requiredRole }) {
  const { user, isLoading } = useAuthContext();

  if (isLoading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  return children;
}
EOF

# -------------------------------------------------------------
# Shared UI components (outside features/, as requested)
# -------------------------------------------------------------
cat > src/components/common/Button.jsx << 'EOF'
export default function Button({ children, onClick, type = "button", disabled, variant = "primary" }) {
  const base = "px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  );
}
EOF

cat > src/components/common/Loader.jsx << 'EOF'
export default function Loader({ label = "Loading..." }) {
  return <p className="text-sm text-gray-500 py-4">{label}</p>;
}
EOF

cat > src/components/common/ErrorMessage.jsx << 'EOF'
export default function ErrorMessage({ message }) {
  if (!message) return null;
  return <p className="text-sm text-red-600 py-2">{message}</p>;
}
EOF

echo "== Shared files written. Writing feature files... =="

# =============================================================
# FEATURE: auth
# =============================================================
cat > src/features/auth/services/auth.service.js << 'EOF'
import apiClient from "../../../lib/apiClient";

export const authService = {
  register: (payload) => apiClient.post("/auth/register", payload).then((res) => res.data),
  login: (payload) => apiClient.post("/auth/login", payload).then((res) => res.data),
};
EOF

cat > src/features/auth/hooks/useAuth.js << 'EOF'
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import { useAuthContext } from "../../../context/AuthContext";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login: setAuthState } = useAuthContext();

  const register = async (payload) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.register(payload);
      setAuthState(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (payload) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.login(payload);
      setAuthState(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return { register, login, isLoading, error };
}
EOF

cat > src/features/auth/pages/LoginPage.jsx << 'EOF'
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Button from "../../../components/common/Button";
import ErrorMessage from "../../../components/common/ErrorMessage";

export default function LoginPage() {
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ phoneOrEmail, password });
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-xl font-semibold mb-4">Log in</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full border rounded-md px-3 py-2"
          placeholder="Phone or email"
          value={phoneOrEmail}
          onChange={(e) => setPhoneOrEmail(e.target.value)}
        />
        <input
          className="w-full border rounded-md px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <ErrorMessage message={error} />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Log in"}
        </Button>
      </form>
      <p className="text-sm mt-3">
        No account? <Link to="/register" className="text-blue-600">Register</Link>
      </p>
    </div>
  );
}
EOF

cat > src/features/auth/pages/RegisterPage.jsx << 'EOF'
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import Button from "../../../components/common/Button";
import ErrorMessage from "../../../components/common/ErrorMessage";

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: "", phoneOrEmail: "", password: "" });
  const { register, isLoading, error } = useAuth();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    register(form);
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-xl font-semibold mb-4">Create an account</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="w-full border rounded-md px-3 py-2" name="fullName" placeholder="Full name" value={form.fullName} onChange={handleChange} />
        <input className="w-full border rounded-md px-3 py-2" name="phoneOrEmail" placeholder="Phone or email" value={form.phoneOrEmail} onChange={handleChange} />
        <input className="w-full border rounded-md px-3 py-2" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />
        <ErrorMessage message={error} />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Register"}
        </Button>
      </form>
    </div>
  );
}
EOF

# =============================================================
# FEATURE: profile
# =============================================================
cat > src/features/profile/services/profile.service.js << 'EOF'
import apiClient from "../../../lib/apiClient";

export const profileService = {
  getMyProfile: () => apiClient.get("/users/me").then((res) => res.data),
  updateMyProfile: (payload) => apiClient.patch("/users/me", payload).then((res) => res.data),
};
EOF

cat > src/features/profile/hooks/useProfile.js << 'EOF'
import { useState, useEffect, useCallback } from "react";
import { profileService } from "../services/profile.service";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await profileService.getMyProfile();
      setProfile(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (payload) => {
    const updated = await profileService.updateMyProfile(payload);
    setProfile(updated);
    return updated;
  };

  return { profile, isLoading, error, updateProfile, refetch: fetchProfile };
}
EOF

cat > src/features/profile/pages/ProfilePage.jsx << 'EOF'
import { useState, useEffect } from "react";
import { useProfile } from "../hooks/useProfile";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";
import ErrorMessage from "../../../components/common/ErrorMessage";

export default function ProfilePage() {
  const { profile, isLoading, error, updateProfile } = useProfile();
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (profile) setFullName(profile.fullName);
  }, [profile]);

  if (isLoading) return <Loader label="Loading profile..." />;

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-xl font-semibold mb-4">My Profile</h1>
      <ErrorMessage message={error} />
      {profile && (
        <div className="space-y-3">
          <input
            className="w-full border rounded-md px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <p className="text-sm text-gray-500">Role: {profile.role}</p>
          <Button onClick={() => updateProfile({ fullName })}>Save</Button>
        </div>
      )}
    </div>
  );
}
EOF

# =============================================================
# FEATURE: tutorApplication
# =============================================================
cat > src/features/tutorApplication/services/tutorApplication.service.js << 'EOF'
import apiClient from "../../../lib/apiClient";

export const tutorApplicationService = {
  getMyApplication: () => apiClient.get("/tutor-applications/me").then((res) => res.data),
  submitApplication: (payload) => apiClient.post("/tutor-applications", payload).then((res) => res.data),
  uploadDocument: (applicationId, file, documentType) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    return apiClient
      .post(`/tutor-applications/${applicationId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },
};
EOF

cat > src/features/tutorApplication/hooks/useTutorApplication.js << 'EOF'
import { useState, useEffect, useCallback } from "react";
import { tutorApplicationService } from "../services/tutorApplication.service";

export function useTutorApplication() {
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplication = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await tutorApplicationService.getMyApplication();
      setApplication(data);
    } catch (err) {
      // 404 just means "no application yet" — not a real error for this screen
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || "Failed to load application status");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const submitApplication = async (payload) => {
    const created = await tutorApplicationService.submitApplication(payload);
    setApplication(created);
    return created;
  };

  const uploadDocument = async (file, documentType) => {
    if (!application) throw new Error("Submit the application before uploading documents");
    return tutorApplicationService.uploadDocument(application.id, file, documentType);
  };

  return { application, isLoading, error, submitApplication, uploadDocument, refetch: fetchApplication };
}
EOF

cat > src/features/tutorApplication/pages/TutorApplicationPage.jsx << 'EOF'
import { useState } from "react";
import { useTutorApplication } from "../hooks/useTutorApplication";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";
import ErrorMessage from "../../../components/common/ErrorMessage";

export default function TutorApplicationPage() {
  const { application, isLoading, error, submitApplication, uploadDocument } = useTutorApplication();
  const [form, setForm] = useState({
    educationLevel: "HIGH_SCHOOL",
    institutionName: "",
    bio: "",
  });

  if (isLoading) return <Loader label="Loading application status..." />;

  // Already applied — show status instead of the form.
  if (application) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <h1 className="text-xl font-semibold mb-2">Tutor Application</h1>
        <p>Status: <strong>{application.status}</strong></p>
        {application.status === "REJECTED" && (
          <p className="text-sm text-red-600 mt-2">Reason: {application.rejectionReason}</p>
        )}
        {application.status === "APPROVED" && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Upload supporting documents:</p>
            <input
              type="file"
              onChange={(e) => e.target.files[0] && uploadDocument(e.target.files[0], "TRANSCRIPT")}
            />
          </div>
        )}
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    submitApplication(form);
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-xl font-semibold mb-4">Apply to become a tutor</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <select
          className="w-full border rounded-md px-3 py-2"
          value={form.educationLevel}
          onChange={(e) => setForm({ ...form, educationLevel: e.target.value })}
        >
          <option value="HIGH_SCHOOL">High school</option>
          <option value="UNIVERSITY">University</option>
        </select>
        <input
          className="w-full border rounded-md px-3 py-2"
          placeholder="Institution name"
          value={form.institutionName}
          onChange={(e) => setForm({ ...form, institutionName: e.target.value })}
        />
        <textarea
          className="w-full border rounded-md px-3 py-2"
          placeholder="Short bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
        <ErrorMessage message={error} />
        <Button type="submit">Submit application</Button>
      </form>
    </div>
  );
}
EOF

# =============================================================
# FEATURE: tutors (directory)
# =============================================================
cat > src/features/tutors/services/tutor.service.js << 'EOF'
import apiClient from "../../../lib/apiClient";

export const tutorService = {
  getTutors: (filters = {}) => apiClient.get("/tutors", { params: filters }).then((res) => res.data),
  getTutorById: (tutorId) => apiClient.get(`/tutors/${tutorId}`).then((res) => res.data),
};
EOF

cat > src/features/tutors/hooks/useTutors.js << 'EOF'
import { useState, useEffect, useCallback } from "react";
import { tutorService } from "../services/tutor.service";

export function useTutors(initialFilters = {}) {
  const [tutors, setTutors] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTutors = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await tutorService.getTutors(filters);
      setTutors(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tutors");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  return { tutors, filters, setFilters, isLoading, error };
}
EOF

cat > src/features/tutors/pages/TutorDirectoryPage.jsx << 'EOF'
import { Link } from "react-router-dom";
import { useTutors } from "../hooks/useTutors";
import Loader from "../../../components/common/Loader";
import ErrorMessage from "../../../components/common/ErrorMessage";

export default function TutorDirectoryPage() {
  const { tutors, isLoading, error } = useTutors();

  if (isLoading) return <Loader label="Loading tutors..." />;

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h1 className="text-xl font-semibold mb-4">Find a tutor</h1>
      <ErrorMessage message={error} />
      <ul className="space-y-3">
        {tutors.map((tutor) => (
          <li key={tutor.userId} className="border rounded-md p-3">
            <p className="font-medium">{tutor.user?.fullName}</p>
            <p className="text-sm text-gray-500">{tutor.institutionName}</p>
            <Link to={`/chat/new/${tutor.userId}`} className="text-blue-600 text-sm">
              Message this tutor
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
EOF

# =============================================================
# FEATURE: quiz
# =============================================================
cat > src/features/quiz/services/quiz.service.js << 'EOF'
import apiClient from "../../../lib/apiClient";

export const quizService = {
  getQuestions: (params) => apiClient.get("/quiz/questions", { params }).then((res) => res.data),
  submitAttempt: (payload) => apiClient.post("/quiz/attempts", payload).then((res) => res.data),
  getWeakTopics: () => apiClient.get("/quiz/weak-topics").then((res) => res.data),
};
EOF

cat > src/features/quiz/hooks/useQuiz.js << 'EOF'
import { useState } from "react";
import { quizService } from "../services/quiz.service";

export function useQuiz() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedOptionId }
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const startQuiz = async (subjectId, gradeLevel) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await quizService.getQuestions({ subjectId, gradeLevel });
      setQuestions(data);
      setAnswers({});
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const selectAnswer = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const submitQuiz = async (subjectId, gradeLevel) => {
    setIsLoading(true);
    try {
      const payload = {
        subjectId,
        gradeLevel,
        answers: Object.entries(answers).map(([questionId, selectedOptionId]) => ({
          questionId,
          selectedOptionId,
        })),
      };
      const data = await quizService.submitAttempt(payload);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit quiz");
    } finally {
      setIsLoading(false);
    }
  };

  return { questions, answers, result, isLoading, error, startQuiz, selectAnswer, submitQuiz };
}
EOF

cat > src/features/quiz/pages/QuizPage.jsx << 'EOF'
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuiz } from "../hooks/useQuiz";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";
import ErrorMessage from "../../../components/common/ErrorMessage";

// Expects a route like /quiz/:subjectId/:gradeLevel
export default function QuizPage() {
  const { subjectId, gradeLevel } = useParams();
  const { questions, answers, result, isLoading, error, startQuiz, selectAnswer, submitQuiz } = useQuiz();

  useEffect(() => {
    startQuiz(subjectId, gradeLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, gradeLevel]);

  if (isLoading) return <Loader label="Loading quiz..." />;

  if (result) {
    return (
      <div className="max-w-xl mx-auto mt-10">
        <h1 className="text-xl font-semibold">Score: {result.score}%</h1>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 space-y-6">
      <ErrorMessage message={error} />
      {questions.map((q, i) => (
        <div key={q.id} className="border rounded-md p-4">
          <p className="font-medium mb-2">{i + 1}. {q.questionText}</p>
          {q.options.map((opt) => (
            <label key={opt.id} className="block text-sm">
              <input
                type="radio"
                name={q.id}
                checked={answers[q.id] === opt.id}
                onChange={() => selectAnswer(q.id, opt.id)}
                className="mr-2"
              />
              {opt.optionText}
            </label>
          ))}
        </div>
      ))}
      {questions.length > 0 && (
        <Button onClick={() => submitQuiz(subjectId, gradeLevel)}>Submit quiz</Button>
      )}
    </div>
  );
}
EOF

# =============================================================
# FEATURE: chat
# =============================================================
cat > src/features/chat/services/chat.service.js << 'EOF'
import apiClient from "../../../lib/apiClient";

export const chatService = {
  getConversations: () => apiClient.get("/conversations").then((res) => res.data),
  getOrCreateConversation: (tutorId) =>
    apiClient.post("/conversations", { tutorId }).then((res) => res.data),
  getMessages: (conversationId) =>
    apiClient.get(`/conversations/${conversationId}/messages`).then((res) => res.data),
  sendTextMessage: (conversationId, text) =>
    apiClient.post(`/conversations/${conversationId}/messages`, { type: "TEXT", textContent: text }).then((res) => res.data),
  sendFileMessage: (conversationId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient
      .post(`/conversations/${conversationId}/messages/file`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },
};
EOF

cat > src/features/chat/hooks/useChat.js << 'EOF'
import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { chatService } from "../services/chat.service";

export function useChat(conversationId) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    setIsLoading(true);
    try {
      const data = await chatService.getMessages(conversationId);
      setMessages(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Real-time updates over Socket.IO
  useEffect(() => {
    if (!conversationId) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", {
      auth: { token: localStorage.getItem("token") },
    });
    socketRef.current = socket;

    socket.emit("conversation:join", conversationId);
    socket.on("message:new", (message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket.emit("conversation:leave", conversationId);
      socket.disconnect();
    };
  }, [conversationId]);

  const sendText = async (text) => {
    await chatService.sendTextMessage(conversationId, text);
    // No optimistic update — rely on the socket "message:new" event so
    // the sender sees the exact same server-confirmed message as everyone else.
  };

  const sendFile = async (file) => {
    await chatService.sendFileMessage(conversationId, file);
  };

  return { messages, isLoading, error, sendText, sendFile };
}
EOF

cat > src/features/chat/pages/ChatPage.jsx << 'EOF'
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useChat } from "../hooks/useChat";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";
import ErrorMessage from "../../../components/common/ErrorMessage";

// Expects a route like /chat/:conversationId
export default function ChatPage() {
  const { conversationId } = useParams();
  const { messages, isLoading, error, sendText, sendFile } = useChat(conversationId);
  const [draft, setDraft] = useState("");

  if (isLoading) return <Loader label="Loading conversation..." />;

  const handleSend = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    sendText(draft);
    setDraft("");
  };

  return (
    <div className="max-w-xl mx-auto mt-10 flex flex-col h-[70vh]">
      <ErrorMessage message={error} />
      <div className="flex-1 overflow-y-auto border rounded-md p-3 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            {m.type === "TEXT" && <p>{m.textContent}</p>}
            {m.type === "IMAGE" && <img src={m.fileUrl} alt={m.fileName} className="max-w-xs rounded-md" />}
            {m.type === "DOCUMENT" && (
              <a href={m.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                {m.fileName}
              </a>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          className="flex-1 border rounded-md px-3 py-2"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
        />
        <input
          type="file"
          className="hidden"
          id="chat-file-input"
          onChange={(e) => e.target.files[0] && sendFile(e.target.files[0])}
        />
        <label htmlFor="chat-file-input">
          <Button type="button" variant="secondary">📎</Button>
        </label>
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
EOF

# =============================================================
# FEATURE: ratings
# =============================================================
cat > src/features/ratings/services/rating.service.js << 'EOF'
import apiClient from "../../../lib/apiClient";

export const ratingService = {
  submitRating: (conversationId, payload) =>
    apiClient.post(`/conversations/${conversationId}/rating`, payload).then((res) => res.data),
};
EOF

cat > src/features/ratings/hooks/useRating.js << 'EOF'
import { useState } from "react";
import { ratingService } from "../services/rating.service";

export function useRating(conversationId) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const submitRating = async (score, comment) => {
    setIsLoading(true);
    setError(null);
    try {
      await ratingService.submitRating(conversationId, { score, comment });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit rating");
    } finally {
      setIsLoading(false);
    }
  };

  return { submitRating, isLoading, error, submitted };
}
EOF

cat > src/features/ratings/pages/RatingPage.jsx << 'EOF'
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useRating } from "../hooks/useRating";
import Button from "../../../components/common/Button";
import ErrorMessage from "../../../components/common/ErrorMessage";

// Expects a route like /conversations/:conversationId/rate
export default function RatingPage() {
  const { conversationId } = useParams();
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const { submitRating, isLoading, error, submitted } = useRating(conversationId);

  if (submitted) {
    return <p className="text-center mt-10">Thanks for your feedback!</p>;
  }

  return (
    <div className="max-w-sm mx-auto mt-10">
      <h1 className="text-xl font-semibold mb-4">Rate this tutor</h1>
      <select className="w-full border rounded-md px-3 py-2 mb-3" value={score} onChange={(e) => setScore(Number(e.target.value))}>
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>
        ))}
      </select>
      <textarea
        className="w-full border rounded-md px-3 py-2 mb-3"
        placeholder="Optional comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <ErrorMessage message={error} />
      <Button onClick={() => submitRating(score, comment)} disabled={isLoading}>
        Submit rating
      </Button>
    </div>
  );
}
EOF

# =============================================================
# FEATURE: reports
# =============================================================
cat > src/features/reports/services/report.service.js << 'EOF'
import apiClient from "../../../lib/apiClient";

export const reportService = {
  // targetType: "MESSAGE" | "CONVERSATION" | "USER_PROFILE"
  // targetId: the id of whichever one is being reported
  submitReport: (payload) => apiClient.post("/reports", payload).then((res) => res.data),
};
EOF

cat > src/features/reports/hooks/useReport.js << 'EOF'
import { useState } from "react";
import { reportService } from "../services/report.service";

export function useReport() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const submitReport = async (targetType, targetId, reason) => {
    setIsLoading(true);
    setError(null);
    try {
      await reportService.submitReport({ targetType, targetId, reason });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit report");
    } finally {
      setIsLoading(false);
    }
  };

  return { submitReport, isLoading, error, submitted };
}
EOF

cat > src/features/reports/pages/ReportPage.jsx << 'EOF'
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useReport } from "../hooks/useReport";
import Button from "../../../components/common/Button";
import ErrorMessage from "../../../components/common/ErrorMessage";

// Expects /report?targetType=MESSAGE&targetId=xyz
export default function ReportPage() {
  const [searchParams] = useSearchParams();
  const targetType = searchParams.get("targetType");
  const targetId = searchParams.get("targetId");
  const [reason, setReason] = useState("");
  const { submitReport, isLoading, error, submitted } = useReport();

  if (submitted) {
    return <p className="text-center mt-10">Report submitted. An admin will review it.</p>;
  }

  return (
    <div className="max-w-sm mx-auto mt-10">
      <h1 className="text-xl font-semibold mb-4">Report content</h1>
      <textarea
        className="w-full border rounded-md px-3 py-2 mb-3"
        placeholder="What's wrong?"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <ErrorMessage message={error} />
      <Button onClick={() => submitReport(targetType, targetId, reason)} disabled={isLoading || !reason}>
        Submit report
      </Button>
    </div>
  );
}
EOF

# =============================================================
# FEATURE: admin
# =============================================================
cat > src/features/admin/services/admin.service.js << 'EOF'
import apiClient from "../../../lib/apiClient";

export const adminService = {
  getPendingApplications: () => apiClient.get("/admin/tutor-applications?status=SUBMITTED").then((res) => res.data),
  approveApplication: (applicationId) =>
    apiClient.patch(`/admin/tutor-applications/${applicationId}/approve`).then((res) => res.data),
  rejectApplication: (applicationId, rejectionReason) =>
    apiClient.patch(`/admin/tutor-applications/${applicationId}/reject`, { rejectionReason }).then((res) => res.data),
  getOpenReports: () => apiClient.get("/admin/reports?status=PENDING").then((res) => res.data),
  resolveReport: (reportId, status) =>
    apiClient.patch(`/admin/reports/${reportId}`, { status }).then((res) => res.data),
};
EOF

cat > src/features/admin/hooks/useAdmin.js << 'EOF'
import { useState, useEffect, useCallback } from "react";
import { adminService } from "../services/admin.service";

export function useAdmin() {
  const [applications, setApplications] = useState([]);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [apps, reps] = await Promise.all([
        adminService.getPendingApplications(),
        adminService.getOpenReports(),
      ]);
      setApplications(apps);
      setReports(reps);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const approveApplication = async (id) => {
    await adminService.approveApplication(id);
    setApplications((prev) => prev.filter((a) => a.id !== id));
  };

  const rejectApplication = async (id, reason) => {
    await adminService.rejectApplication(id, reason);
    setApplications((prev) => prev.filter((a) => a.id !== id));
  };

  const resolveReport = async (id, status) => {
    await adminService.resolveReport(id, status);
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  return { applications, reports, isLoading, error, approveApplication, rejectApplication, resolveReport };
}
EOF

cat > src/features/admin/pages/AdminDashboardPage.jsx << 'EOF'
import { useAdmin } from "../hooks/useAdmin";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";
import ErrorMessage from "../../../components/common/ErrorMessage";

export default function AdminDashboardPage() {
  const { applications, reports, isLoading, error, approveApplication, rejectApplication, resolveReport } = useAdmin();

  if (isLoading) return <Loader label="Loading admin dashboard..." />;

  return (
    <div className="max-w-3xl mx-auto mt-10 space-y-10">
      <ErrorMessage message={error} />

      <section>
        <h2 className="text-lg font-semibold mb-3">Pending tutor applications</h2>
        {applications.map((app) => (
          <div key={app.id} className="border rounded-md p-3 mb-2 flex justify-between items-center">
            <div>
              <p className="font-medium">{app.applicant?.fullName}</p>
              <p className="text-sm text-gray-500">{app.institutionName} — {app.educationLevel}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => approveApplication(app.id)}>Approve</Button>
              <Button variant="danger" onClick={() => rejectApplication(app.id, "Did not meet criteria")}>Reject</Button>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Open reports</h2>
        {reports.map((report) => (
          <div key={report.id} className="border rounded-md p-3 mb-2 flex justify-between items-center">
            <div>
              <p className="text-sm">{report.reason}</p>
              <p className="text-xs text-gray-500">{report.targetType}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => resolveReport(report.id, "ACTION_TAKEN")}>Action taken</Button>
              <Button variant="secondary" onClick={() => resolveReport(report.id, "DISMISSED")}>Dismiss</Button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
EOF

echo "== Done. Feature-based structure written under src/features/ =="
echo "Next: wire these pages into src/routes/AppRoutes.jsx and wrap your app in <AuthProvider>."
