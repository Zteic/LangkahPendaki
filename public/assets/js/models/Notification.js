export class Notification {
    constructor(data = {}) {
        this.id = data.id || Date.now() + Math.floor(Math.random() * 1000);
        this.title = data.title || "Notifikasi Baru";
        this.message = data.message || "";
        this.type = data.type || "general"; // booking, payment, stock, etc
        this.icon = data.icon || "fa-bell";
        this.color = data.color || "text-stone-500";
        this.reference_id = data.reference_id || null;
        this.reference_type = data.reference_type || null;
        this.is_read = data.is_read || 0;
        this.created_at = data.created_at || new Date().toISOString();
    }
}