import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

type Task = {
  id: number;
  title: string;
  description?: string | null;
  status: "pending" | "completed" | "expired"; // ✅ expired eklendi
  userId: number;
  createdAt: string;
  updatedAt: string;
  dueDate?: string | null; // ✅ yeni alan
  user?: { username: string };
};

type User = { id: number; username: string };

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskDetailModal, setTaskDetailModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // form state
  const [fTitle, setFTitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fStatus, setFStatus] = useState<"pending" | "completed">("pending");
  const [fUserId, setFUserId] = useState<number | "">("");
  const [fDueDate, setFDueDate] = useState<string>(""); // ✅ yeni alan (datetime-local string)

  // details için seçili task
  const [selectedTask, setSelectedTask] = useState<Task | null>(null); // ✅ description yerine komple task

  const username = localStorage.getItem("username") || "User";
  const role = localStorage.getItem("role") || "User";
  const selfUserId = Number(localStorage.getItem("userId") || 0);

  const niceDate = (iso?: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ISO -> <input type="datetime-local"> değeri (YYYY-MM-DDTHH:mm)
  const isoToLocalInput = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const welcome = useMemo(() => `${username}`, [username]);

  async function fetchTasks() {
    setLoading(true);
    try {
      const { data } = await api.get<Task[]>("/tasks");
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const { data } = await api.get<User[]>("/auth/users");
      setUsers(data);
    } catch {
      if (selfUserId && username) {
        setUsers([{ id: selfUserId, username }]);
      }
    }
  }

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  function openAddModal() {
    setEditingTask(null);
    setFTitle("");
    setFDesc("");
    setFStatus("pending");
    setFUserId(selfUserId || "");
    setFDueDate(""); // ✅ yeni
    setShowTaskModal(true);
  }

  function openEditModal(t: Task) {
    setEditingTask(t);
    setFTitle(t.title);
    setFDesc(t.description ?? "");
    setFStatus(t.status === "completed" ? "completed" : "pending"); // expired'ı burada manuel seçtirmiyoruz
    setFUserId(t.userId);
    setFDueDate(isoToLocalInput(t.dueDate)); // ✅ mevcut dueDate'i forma taşı
    setShowTaskModal(true);
  }

  function closeTaskModal() {
    setShowTaskModal(false);
  }

  async function saveTask(e: React.FormEvent) {
    e.preventDefault();
    if (!fTitle.trim() || !fDesc.trim() || !fUserId) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    const payload = {
      title: fTitle.trim(),
      description: fDesc.trim(),
      status: fStatus,
      userId: Number(fUserId),
      dueDate: fDueDate ? new Date(fDueDate).toISOString() : null, // ✅ BE'ye ISO gönder
    };

    if (editingTask) {
      await api.put(`/tasks/${editingTask.id}`, payload);
    } else {
      await api.post("/tasks", payload);
    }

    await fetchTasks();
    setShowTaskModal(false);
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    await api.delete(`/tasks/${confirmDeleteId}`);
    setConfirmDeleteId(null);
    await fetchTasks();
  }

  function logoutYes() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="w-full bg-white border-b shadow-sm p-[0_12px]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">MEA-TEC Task Management Portal</div>
          <div className="flex items-center gap-4">
            Welcome&nbsp;<span style={{ fontWeight: "600" }} className="text-sm font-bold text-gray-700">{welcome}</span>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
              className="rounded-lg border px-3 m-[6px_12px] py-1 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Tasks</h2>
            {role !== "User" && (
              <button
                onClick={openAddModal}
                className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
              >
                + Add New Task
              </button>
            )}
        </div>

        {/* Table */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-sm">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Updated</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td className="px-3 py-3" colSpan={7}>
                    Loading...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td className="px-3 py-3" colSpan={7}>
                    No tasks found.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="px-3 py-2">{t.id}</td>
                    <td className="px-3 py-2">{t.title}</td>
                    <td className="px-3 py-2">{niceDate(t.createdAt)}</td>
                    <td className="px-3 py-2">{niceDate(t.updatedAt)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          "px-2 py-1 rounded text-xs " +
                          (t.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : t.status === "expired"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700")
                        }
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {t.user?.username ??
                        (t.userId === selfUserId ? username : `#${t.userId}`)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(t)}
                          className="px-2 py-1 rounded border hover:bg-gray-100"
                        >
                          Edit
                        </button>
                        {role !== "User" && (
                        <button
                          onClick={() => setConfirmDeleteId(t.id)}
                          className="px-2 py-1 ml-[12px] rounded border text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                        )}
                        <button
                          onClick={() => { setSelectedTask(t); setTaskDetailModal(true); }}
                          className="px-2 py-1 ml-[12px] rounded border hover:bg-gray-100"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed p-4 rounded inset-0 z-50 flex items-center justify-center">
          {/* overlay */}
          <div className="absolute inset-0 bg-black/40"></div>

          {/* modal content */}
          <div className="relative z-50 bg-white w-full max-w-md rounded-2xl shadow-xl p-5">
            <h3 className="text-lg font-semibold mb-4">
              {editingTask ? "Edit Task" : "Add New Task"}
            </h3>
            <form onSubmit={saveTask} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Title</label>
                <input
                  className="w-full p-[12px] border rounded-md px-3 py-2"
                  value={fTitle}
                  onChange={(e) => setFTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1 mt-[12px]">Description</label>
                <textarea
                  className="w-full p-[12px] border rounded-md px-3 py-2"
                  rows={4}
                  value={fDesc}
                  onChange={(e) => setFDesc(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1 mt-[12px]">Due Date</label>
                <input
                  type="datetime-local"
                  className="w-full p-[12px] border rounded-md px-3 py-2"
                  value={fDueDate}
                  onChange={(e) => setFDueDate(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1 pr-[6px]">
                  <label className="block text-sm mb-1 mt-[12px]">Status</label>
                  <select
                    className="w-full p-[8px] border rounded-md px-3 py-2"
                    value={fStatus}
                    onChange={(e) =>
                      setFStatus(e.target.value as "pending" | "completed")
                    }
                    required
                  >
                    <option value="pending">pending</option>
                    <option value="completed">completed</option>
                  </select>
                </div>
                <div className="flex-1 pl-[6px]">
                  <label className="block text-sm mb-1 mt-[12px]">User</label>
                  <select
                    className="w-full p-[8px] border rounded-md px-3 py-2"
                    value={fUserId}
                    onChange={(e) => setFUserId(Number(e.target.value))}
                    required
                  >
                    <option value="" disabled>
                      Choose
                    </option>
                    {users
                      .slice()
                      .sort((a, b) =>
                        a.username.localeCompare(b.username, "tr")
                      )
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.username}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-around gap-2 mt-[24px] text-center">
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="px-3 py-2 rounded-md border hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDeleteId && (
        <div className="fixed rounded inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-5">
            <h3 className="text-lg font-semibold mb-2">Are you sure?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure to remove the task?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-2 rounded-md border hover:bg-gray-100"
              >
                No
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout confirm */}
      {showLogoutConfirm && (
        <div className="fixed rounded inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-5">
            <h3 className="text-lg font-semibold mb-2">Logout</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure to logout?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3 py-2 rounded-md border hover:bg-gray-100"
              >
                No
              </button>
              <button
                onClick={logoutYes}
                className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details modal */}
      {taskDetailModal && selectedTask && (
        <div className="fixed rounded inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-5">
            <h3 className="text-lg font-semibold mb-2">Task Details</h3>

            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">Title:</span> {selectedTask.title}</p>
              <p className="whitespace-pre-wrap">
                <span className="font-medium">Description:</span> {selectedTask.description ?? "(No description)"}
              </p>
              {/* ✅ İstenen satır */}
              <p><span className="font-medium">Due Date:</span> {selectedTask.dueDate ? niceDate(selectedTask.dueDate) : "-"}</p>
              <p>
                <span className="font-medium">Status:</span>{" "}
                <span className={
                  "px-2 py-1 rounded text-xs " +
                  (selectedTask.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : selectedTask.status === "expired"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700")
                }>
                  {selectedTask.status}
                </span>
              </p>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => { setTaskDetailModal(false); setSelectedTask(null); }}
                className="px-3 py-2 rounded-md border hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}