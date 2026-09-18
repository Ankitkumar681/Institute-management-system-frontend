import Swal from "sweetalert2";

class AlertService {
  // 🟢 1. Success Toast / Popups
  success(title, text = "") {
    return Swal.fire({
      icon: "success",
      title,
      text,
      confirmButtonColor: "#4f46e5",
      background: "#ffffff",
      customClass: {
        popup: "rounded-2xl font-sans text-slate-800",
      },
    });
  }

  // 🔴 2. Error Notifications
  error(title, text = "") {
    return Swal.fire({
      icon: "error",
      title,
      text,
      confirmButtonColor: "#1e293b",
      background: "#ffffff",
      customClass: {
        popup: "rounded-2xl font-sans text-slate-800",
      },
    });
  }

  // 🟡 3. Interactive Destruction Confirmations
  async confirm(
    title,
    text = "You won't be able to revert this!",
    confirmText = "Yes, execute it!",
  ) {
    const result = await Swal.fire({
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: confirmText, // ⚡ FIX: Uses the dynamic text string argument passed by the caller
      background: "#ffffff",
      customClass: {
        popup: "rounded-2xl font-sans text-slate-800",
        confirmButton: "rounded-xl font-bold px-4 py-2",
        cancelButton: "rounded-xl font-bold px-4 py-2",
      },
    });
    return result.isConfirmed;
  }
}

export default new AlertService();
