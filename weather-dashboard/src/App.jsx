import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchTasks,
  createTask,
  deleteTask,
  updateTask,
  updateTaskStatus,
} from "./api/tasksApi";
import {
  login as loginRequest,
  register as registerRequest,
} from "./api/authApi";
import "./App.css";

function App() {
  // ---------------- Auth ----------------
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [email, setEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verifyError, setVerifyError] = useState("");

  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");

  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  const verifyRequestedRef = useRef(false);

  // ---------------- Dark Mode ----------------
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  // ---------------- Weather ----------------
  const [city, setCity] = useState("Berlin");
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(null);

  // ---------------- User Profile ----------------
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");

  const [headerAvatarError, setHeaderAvatarError] = useState(false);
  const [modalAvatarError, setModalAvatarError] = useState(false);

  // ---------------- Tasks ----------------
  const [tasks, setTasks] = useState([]);
  const [tasksError, setTasksError] = useState(null);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");

  // ---------------- Filter / Sort / Search ----------------
  const [activeTab, setActiveTab] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sortMode, setSortMode] = useState("NEWEST");
  const [searchTerm, setSearchTerm] = useState("");

  // ---------------- Task Edit Modal ----------------
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("MEDIUM");
  const [editLoading, setEditLoading] = useState(false);

  // ---------------- Delete Dialog ----------------
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ---------------- Toasts ----------------
  const [toasts, setToasts] = useState([]);

  const BACKEND_URL = "http://localhost:8081";

  const pathname = window.location.pathname;
  const isResetRoute = pathname === "/reset-password";

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    setHeaderAvatarError(false);
  }, [userProfile?.avatarUrl]);

  useEffect(() => {
    setModalAvatarError(false);
  }, [profileAvatarUrl]);

  // ---------------- Helpers ----------------
  function showToast(message, type = "success") {
    const id = Date.now() + Math.random();
    const toast = { id, message, type };
    setToasts((prev) => [...prev, toast]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }

  function getInitials(name) {
    if (!name) return "U";
    return name
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
    setTasks([]);
    setTasksError(null);
    setLoginError(null);
    setUserProfile(null);
    setIsProfileModalOpen(false);
    showToast("Erfolgreich ausgeloggt", "info");
  }

  function getStatusColor(status) {
    switch (status) {
      case "IN_PROGRESS":
        return "#f59e0b";
      case "DONE":
        return "#22c55e";
      case "NEW":
      default:
        return "#3b82f6";
    }
  }

  function getPriorityColor(priority) {
    switch (priority) {
      case "HIGH":
        return "#ef4444";
      case "MEDIUM":
        return "#f59e0b";
      case "LOW":
        return "#22c55e";
      default:
        return "#6b7280";
    }
  }

  function clearFilters() {
    setActiveTab("ALL");
    setPriorityFilter("ALL");
    setSortMode("NEWEST");
    setSearchTerm("");
  }

  function fillDemoTask(type) {
    if (type === "quick") {
      setNewTaskTitle("Quick Review");
      setNewTaskDescription("Check open tasks and update their status");
      setNewTaskPriority("MEDIUM");
    } else if (type === "important") {
      setNewTaskTitle("Important Task");
      setNewTaskDescription("Finish the most important work for today");
      setNewTaskPriority("HIGH");
    } else {
      setNewTaskTitle("Small Task");
      setNewTaskDescription("Complete a simple low priority task");
      setNewTaskPriority("LOW");
    }
  }

  function openEditModal(task) {
    setEditingTask(task);
    setEditTitle(task.title || "");
    setEditDescription(task.description || "");
    setEditPriority(task.priority || "MEDIUM");
    setIsEditModalOpen(true);
  }

  function closeEditModal() {
    setIsEditModalOpen(false);
    setEditingTask(null);
    setEditTitle("");
    setEditDescription("");
    setEditPriority("MEDIUM");
    setEditLoading(false);
  }

  function openDeleteDialog(task) {
    setTaskToDelete(task);
  }

  function closeDeleteDialog() {
    setTaskToDelete(null);
    setDeleteLoading(false);
  }

  function openProfileModal() {
    if (!userProfile) return;
    setProfileEmail(userProfile.email || "");
    setProfilePhone(userProfile.phone || "");
    setProfileAvatarUrl(userProfile.avatarUrl || "");
    setModalAvatarError(false);
    setIsProfileModalOpen(true);
  }

  function closeProfileModal() {
    setIsProfileModalOpen(false);
    setProfileSaving(false);
  }

  function getTabCount(tab) {
    if (tab === "ALL") return tasks.length;
    return tasks.filter((task) => (task.status || "NEW") === tab).length;
  }

  // ---------------- Weather ----------------
  async function loadWeather() {
    if (!city.trim()) return;

    try {
      setWeatherError(null);

      const res = await fetch(
        `http://localhost:8081/api/weather?city=${city}`
      );

      if (!res.ok) {
        throw new Error("Stadt nicht gefunden oder API-Fehler");
      }

      const data = await res.json();
      setWeather(data);
    } catch (err) {
      setWeather(null);
      setWeatherError(err.message);
    }
  }

  // ---------------- Profile ----------------
  async function loadProfile(currentToken = token) {
    if (!currentToken) return;

    try {
      setProfileLoading(true);

      const res = await fetch(`${BACKEND_URL}/api/account/me`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("Profil konnte nicht geladen werden");
      }

      const data = await res.json();
      setUserProfile(data);
      setHeaderAvatarError(false);
    } catch (err) {
      showToast(err.message || "Profil konnte nicht geladen werden", "error");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!token) return;

    try {
      setProfileSaving(true);

      const res = await fetch(`${BACKEND_URL}/api/account/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: profileEmail.trim(),
          phone: profilePhone.trim(),
          avatarUrl: profileAvatarUrl.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Profil konnte nicht gespeichert werden");
      }

      const updated = await res.json();
      setUserProfile(updated);
      setHeaderAvatarError(false);
      showToast("Profil gespeichert");
      closeProfileModal();
    } catch (err) {
      showToast(
        err.message || "Profil konnte nicht gespeichert werden",
        "error"
      );
      setProfileSaving(false);
    }
  }

  async function handleEmailVerification(tokenFromUrl) {
    if (!tokenFromUrl) return;

    try {
      setVerifyLoading(true);
      setVerifyError("");
      setVerifyMessage("");
      setLoginError(null);

      const res = await fetch(
        `${BACKEND_URL}/verify-email?token=${encodeURIComponent(tokenFromUrl)}`
      );

      const text = await res.text();

      if (!res.ok) {
        const normalized = (text || "").toLowerCase();

        if (
          normalized.includes("already used") ||
          normalized.includes("already verified")
        ) {
          setVerifyMessage("E-Mail ist bereits bestätigt.");
          showToast("E-Mail ist bereits bestätigt", "info");
          window.history.replaceState({}, document.title, "/");
          return;
        }

        throw new Error(text || "E-Mail-Verifizierung fehlgeschlagen");
      }

      setVerifyMessage(text || "E-Mail erfolgreich bestätigt");
      setAuthMode("login");
      showToast("E-Mail erfolgreich bestätigt");

      window.history.replaceState({}, document.title, "/");
    } catch (err) {
      setVerifyError(err.message || "E-Mail-Verifizierung fehlgeschlagen");
      showToast(
        err.message || "E-Mail-Verifizierung fehlgeschlagen",
        "error"
      );
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setForgotPasswordError("Bitte zuerst eine E-Mail eingeben.");
      setForgotPasswordMessage("");
      return;
    }

    try {
      setForgotPasswordLoading(true);
      setForgotPasswordError("");
      setForgotPasswordMessage("");

      const res = await fetch(`${BACKEND_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: "",
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(text || "Reset-Link konnte nicht gesendet werden");
      }

      const message =
        text || "Wenn die E-Mail existiert, wurde ein Reset-Link gesendet.";
      setForgotPasswordMessage(message);
      showToast("Reset-Link wurde angefordert", "info");
    } catch (err) {
      setForgotPasswordError(
        err.message || "Reset-Link konnte nicht gesendet werden"
      );
      showToast(
        err.message || "Reset-Link konnte nicht gesendet werden",
        "error"
      );
    } finally {
      setForgotPasswordLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();

    if (!resetPassword || !resetPasswordConfirm) {
      setResetError("Bitte beide Passwort-Felder ausfüllen.");
      setResetMessage("");
      return;
    }

    if (resetPassword !== resetPasswordConfirm) {
      setResetError("Die Passwörter stimmen nicht überein.");
      setResetMessage("");
      return;
    }

    try {
      setResetLoading(true);
      setResetError("");
      setResetMessage("");

      const res = await fetch(
        `${BACKEND_URL}/reset-password?token=${encodeURIComponent(
          resetToken
        )}&newPassword=${encodeURIComponent(resetPassword)}`,
        {
          method: "POST",
        }
      );

      const text = await res.text();

      if (!res.ok) {
        throw new Error(text || "Passwort konnte nicht zurückgesetzt werden");
      }

      setResetMessage(text || "Passwort erfolgreich zurückgesetzt.");
      setResetPassword("");
      setResetPasswordConfirm("");
      showToast("Passwort erfolgreich zurückgesetzt");

      window.setTimeout(() => {
        window.history.replaceState({}, document.title, "/");
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      setResetError(
        err.message || "Passwort konnte nicht zurückgesetzt werden"
      );
      showToast(
        err.message || "Passwort konnte nicht zurückgesetzt werden",
        "error"
      );
    } finally {
      setResetLoading(false);
    }
  }

  // ---------------- Tasks ----------------
  async function loadTasks() {
    try {
      setTasksLoading(true);
      setTasksError(null);

      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      if (err.code === 401) {
        handleLogout();
        return;
      }
      setTasksError(err.message);
      showToast(err.message || "Tasks konnten nicht geladen werden", "error");
    } finally {
      setTasksLoading(false);
    }
  }

  useEffect(() => {
    loadWeather();
    if (token) {
      loadTasks();
      loadProfile(token);
    }
  }, [token]);

  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");

    if (path === "/verify-email" && tokenFromUrl) {
      if (verifyRequestedRef.current) return;
      verifyRequestedRef.current = true;
      handleEmailVerification(tokenFromUrl);
    }

    if (path === "/reset-password") {
      setResetToken(tokenFromUrl || "");
    }
  }, []);

  // ---------------- Login / Register ----------------
  async function handleAuth(e) {
    e.preventDefault();
    if (!email.trim() || !loginPassword) return;

    try {
      setLoginLoading(true);
      setLoginError(null);

      const userEmail = email.trim();

      if (authMode === "login") {
        const data = await loginRequest(userEmail, loginPassword);
        localStorage.setItem("token", data.token);
        setToken(data.token);
        showToast("Login erfolgreich");
      } else {
        await registerRequest(userEmail, loginPassword);
        setAuthMode("login");
        showToast("Registrierung erfolgreich. Bitte E-Mail bestätigen.");
      }

      setEmail("");
      setLoginPassword("");
    } catch (err) {
      setLoginError(err.message);
      showToast(err.message || "Fehler bei der Anmeldung", "error");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      setTasksError(null);

      const created = await createTask({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        priority: newTaskPriority,
      });

      setTasks((prev) => [created, ...prev]);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("MEDIUM");
      showToast("Task erstellt");
    } catch (err) {
      if (err.code === 401) {
        handleLogout();
        return;
      }
      setTasksError(err.message);
      showToast(err.message || "Task konnte nicht erstellt werden", "error");
    }
  }

  async function handleDeleteTaskConfirmed() {
    if (!taskToDelete) return;

    try {
      setDeleteLoading(true);
      setTasksError(null);

      await deleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      showToast("Task gelöscht");
      closeDeleteDialog();
    } catch (err) {
      if (err.code === 401) {
        handleLogout();
        return;
      }
      setTasksError(err.message);
      showToast(err.message || "Task konnte nicht gelöscht werden", "error");
      setDeleteLoading(false);
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      setTasksError(null);
      const updated = await updateTaskStatus(id, newStatus);

      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, status: updated.status } : task
        )
      );

      showToast("Status aktualisiert");
    } catch (err) {
      if (err.code === 401) {
        handleLogout();
        return;
      }
      setTasksError(err.message);
      showToast(err.message || "Status konnte nicht geändert werden", "error");
    }
  }

  async function handleSaveEdit() {
    if (!editingTask || !editTitle.trim()) return;

    try {
      setEditLoading(true);
      setTasksError(null);

      const updated = await updateTask(editingTask.id, {
        id: editingTask.id,
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        status: editingTask.status,
      });

      setTasks((prev) =>
        prev.map((task) => (task.id === editingTask.id ? updated : task))
      );

      showToast("Task gespeichert");
      closeEditModal();
    } catch (err) {
      if (err.code === 401) {
        handleLogout();
        return;
      }
      setTasksError(err.message);
      showToast(err.message || "Task konnte nicht gespeichert werden", "error");
      setEditLoading(false);
    }
  }

  // ---------------- Derived ----------------
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    if (activeTab !== "ALL") {
      result = result.filter((task) => (task.status || "NEW") === activeTab);
    }

    if (priorityFilter !== "ALL") {
      result = result.filter(
        (task) => (task.priority || "MEDIUM") === priorityFilter
      );
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (task) =>
          (task.title || "").toLowerCase().includes(q) ||
          (task.description || "").toLowerCase().includes(q)
      );
    }

    if (sortMode === "TITLE_ASC") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortMode === "TITLE_DESC") {
      result.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    } else if (sortMode === "PRIORITY") {
      const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      result.sort(
        (a, b) =>
          (rank[b.priority || "MEDIUM"] || 0) -
          (rank[a.priority || "MEDIUM"] || 0)
      );
    } else {
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [tasks, activeTab, priorityFilter, sortMode, searchTerm]);

  const total = tasks.length;
  const totalNew = tasks.filter((t) => (t.status || "NEW") === "NEW").length;
  const totalInProgress = tasks.filter(
    (t) => (t.status || "NEW") === "IN_PROGRESS"
  ).length;
  const totalDone = tasks.filter((t) => (t.status || "NEW") === "DONE").length;
  const completionRate =
    total === 0 ? 0 : Math.round((totalDone / total) * 100);

  const showHeaderAvatar = Boolean(
    userProfile?.avatarUrl && !headerAvatarError
  );
  const showModalAvatar = Boolean(profileAvatarUrl && !modalAvatarError);

  return (
    <div className="app-shell">
      <div className="background-orb orb-1" />
      <div className="background-orb orb-2" />
      <div className="background-grid" />

      <div className="app">
        <header className="topbar">
          <div className="hero-copy">
            <span className="hero-badge">✨ Productivity Dashboard</span>
            <h1>Weather &amp; Task Dashboard</h1>
            <p className="muted hero-text">
              Organisiere Aufgaben, verfolge Fortschritt und behalte das Wetter
              im Blick.
            </p>

            {token && (
              <div className="hero-mini-stats">
                <div className="hero-mini-card">
                  <span className="hero-mini-label">📋 Tasks</span>
                  <strong>{total}</strong>
                </div>
                <div className="hero-mini-card">
                  <span className="hero-mini-label">✅ Done</span>
                  <strong>{totalDone}</strong>
                </div>
                <div className="hero-mini-card">
                  <span className="hero-mini-label">📈 Rate</span>
                  <strong>{completionRate}%</strong>
                </div>
              </div>
            )}
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="ghost icon-btn"
              onClick={() => setDarkMode((v) => !v)}
              title="Dark Mode umschalten"
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>

            {token && userProfile ? (
              <>
                <button
                  type="button"
                  className="profile-trigger"
                  onClick={openProfileModal}
                >
                  <div className="profile-avatar-wrap">
                    {showHeaderAvatar ? (
                      <img
                        src={userProfile.avatarUrl}
                        alt={userProfile.login}
                        className="profile-avatar"
                        onError={() => setHeaderAvatarError(true)}
                      />
                    ) : (
                      <div className="profile-avatar profile-avatar-fallback">
                        {getInitials(userProfile.login)}
                      </div>
                    )}
                  </div>

                  <div className="profile-text">
                    <span className="profile-name">{userProfile.login}</span>
                    <span className="profile-subtitle">
                      {userProfile.email || "Kein E-Mail-Eintrag"}
                    </span>
                  </div>
                </button>

                <button onClick={handleLogout}>🚪 Logout</button>
              </>
            ) : token ? (
              <>
                <button type="button" className="ghost" disabled>
                  {profileLoading ? "Profil lädt..." : "Profil"}
                </button>
                <button onClick={handleLogout}>🚪 Logout</button>
              </>
            ) : (
              <span className="muted auth-state">🔒 Nicht eingeloggt</span>
            )}
          </div>
        </header>

        {!token && isResetRoute && (
          <section className="card auth-card fade-up">
            <div className="section-head">
              <div>
                <h2>🔐 Neues Passwort setzen</h2>
                <p className="muted section-subtitle">
                  Vergib ein neues Passwort für dein Konto.
                </p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="row">
              <input
                type="password"
                placeholder="Neues Passwort"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Passwort wiederholen"
                value={resetPasswordConfirm}
                onChange={(e) => setResetPasswordConfirm(e.target.value)}
              />
              <button type="submit" disabled={resetLoading || !resetToken}>
                {resetLoading ? "⏳ Bitte warten..." : "🔐 Passwort speichern"}
              </button>
            </form>

            {!resetToken && (
              <p className="error">
                Kein Reset-Token gefunden. Bitte benutze den Link aus der Mail.
              </p>
            )}
            {resetMessage && <p className="muted">{resetMessage}</p>}
            {resetError && <p className="error">{resetError}</p>}
          </section>
        )}

        {!token && !isResetRoute && (
          <section className="card auth-card fade-up">
            <div className="section-head">
              <div>
                <h2>{authMode === "login" ? "🔐 Login" : "📝 Registrieren"}</h2>
                <p className="muted section-subtitle">
                  Melde dich an, um deine Aufgaben zu verwalten.
                </p>
              </div>

              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setAuthMode((m) => (m === "login" ? "register" : "login"));
                  setLoginError(null);
                  setForgotPasswordError("");
                  setForgotPasswordMessage("");
                }}
              >
                {authMode === "login"
                  ? "📝 Registrieren"
                  : "⬅️ Zurück zu Login"}
              </button>
            </div>

            <form onSubmit={handleAuth} className="row">
              <input
                type="email"
                placeholder="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Passwort"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <button type="submit" disabled={loginLoading}>
                {loginLoading
                  ? "⏳ Bitte warten..."
                  : authMode === "login"
                  ? "🔐 Login"
                  : "📝 Registrieren"}
              </button>
            </form>

            {authMode === "login" && (
              <div style={{ marginTop: "12px" }}>
                <button
                  type="button"
                  className="ghost"
                  onClick={handleForgotPassword}
                  disabled={forgotPasswordLoading}
                >
                  {forgotPasswordLoading
                    ? "⏳ Link wird gesendet..."
                    : "🔑 Passwort vergessen?"}
                </button>
              </div>
            )}

            {verifyLoading && <p className="muted">E-Mail wird bestätigt...</p>}
            {verifyMessage && <p className="muted">{verifyMessage}</p>}
            {verifyError && <p className="error">{verifyError}</p>}

            {forgotPasswordMessage && (
              <p className="muted">{forgotPasswordMessage}</p>
            )}
            {forgotPasswordError && (
              <p className="error">{forgotPasswordError}</p>
            )}

            {loginError && <p className="error">{loginError}</p>}
          </section>
        )}

        {token && (
          <>
            <div className="kpi-bar fade-up">
              <div className="kpi-card kpi-accent-blue">
                <span className="kpi-label">📋 Total Tasks</span>
                <span className="kpi-value">{total}</span>
                <span className="kpi-foot">Alle vorhandenen Aufgaben</span>
              </div>

              <div className="kpi-card kpi-new">
                <span className="kpi-label">🆕 New</span>
                <span className="kpi-value">{totalNew}</span>
                <span className="kpi-foot">Noch nicht gestartet</span>
              </div>

              <div className="kpi-card kpi-progress">
                <span className="kpi-label">⏳ In Progress</span>
                <span className="kpi-value">{totalInProgress}</span>
                <span className="kpi-foot">Aktiv in Bearbeitung</span>
              </div>

              <div className="kpi-card kpi-done">
                <span className="kpi-label">✅ Done</span>
                <span className="kpi-value">{totalDone}</span>
                <span className="kpi-foot">Bereits abgeschlossen</span>
              </div>
            </div>

            <section className="card progress-card fade-up">
              <div className="progress-head">
                <div>
                  <h2>📈 Fortschritt</h2>
                  <p className="muted section-subtitle">
                    {completionRate}% deiner Tasks sind erledigt.
                  </p>
                </div>
                <strong className="progress-percent">{completionRate}%</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </section>
          </>
        )}

        <div className="dashboard-grid">
          <section className="card weather-card fade-up">
            <div className="section-head">
              <div>
                <h2>🌤️ Wetter</h2>
                <p className="muted section-subtitle">
                  Aktuelles Wetter für deine Stadt.
                </p>
              </div>
            </div>

            <div className="row">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Stadt eingeben..."
              />
              <button onClick={loadWeather}>🔎 Wetter laden</button>
            </div>

            {weatherError && (
              <p className="error">Fehler beim Wetter: {weatherError}</p>
            )}

            {weather && (
              <div className="weather-info">
                <div className="weather-glow" />

                <div className="weather-icon-wrap">
                  <div className="weather-icon">🌤️</div>
                </div>

                <h3>{weather.city}</h3>
                <p className="weather-temp">
                  {Math.round(weather.temperature)}°C
                </p>
                <p className="weather-desc">{weather.description}</p>

                <div className="weather-stats">
                  <div className="mini-stat">
                    <span className="mini-stat-label">💧 Luftfeuchtigkeit</span>
                    <span className="mini-stat-value">
                      {weather.humidity}%
                    </span>
                  </div>

                  <div className="mini-stat">
                    <span className="mini-stat-label">🌬️ Wind</span>
                    <span className="mini-stat-value">
                      {Math.round(weather.windSpeed)} m/s
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="card fade-up">
            <div className="section-head">
              <div>
                <h2>📋 Aufgaben</h2>
                <p className="muted section-subtitle">
                  Erstelle, filtere und bearbeite deine Tasks.
                </p>
              </div>
            </div>

            {!token ? (
              <div className="empty-state">
                <p className="muted">🔒 Bitte einloggen, um Tasks zu sehen.</p>
              </div>
            ) : (
              <>
                <div className="quick-actions">
                  <button
                    type="button"
                    className="ghost quick-btn"
                    onClick={() => fillDemoTask("quick")}
                  >
                    ⚡ Quick Task
                  </button>
                  <button
                    type="button"
                    className="ghost quick-btn"
                    onClick={() => fillDemoTask("important")}
                  >
                    🔥 Important
                  </button>
                  <button
                    type="button"
                    className="ghost quick-btn"
                    onClick={() => fillDemoTask("small")}
                  >
                    🌱 Small Task
                  </button>
                </div>

                <form onSubmit={handleAddTask} className="task-create-grid">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Titel..."
                  />

                  <input
                    type="text"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Beschreibung..."
                  />

                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>

                  <button type="submit">➕ Hinzufügen</button>
                </form>

                <div className="tabs">
                  <button
                    type="button"
                    className={activeTab === "ALL" ? "tab active" : "tab"}
                    onClick={() => setActiveTab("ALL")}
                  >
                    📋 All ({getTabCount("ALL")})
                  </button>
                  <button
                    type="button"
                    className={activeTab === "NEW" ? "tab active" : "tab"}
                    onClick={() => setActiveTab("NEW")}
                  >
                    🆕 New ({getTabCount("NEW")})
                  </button>
                  <button
                    type="button"
                    className={
                      activeTab === "IN_PROGRESS" ? "tab active" : "tab"
                    }
                    onClick={() => setActiveTab("IN_PROGRESS")}
                  >
                    ⏳ In Progress ({getTabCount("IN_PROGRESS")})
                  </button>
                  <button
                    type="button"
                    className={activeTab === "DONE" ? "tab active" : "tab"}
                    onClick={() => setActiveTab("DONE")}
                  >
                    ✅ Done ({getTabCount("DONE")})
                  </button>
                </div>

                <div className="toolbar-grid">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Task suchen..."
                  />

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="ALL">Alle Prioritäten</option>
                    <option value="HIGH">Nur High</option>
                    <option value="MEDIUM">Nur Medium</option>
                    <option value="LOW">Nur Low</option>
                  </select>

                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value)}
                  >
                    <option value="NEWEST">Neueste zuerst</option>
                    <option value="TITLE_ASC">Titel A-Z</option>
                    <option value="TITLE_DESC">Titel Z-A</option>
                    <option value="PRIORITY">Priorität High-Low</option>
                  </select>

                  <button
                    type="button"
                    className="ghost"
                    onClick={clearFilters}
                  >
                    ♻️ Zurücksetzen
                  </button>
                </div>

                {tasksError && (
                  <p className="error">Fehler bei Tasks: {tasksError}</p>
                )}

                {tasksLoading ? (
                  <div className="skeleton-list">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div className="skeleton-card" key={index}>
                        <div className="skeleton skeleton-line skeleton-line-title" />
                        <div className="skeleton skeleton-line skeleton-line-text" />
                        <div className="skeleton skeleton-line skeleton-line-text short" />
                        <div className="skeleton-row">
                          <div className="skeleton skeleton-pill" />
                          <div className="skeleton skeleton-pill" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredAndSortedTasks.length === 0 ? (
                  <div className="empty-state">
                    <p className="muted">
                      📭 Keine Aufgaben für den aktuellen Filter.
                    </p>
                  </div>
                ) : (
                  <ul className="task-list">
                    {filteredAndSortedTasks.map((task, index) => {
                      const status = task.status || "NEW";
                      const statusColor = getStatusColor(status);
                      const priority = task.priority || "MEDIUM";
                      const priorityColor = getPriorityColor(priority);

                      return (
                        <li
                          key={task.id}
                          className="task-item slide-in"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div
                            className="task-side-line"
                            style={{ backgroundColor: priorityColor }}
                          />

                          <div className="task-main">
                            <div className="task-content">
                              <div className="task-topline">
                                <div className="task-title-wrap">
                                  <span className="task-title">
                                    📝 {task.title}
                                  </span>
                                  <span className="task-id"># {task.id}</span>
                                </div>

                                <span
                                  className="status-pill"
                                  style={{
                                    backgroundColor: `${statusColor}18`,
                                    color: statusColor,
                                    border: `1px solid ${statusColor}`,
                                  }}
                                >
                                  {status === "DONE"
                                    ? "✅ Done"
                                    : status === "IN_PROGRESS"
                                    ? "⏳ In Progress"
                                    : "🆕 New"}
                                </span>
                              </div>

                              <p className="task-desc">
                                {task.description || "Keine Beschreibung"}
                              </p>

                              <div className="task-meta">
                                <span
                                  className="priority-badge"
                                  style={{
                                    backgroundColor: `${priorityColor}18`,
                                    color: priorityColor,
                                    border: `1px solid ${priorityColor}`,
                                  }}
                                >
                                  {priority === "HIGH"
                                    ? "🔥 High"
                                    : priority === "LOW"
                                    ? "🌱 Low"
                                    : "⚡ Medium"}
                                </span>

                                <span className="task-meta-chip">
                                  {status === "DONE"
                                    ? "✅ Completed"
                                    : status === "IN_PROGRESS"
                                    ? "⚙️ Active"
                                    : "📌 Planned"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="task-actions">
                            <select
                              value={status}
                              onChange={(e) =>
                                handleStatusChange(task.id, e.target.value)
                              }
                            >
                              <option value="NEW">New</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="DONE">Done</option>
                            </select>

                            <button
                              className="ghost"
                              onClick={() => openEditModal(task)}
                            >
                              ✏️ Bearbeiten
                            </button>

                            <button
                              className="danger"
                              onClick={() => openDeleteDialog(task)}
                            >
                              🗑️ Löschen
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </section>
        </div>

        <footer className="footer">
          <div className="footer-line">
            <strong>Weather &amp; Task Dashboard</strong>
            <span>⚛️ React + ☕ Spring Boot</span>
            <span>✨ Modern UI 2026</span>
          </div>
          <p>
            Übersichtliches Dashboard mit Wetter, Task-Management, Tabs, Modal,
            Toasts und Skeleton Loader.
          </p>
        </footer>
      </div>

      {isEditModalOpen && editingTask && (
        <div className="overlay" onClick={closeEditModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2>✏️ Task bearbeiten</h2>
                <p className="muted section-subtitle">
                  Änderungen für Task #{editingTask.id}
                </p>
              </div>
              <button type="button" className="ghost" onClick={closeEditModal}>
                ✖️ Schließen
              </button>
            </div>

            <div className="modal-body">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Titel..."
              />

              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Beschreibung..."
              />

              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="modal-actions">
              <button type="button" className="ghost" onClick={closeEditModal}>
                ↩️ Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={editLoading}
              >
                {editLoading ? "⏳ Speichern..." : "💾 Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}

      {taskToDelete && (
        <div className="overlay" onClick={closeDeleteDialog}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2>🗑️ Task löschen?</h2>
            <p className="muted">
              Möchtest du <strong>{taskToDelete.title}</strong> wirklich löschen?
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="ghost"
                onClick={closeDeleteDialog}
              >
                ↩️ Abbrechen
              </button>
              <button
                type="button"
                className="danger"
                onClick={handleDeleteTaskConfirmed}
                disabled={deleteLoading}
              >
                {deleteLoading ? "⏳ Löschen..." : "🗑️ Ja, löschen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isProfileModalOpen && userProfile && (
        <div className="overlay" onClick={closeProfileModal}>
          <div
            className="modal profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <h2>👤 Mein Profil</h2>
                <p className="muted section-subtitle">
                  Kontodetails und persönliche Informationen
                </p>
              </div>
              <button
                type="button"
                className="ghost"
                onClick={closeProfileModal}
              >
                ✖️ Schließen
              </button>
            </div>

            <div className="profile-modal-top">
              <div className="profile-avatar-large-wrap">
                {showModalAvatar ? (
                  <img
                    src={profileAvatarUrl}
                    alt={userProfile.login}
                    className="profile-avatar-large"
                    onError={() => setModalAvatarError(true)}
                  />
                ) : (
                  <div className="profile-avatar-large profile-avatar-fallback">
                    {getInitials(userProfile.login)}
                  </div>
                )}
              </div>

              <div className="profile-modal-info">
                <h3 className="profile-modal-name">{userProfile.login}</h3>
                <p className="muted">Persönliches Benutzerkonto</p>
              </div>
            </div>

            <div className="modal-body">
              <input type="text" value={userProfile.login} disabled />

              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="E-Mail-Adresse"
              />

              <input
                type="text"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder="Handynummer"
              />

              <input
                type="text"
                value={profileAvatarUrl}
                onChange={(e) => setProfileAvatarUrl(e.target.value)}
                placeholder="Avatar URL"
              />
            </div>

            <p className="profile-help-text">
              Für Bilder am besten eine direkte Bild-URL verwenden, zum Beispiel
              eine `.png`, `.jpg` oder `.webp` Datei.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="ghost"
                onClick={closeProfileModal}
              >
                ↩️ Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={profileSaving}
              >
                {profileSaving ? "⏳ Speichern..." : "💾 Profil speichern"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="toast-stack">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${
              toast.type === "error"
                ? "toast-error"
                : toast.type === "info"
                ? "toast-info"
                : "toast-success"
            }`}
          >
            {toast.type === "error"
              ? "❌ "
              : toast.type === "info"
              ? "ℹ️ "
              : "✅ "}
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;