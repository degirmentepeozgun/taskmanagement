import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

type Task = {
  id: number;
  title: string;
  description?: string | null;
  status: "pending" | "completed";
  userId: number;
  createdAt: string;
  updatedAt: string;
  user?: { username: string }; // backend include ile gelebilir
};

type User = { id: number; username: string };

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskDetailModal, showDetails] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // form state (modal içinde kullanacağız)
  const [fTitle, setFTitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [selectedTaskDesc, setSelectedTaskDesc] = useState<string | null>(null);
  const [fStatus, setFStatus] = useState<"pending" | "completed">("pending");
  const [fUserId, setFUserId] = useState<number | "">("");

  const username = localStorage.getItem("username") || "User";
  const selfUserId = Number(localStorage.getItem("userId") || 0);

  const niceDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const welcome = useMemo(() => `${username}`, [username]);

  async function fetchTasks() {
    setLoading(true);
    try {
      // BE tarafında include user ekli ise username gelir; yoksa userId göstereceğiz
      const { data } = await api.get<Task[]>("/tasks");
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      // BE tarafında bu endpoint yoksa ekleyebilirsin: GET /api/auth/users -> [{id, username}]
      const { data } = await api.get<User[]>("/auth/users");
      setUsers(data);
    } catch {
      // endpoint yoksa en azından kendini seçilebilir yap
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
    setShowTaskModal(true);
  }

  function openEditModal(t: Task) {
    setEditingTask(t);
    setFTitle(t.title);
    setFDesc(t.description ?? "");
    setFStatus(t.status);
    setFUserId(t.userId);
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
    window.location.href = "/login"; // router yoksa böyle
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="w-full bg-white border-b shadow-sm p-[0_12px]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">MEA-TEC Task Management Portal</div>
          <div className="flex items-center gap-4">
            Welcome&nbsp;<span style={{fontWeight: "600" }} className="text-sm font-bold text-gray-700">{welcome}</span>
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
      <div className="max-w-6xl mx-auto p-[0_24px]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Tasks</h2>
          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
          >
            + Add New Task
          </button>
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
                        <button
                          onClick={() => setConfirmDeleteId(t.id)}
                          className="px-2 py-1 ml-[12px] rounded border text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                       <button
                        onClick={() => setSelectedTaskDesc(t.description ?? "(No description)")}
                        className="px-2 py-1 ml-[12px] rounded border text-red-600 hover:bg-red-50"
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
  <div className="fixed modal rounded-[6px] shadow-[0_4px_12px_rgba(0,0,0,.15)] inset-0 z-50 flex items-center justify-center">
    {/* overlay */}
    <div className="absolute inset-0 bg-black/40"></div>

    {/* modal content */}
    <div className="relative z-50 bg-white w-full max-w-md rounded-2xl shadow-xl p-3">
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
        <div className="fixed rounded-[6px] shadow-[0_4px_12px_rgba(0,0,0,.15)] p-[24px] modal inset-0 bg-black/40 flex items-center justify-center p-4">
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
        <div className="fixed modal rounded-[6px] shadow-[0_4px_12px_rgba(0,0,0,.15)] p-[24px] inset-0 bg-black/40 flex items-center justify-center p-4">
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
      {/* Description & Details modal */}
      {selectedTaskDesc !== null && (
        <div className="fixed modal rounded-[6px] shadow-[0_4px_12px_rgba(0,0,0,.15)] p-[24px] inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-5">
            <h3 className="text-lg font-semibold mb-2">Task Description</h3>
            <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">
              {selectedTaskDesc}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedTaskDesc(null)}
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