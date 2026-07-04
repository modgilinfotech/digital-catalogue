window.AdminCommon = (function () {
  "use strict";

  async function api(path, options = {}) {
    const res = await fetch(path, {
      credentials: "same-origin",
      headers: options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {},
      ...options,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      const message = (data && data.error) || `Request failed (${res.status})`;
      throw new Error(message);
    }
    return data;
  }

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null) continue;
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else node.setAttribute(k, v);
    }
    for (const child of children) {
      if (child == null) continue;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    }
    return node;
  }

  let toastTimer = null;
  function toast(message, isError = false) {
    let node = document.getElementById("adminToast");
    if (!node) {
      node = document.createElement("div");
      node.id = "adminToast";
      node.className = "toast";
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.toggle("is-error", isError);
    node.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove("is-visible"), 2600);
  }

  async function requireSession(redirectTo) {
    try {
      return await api("/api/auth/me");
    } catch {
      window.location.href = redirectTo;
      return null;
    }
  }

  async function logout(redirectTo) {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = redirectTo;
  }

  return { api, el, toast, requireSession, logout };
})();
